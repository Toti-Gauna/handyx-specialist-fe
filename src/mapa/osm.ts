// Datos de OpenStreetMap → capas del mapa y grafo de calles (lote 4.3). Lo usa scripts/mapa/generar.ts con el extracto
// que baja scripts/mapa/descargar.ts (Overpass, `out body geom`). Funciones puras: se prueban con datos sintéticos.
// Licencia de los datos: ODbL. El mapa muestra siempre "© OpenStreetMap" (src/mapa/estilo.ts).
import type { Feature, LineString, Point, Polygon } from 'geojson';
import { ESCALA_COORD, type GrafoDatos } from './grafo.ts';
import { distanciaM, en } from '../lib/geo.ts';
import type { Barrio } from '../contracts/dto.ts';

export interface NodoOsm {
  type: 'node';
  id: number;
  lat: number;
  lon: number;
  tags?: Record<string, string>;
}
export interface WayOsm {
  type: 'way';
  id: number;
  nodes: number[];
  geometry: Array<{ lat: number; lon: number } | null>;
  tags?: Record<string, string>;
}
export type ElementoOsm = NodoOsm | WayOsm | { type: 'relation'; id: number };

/** Oeste, sur, este, norte. */
export type Bbox = readonly [number, number, number, number];

export const CLASES_CALLE = ['autopista', 'avenida', 'secundaria', 'calle', 'servicio'] as const;
export type ClaseCalle = (typeof CLASES_CALLE)[number];

// Velocidades de referencia (km/h) para estimar tiempos en el mock. El motor real (fase 5) usa sus propios perfiles.
const CALLES: Record<string, { clase: ClaseCalle; kmh: number }> = {
  motorway: { clase: 'autopista', kmh: 80 },
  motorway_link: { clase: 'autopista', kmh: 50 },
  trunk: { clase: 'autopista', kmh: 60 },
  trunk_link: { clase: 'autopista', kmh: 40 },
  primary: { clase: 'avenida', kmh: 45 },
  primary_link: { clase: 'avenida', kmh: 35 },
  secondary: { clase: 'avenida', kmh: 40 },
  secondary_link: { clase: 'avenida', kmh: 30 },
  tertiary: { clase: 'secundaria', kmh: 35 },
  tertiary_link: { clase: 'secundaria', kmh: 30 },
  residential: { clase: 'calle', kmh: 30 },
  unclassified: { clase: 'calle', kmh: 30 },
  living_street: { clase: 'calle', kmh: 15 },
  service: { clase: 'servicio', kmh: 15 },
};
/** Las demoras en esquinas y semáforos no están en el grafo: se suman como un 25 % más. */
const DEMORA = 1.25;

const esWay = (e: ElementoOsm): e is WayOsm => e.type === 'way' && Array.isArray((e as WayOsm).geometry);
const coordsDe = (w: WayOsm): Array<[number, number]> | null => {
  if (w.geometry.some((g) => g === null)) return null;
  return (w.geometry as Array<{ lat: number; lon: number }>).map((g) => [round6(g.lon), round6(g.lat)]);
};
const round6 = (x: number): number => Math.round(x * 1e6) / 1e6;

export function claseCalle(tags: Record<string, string> | undefined): ClaseCalle | null {
  const h = tags?.highway;
  return h && CALLES[h] ? CALLES[h].clase : null;
}

/** Se puede circular en auto (sin entradas privadas ni prohibidas). */
function circulable(tags: Record<string, string> | undefined): boolean {
  if (!tags?.highway || !CALLES[tags.highway]) return false;
  if (tags.access === 'no' || tags.access === 'private' || tags.motor_vehicle === 'no' || tags.motorcar === 'no') return false;
  if (tags.service === 'parking_aisle' || tags.service === 'driveway' || tags.area === 'yes') return false;
  return true;
}

/** 1: solo en el sentido del dibujo · -1: solo en contra · 0: doble mano. */
function sentido(tags: Record<string, string>): 1 | -1 | 0 {
  const o = tags.oneway;
  if (o === '-1' || o === 'reverse') return -1;
  if (o === 'yes' || o === 'true' || o === '1') return 1;
  if (o === 'no') return 0;
  if (tags.junction === 'roundabout' || tags.junction === 'circular' || tags.highway === 'motorway') return 1;
  return 0;
}

const dentro = (b: Bbox, lng: number, lat: number): boolean => lng >= b[0] && lng <= b[2] && lat >= b[1] && lat <= b[3];

