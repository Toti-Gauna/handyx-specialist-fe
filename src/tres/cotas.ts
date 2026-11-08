// Cotas y medidas en 3D (lote 0.3). Lógica pura: formato de las medidas en voseo y con coma decimal, medidas de una
// caja y el trazado de una cota (línea, líneas de referencia y marcas). La parte de Three.js está en primitivas/cotas3d.ts.
// Unidades: metros.

export type Vec3 = readonly [number, number, number];

export interface Caja {
  min: Vec3;
  max: Vec3;
}

const coma = (n: number, decimales: number) => n.toFixed(decimales).replace('.', ',');

/**
 * «85 cm», «4,5 cm», «1,20 m». Por debajo del metro, centímetros enteros (con un decimal si es menos de 10 cm y no es
 * entero); desde el metro, metros con dos decimales.
 */
export function formatearMedida(metros: number): string {
  if (!Number.isFinite(metros) || metros < 0) return '—';
  if (metros >= 1) return `${coma(Math.round(metros * 100) / 100, 2)} m`;
  const cm = metros * 100;
  if (cm < 10) {
    const r = Math.round(cm * 10) / 10;
    return Number.isInteger(r) ? `${r} cm` : `${coma(r, 1)} cm`;
  }
  return `${Math.round(cm)} cm`;
}

export function formatearDiametro(metros: number): string {
  return `Ø ${formatearMedida(metros)}`;
}

export interface Medidas {
  alto: number;
  ancho: number;
  fondo: number;
}

export function medidasDeCaja(c: Caja): Medidas {
  return { ancho: Math.abs(c.max[0] - c.min[0]), alto: Math.abs(c.max[1] - c.min[1]), fondo: Math.abs(c.max[2] - c.min[2]) };
}

/**
 * Texto de las medidas para la descripción accesible y la ficha: «Alto 85 cm · diámetro 45 cm · aprox.». Las medidas
 * de un escaneo o de la cámara son aproximadas y se dice siempre.
 */
export function describirMedidas(m: { alto?: number; ancho?: number; fondo?: number; diametro?: number }, aproximadas = true): string {
  const partes: string[] = [];
  if (m.alto !== undefined) partes.push(`alto ${formatearMedida(m.alto)}`);
  if (m.diametro !== undefined) partes.push(`diámetro ${formatearMedida(m.diametro)}`);
  if (m.ancho !== undefined) partes.push(`ancho ${formatearMedida(m.ancho)}`);
  if (m.fondo !== undefined) partes.push(`fondo ${formatearMedida(m.fondo)}`);
  if (!partes.length) return '';
  const texto = partes.join(' · ');
  const capital = texto.charAt(0).toUpperCase() + texto.slice(1);
  return aproximadas ? `${capital} · aprox.` : capital;
}

const suma = (a: Vec3, b: Vec3): Vec3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const resta = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const escalar = (a: Vec3, k: number): Vec3 => [a[0] * k, a[1] * k, a[2] * k];
export const distancia = (a: Vec3, b: Vec3) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);

export interface TrazoCota {
  /** De cada punto medido a la línea de cota (líneas de referencia, finitas). */
  referencias: [[Vec3, Vec3], [Vec3, Vec3]];
  /** La línea de cota, separada del objeto. */
  linea: [Vec3, Vec3];
  /** Marcas en los extremos, perpendiculares a la línea (en la dirección de la separación). */
  marcas: [[Vec3, Vec3], [Vec3, Vec3]];
  /** Donde va la etiqueta. */
  medio: Vec3;
  /** Lo que mide (la distancia real entre los puntos, no la de la línea desplazada). */
  largo: number;
}

/**
 * Cota entre dos puntos, corrida `desplazamiento` hacia afuera del objeto (como en un plano). Las marcas miden
 * `largoMarca` y siguen la dirección del desplazamiento.
 */
export function trazarCota(desde: Vec3, hasta: Vec3, desplazamiento: Vec3, largoMarca = 0.03): TrazoCota {
  const a = suma(desde, desplazamiento);
  const b = suma(hasta, desplazamiento);
  const largoDesp = Math.hypot(...desplazamiento);
  const dir: Vec3 = largoDesp > 0 ? escalar(desplazamiento, 1 / largoDesp) : [0, 0, 0];
  const m = escalar(dir, largoMarca / 2);
  return {
    referencias: [
      [desde, suma(a, m)],
      [hasta, suma(b, m)],
    ],
    linea: [a, b],
    marcas: [
      [resta(a, m), suma(a, m)],
      [resta(b, m), suma(b, m)],
    ],
    medio: escalar(suma(a, b), 0.5),
    largo: distancia(desde, hasta),
  };
}

/** Cota del alto de una caja: sobre la esquina del frente a la derecha, corrida hacia la derecha. */
export function cotaAlto(c: Caja, separacion = 0.08): TrazoCota {
  return trazarCota([c.max[0], c.min[1], c.max[2]], [c.max[0], c.max[1], c.max[2]], [separacion, 0, 0]);
}

/** Cota del diámetro de un cilindro vertical: de lado a lado por el frente, arriba del todo, corrida hacia arriba. */
export function cotaDiametro(centro: Vec3, radio: number, altura: number, separacion = 0.08): TrazoCota {
  return trazarCota([centro[0] - radio, altura, centro[2] + radio], [centro[0] + radio, altura, centro[2] + radio], [0, separacion, 0]);
}

/** Cota del ancho de una caja: por el frente, abajo, corrida hacia el frente. */
export function cotaAncho(c: Caja, separacion = 0.08): TrazoCota {
  return trazarCota([c.min[0], c.min[1], c.max[2]], [c.max[0], c.min[1], c.max[2]], [0, 0, separacion]);
}
