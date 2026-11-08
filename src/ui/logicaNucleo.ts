// Lógica pura de las piezas del núcleo (lote 1.3): la cinta de precio, los atajos, los horarios a medida y las paradas
// del día. Sin React ni DOM: se prueba en logicaNucleo.test.ts. Importes en centavos enteros; horas de Buenos Aires
// (UTC−3, sin horario de verano).
import { sinCortes, textoCifra } from './logica.ts';

// ── Cinta de precio ────────────────────────────────────────────────────

/** Cada marca de la cinta vale $ 500 y ocupa 14 px; una marca larga cada $ 1.000 y un número cada $ 2.000. */
export const PASO_CINTA = 50_000;
export const PX_MARCA = 14;
export const MAXIMO_CINTA = 99_999_900;

const recortar = (c: number): number => Math.max(0, Math.min(MAXIMO_CINTA, Math.round(c)));

/** Mueve el precio `pasos` marcas, quedando siempre sobre una marca. */
export function moverCinta(centavos: number, pasos: number): number {
  const base = Math.round(centavos / PASO_CINTA) * PASO_CINTA;
  return recortar(base + pasos * PASO_CINTA);
}

/** Precio después de arrastrar la cinta `dx` px desde `inicio` (arrastrar a la izquierda sube el precio). */
export function arrastreCinta(inicio: number, dx: number): number {
  return moverCinta(inicio, -Math.round(dx / PX_MARCA));
}

export interface MarcaCinta {
  centavos: number;
  /** px desde el centro de la cinta (la aguja). */
  x: number;
  larga: boolean;
  /** "47" (miles) cada $ 2.000. */
  rotulo: string | null;
}

/** Las marcas visibles alrededor del precio (`cuantas` a cada lado). */
export function marcasCinta(centavos: number, cuantas = 16): MarcaCinta[] {
  const centro = Math.floor(centavos / PASO_CINTA);
  const corrimiento = ((centavos - centro * PASO_CINTA) / PASO_CINTA) * PX_MARCA;
  const r: MarcaCinta[] = [];
  for (let i = -cuantas; i <= cuantas; i++) {
    const c = (centro + i) * PASO_CINTA;
    if (c < 0) continue;
    const larga = c % 100_000 === 0;
    r.push({ centavos: c, x: i * PX_MARCA - corrimiento, larga, rotulo: c % 200_000 === 0 ? String(c / 100_000) : null });
  }
  return r;
}

/** Dónde va el cartel "sugerido" respecto de la aguja (px), o null si queda fuera de la vista. */
export function posicionSugerido(centavos: number, sugerido: number | null, mitadPx = 200): number | null {
  if (sugerido === null) return null;
  const x = ((sugerido - centavos) / PASO_CINTA) * PX_MARCA;
  return Math.abs(x) > mitadPx ? null : x;
}

/** Atajos del lienzo: el sugerido, +$ 2.000 y +$ 5.000 sobre el sugerido (o sobre el precio si no hay sugerido). */
export function atajosPrecio(sugerido: number | null, actual: number): { texto: string; centavos: number }[] {
  const base = sugerido ?? actual;
  const r = [
    { texto: '+ $ 2.000', centavos: recortar(base + 200_000) },
    { texto: '+ $ 5.000', centavos: recortar(base + 500_000) },
  ];
  return (sugerido !== null ? [{ texto: 'Sugerido', centavos: sugerido }, ...r] : r).map((a) => ({ ...a, texto: sinCortes(a.texto) }));
}

/** "$ 3.500 más que lo sugerido", "$ 1.000 menos que lo sugerido" o "Igual a lo sugerido". */
export function textoDiferencia(precio: number, sugerido: number | null): string | null {
  if (sugerido === null) return null;
  const d = precio - sugerido;
  if (d === 0) return 'Igual a lo sugerido';
  return `${textoCifra(Math.abs(d))} ${d > 0 ? 'más' : 'menos'} que lo sugerido`;
}

/** Redondea a los mil pesos más cercanos. */
export const redondearMil = (centavos: number): number => recortar(Math.round(centavos / 100_000) * 100_000);

// ── Horarios (Buenos Aires) ────────────────────────────────────────────

const OFFSET_MS = -3 * 3600_000;
const dos = (n: number) => String(n).padStart(2, '0');

/** Instante UTC de un día ("AAAA-MM-DD") a `minutos` desde las 00:00 de Buenos Aires. */
export function instanteBA(fecha: string, minutos: number): string {
  return new Date(Date.parse(`${fecha}T00:00:00.000Z`) - OFFSET_MS + minutos * 60_000).toISOString();
}

/** Minutos desde las 00:00 de Buenos Aires de un instante. */
export function minutosBA(iso: string): number {
  const ms = Date.parse(iso) + OFFSET_MS;
  return Math.floor((((ms % 86_400_000) + 86_400_000) % 86_400_000) / 60_000);
}

/** "AAAA-MM-DD" de Buenos Aires de un instante. */
export function fechaBA(iso: string): string {
  return new Date(Date.parse(iso) + OFFSET_MS).toISOString().slice(0, 10);
}