/** Grafo dirigido de las calles circulables que tocan el recuadro. */
export function armarGrafo(elementos: readonly ElementoOsm[], recuadro: Bbox, fuente: string): GrafoDatos {
  const indice = new Map<number, number>();
  const coords: number[] = [];
  const aristas: number[] = [];
  const nodo = (id: number, lng: number, lat: number): number => {
    let i = indice.get(id);
    if (i === undefined) {
      i = indice.size;
      indice.set(id, i);
      coords.push(Math.round(lat * ESCALA_COORD), Math.round(lng * ESCALA_COORD));
    }
    return i;
  };
  for (const e of elementos) {
    if (!esWay(e) || !circulable(e.tags)) continue;
    const c = coordsDe(e);
    if (!c || c.length !== e.nodes.length || !c.some(([lng, lat]) => dentro(recuadro, lng, lat))) continue;
    const tags = e.tags as Record<string, string>;
    const kmh = CALLES[tags.highway as string]?.kmh ?? 30;
    const s = sentido(tags);
    for (let k = 0; k < c.length - 1; k++) {
      const [lngA, latA] = en(c, k);
      const [lngB, latB] = en(c, k + 1);
      const a = nodo(en(e.nodes, k), lngA, latA);
      const b = nodo(en(e.nodes, k + 1), lngB, latB);
      const m = distanciaM({ lat: latA, lng: lngA }, { lat: latB, lng: lngB });
      const seg = (m / ((kmh * 1000) / 3600)) * DEMORA;
      const mi = Math.max(1, Math.round(m));
      const si = Math.max(1, Math.round(seg));
      if (s >= 0) aristas.push(a, b, mi, si);
      if (s <= 0) aristas.push(b, a, mi, si);
    }
  }
  return { version: 1, fuente, coords, aristas };
}

// ── Capas del mapa base ─────────────────────────────────────────────────────────────────────────

export interface Capas {
  calles: Array<Feature<LineString, { clase: ClaseCalle }>>;
  mar: Array<Feature<Polygon, Record<string, never>>>;
  agua: Array<Feature<Polygon, Record<string, never>>>;
  verde: Array<Feature<Polygon, Record<string, never>>>;
  playa: Array<Feature<Polygon, Record<string, never>>>;
}

const cerrado = (c: Array<[number, number]>): boolean => {
  if (c.length < 4) return false;
  const [a, b] = [en(c, 0), en(c, c.length - 1)];
  return a[0] === b[0] && a[1] === b[1];
};
const poligono = (c: Array<[number, number]>): Feature<Polygon, Record<string, never>> => ({ type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates: [c] } });

export function armarCapas(elementos: readonly ElementoOsm[], recuadro: Bbox): Capas {
  const capas: Capas = { calles: [], mar: [], agua: [], verde: [], playa: [] };
  const costas: WayOsm[] = [];
  for (const e of elementos) {
    if (!esWay(e)) continue;
    const t = e.tags ?? {};
    const c = coordsDe(e);
    if (!c) continue;
    const clase = claseCalle(t);
    if (clase && t.area !== 'yes') capas.calles.push({ type: 'Feature', properties: { clase }, geometry: { type: 'LineString', coordinates: c } });
    else if (t.natural === 'coastline') costas.push(e);
    else if (cerrado(c) && (t.natural === 'water' || t.water)) capas.agua.push(poligono(c));
    else if (cerrado(c) && (t.leisure === 'park' || t.leisure === 'garden' || t.landuse === 'grass' || t.landuse === 'recreation_ground' || t.landuse === 'forest' || t.natural === 'wood')) capas.verde.push(poligono(c));
    else if (cerrado(c) && (t.natural === 'beach' || t.natural === 'sand')) capas.playa.push(poligono(c));
  }
  capas.mar = marDesdeCostas(costas, recuadro);
  return capas;
}

/**
 * El mar no es un polígono en OpenStreetMap: son líneas de costa con la tierra a la izquierda. Se unen en cadenas y
 * cada cadena se cierra por el borde del recuadro en sentido horario (el agua queda a la derecha).
 */
