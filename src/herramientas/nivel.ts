// Nivel, pared y plomada (T-Nivel, lote 2.4). Se apoya en la lógica de src/taller/nivel.ts (pendiente, calibración y
// estado) y suma lo de la pantalla nueva: los tres modos, la posición de la burbuja y hacia dónde está inclinado, dicho
// con palabras. `beta`: adelante/atrás; `gamma`: izquierda/derecha (DeviceOrientationEvent, en grados).
import { estadoNivel, type EstadoNivel, type Lectura } from '../taller/nivel.ts';

export type ModoNivelTelefono = 'superficie' | 'pared' | 'plomada';

export const MODOS_NIVEL: readonly { valor: ModoNivelTelefono; texto: string; ayuda: string }[] = [
  { valor: 'superficie', texto: 'Superficie', ayuda: 'Apoyá el teléfono acostado sobre la mesada, el piso o el estante.' },
  { valor: 'pared', texto: 'Pared', ayuda: 'Apoyá el teléfono de costado sobre un listón, un caño o el marco.' },
  { valor: 'plomada', texto: 'Plomada', ayuda: 'Apoyá el teléfono parado contra la pared o la columna.' },
];

/** ±10° llegan al borde del círculo. */
const TOPE_GRADOS = 10;

export interface LecturaNivel {
  /** El ángulo principal, sin signo de presentación (positivo = derecha o adelante). */
  angulo: number;
  /** Posición de la burbuja de −1 a 1 (la burbuja sube: va al lado alto). */
  x: number;
  y: number;
}

export function leerNivel(l: Lectura, modo: ModoNivelTelefono, cero: Lectura = { beta: 0, gamma: 0 }): LecturaNivel {
  const beta = l.beta - cero.beta;
  const gamma = l.gamma - cero.gamma;
  const a = (v: number) => -v / TOPE_GRADOS;
  if (modo === 'superficie') {
    const principal = Math.abs(gamma) >= Math.abs(beta) ? gamma : beta;
    return { angulo: Math.round(principal * 10) / 10, x: a(gamma), y: a(beta) };
  }
  if (modo === 'pared') return { angulo: Math.round(gamma * 10) / 10, x: a(gamma), y: 0 };
  // Parado: a plomo con beta = 90°; lo que falta o sobra es la inclinación hacia adelante o atrás.
  const fuera = Math.abs(gamma) >= Math.abs(beta - 90) ? gamma : beta - 90;
  return { angulo: Math.round(fuera * 10) / 10, x: a(gamma), y: a(beta - 90) };
}

const ESTADO: Record<EstadoNivel, string> = { a_nivel: 'A nivel', casi: 'Casi a nivel', fuera: 'Fuera de nivel' };
const ESTADO_PLOMO: Record<EstadoNivel, string> = { a_nivel: 'A plomo', casi: 'Casi a plomo', fuera: 'Fuera de plomo' };

/** «Casi a nivel · inclinado hacia la izquierda». */
export function describirNivel(l: Lectura, modo: ModoNivelTelefono, cero: Lectura = { beta: 0, gamma: 0 }): { estado: EstadoNivel; texto: string; grados: string } {
  const { angulo } = leerNivel(l, modo, cero);
  const estado = estadoNivel(angulo);
  const textos = modo === 'plomada' ? ESTADO_PLOMO : ESTADO;
  const beta = l.beta - cero.beta - (modo === 'plomada' ? 90 : 0);
  const gamma = l.gamma - cero.gamma;
  const lateral = modo === 'pared' || Math.abs(gamma) >= Math.abs(beta);
  const hacia = lateral ? (gamma < 0 ? 'hacia la izquierda' : 'hacia la derecha') : beta < 0 ? 'hacia atrás' : 'hacia adelante';
  const grados = `${Math.abs(angulo).toFixed(1).replace('.', ',')}°`;
  return { estado, grados, texto: estado === 'a_nivel' ? textos.a_nivel : `${textos[estado]} · inclinado ${hacia}` };
}
