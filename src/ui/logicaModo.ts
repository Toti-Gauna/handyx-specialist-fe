// Lógica pura del Modo trabajo y del cierre (lote 2.3: H0-Modo, H0-ModoHerramientas, H0-ModoAyuda, H0-ModoAgenda,
// H0-AntesDespues, H0-AntesLado, H0-Informe y H0-InformeEnviado). Sin React ni navegador: se prueba con node --test.
// El cronómetro lo lleva el servidor con tramos; acá solo se suma lo que dicen los tramos con el reloj de la app.
import type { AgendaItem } from '../contracts/dto.ts';
import type { ContactoProfesional } from '../contracts/equipo.ts';
import type { EstadoConformidad, SeccionInforme, Tarea } from '../contracts/modo-trabajo.ts';
import type { NombreIconoUi } from './atomos/Icono.tsx';
import type { TonoChip } from './atomos/Texto.tsx';

const MIN = 60_000;
const ZONA = 'America/Argentina/Buenos_Aires';

// ── Cronómetro ───────────────────────────────────────────────────────────────────────────────────

/** Milisegundos trabajados: la suma de los tramos (el abierto cuenta hasta ahora). */
export function tiempoTramos(tramos: readonly { desde: string; hasta: string | null }[], ahoraMs: number): number {
  let total = 0;
  for (const t of tramos) {
    const desde = Date.parse(t.desde);
    const hasta = t.hasta === null ? ahoraMs : Date.parse(t.hasta);
    if (Number.isFinite(desde) && Number.isFinite(hasta) && hasta > desde) total += hasta - desde;
  }
  return total;
}

const dos = (n: number) => String(n).padStart(2, '0');

/** "24:18" o "1:05:09": lo que se ve grande en la cabecera. */
export function textoReloj(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return h > 0 ? `${h}:${dos(m)}:${dos(s % 60)}` : `${dos(m)}:${dos(s % 60)}`;
}

/** "24 minutos", "1 hora y 5 minutos": para el lector de pantalla (no lee los segundos). */
export function textoDuracion(ms: number): string {
  const min = Math.max(0, Math.floor(ms / MIN));
  const h = Math.floor(min / 60);
  const m = min % 60;
  const minutos = `${m} ${m === 1 ? 'minuto' : 'minutos'}`;
  if (h === 0) return minutos;
  const horas = `${h} ${h === 1 ? 'hora' : 'horas'}`;
  return m === 0 ? horas : `${horas} y ${minutos}`;
}

// ── Tareas ───────────────────────────────────────────────────────────────────────────────────────

export const ordenarTareas = (tareas: readonly Tarea[]): Tarea[] => [...tareas].sort((a, b) => a.orden - b.orden);

export function progresoTareas(tareas: readonly Pick<Tarea, 'estado'>[]): { hechas: number; total: number } {
  return { hechas: tareas.filter((t) => t.estado === 'hecha').length, total: tareas.length };
}

/** La tarea de ahora: la que dice el servidor o, si no, la primera sin hacer en orden. */
export function tareaActual(tareas: readonly Tarea[], actualId: string | null): Tarea | null {
  const lista = ordenarTareas(tareas);
  const marcada = actualId ? lista.find((t) => t.id === actualId && t.estado !== 'hecha') : undefined;
  return marcada ?? lista.find((t) => t.estado !== 'hecha') ?? null;
}

/** "Tus tareas · 2 de 4". */
export const textoTareas = (hechas: number, total: number): string => (total === 0 ? 'Tus tareas' : `Tus tareas · ${hechas} de ${total}`);

/** Segmentos de la barra de avance de la cabecera: uno por tarea (hecha o no). Como mucho 12; si hay más, proporcional. */
export function segmentosAvance(hechas: number, total: number, maximo = 12): boolean[] {
  if (total <= 0) return [];
  const n = Math.min(total, maximo);
  const llenos = Math.round((hechas / total) * n);
  return Array.from({ length: n }, (_, i) => i < llenos);
}

// ── Informe ──────────────────────────────────────────────────────────────────────────────────────

export const SECCION_INFORME: Record<SeccionInforme, { titulo: string; icono: NombreIconoUi; ejemplo: string }> = {
  causa: { titulo: 'Qué encontraste', icono: 'lupa', ejemplo: 'Ej.: el disco del cartucho estaba gastado' },
  antes_despues: { titulo: 'Antes y después', icono: 'columnas', ejemplo: 'Sacá la foto del antes y la del después' },
  pruebas: { titulo: 'Pruebas', icono: 'gota', ejemplo: 'Ej.: sin pérdidas a los 10 minutos' },
  materiales_garantia: { titulo: 'Materiales y garantía', icono: 'caja', ejemplo: 'Lo que pusiste y la garantía que das' },
  recomendaciones: { titulo: 'Qué conviene hacer después', icono: 'agenda', ejemplo: 'Ej.: revisar la canilla del baño en 6 meses' },
};

export const ESTADO_SECCION: Record<'falta' | 'lista' | 'automatica', { texto: string; tono: TonoChip; icono: NombreIconoUi }> = {
  falta: { texto: 'Te falta', tono: 'amarillo', icono: 'alerta' },
  lista: { texto: 'Listo', tono: 'exito', icono: 'check' },
  automatica: { texto: 'Se completó solo', tono: 'tinte', icono: 'rayo' },
};

export const ESTADO_CONFORMIDAD: Record<EstadoConformidad, { texto: string; tono: TonoChip; icono: NombreIconoUi }> = {
  sin_enviar: { texto: 'Sin mandar', tono: 'gris', icono: 'reloj' },
  esperando: { texto: 'Esperando', tono: 'amarillo', icono: 'reloj' },
  dada: { texto: 'Dio su conformidad', tono: 'exito', icono: 'check' },
  con_observaciones: { texto: 'Con observaciones', tono: 'error', icono: 'alerta' },
};