export function marDesdeCostas(costas: readonly WayOsm[], recuadro: Bbox): Array<Feature<Polygon, Record<string, never>>> {
  const cadenas = unirCadenas(costas);
  const mar: Array<Feature<Polygon, Record<string, never>>> = [];
  for (const cadena of cadenas) {
    const c = cadena.coords;
    if (cadena.inicio === cadena.fin && c.length >= 4) {
      // Isla o costa cerrada: con la tierra a la izquierda, el anillo de una isla va en sentido horario.
      continue;
    }
    const tFin = perimetro(recuadro, en(c, c.length - 1));
    const tIni = perimetro(recuadro, en(c, 0));
    const anillo: Array<[number, number]> = [...c, puntoDePerimetro(recuadro, tFin)];
    // Vueltas por las esquinas en sentido horario, desde el final de la costa hasta su comienzo.
    const esquinas = [0, 1, 2, 3].map((k) => ({ t: k, p: puntoDePerimetro(recuadro, k) }));
    const recorrer = (tIni - tFin + 4) % 4;
    for (const e of esquinas.map((x) => ({ ...x, d: (x.t - tFin + 4) % 4 })).sort((a, b) => a.d - b.d)) {
      if (e.d > 0 && e.d < recorrer) anillo.push(e.p);
    }
    anillo.push(puntoDePerimetro(recuadro, tIni), en(c, 0));
    mar.push(poligono(anillo));
  }
  return mar;
}

interface Cadena {
  inicio: number;
  fin: number;
  coords: Array<[number, number]>;
}

function unirCadenas(costas: readonly WayOsm[]): Cadena[] {
  const pendientes: Cadena[] = [];
  for (const w of costas) {
    const c = coordsDe(w);
    if (c && c.length >= 2) pendientes.push({ inicio: en(w.nodes, 0), fin: en(w.nodes, w.nodes.length - 1), coords: c });
  }
  let unio = true;
  while (unio) {
    unio = false;
    for (let i = 0; i < pendientes.length && !unio; i++) {
      for (let j = 0; j < pendientes.length; j++) {
        const a = en(pendientes, i);
        const b = en(pendientes, j);
        if (i === j || a.fin !== b.inicio || a.inicio === a.fin) continue;
        pendientes[i] = { inicio: a.inicio, fin: b.fin, coords: [...a.coords, ...b.coords.slice(1)] };
        pendientes.splice(j, 1);
        unio = true;
        break;
      }
    }
  }
  return pendientes;
}

/**
 * Posición sobre el borde del recuadro, de 0 a 4 en sentido horario: 0 = esquina noroeste, 1 = noreste, 2 = sudeste,
 * 3 = sudoeste. Un punto de adentro se lleva al borde más cercano.
 */
export function perimetro(b: Bbox, [lng, lat]: [number, number]): number {
  const [o, s, e, n] = b;
  const x = Math.min(e, Math.max(o, lng));
  const y = Math.min(n, Math.max(s, lat));
  const d = [n - y, e - x, y - s, x - o]; // distancia a norte, este, sur, oeste
  const lado = d.indexOf(Math.min(...d));
  if (lado === 0) return (x - o) / (e - o);
  if (lado === 1) return 1 + (n - y) / (n - s);
  if (lado === 2) return 2 + (e - x) / (e - o);
  return 3 + (y - s) / (n - s);
}

export function puntoDePerimetro(b: Bbox, t: number): [number, number] {
  const [o, s, e, n] = b;
  const u = ((t % 4) + 4) % 4;
  const f = u - Math.floor(u);
  if (u < 1) return [o + f * (e - o), n];
  if (u < 2) return [e, n - f * (n - s)];
  if (u < 3) return [e - f * (e - o), s];
  return [o, s + f * (n - s)];
}

// ── Barrios ─────────────────────────────────────────────────────────────────────────────────────

const slug = (s: string): string =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

/** Barrios con nombre (place=suburb, neighbourhood o quarter) dentro del recuadro, sin repetidos. */
export function armarBarrios(elementos: readonly ElementoOsm[], recuadro: Bbox): Barrio[] {
  const vistos = new Map<string, Barrio>();
  for (const e of elementos) {
    if (e.type !== 'node') continue;
    const n = e as NodoOsm;
    const p = n.tags?.place;
    const nombre = n.tags?.name;
    if (!nombre || !(p === 'suburb' || p === 'neighbourhood' || p === 'quarter') || !dentro(recuadro, n.lon, n.lat)) continue;
    const id = slug(nombre);
    if (!vistos.has(id)) vistos.set(id, { id, nombre, centro: { lat: round6(n.lat), lng: round6(n.lon) } });
  }
  return [...vistos.values()].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
}

export const barrioComoPunto = (b: Barrio): Feature<Point, { nombre: string }> => ({
  type: 'Feature',
  properties: { nombre: b.nombre },
  geometry: { type: 'Point', coordinates: [b.centro.lng, b.centro.lat] },
});
