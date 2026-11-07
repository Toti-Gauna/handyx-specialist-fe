// Nivel, plomada y pendiente con el giroscopio (fase H0; lo reusan Plomería y Albañilería). Lógica pura.
// La orientación llega como `beta` (inclinación adelante/atrás) y `gamma` (izquierda/derecha) en grados, según
// DeviceOrientationEvent. El modo decide qué eje se mide.

export type ModoNivel = 'plano' | 'canto';

export interface Lectura {
  beta: number;
  gamma: number;
}

/** Ángulo del eje que se mide. `plano`: el celular acostado sobre una superficie (eje largo = beta). `canto`: apoyado de
 * costado contra un caño o un listón (eje = gamma). */
export function anguloDe(l: Lectura, modo: ModoNivel): number {
  return modo === 'plano' ? l.beta : l.gamma;
}

/** Pendiente en % a partir del ángulo en grados: tan(θ) × 100. */
export function pendientePorcentaje(grados: number): number {
  return Math.round(Math.tan((grados * Math.PI) / 180) * 1000) / 10;
}

/** Diferencia de altura (mm) en un largo dado (m) para una pendiente en %. */
export function desnivelMm(pendiente: number, largoM: number): number {
  return Math.round(pendiente * largoM * 10);
}

/** Suavizado exponencial: el número no tiembla con el pulso. */
export function suavizar(anterior: number | null, nuevo: number, alfa = 0.2): number {
  return anterior === null ? nuevo : anterior + alfa * (nuevo - anterior);
}

/** Calibración: el ángulo que marca el celular sobre una superficie que el profesional sabe que está a nivel. */
export function calibrado(angulo: number, cero: number): number {
  return Math.round((angulo - cero) * 10) / 10;
}

export type EstadoNivel = 'a_nivel' | 'casi' | 'fuera';

/** A nivel dentro de 0,2°; casi hasta 1°. */
export function estadoNivel(angulo: number): EstadoNivel {
  const a = Math.abs(angulo);
  if (a <= 0.2) return 'a_nivel';
  if (a <= 1) return 'casi';
  return 'fuera';
}

/** ¿La pendiente medida llega a la buscada (por ejemplo, 2 % en un desagüe)? Con tolerancia de 0,2 puntos. */
export function cumplePendiente(medida: number, buscada: number): boolean {
  return Math.abs(medida) + 0.2 >= buscada;
}
