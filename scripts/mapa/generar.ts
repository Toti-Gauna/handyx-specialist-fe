// Convierte el extracto de OpenStreetMap (.cache/mapa/overpass.json) en lo que usan la app y el mock (lote 4.3):
//   public/mapa/teselas/{z}/{x}/{y}.pbf + public/mapa/meta.json   → el mapa base (se publica con la app)
//   src/data/mock/mapa/barrios.json                              → centros de barrio del mock
//   src/data/mock/mapa/grafo.json                                → calles para que el mock calcule trayectos
//
//   npm run mapa:generar [-- <extracto.json>]
//
// Las teselas no llevan nombres ni datos de personas: solo geometría pública de OpenStreetMap (ODbL).
import { mkdirSync, readFileSync, rmSync, statSync, writeFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { GeoJSONVT } from '@maplibre/geojson-vt';
import { fromGeojsonVt } from '@maplibre/vt-pbf';
import type { Feature } from 'geojson';
import { armarBarrios, armarCapas, armarGrafo, type ClaseCalle, type ElementoOsm } from '../../src/mapa/osm.ts';
import { RECUADRO_GRAFO, RECUADRO_MAPA, ZOOM_MAX, ZOOM_MIN } from './zona.ts';

const entrada = process.argv[2] ?? '.cache/mapa/overpass.json';
const salidaPublica = process.env.MAPA_SALIDA_PUBLICA ?? 'public/mapa';
const salidaMock = process.env.MAPA_SALIDA_MOCK ?? 'src/data/mock/mapa';

const crudo = JSON.parse(readFileSync(entrada, 'utf8')) as { elements: ElementoOsm[]; osm3s?: { timestamp_osm_base?: string } };
const fecha = (crudo.osm3s?.timestamp_osm_base ?? new Date().toISOString()).slice(0, 10);
const fuente = `© OpenStreetMap contributors (ODbL) · extracto del ${fecha}`;
const elementos = crudo.elements;
console.log(`generar: ${elementos.length} elementos de ${entrada}`);

// ── Capas y teselas ─────────────────────────────────────────────────────────────────────────────

const capas = armarCapas(elementos, RECUADRO_MAPA);
console.log(`generar: ${capas.calles.length} calles, ${capas.mar.length} mar, ${capas.agua.length} agua, ${capas.verde.length} verde, ${capas.playa.length} playa`);

// Qué calles entran en cada zoom (en los zooms bajos solo las avenidas: las teselas quedan livianas).
const CLASES_POR_ZOOM: Record<number, readonly ClaseCalle[]> = {
  10: ['autopista', 'avenida'],
  11: ['autopista', 'avenida'],
  12: ['autopista', 'avenida', 'secundaria'],
  13: ['autopista', 'avenida', 'secundaria', 'calle'],
  14: ['autopista', 'avenida', 'secundaria', 'calle', 'servicio'],
};
const OPCIONES = { maxZoom: ZOOM_MAX, indexMaxZoom: ZOOM_MAX, indexMaxPoints: 0, tolerance: 3, extent: 4096, buffer: 64 };
const indice = (features: Feature[]) => new GeoJSONVT({ type: 'FeatureCollection', features }, OPCIONES);
const fijas = { mar: indice(capas.mar), agua: indice(capas.agua), verde: indice(capas.verde), playa: indice(capas.playa) };
const callesPorZoom = new Map<number, GeoJSONVT>();
for (let z = ZOOM_MIN; z <= ZOOM_MAX; z++) {
  const clases = CLASES_POR_ZOOM[z] ?? CLASES_POR_ZOOM[ZOOM_MAX] ?? [];
  callesPorZoom.set(z, indice(capas.calles.filter((f) => clases.includes(f.properties.clase))));
}

const lng2x = (lng: number, z: number) => Math.floor(((lng + 180) / 360) * 2 ** z);
const lat2y = (lat: number, z: number) => {
  const r = (lat * Math.PI) / 180;
  return Math.floor(((1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2) * 2 ** z);
};

const dirTeselas = join(salidaPublica, 'teselas');
rmSync(dirTeselas, { recursive: true, force: true });
let cantidad = 0;
let bytes = 0;
const [o, s, e, n] = RECUADRO_MAPA;
for (let z = ZOOM_MIN; z <= ZOOM_MAX; z++) {
  const calles = callesPorZoom.get(z);
  for (let x = lng2x(o, z); x <= lng2x(e, z); x++) {
    for (let y = lat2y(n, z); y <= lat2y(s, z); y++) {
      const capasTesela: Record<string, NonNullable<ReturnType<GeoJSONVT['getTile']>>> = {};
      for (const [nombre, idx] of [...Object.entries(fijas), ['calles', calles] as const]) {
        const t = idx?.getTile(z, x, y);
        if (t && t.features.length > 0) capasTesela[nombre] = t;
      }
      if (Object.keys(capasTesela).length === 0) continue;
      const pbf = fromGeojsonVt(capasTesela, { version: 2, extent: 4096 });
      mkdirSync(join(dirTeselas, String(z), String(x)), { recursive: true });
      writeFileSync(join(dirTeselas, String(z), String(x), `${y}.pbf`), pbf);
      cantidad += 1;
      bytes += pbf.byteLength;
    }
  }
}
writeFileSync(join(salidaPublica, 'meta.json'), `${JSON.stringify({ version: 1, limites: RECUADRO_MAPA, zMin: ZOOM_MIN, zMax: ZOOM_MAX, fecha, fuente }, null, 2)}\n`);
console.log(`generar: ${cantidad} teselas (${(bytes / 1e6).toFixed(1)} MB) en ${dirTeselas}`);

// ── Barrios y grafo del mock ────────────────────────────────────────────────────────────────────

mkdirSync(salidaMock, { recursive: true });
const barrios = armarBarrios(elementos, RECUADRO_MAPA);
writeFileSync(join(salidaMock, 'barrios.json'), `${JSON.stringify({ fuente, barrios }, null, 2)}\n`);
console.log(`generar: ${barrios.length} barrios → ${join(salidaMock, 'barrios.json')}`);

const grafo = armarGrafo(elementos, RECUADRO_GRAFO, fuente);
writeFileSync(join(salidaMock, 'grafo.json'), JSON.stringify(grafo));
const pesoGrafo = statSync(join(salidaMock, 'grafo.json')).size;
console.log(`generar: grafo con ${grafo.coords.length / 2} esquinas y ${grafo.aristas.length / 4} tramos (${(pesoGrafo / 1e6).toFixed(2)} MB)`);
console.log(`generar: listo. Directorios de teselas por zoom: ${readdirSync(dirTeselas).join(', ')}`);
