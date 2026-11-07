// Cuentas de mapa sin dependencias (lote 4.3): distancias, avance sobre un trayecto, desvío, señal del GPS y textos.
// Las usan la pantalla En camino, el mock (que emula al servidor) y el script que arma los datos del mapa.
import type { Punto } from '../contracts/dto.ts';

const RADIO_TIERRA_M = 6_371_008.8;
const rad = (g: number): number => (g * Math.PI) / 180;
const grados = (r: number): number => (r * 180) / Math.PI;

/** Elemento i de una lista que se sabe que existe (los recorridos de abajo nunca se salen de rango). */
export function en<T>(lista: readonly T[], i: number): T {
  const v = lista[i];
  if (v === undefined) throw new RangeError(`índice ${i} fuera de la lista`);
  return v;
}

/** Más lejos que esto del trayecto (con buena precisión) cuenta como desvío. */
export const UMBRAL_DESVIO_M = 60;
/** Con una precisión peor que esta, la ubicación se muestra como imprecisa y no se usa para detectar desvíos. */
export const PRECISION_IMPRECISA_M = 100;
/** Sin una posición nueva en este tiempo, "sin señal". */
export const SIN_SENAL_MS = 30_000;
/** Envíos al servidor: como mucho uno cada 5 s, y uno cada 10 s aunque no te muevas. */
export const ENVIO_MIN_MS = 5_000;
export const ENVIO_MAX_MS = 10_000;
export const ENVIO_DISTANCIA_M = 25;