/** "Casi listo · 4 de 5" o "Listo · 5 de 5". */
export const textoAvanceInforme = (completas: number, total: number): string => `${completas >= total ? 'Listo' : 'Casi listo'} · ${completas} de ${total}`;

/** Opciones del recordatorio de mantenimiento (para vos, nunca se le manda al cliente solo). */
export const OPCIONES_RECORDATORIO = [
  { valor: 'no', texto: 'No hace falta', meses: null },
  { valor: '6', texto: 'En 6 meses', meses: 6 },
  { valor: '12', texto: 'En 1 año', meses: 12 },
] as const;
export type OpcionRecordatorio = (typeof OPCIONES_RECORDATORIO)[number]['valor'];

// ── Fechas (AAAA-MM-DD, sin hora) ────────────────────────────────────────────────────────────────

const aFecha = (d: Date): string => `${d.getUTCFullYear()}-${dos(d.getUTCMonth() + 1)}-${dos(d.getUTCDate())}`;
const deFecha = (f: string): Date => new Date(`${f}T12:00:00.000Z`);

export function sumarDias(fecha: string, dias: number): string {
  const d = deFecha(fecha);
  d.setUTCDate(d.getUTCDate() + dias);
  return aFecha(d);
}

/** Suma meses sin pasarse del último día (31/08 + 6 meses = 28/02). */
export function sumarMeses(fecha: string, meses: number): string {
  const d = deFecha(fecha);
  const dia = d.getUTCDate();
  d.setUTCDate(1);
  d.setUTCMonth(d.getUTCMonth() + meses);
  const ultimo = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
  d.setUTCDate(Math.min(dia, ultimo));
  return aFecha(d);
}

/** "17/12" en el año de hoy; "17/05/2027" si es otro año. */
export function textoFecha(fecha: string, hoy: string): string {
  const [a, m, d] = fecha.split('-');
  return a === hoy.slice(0, 4) ? `${d}/${m}` : `${d}/${m}/${a}`;
}

/** Hoy en Buenos Aires (AAAA-MM-DD). */
export const hoyBA = (ahora: Date): string => new Intl.DateTimeFormat('en-CA', { timeZone: ZONA, year: 'numeric', month: '2-digit', day: '2-digit' }).format(ahora);

// ── Contactos y agenda ───────────────────────────────────────────────────────────────────────────

const horaBA = (iso: string): string => {
  const p = new Intl.DateTimeFormat('es-AR', { timeZone: ZONA, hour: 'numeric', minute: '2-digit', hour12: false }).formatToParts(new Date(iso));
  const h = p.find((x) => x.type === 'hour')?.value ?? '';
  const m = p.find((x) => x.type === 'minute')?.value ?? '00';
  return m === '00' ? String(Number(h)) : `${Number(h)}:${m}`;
};

/** Estado de un contacto escrito (nunca solo color). Null: no lo comparte. */
export function estadoContacto(c: Pick<ContactoProfesional, 'estado' | 'ocupadoHasta'>): { texto: string; tono: TonoChip; icono: NombreIconoUi } {
  if (c.estado === 'disponible') return { texto: 'Disponible', tono: 'exito', icono: 'check' };
  if (c.estado === 'ocupado') return { texto: c.ocupadoHasta ? `Ocupado hasta las ${horaBA(c.ocupadoHasta)}` : 'Ocupado', tono: 'amarillo', icono: 'reloj' };
  if (c.estado === 'en_obra') return { texto: 'En obra', tono: 'tinte', icono: 'obra' };
  return { texto: 'No comparte su estado', tono: 'gris', icono: 'usuario2' };
}

/** Lo que sigue después de este trabajo (confirmado o con cambio pendiente), en orden. */
export function loQueSigue(items: readonly AgendaItem[], trabajoId: string, ahoraMs: number): AgendaItem[] {
  return items
    .filter((i) => i.trabajoId !== null && i.trabajoId !== trabajoId && i.estado !== 'oferta_pendiente' && Date.parse(i.inicio) > ahoraMs)
    .sort((a, b) => Date.parse(a.inicio) - Date.parse(b.inicio));
}

/**
 * Minutos que este trabajo lleva pasado de su horario (0 si no se pasó, no tiene fin o se pasó más de `maximo`: un
 * trabajo que sigue otro día no «va tarde», sigue).
 */
export function minutosDePasado(fin: string | null, ahoraMs: number, maximo = 240): number {
  if (!fin) return 0;
  const m = Math.floor((ahoraMs - Date.parse(fin)) / MIN);
  return m > 0 && m <= maximo ? m : 0;
}

// ── Comparador antes y después ───────────────────────────────────────────────────────────────────

/** Lo que se lee de la manija: "Se ve 50 % del antes y 50 % del después". */
export const textoComparador = (pos: number): string => `Se ve ${Math.round(pos)} % del antes y ${100 - Math.round(pos)} % del después`;

// ── Textos del trabajo ───────────────────────────────────────────────────────────────────────────

/** Título corto del trabajo para la cabecera: la primera frase de lo acordado, cortada en una palabra (≤ 34 letras). */
export function tituloTrabajo(alcance: string, maximo = 34): string {
  const frase = (alcance.split(/[.:;\n]/)[0] ?? alcance).trim();
  if (frase.length <= maximo) return frase;
  const corte = frase.slice(0, maximo + 1).lastIndexOf(' ');
  return `${frase.slice(0, corte > 10 ? corte : maximo).trimEnd()}…`;
}
