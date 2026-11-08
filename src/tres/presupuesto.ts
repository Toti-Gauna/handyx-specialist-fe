// Presupuesto de rendimiento del 3D (lote 0.3). Lógica pura: a partir de lo que el teléfono declara, decide cuántos
// píxeles se dibujan, cuánta geometría entra y qué extras se encienden. Referencia de gama baja: Moto E20 (2 GB de
// memoria, GPU de un núcleo, pantalla de 720 × 1600). Ver docs/tres.md §Presupuesto.

export type NivelTres = 'bajo' | 'medio' | 'alto';

/** Lo que el navegador declara. Lo que no declara queda `undefined` (Safari no informa la memoria). */
export interface Equipo {
  /** window.devicePixelRatio */
  densidad: number;
  /** navigator.deviceMemory, en GB (Chrome y Android). */
  memoriaGb?: number;
  /** navigator.hardwareConcurrency */
  nucleos?: number;
  /** MAX_TEXTURE_SIZE de WebGL, si ya se leyó. */
  texturaMax?: number;
  /** navigator.connection.saveData: el usuario pidió ahorrar datos (y suele ser un equipo modesto). */
  ahorroDatos?: boolean;
}

export interface Presupuesto {
  nivel: NivelTres;
  /** Tope de devicePixelRatio para el lienzo. */
  densidadMax: number;
  /** Tope de píxeles reales del lienzo (ancho × alto × densidad²). */
  pixelesMax: number;
  antialias: boolean;
  /** Triángulos que puede tener la escena entera. */
  triangulosMax: number;
  /** Segmentos para cilindros, esferas y anillos (más = más suave y más caro). */
  segmentos: number;
  /** Reflejos suaves del entorno (un mapa de entorno que se calcula una vez). */
  entorno: boolean;
  /** Entre cuadros de una animación: 33 ms = 30 cuadros por segundo. */
  intervaloMinMs: number;
}

export const PRESUPUESTOS: Record<NivelTres, Presupuesto> = {
  bajo: { nivel: 'bajo', densidadMax: 1.25, pixelesMax: 600_000, antialias: false, triangulosMax: 40_000, segmentos: 20, entorno: false, intervaloMinMs: 33 },
  medio: { nivel: 'medio', densidadMax: 1.75, pixelesMax: 1_300_000, antialias: true, triangulosMax: 120_000, segmentos: 32, entorno: true, intervaloMinMs: 16 },
  alto: { nivel: 'alto', densidadMax: 2, pixelesMax: 2_400_000, antialias: true, triangulosMax: 250_000, segmentos: 48, entorno: true, intervaloMinMs: 0 },
};

/**
 * Nivel del equipo. Ante la duda se elige el más bajo: un 3D que anda fluido en un Moto E20 vale más que uno lindo que
 * se traba.
 */
export function nivelDe(e: Equipo): NivelTres {
  if (e.ahorroDatos) return 'bajo';
  if (e.texturaMax !== undefined && e.texturaMax < 4096) return 'bajo';
  if (e.memoriaGb !== undefined && e.memoriaGb <= 2) return 'bajo';
  if (e.nucleos !== undefined && e.nucleos <= 4) return 'bajo';
  if (e.memoriaGb !== undefined) return e.memoriaGb >= 6 ? 'alto' : 'medio';
  // Sin dato de memoria (iPhone, iPad, escritorio con Firefox o Safari): nivel medio.
  return 'medio';
}

export function presupuestoPara(e: Equipo, forzado?: NivelTres): Presupuesto {
  return PRESUPUESTOS[forzado ?? nivelDe(e)];
}

/**
 * Densidad que se usa para un lienzo de `anchoCss` × `altoCss`: la del equipo, sin pasar el tope del nivel ni el
 * máximo de píxeles. Nunca baja de 1 salvo que el lienzo sea enorme.
 */
export function densidadPara(p: Presupuesto, densidadEquipo: number, anchoCss: number, altoCss: number): number {
  const area = Math.max(1, anchoCss * altoCss);
  const porPixeles = Math.sqrt(p.pixelesMax / area);
  const d = Math.min(Math.max(0.5, densidadEquipo || 1), p.densidadMax, porPixeles);
  return Math.max(0.5, Math.round(d * 100) / 100);
}

/** ¿La escena entra en el presupuesto? Lo usan las primitivas y las pruebas. */
export function dentroDelPresupuesto(p: Presupuesto, triangulos: number): boolean {
  return triangulos <= p.triangulosMax;
}

/** Segmentos para una pieza: proporcional al nivel, nunca menos de `minimo` (un cilindro de 6 lados no se ve redondo). */
export function segmentosPara(p: Presupuesto, proporcion = 1, minimo = 8): number {
  return Math.max(minimo, Math.round(p.segmentos * proporcion));
}

/** ¿Toca dibujar este cuadro? En gama baja las animaciones van a 30 cuadros para no calentar el teléfono. */
export function tocaCuadro(p: Presupuesto, ahoraMs: number, ultimoMs: number): boolean {
  return ahoraMs - ultimoMs >= p.intervaloMinMs - 1;
}
