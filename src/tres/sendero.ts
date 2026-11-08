// Sendero con estaciones (lote 0.3, base del Camino de trabajos, G.2). Lógica pura: dónde va cada estación, en qué
// estado está y cuánto del sendero ya se recorrió. Solo cuenta lo verificado: el avance lo calcula el servidor y llega
// como dato; acá solo se dibuja.
import type { Vec3 } from './cotas.ts';

export type EstadoEstacion = 'lograda' | 'actual' | 'proxima';

export interface Estacion {
  /** «Gorra Handyx» */
  titulo: string;
  /** «10 trabajos» */
  requisito: string;
  estado: EstadoEstacion;
}

/** Estados a partir de la estación en curso: las anteriores logradas, las siguientes por venir. */
export function estadosEstaciones(cantidad: number, actual: number): EstadoEstacion[] {
  return Array.from({ length: Math.max(0, cantidad) }, (_, i) => (i < actual ? 'lograda' : i === actual ? 'actual' : 'proxima'));
}

export interface OpcionesSendero {
  /** Distancia entre estaciones, hacia el fondo (−Z). */
  separacion?: number;
  /** Cuánto serpentea a los costados. */
  amplitud?: number;
}

/**
 * Posiciones de las estaciones: el sendero arranca adelante y serpentea hacia el fondo, como el camino de Duolingo
 * acostado. Siempre el mismo trazado para la misma cantidad (sin azar).
 */
export function trazarSendero(cantidad: number, o: OpcionesSendero = {}): Vec3[] {
  const sep = o.separacion ?? 1.6;
  const amp = o.amplitud ?? 1.1;
  return Array.from({ length: Math.max(0, cantidad) }, (_, i) => [amp * Math.sin(i * 1.15), 0, -i * sep] as Vec3);
}

/**
 * Puntos para la curva del sendero: las estaciones más un tramo antes de la primera y uno después de la última, para
 * que el camino entre y salga de la vista en lugar de cortarse en seco.
 */
export function puntosCurva(estaciones: readonly Vec3[], o: OpcionesSendero = {}): Vec3[] {
  const sep = o.separacion ?? 1.6;
  const primera = estaciones[0];
  const ultima = estaciones[estaciones.length - 1];
  if (!primera || !ultima) return [];
  return [[primera[0] * 0.5, 0, primera[2] + sep * 0.8], ...estaciones, [ultima[0] * 0.5, 0, ultima[2] - sep * 0.8]];
}

/**
 * Cuánto del sendero está recorrido (0 a 1) entre la primera y la última estación: la estación actual más lo que se
 * avanzó hacia la siguiente (`avance` 0 a 1, p. ej. 8 de 10 trabajos = 0,8).
 */
export function recorrido(cantidad: number, actual: number, avance = 0): number {
  if (cantidad <= 1) return 1;
  const a = Math.min(Math.max(0, actual), cantidad - 1);
  const u = (a + Math.min(1, Math.max(0, avance))) / (cantidad - 1);
  return Math.min(1, Math.max(0, u));
}

/** Descripción en texto del sendero (para la descripción accesible del visor). */
export function describirSendero(estaciones: readonly Estacion[]): string {
  if (!estaciones.length) return 'Todavía no hay estaciones en tu camino.';
  const logradas = estaciones.filter((e) => e.estado === 'lograda').length;
  const actual = estaciones.find((e) => e.estado === 'actual');
  const partes = [`Camino de ${estaciones.length} estaciones, ${logradas === 1 ? '1 lograda' : `${logradas} logradas`}.`];
  if (actual) partes.push(`Vas por «${actual.titulo}» (${actual.requisito}).`);
  else if (logradas === estaciones.length) partes.push('Llegaste al final del camino.');
  return partes.join(' ');
}
