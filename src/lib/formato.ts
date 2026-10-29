// Fechas y plata para mostrar. Los instantes llegan en UTC y se muestran en Buenos Aires (America/Argentina/Buenos_Aires).
import { formatearPesos, monto, type Monto } from '../contracts/dinero.ts';
import { ZONA_HORARIA } from '../contracts/tiempos.ts';

const partes = (iso: string, opciones: Intl.DateTimeFormatOptions): string =>
  new Intl.DateTimeFormat('es-AR', { timeZone: ZONA_HORARIA, ...opciones }).format(new Date(iso));

const sinPunto = (t: string) => t.replace('.', '');

/** "mar 17/11" (armado por partes: el separador cambia según la versión de ICU). */
export function fechaCorta(iso: string): string {
  const p = new Intl.DateTimeFormat('es-AR', { timeZone: ZONA_HORARIA, weekday: 'short', day: '2-digit', month: '2-digit' }).formatToParts(new Date(iso));
  const v = (t: string) => p.find((x) => x.type === t)?.value ?? '';
  return `${sinPunto(v('weekday'))} ${v('day')}/${v('month')}`;
}
/** "12:00" */
export const hora = (iso: string): string => partes(iso, { hour: '2-digit', minute: '2-digit', hour12: false });
/** "mar 17/11 · 12:00" */
export const fechaHora = (iso: string): string => `${fechaCorta(iso)} · ${hora(iso)}`;
/** "martes 17 de noviembre" */
export const fechaLarga = (iso: string): string => partes(iso, { weekday: 'long', day: 'numeric', month: 'long' });
/** "AAAA-MM-DD" del día en Buenos Aires */
export const diaLocal = (iso: string): string => new Intl.DateTimeFormat('en-CA', { timeZone: ZONA_HORARIA, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(iso));

export const pesos = (m: Monto): string => formatearPesos(m);
export const pesosDesdeCentavos = (c: number): string => formatearPesos(monto(c));

/** "hace 8 min", "hace 3 h", "hace 2 días" */
export function haceCuanto(iso: string, ahora: Date): string {
  const min = Math.max(0, Math.round((ahora.getTime() - Date.parse(iso)) / 60_000));
  if (min < 1) return 'recién';
  if (min < 60) return `hace ${min} min`;
  if (min < 24 * 60) return `hace ${Math.round(min / 60)} h`;
  const d = Math.round(min / (24 * 60));
  return `hace ${d} ${d === 1 ? 'día' : 'días'}`;
}

/** Tiempo que falta para un vencimiento: "4:32", "3 h 10 min" o null si ya venció. */
export function restante(hasta: string, ahora: Date): string | null {
  const s = Math.floor((Date.parse(hasta) - ahora.getTime()) / 1000);
  if (s <= 0) return null;
  if (s < 3600) return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  const h = Math.floor(s / 3600);
  return `${h} h ${String(Math.floor((s % 3600) / 60)).padStart(2, '0')} min`;
}

/** Valor de <input type="datetime-local"> (hora de Buenos Aires) ⇄ instante UTC. Argentina no tiene horario de verano (UTC−3). */
export function aInputLocal(iso: string): string {
  return `${diaLocal(iso)}T${hora(iso)}`;
}
export function deInputLocal(v: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(v)) return null;
  const d = new Date(`${v}:00-03:00`);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

/** Pesos escritos por la persona ("45.000", "45000,50") → centavos enteros, o null si no es un importe válido. */
export function centavosDesdeTexto(texto: string): number | null {
  const limpio = texto.trim().replace(/\$/g, '').replace(/\s/g, '').replace(/\./g, '').replace(',', '.');
  if (!/^\d+(\.\d{1,2})?$/.test(limpio)) return null;
  const [e = '0', d = ''] = limpio.split('.');
  return Number(e) * 100 + Number(d.padEnd(2, '0'));
}

/** UUIDv4 para Idempotency-Key (con respaldo si `crypto.randomUUID` no está, p. ej. http por red local). */
export function nuevaClave(): string {
  const c: Crypto = globalThis.crypto;
  if (typeof c.randomUUID === 'function') return c.randomUUID();
  const b = c.getRandomValues(new Uint8Array(16));
  b[6] = ((b[6] ?? 0) & 0x0f) | 0x40;
  b[8] = ((b[8] ?? 0) & 0x3f) | 0x80;
  const h = [...b].map((x) => x.toString(16).padStart(2, '0')).join('');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}
