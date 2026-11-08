// Lógica pura de la pestaña Taller (lote 2.1): agenda e ingresos. Sin React ni DOM; sus pruebas están en
// agendaTaller.test.ts. Las fechas son 'AAAA-MM-DD' de Buenos Aires y los importes, centavos enteros.
import type { TurnoAgenda } from '../contracts/agenda.ts';
import type { CategoriaGasto, ResumenIngresos } from '../contracts/ingresos.ts';
import type { EstadoPago } from '../contracts/maquinas.ts';
import type { NombreIconoUi } from '../ui/atomos/Icono.tsx';
import type { TonoChip } from '../ui/atomos/Texto.tsx';

const DIA_MS = 24 * 60 * 60_000;
const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'] as const;
const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'] as const;

const aMs = (fecha: string): number => Date.parse(`${fecha}T12:00:00.000Z`);
const aFecha = (ms: number): string => new Date(ms).toISOString().slice(0, 10);

/** Suma días a una fecha. */
export const sumarDias = (fecha: string, dias: number): string => aFecha(aMs(fecha) + dias * DIA_MS);

/** El lunes de la semana de una fecha. */
export function lunesDe(fecha: string): string {
  const dow = (new Date(aMs(fecha)).getUTCDay() + 6) % 7;
  return sumarDias(fecha, -dow);
}

/** "martes 17" */
export function diaConNumero(fecha: string): string {
  const d = new Date(aMs(fecha));
  return `${DIAS[d.getUTCDay()]} ${d.getUTCDate()}`;
}

/** "Hoy · martes 17", "Ayer · lunes 16", "Mañana · miércoles 18" o "viernes 13". */
export function rotuloDia(fecha: string, hoy: string): string {
  const base = diaConNumero(fecha);
  if (fecha === hoy) return `Hoy · ${base}`;
  if (fecha === sumarDias(hoy, -1)) return `Ayer · ${base}`;
  if (fecha === sumarDias(hoy, 1)) return `Mañana · ${base}`;
  return base;
}

/** "Noviembre 2026" */
export function nombreMes(mes: string): string {
  const [a, m] = mes.split('-').map(Number) as [number, number];
  const n = MESES[m - 1] ?? '';
  return `${n.charAt(0).toUpperCase()}${n.slice(1)} ${a}`;
}

/** El mes de una fecha (AAAA-MM) y el mes siguiente o anterior. */
export const mesDe = (fecha: string): string => fecha.slice(0, 7);
export function moverMesTexto(mes: string, delta: number): string {
  const [a, m] = mes.split('-').map(Number) as [number, number];
  const t = a * 12 + (m - 1) + delta;
  return `${Math.floor(t / 12)}-${String((t % 12) + 1).padStart(2, '0')}`;
}

/** Agrupa turnos ya ordenados por el día de su inicio, conservando el orden. `diaDe` pasa un instante al día de Buenos Aires. */
export function agruparPorDia(turnos: readonly TurnoAgenda[], diaDe: (instante: string) => string): Array<{ fecha: string; turnos: TurnoAgenda[] }> {
  const r: Array<{ fecha: string; turnos: TurnoAgenda[] }> = [];
  for (const t of turnos) {
    const fecha = diaDe(t.inicio);
    const ultimo = r.at(-1);
    if (ultimo && ultimo.fecha === fecha) ultimo.turnos.push(t);
    else r.push({ fecha, turnos: [t] });
  }
  return r;
}

/** Lo acordado en un día, sin contar ofertas (una oferta no es un turno). */
export const totalDelDia = (turnos: readonly TurnoAgenda[]): number => turnos.reduce((n, t) => n + (t.tipo === 'oferta' ? 0 : (t.monto?.centavos ?? 0)), 0);

export interface ChipDato {
  texto: string;
  tono: TonoChip;
  icono: NombreIconoUi;
}