/** Distancia sobre la superficie (haversine), en metros. */
export function distanciaM(a: Punto, b: Punto): number {
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * RADIO_TIERRA_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function largoM(linea: readonly Punto[]): number {
  let total = 0;
  for (let i = 1; i < linea.length; i++) total += distanciaM(en(linea, i - 1), en(linea, i));
  return total;
}

/** Rumbo inicial de a hacia b, en grados (0 = norte, 90 = este). */
export function rumbo(a: Punto, b: Punto): number {
  const y = Math.sin(rad(b.lng - a.lng)) * Math.cos(rad(b.lat));
  const x = Math.cos(rad(a.lat)) * Math.sin(rad(b.lat)) - Math.sin(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.cos(rad(b.lng - a.lng));
  return (grados(Math.atan2(y, x)) + 360) % 360;
}

/** El punto a `metros` de p con el rumbo dado. */
export function desplazar(p: Punto, metros: number, rumboGrados: number): Punto {
  const d = metros / RADIO_TIERRA_M;
  const r = rad(rumboGrados);
  const lat = Math.asin(Math.sin(rad(p.lat)) * Math.cos(d) + Math.cos(rad(p.lat)) * Math.sin(d) * Math.cos(r));
  const lng = rad(p.lng) + Math.atan2(Math.sin(r) * Math.sin(d) * Math.cos(rad(p.lat)), Math.cos(d) - Math.sin(rad(p.lat)) * Math.sin(lat));
  return { lat: grados(lat), lng: ((grados(lng) + 540) % 360) - 180 };
}

export interface Proyeccion {
  /** El punto del trayecto más cercano. */
  punto: Punto;
  /** Qué tan lejos queda p del trayecto. */
  distanciaM: number;
  /** Cuánto se recorrió desde el inicio hasta `punto`. */
  recorridoM: number;
  /** Índice del tramo (entre linea[i] y linea[i + 1]). */
  tramo: number;
}

/** Proyecta p sobre el trayecto. Plano local alrededor de p: sobra para tramos de calle de pocos cientos de metros. */
export function proyectar(linea: readonly Punto[], p: Punto): Proyeccion {
  const kx = Math.cos(rad(p.lat)) * (Math.PI / 180) * RADIO_TIERRA_M;
  const ky = (Math.PI / 180) * RADIO_TIERRA_M;
  const xy = (q: Punto): [number, number] => [(q.lng - p.lng) * kx, (q.lat - p.lat) * ky];
  const primero = en(linea, 0);
  let mejor: Proyeccion = { punto: primero, distanciaM: distanciaM(p, primero), recorridoM: 0, tramo: 0 };
  let acumulado = 0;
  for (let i = 0; i < linea.length - 1; i++) {
    const a = en(linea, i);
    const b = en(linea, i + 1);
    const [ax, ay] = xy(a);
    const [bx, by] = xy(b);
    const dx = bx - ax;
    const dy = by - ay;
    const l2 = dx * dx + dy * dy;
    const t = l2 === 0 ? 0 : Math.max(0, Math.min(1, -(ax * dx + ay * dy) / l2));
    const cx = ax + t * dx;
    const cy = ay + t * dy;
    const d = Math.hypot(cx, cy);
    const tramoM = distanciaM(a, b);
    if (d < mejor.distanciaM) mejor = { punto: entre(a, b, t), distanciaM: d, recorridoM: acumulado + t * tramoM, tramo: i };
    acumulado += tramoM;
  }
  return mejor;
}

const entre = (a: Punto, b: Punto, t: number): Punto => ({ lat: a.lat + t * (b.lat - a.lat), lng: a.lng + t * (b.lng - a.lng) });

/** El punto que queda a `metros` del inicio del trayecto (o el final, si se pasa). */
export function puntoEn(linea: readonly Punto[], metros: number): Punto {
  let falta = Math.max(0, metros);
  for (let i = 0; i < linea.length - 1; i++) {
    const a = en(linea, i);
    const b = en(linea, i + 1);
    const tramo = distanciaM(a, b);
    if (falta <= tramo) return entre(a, b, tramo === 0 ? 0 : falta / tramo);
    falta -= tramo;
  }
  return en(linea, linea.length - 1);
}

/** Lo que falta del trayecto desde p: la parte que todavía se dibuja. */
export function loQueFalta(linea: readonly Punto[], p: Punto): Punto[] {
  if (linea.length < 2) return [...linea];
  const pr = proyectar(linea, p);
  return [pr.punto, ...linea.slice(pr.tramo + 1)];
}

/** Desvío: lejos del trayecto y con una precisión que permite asegurarlo. */
export function fueraDelTrayecto(linea: readonly Punto[], p: Punto, precisionM: number): boolean {
  if (linea.length < 2 || precisionM > PRECISION_IMPRECISA_M) return false;
  return proyectar(linea, p).distanciaM > UMBRAL_DESVIO_M + precisionM / 2;
}

/** Polígono cerrado que aproxima un círculo (para la zona aproximada). */
export function circulo(centro: Punto, radioM: number, lados = 48): Punto[] {
  const anillo = Array.from({ length: lados }, (_, i) => desplazar(centro, radioM, (360 * i) / lados));
  return [...anillo, en(anillo, 0)];
}

/** Rectángulo que contiene a todos los puntos: [[oeste, sur], [este, norte]]. */
export function encuadre(puntos: readonly Punto[]): [[number, number], [number, number]] {
  if (puntos.length === 0) throw new Error('sin puntos');
  let o = Infinity;
  let s = Infinity;
  let e = -Infinity;
  let n = -Infinity;
  for (const p of puntos) {
    o = Math.min(o, p.lng);
    e = Math.max(e, p.lng);
    s = Math.min(s, p.lat);
    n = Math.max(n, p.lat);
  }
  return [
    [o, s],
    [e, n],
  ];
}

// ── Señal del GPS ───────────────────────────────────────────────────────────────────────────────

export const SENALES = ['buscando', 'normal', 'imprecisa', 'sin_senal', 'sin_permiso', 'no_disponible'] as const;
export type Senal = (typeof SENALES)[number];

export interface Fix {
  punto: Punto;
  precisionM: number;
  enMs: number;
}

/** Estado de la señal para mostrar con texto: el permiso y la falta de GPS mandan sobre la última posición. */
export function senalDe(ultimo: Fix | null, ahoraMs: number, error: 'permiso' | 'no_disponible' | null = null): Senal {
  if (error === 'permiso') return 'sin_permiso';
  if (error === 'no_disponible') return 'no_disponible';
  if (!ultimo) return 'buscando';
  if (ahoraMs - ultimo.enMs > SIN_SENAL_MS) return 'sin_senal';
  return ultimo.precisionM > PRECISION_IMPRECISA_M ? 'imprecisa' : 'normal';
}

/** Si corresponde mandar esta posición al servidor (sin cola: si no sale, se manda la siguiente). */
export function debeEnviar(anterior: Fix | null, nuevo: Fix): boolean {
  if (!anterior) return true;
  const pasado = nuevo.enMs - anterior.enMs;
  if (pasado < ENVIO_MIN_MS) return false;
  return pasado >= ENVIO_MAX_MS || distanciaM(anterior.punto, nuevo.punto) >= ENVIO_DISTANCIA_M;
}

// ── Textos ──────────────────────────────────────────────────────────────────────────────────────

const NBSP = ' ';

/** "350 m", "1,2 km", "12 km". Redondeo hacia arriba en metros chicos para no prometer de más. */
export function textoDistancia(m: number): string {
  if (m < 1000) return `${Math.max(10, Math.ceil(m / 10) * 10)}${NBSP}m`;
  const km = m / 1000;
  return `${km < 10 ? km.toLocaleString('es-AR', { maximumFractionDigits: 1, minimumFractionDigits: 1 }) : Math.round(km)}${NBSP}km`;
}

/** "1 min", "8 min", "1 h 5 min". Nunca "0 min": es una estimación. */
export function textoDuracion(s: number): string {
  const min = Math.max(1, Math.ceil(s / 60));
  if (min < 60) return `${min}${NBSP}min`;
  const h = Math.floor(min / 60);
  const r = min % 60;
  return r === 0 ? `${h}${NBSP}h` : `${h}${NBSP}h ${r}${NBSP}min`;
}

/**
 * Atajos a Google Maps y Waze con el destino. Los abre el especialista con un toque: recién ahí el destino sale
 * de Handyx hacia ese servicio. Nunca se abre solo.
 */
export function enlacesNavegacion(destino: Punto): { google: string; waze: string } {
  const ll = `${destino.lat.toFixed(6)},${destino.lng.toFixed(6)}`;
  return {
    google: `https://www.google.com/maps/dir/?api=1&destination=${ll}&travelmode=driving`,
    waze: `https://waze.com/ul?ll=${ll}&navigate=yes`,
  };
}
