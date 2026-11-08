// Medir con la cámara (T-Medir, lote 2.4, fase H0.1b). Lógica pura, sin navegador:
// - Con AR (WebXR en Android) cada punto es una posición en el espacio en metros; la distancia sale directa (± 1 cm
//   aproximado, según el teléfono y la luz).
// - Sin AR (iPhone o un Android sin WebXR) se mide sobre una foto con una tarjeta de referencia del tamaño de una SUBE o
//   una de crédito (85,6 × 54 mm, ISO/IEC 7810 ID-1) apoyada en la misma superficie: sus dos puntas dan la escala.
//   Es más aproximada: vale para lo que está en el mismo plano que la tarjeta y de frente.
// Siempre se dice que es una medida aproximada: para cortar, se confirma con la cinta.
import { formatearMedida, type Vec3 } from '../tres/cotas.ts';

/** Lado largo de una tarjeta SUBE o de crédito (ISO/IEC 7810 ID-1). */
export const TARJETA_LARGO_MM = 85.6;
/** Menos que esto en la foto y la escala no es confiable: hay que acercarse. */
export const TARJETA_MIN_PX = 30;
/** Hasta cuántos puntos se marcan por medición (una cadena: cada punto nuevo mide desde el anterior). */
export const MAX_PUNTOS = 8;

export type Punto2 = readonly [number, number];

export const distancia2 = (a: Punto2, b: Punto2) => Math.hypot(a[0] - b[0], a[1] - b[1]);
const distancia3 = (a: Vec3, b: Vec3) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);

export type ResultadoEscala = { ok: true; metrosPorPx: number } | { ok: false; motivo: 'chica' };

/** Metros por píxel de la foto a partir de las dos puntas del lado largo de la tarjeta. */
export function escalaTarjeta(a: Punto2, b: Punto2): ResultadoEscala {
  const px = distancia2(a, b);
  if (!Number.isFinite(px) || px < TARJETA_MIN_PX) return { ok: false, motivo: 'chica' };
  return { ok: true, metrosPorPx: TARJETA_LARGO_MM / 1000 / px };
}

/** Largos de cada tramo (en metros) de una cadena de puntos sobre la foto. */
export function tramosEnFoto(puntos: readonly Punto2[], metrosPorPx: number): number[] {
  return puntos.slice(1).map((p, i) => distancia2(puntos[i] ?? p, p) * metrosPorPx);
}

/** Largos de cada tramo (en metros) de una cadena de puntos de la AR. */
export function tramosEnAr(puntos: readonly Vec3[]): number[] {
  return puntos.slice(1).map((p, i) => distancia3(puntos[i] ?? p, p));
}

/** El ángulo (en grados, 0 a 180) entre dos tramos que comparten el punto del medio. */
export function anguloEntre<T extends readonly number[]>(a: T, b: T, c: T): number {
  const u = a.map((v, i) => v - (b[i] ?? 0));
  const w = c.map((v, i) => v - (b[i] ?? 0));
  const punto = u.reduce((s, v, i) => s + v * (w[i] ?? 0), 0);
  const nu = Math.hypot(...u);
  const nw = Math.hypot(...w);
  if (nu === 0 || nw === 0) return 0;
  return (Math.acos(Math.max(-1, Math.min(1, punto / (nu * nw)))) * 180) / Math.PI;
}

/** «1,42 m», «85 cm» o «2,39 m²». */
export const textoMedida = formatearMedida;
export function textoSuperficie(m2: number): string {
  if (!Number.isFinite(m2) || m2 <= 0) return '—';
  return `${(Math.round(m2 * 100) / 100).toFixed(2).replace('.', ',')} m²`;
}

export interface Resumen {
  /** «Hueco de 1,42 × 1,68 m · 2,39 m²» o «3 medidas · 4,20 m en total». */
  texto: string;
  /** Superficie si los dos tramos forman casi un ángulo recto (un rectángulo: hueco, pared, mesada). */
  superficieM2: number | null;
  /** Para el chip: «2 medidas». */
  cantidad: string;
}

/**
 * Resumen de lo medido. Con dos tramos casi en escuadra (entre 80° y 100°) se informa la superficie del rectángulo;
 * con uno, su largo; con más, la suma (útil para un recorrido de caño o un zócalo).
 */
export function resumirMedidas(tramos: readonly number[], angulo: number | null): Resumen {
  const n = tramos.length;
  const cantidad = n === 1 ? '1 medida' : `${n} medidas`;
  const [primero, segundo] = tramos;
  if (primero === undefined) return { texto: 'Todavía no mediste nada', superficieM2: null, cantidad: '0 medidas' };
  if (segundo === undefined) return { texto: textoMedida(primero), superficieM2: null, cantidad };
  if (n === 2 && angulo !== null && angulo >= 80 && angulo <= 100) {
    const s = primero * segundo;
    return { texto: `${textoMedida(primero).replace(' m', '')} × ${textoMedida(segundo)} · ${textoSuperficie(s)}`, superficieM2: s, cantidad };
  }
  const total = tramos.reduce((a, b) => a + b, 0);
  return { texto: `${textoMedida(total)} en total`, superficieM2: null, cantidad };
}

/** Texto para compartir o copiar: cada tramo y la aclaración de que son aproximadas. */
export function textoParaCompartir(nombre: string, tramos: readonly number[], resumen: Resumen): string {
  const lineas = tramos.map((t, i) => `Medida ${i + 1}: ${textoMedida(t)}`);
  return [nombre.trim() || 'Medidas', ...lineas, resumen.superficieM2 ? `Superficie: ${textoSuperficie(resumen.superficieM2)}` : null, 'Medidas aproximadas, tomadas con la cámara del teléfono.'].filter(Boolean).join('\n');
}

/** Mueve un punto con los botones de flecha (alternativa al arrastre: WCAG 2.5.7), sin salir de la foto. */
export function moverPunto(p: Punto2, dx: number, dy: number, ancho: number, alto: number): Punto2 {
  return [Math.min(ancho, Math.max(0, p[0] + dx)), Math.min(alto, Math.max(0, p[1] + dy))];
}
