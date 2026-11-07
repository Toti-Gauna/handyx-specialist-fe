// Baja de Overpass (OpenStreetMap) las calles, la costa, el agua, los espacios verdes, las playas y los barrios de Mar
// del Plata y Batán (lote 4.3). Una sola consulta; el resultado queda en .cache/mapa/overpass.json (fuera de Git) y
// después lo convierte scripts/mapa/generar.ts. Datos © OpenStreetMap contributors, licencia ODbL.
//
//   npm run mapa:descargar
//
// No manda nada propio: solo el recuadro de la ciudad. Detrás de un proxy, Node usa HTTPS_PROXY con NODE_USE_ENV_PROXY=1
// (ya está en el script de npm).
import { mkdirSync, writeFileSync } from 'node:fs';
import { RECUADRO_MAPA } from './zona.ts';

const SERVIDOR = process.env.OVERPASS_URL ?? 'https://overpass-api.de/api/interpreter';
const [o, s, e, n] = RECUADRO_MAPA;
const bbox = `${s},${o},${n},${e}`; // Overpass: sur, oeste, norte, este

const consulta = `[out:json][timeout:300][bbox:${bbox}];
(
  way["highway"];
  way["natural"="coastline"];
  way["natural"~"^(water|beach|sand|wood)$"];
  way["water"];
  way["leisure"~"^(park|garden)$"];
  way["landuse"~"^(grass|recreation_ground|forest)$"];
  node["place"~"^(suburb|neighbourhood|quarter)$"]["name"];
);
out body geom qt;`;

const inicio = Date.now();
console.log(`descargar: pidiendo a ${SERVIDOR} el recuadro ${bbox}…`);
const r = await fetch(SERVIDOR, {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': 'handyx-specialist-fe/0.1 (mapa propio de Mar del Plata; lote 4.3)' },
  body: new URLSearchParams({ data: consulta }),
});
if (!r.ok) {
  console.error(`descargar: Overpass respondió ${r.status} ${r.statusText}`);
  process.exit(1);
}
const texto = await r.text();
const datos = JSON.parse(texto) as { elements?: unknown[]; osm3s?: { timestamp_osm_base?: string } };
if (!Array.isArray(datos.elements) || datos.elements.length === 0) {
  console.error('descargar: la respuesta no trae elementos');
  process.exit(1);
}
mkdirSync('.cache/mapa', { recursive: true });
writeFileSync('.cache/mapa/overpass.json', texto);
console.log(`descargar: ${datos.elements.length} elementos (${(texto.length / 1e6).toFixed(1)} MB, datos del ${datos.osm3s?.timestamp_osm_base ?? '¿?'}) en ${((Date.now() - inicio) / 1000).toFixed(0)} s → .cache/mapa/overpass.json`);
