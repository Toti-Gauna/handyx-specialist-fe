// Lógica pura de las piezas de acceso del kit v3 (lote 1.1). Sin React, con pruebas en logicaAcceso.test.ts.

/** Segundos enteros que faltan hasta `desde` (ISO), nunca negativos. */
export function segundosHasta(desde: string, ahoraMs: number): number {
  return Math.max(0, Math.ceil((Date.parse(desde) - ahoraMs) / 1000));
}

/** "0:42", "1:05": la espera escrita como en un reloj. */
export function textoEspera(segundos: number): string {
  const s = Math.max(0, Math.floor(segundos));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

/** La misma espera dicha en palabras para el lector de pantalla ("42 segundos", "1 minuto y 5 segundos"). */
export function esperaEnPalabras(segundos: number): string {
  const m = Math.floor(segundos / 60);
  const s = segundos % 60;
  const min = m === 1 ? '1 minuto' : `${m} minutos`;
  const seg = s === 1 ? '1 segundo' : `${s} segundos`;
  if (m === 0) return seg;
  return s === 0 ? min : `${min} y ${seg}`;
}

/** Código de respaldo: letras y números en mayúscula, con el guion en el medio ("HX7KP-2M9QD"). */
export function normalizarRespaldo(texto: string): string {
  const t = texto.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10);
  return t.length > 5 ? `${t.slice(0, 5)}-${t.slice(5)}` : t;
}

/** Lo escrito en "Email o teléfono" parece un email (si no, se trata como teléfono). */
export const pareceEmail = (texto: string): boolean => texto.includes('@');
