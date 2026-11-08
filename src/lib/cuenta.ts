// Textos de Cuenta que salen de fechas del servidor (lote 1.4). Lógica pura, con su prueba.
import type { PreferenciasCuenta } from '../data/api/cuenta.ts';
import type { FalloApi } from '../data/errores.ts';
const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'] as const;

/** "2026-11" → "nov 2026". */
export function mesYAnio(aaaaMm: string): string {
  const [anio = '', mes = ''] = aaaaMm.split('-');
  const nombre = MESES[Number(mes) - 1];
  return nombre ? `${nombre} ${anio}` : aaaaMm;
}

/** "2028-03-31" → "03/2028" (el mes en que vence). */
export function venceMesAnio(fecha: string): string {
  const [anio = '', mes = ''] = fecha.split('-');
  return `${mes}/${anio}`;
}

/** "2026-11-10T15:00:00Z" → "10/11" en hora de Buenos Aires, para «Verificados el 10/11». */
export function diaMes(fechaIso: string, zona = 'America/Argentina/Buenos_Aires'): string {
  const p = new Intl.DateTimeFormat('es-AR', { timeZone: zona, day: '2-digit', month: '2-digit' }).formatToParts(new Date(fechaIso));
  const v = (t: string) => p.find((x) => x.type === t)?.value ?? '';
  return `${v('day')}/${v('month')}`;
}

/** Los últimos números de un documento, como los muestra la app: "•• ••• 678". Nunca el número completo. */
export function ultimosEnmascarados(ultimos: string | null, grupos = ['••', '•••']): string {
  if (!ultimos) return 'Sin cargar';
  return `${grupos.join(' ')} ${ultimos}`;
}

// ── Preferencias ───────────────────────────────────────────────────────────────────────────────────

/** Lo que se manda a guardar: todo menos `push` (el permiso del teléfono se pide aparte), con el cambio encima. Nunca pierde un campo. */
export function cuerpoPreferencias(p: PreferenciasCuenta, cambio: Partial<Omit<PreferenciasCuenta, 'push'>> = {}): Omit<PreferenciasCuenta, 'push'> {
  const { push: _push, ...resto } = p;
  return { ...resto, ...cambio };
}

export const SILENCIO_POR_DEFECTO = { desde: '22:00', hasta: '07:00' } as const;

/** "22 a 7": las horas redondas sin ceros; con minutos, "22:30 a 7". */
export function textoSilencio(s: { desde: string; hasta: string }): string {
  const h = (v: string) => (v.endsWith(':00') ? String(Number(v.slice(0, 2))) : v.replace(/^0/, ''));
  return `${h(s.desde)} a ${h(s.hasta)}`;
}

/** El texto de un cambio sensible (contraseña o código) que no salió. Una contraseña equivocada puede venir como 400 o 401. */
export function mensajeReauth(f: FalloApi | null): string | null {
  if (!f) return null;
  if (f.tipo === 'validacion' || f.tipo === 'sesion') return 'No coincide. Revisá tu contraseña o tu código e intentá de nuevo.';
  if (f.tipo === 'limite') return 'Probaste muchas veces. Esperá un rato y volvé a intentar.';
  if (f.tipo === 'conflicto') return f.detalle?.mensaje ?? 'Esto ya estaba pedido.';
  return f.detalle?.mensaje ?? 'No pudimos hacerlo ahora. Probá de nuevo en un rato.';
}