/** El estado de un turno con ícono y texto (el color solo apoya). */
export function chipTurno(t: Pick<TurnoAgenda, 'tipo' | 'estado'>): ChipDato {
  if (t.estado === 'hecho') return { texto: 'Hecho', tono: 'exito', icono: 'check' };
  if (t.estado === 'cancelado') return { texto: 'Cancelado', tono: 'gris', icono: 'cerrar' };
  if (t.estado === 'cambio_pendiente') return { texto: 'Cambio pendiente', tono: 'amarillo', icono: 'reloj' };
  if (t.estado === 'oferta_pendiente') return { texto: 'Oferta sin confirmar', tono: 'gris', icono: 'ticket' };
  if (t.tipo === 'jornada') return { texto: 'Obra', tono: 'tinte', icono: 'obra' };
  if (t.tipo === 'retiro_ferreteria') return { texto: 'Retiro', tono: 'tinte', icono: 'carrito' };
  return { texto: 'Agendado', tono: 'noche', icono: 'agenda' };
}

/** Cómo va el cobro de una pasada: informado ≠ verificado. */
export function chipCobro(estado: EstadoPago): ChipDato {
  switch (estado) {
    case 'verificado':
      return { texto: 'Cobrado · verificado', tono: 'exito', icono: 'check' };
    case 'reportado':
      return { texto: 'Informado', tono: 'amarillo', icono: 'reloj' };
    case 'pendiente':
      return { texto: 'Sin cobrar', tono: 'gris', icono: 'reloj' };
    case 'fallido':
      return { texto: 'El pago falló', tono: 'error', icono: 'alerta' };
    case 'en_discrepancia':
      return { texto: 'En revisión', tono: 'amarillo', icono: 'alerta' };
  }
}

/** Una frase corta para el lector de pantalla y el pie de la tarjeta: "2 turnos". */
export const textoTurnos = (n: number): string => (n === 0 ? 'Sin turnos' : n === 1 ? '1 turno' : `${n} turnos`);

// ── Ingresos ────────────────────────────────────────────────────────────────────────────────────

export const NOMBRE_CATEGORIA: Record<CategoriaGasto, string> = {
  materiales: 'Materiales',
  combustible_viaticos: 'Combustible y viáticos',
  herramientas: 'Herramientas',
  otro: 'Otros gastos',
};
export const ICONO_CATEGORIA: Record<CategoriaGasto, NombreIconoUi> = {
  materiales: 'caja',
  combustible_viaticos: 'camion',
  herramientas: 'herramienta',
  otro: 'ticket',
};

export interface TramoBarra {
  clave: 'neto' | CategoriaGasto;
  texto: string;
  centavos: number;
  /** 0 a 100, con un decimal. */
  porcentaje: number;
}

/**
 * La barra del neto: del bruto, cuánto queda y cuánto se va en cada gasto. Si los gastos superan al bruto, toda la barra
 * es de gastos (y la pantalla dice la pérdida con palabras). Los porcentajes suman 100 cuando hay bruto y 0 cuando no.
 */
export function tramosNeto(r: Pick<ResumenIngresos, 'bruto' | 'gastos' | 'neto'>): TramoBarra[] {
  const bruto = r.bruto.total.centavos;
  const gastos = r.gastos.porCategoria.map((c) => ({
    clave: c.categoria,
    texto: NOMBRE_CATEGORIA[c.categoria],
    centavos: c.total.centavos,
  }));
  const totalGastos = gastos.reduce((n, g) => n + g.centavos, 0);
  const base = Math.max(bruto, totalGastos);
  const pct = (c: number): number => (base === 0 ? 0 : Math.round((c / base) * 1000) / 10);
  const neto = r.neto?.centavos ?? 0;
  const tramos: TramoBarra[] = [{ clave: 'neto', texto: 'Neto', centavos: neto, porcentaje: pct(neto) }, ...gastos.map((g) => ({ ...g, porcentaje: pct(g.centavos) }))];
  return tramos.filter((t) => t.centavos > 0);
}

/** "75 % neto, 21 % materiales, 4 % combustible y viáticos" para el lector de pantalla. */
export function textoBarra(tramos: readonly TramoBarra[]): string {
  if (tramos.length === 0) return 'Todavía no hay ingresos ni gastos este mes';
  return tramos.map((t) => `${Math.round(t.porcentaje)} % ${t.texto.toLowerCase()}`).join(', ');
}
