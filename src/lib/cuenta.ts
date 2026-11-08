// Textos de Cuenta que salen de fechas del servidor (lote 1.4). Lógica pura, con su prueba.
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
