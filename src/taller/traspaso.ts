// Traspaso en memoria entre herramientas del Taller (por ejemplo, de la foto con IA al armador de tablero). Vive solo
// mientras la pestaña está abierta: nada en localStorage, sessionStorage ni cookies (regla de la app).
import type { Dispositivo } from './tablero.ts';

let paraTablero: Dispositivo[] | null = null;

export function dejarParaTablero(d: Dispositivo[]): void {
  paraTablero = d.map((x) => ({ ...x }));
}

/** Lo que quedó para el armador, una sola vez. */
export function tomarParaTablero(): Dispositivo[] | null {
  const d = paraTablero;
  paraTablero = null;
  return d;
}
