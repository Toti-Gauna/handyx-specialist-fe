// Zona horaria y plazos del negocio. Los vencimientos se calculan SIEMPRE en el servidor;
// el frontend solo los muestra. Timestamps en UTC (ISO 8601 con Z); se muestran en Buenos Aires.
export const ZONA_HORARIA = 'America/Argentina/Buenos_Aires';

const MINUTO = 60_000;

/** Ventana de búsqueda de un pedido urgente ("Ahora"). PROD-03/18. */
export const VENTANA_BUSQUEDA_URGENTE_MS = 20 * MINUTO;

/** Vigencia de una propuesta inmediata (urgente). No confundir con la ventana de búsqueda. PROD-03/18. */
export const VIGENCIA_PROPUESTA_INMEDIATA_MS = 5 * MINUTO;

/** Un programado sin propuestas en este plazo ofrece revisar o relanzar la búsqueda. */
export const PROGRAMADO_SIN_PROPUESTAS_MS = 12 * 60 * MINUTO;

/** Relanzamientos permitidos por pedido. PENDIENTE de confirmar en PROD-03/18 (valor provisorio). */
export const MAX_RELANZAMIENTOS = 3;

/** Fecha calendario (AAAA-MM-DD) de un instante en Buenos Aires. */
export function fechaLocal(instante: Date): string {
  const partes = new Intl.DateTimeFormat('en-CA', {
    timeZone: ZONA_HORARIA,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(instante);
  return partes; // en-CA ya da AAAA-MM-DD
}

/** Días calendario entre dos fechas AAAA-MM-DD (b − a). */
export function diasEntre(a: string, b: string): number {
  return Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86_400_000);
}

/** Vigencia de una propuesta de un pedido programado u obra. PENDIENTE: PROD-21 deja [H] horas sin valor. */
export const VIGENCIA_PROPUESTA_PROGRAMADO_MS = 24 * 60 * MINUTO;

/** Hora de Buenos Aires de un instante, "HH:MM" (America/Argentina/Buenos_Aires, UTC−3 sin horario de verano). */
export function horaLocal(instante: Date): string {
  return new Intl.DateTimeFormat('es-AR', {
    timeZone: ZONA_HORARIA,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(instante);
}