/** "18", "6:30" (hora corta para las franjas). */
export function horaCorta(minutos: number): string {
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  return m === 0 ? String(h) : `${h}:${dos(m)}`;
}

/** "6:15" (con minutos siempre: hora exacta y desde/hasta de la rueda). */
export const horaConMinutos = (minutos: number): string => `${Math.floor(minutos / 60)}:${dos(minutos % 60)}`;

const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

/** "hoy", "mañana" o "jueves 19". */
export function nombreDia(fecha: string, hoy: string): string {
  if (fecha === hoy) return 'hoy';
  const manana = new Date(Date.parse(`${hoy}T12:00:00Z`) + 86_400_000).toISOString().slice(0, 10);
  if (fecha === manana) return 'mañana';
  const d = new Date(`${fecha}T12:00:00Z`);
  return `${DIAS[d.getUTCDay()]} ${d.getUTCDate()}`;
}

/** "de 18 a 20 h" o "a las 6:30". */
export function textoFranja(desde: number, hasta: number | null): string {
  if (hasta === null) return `a las ${horaConMinutos(desde)}`;
  return `de ${horaCorta(desde)} a ${horaCorta(hasta)} h`;
}

/** "Hoy, de 18 a 20 h" o "Jueves 19, a las 6:30" para un horario con instantes. */
export function textoHorario(h: { inicio: string; fin: string | null }, hoy: string): string {
  const dia = nombreDia(fechaBA(h.inicio), hoy);
  const t = `${dia}, ${textoFranja(minutosBA(h.inicio), h.fin ? minutosBA(h.fin) : null)}`;
  return t.charAt(0).toUpperCase() + t.slice(1);
}

export interface Franja {
  desde: number;
  hasta: number;
}

/** Franjas del lienzo para elegir con un toque. */
export const FRANJAS_DIA: readonly Franja[] = [
  { desde: 9 * 60, hasta: 13 * 60 },
  { desde: 13 * 60, hasta: 17 * 60 },
  { desde: 17 * 60, hasta: 19 * 60 },
  { desde: 18 * 60, hasta: 20 * 60 },
];

export const seSuperponen = (a: Franja, b: Franja): boolean => a.desde < b.hasta && b.desde < a.hasta;

/** Por qué no se puede elegir una franja ese día: ya pasó o se superpone con algo agendado; null si se puede. */
export function franjaNoDisponible(f: Franja, fecha: string, hoy: string, ahoraMin: number, ocupado: readonly Franja[]): 'pasada' | 'ocupada' | null {
  if (fecha < hoy || (fecha === hoy && f.desde <= ahoraMin)) return 'pasada';
  return ocupado.some((o) => seSuperponen(f, o)) ? 'ocupada' : null;
}

/** Atajos del horario a medida (F-FechaHora). */
export const ATAJOS_HORARIO: readonly { texto: string; desde: number; hasta: number | null }[] = [
  { texto: '6 a 8', desde: 6 * 60, hasta: 8 * 60 },
  { texto: '7 a 9', desde: 7 * 60, hasta: 9 * 60 },
  { texto: 'A las 6:30', desde: 6 * 60 + 30, hasta: null },
  { texto: 'Toda la mañana', desde: 8 * 60, hasta: 12 * 60 },
];

/** Opciones de la rueda: cada 15 minutos de 5:00 a 23:45. */
export const opcionesRueda = (desde = 5 * 60, hasta = 23 * 60 + 45, paso = 15): number[] => {
  const r: number[] = [];
  for (let m = desde; m <= hasta; m += paso) r.push(m);
  return r;
};

/** Un horario a medida válido: hasta después de desde (o sin hasta, si es hora exacta). */
export const horarioValido = (desde: number, hasta: number | null): boolean => hasta === null || hasta > desde;

// ── Tu día ─────────────────────────────────────────────────────────────

/** "12 min", "1 h 05 min" (orientativo: nunca una promesa al cliente). */
export function textoMinutos(segundos: number): string {
  const m = Math.max(1, Math.round(segundos / 60));
  if (m < 60) return `${m} min`;
  return `${Math.floor(m / 60)} h ${dos(m % 60)} min`;
}

/** Mueve un elemento de la lista una posición (para reordenar con botones). Las posiciones bloqueadas no se mueven. */
export function moverEnLista<T>(lista: readonly T[], i: number, sentido: -1 | 1, fijo: (t: T) => boolean = () => false): T[] {
  const j = i + sentido;
  const a = lista[i];
  const b = lista[j];
  if (a === undefined || b === undefined || fijo(a) || fijo(b)) return [...lista];
  const r = [...lista];
  r[i] = b;
  r[j] = a;
  return r;
}

/** Cuánto falta para salir: "Sale en 10 min", "Salí ahora" o null si no hay hora sugerida. */
export function textoSalida(salirA: string | null, ahora: Date): string | null {
  if (!salirA) return null;
  const s = (Date.parse(salirA) - ahora.getTime()) / 1000;
  if (s <= 60) return 'Salí ahora';
  return `Sale en ${textoMinutos(s)}`;
}
