// Geografía del mock (lote 4.3). Todo es de prueba:
// - Los centros de barrio son aproximados hasta que scripts/mapa genere los de OpenStreetMap (mapa/barrios.json).
// - Los destinos son puntos sintéticos cerca de esos centros, sin relación con ningún hogar real.
// - El grafo de calles (mapa/grafo.json) lo genera el mismo script; vacío, no hay trayectos y la app ofrece Google Maps o Waze.
import type { Barrio, Punto, ZonaMapa } from '../../contracts/dto.ts';
import { desplazar } from '../../lib/geo.ts';
import { ZONAS } from '../../lib/etiquetas.ts';
import { calcularRuta, prepararGrafo, type GrafoDatos, type Ruta } from '../../mapa/grafo.ts';
import datosBarrios from './mapa/barrios.json' with { type: 'json' };

const APROXIMADOS: Record<(typeof ZONAS)[number], Punto> = {
  Centro: { lat: -38.0005, lng: -57.547 },
  'La Perla': { lat: -37.9905, lng: -57.553 },
  'Playa Grande': { lat: -38.0255, lng: -57.536 },
  Güemes: { lat: -38.014, lng: -57.545 },
  'Punta Mogotes': { lat: -38.068, lng: -57.553 },
  Constitución: { lat: -37.965, lng: -57.552 },
};

/** Donde arranca el viaje simulado (un punto de prueba, no la base de nadie). */
export const BASE_PRUEBA: Punto = { lat: -38.006, lng: -57.572 };

const normalizar = (s: string): string => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const osm = (datosBarrios as { barrios: Barrio[] }).barrios;

/** Los barrios de cobertura del mock (los mismos ids que usa Disponibilidad), con el centro de OpenStreetMap si está. */
export function barriosPrueba(): Barrio[] {
  return ZONAS.map((nombre) => ({ id: nombre, nombre, centro: osm.find((b) => normalizar(b.nombre) === normalizar(nombre))?.centro ?? APROXIMADOS[nombre] }));
}

const semilla = (id: string): number => {
  let h = 7;
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) % 100_003;
  return h;
};

/** Punto exacto de prueba de un pedido: cerca del centro del barrio y hacia tierra (al oeste de la costa). */
export function destinoPrueba(id: string, zona: string): Punto {
  const b = barriosPrueba().find((x) => x.id === zona) ?? { centro: APROXIMADOS.Centro };
  const n = semilla(id);
  return redondear(desplazar(b.centro, 150 + (n % 250), 200 + (n % 140)));
}

/** Lo que el servidor manda antes del acuerdo: el centro corrido (hasta 350 m) y un radio que igual contiene al destino. */
export function zonaPrueba(id: string, destino: Punto): ZonaMapa {
  const n = semilla(`${id}:zona`);
  return { centro: redondear(desplazar(destino, 200 + (n % 150), n % 360)), radioM: 700 };
}

const redondear = (p: Punto): Punto => ({ lat: Math.round(p.lat * 1e6) / 1e6, lng: Math.round(p.lng * 1e6) / 1e6 });

// ── Trayectos ───────────────────────────────────────────────────────────────────────────────────

let grafo: ReturnType<typeof prepararGrafo> | undefined;

/** Carga diferida del grafo (puede pesar cerca de 1 MB): solo cuando una pantalla pide un viaje. */
export async function cargarGrafo(): Promise<void> {
  if (grafo !== undefined) return;
  const m = (await import('./mapa/grafo.json', { with: { type: 'json' } })) as { default: GrafoDatos };
  grafo = prepararGrafo(m.default);
}

/** Solo para las pruebas: reemplaza el grafo por uno sintético (o lo vacía con null). */
export function usarGrafo(d: GrafoDatos | null): void {
  grafo = d ? prepararGrafo(d) : null;
}

/** Null si no hay grafo (todavía no se generaron los datos) o si no hay camino. */
export function rutaPrueba(origen: Punto, destino: Punto): Ruta | null {
  return grafo ? calcularRuta(grafo, origen, destino) : null;
}
