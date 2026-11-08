// Cámara orbital del visor 3D (lote 0.3). Lógica pura, sin Three.js: el visor guarda una órbita «objetivo» que mueven
// los gestos y los botones, y una órbita «actual» que la sigue con amortiguación. Cuando las dos coinciden, el visor
// deja de dibujar (render bajo demanda).

/** Ángulos en radianes. `polar` 0 = mirando desde arriba, π/2 = a la altura del objeto. */
export interface Orbita {
  azimut: number;
  polar: number;
  distancia: number;
}

export interface LimitesOrbita {
  distanciaMin: number;
  distanciaMax: number;
  polarMin: number;
  polarMax: number;
  /** Sin tope de giro horizontal si se omiten. */
  azimutMin?: number;
  azimutMax?: number;
}

export const LIMITES_BASE: LimitesOrbita = {
  distanciaMin: 0.5,
  distanciaMax: 20,
  polarMin: Math.PI * 0.12,
  polarMax: Math.PI * 0.62,
};

const acotar = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

export function limitar(o: Orbita, l: LimitesOrbita): Orbita {
  return {
    azimut: acotar(o.azimut, l.azimutMin ?? -Infinity, l.azimutMax ?? Infinity),
    polar: acotar(o.polar, l.polarMin, l.polarMax),
    distancia: acotar(o.distancia, l.distanciaMin, l.distanciaMax),
  };
}

/**
 * Girar arrastrando: recorrer el alto del visor con el dedo es media vuelta. Arrastrar a la derecha gira el objeto a la
 * derecha (la cámara va hacia la izquierda), como en los visores que el especialista ya conoce.
 */
export function girar(o: Orbita, dxPx: number, dyPx: number, altoPx: number, l: LimitesOrbita): Orbita {
  const escala = Math.PI / Math.max(1, altoPx);
  return limitar({ ...o, azimut: o.azimut - dxPx * escala, polar: o.polar - dyPx * escala }, l);
}

/** Acercar o alejar: `factor` < 1 acerca (pellizco que se abre), > 1 aleja. */
export function acercar(o: Orbita, factor: number, l: LimitesOrbita): Orbita {
  if (!Number.isFinite(factor) || factor <= 0) return o;
  return limitar({ ...o, distancia: o.distancia * factor }, l);
}

/**
 * Amortiguación independiente de los cuadros por segundo: en `vidaMediaMs` recorre la mitad de lo que falta. Así un
 * teléfono que dibuja a 30 cuadros se siente igual que uno a 60.
 */
export function amortiguar(actual: Orbita, objetivo: Orbita, dtMs: number, vidaMediaMs = 90): Orbita {
  if (vidaMediaMs <= 0) return { ...objetivo };
  const k = 1 - 2 ** (-Math.max(0, dtMs) / vidaMediaMs);
  return {
    azimut: actual.azimut + (objetivo.azimut - actual.azimut) * k,
    polar: actual.polar + (objetivo.polar - actual.polar) * k,
    distancia: actual.distancia + (objetivo.distancia - actual.distancia) * k,
  };
}

/** ¿Ya llegó? Por debajo de este umbral el cambio no se ve y se deja de dibujar. */
export function asentada(a: Orbita, b: Orbita, eps = 1e-4): boolean {
  return Math.abs(a.azimut - b.azimut) < eps && Math.abs(a.polar - b.polar) < eps && Math.abs(a.distancia - b.distancia) < eps * Math.max(1, b.distancia);
}

/** Posición de la cámara (x, y, z) alrededor de `centro`. */
export function aCartesianas(o: Orbita, centro: readonly [number, number, number] = [0, 0, 0]): [number, number, number] {
  const s = Math.sin(o.polar);
  return [centro[0] + o.distancia * s * Math.sin(o.azimut), centro[1] + o.distancia * Math.cos(o.polar), centro[2] + o.distancia * s * Math.cos(o.azimut)];
}

/**
 * Distancia para que una esfera de `radio` entre entera en la vista, con un margen. Tiene en cuenta el lado más
 * angosto: en un celular vertical manda el ancho.
 */
export function distanciaEncuadre(radio: number, fovVerticalGrados: number, aspecto: number, margen = 1.2): number {
  const fovV = (fovVerticalGrados * Math.PI) / 180;
  const fovH = 2 * Math.atan(Math.tan(fovV / 2) * Math.max(0.1, aspecto));
  const fov = Math.min(fovV, fovH);
  return (Math.max(1e-3, radio) * margen) / Math.sin(fov / 2);
}

/** Vista inicial: tres cuartos de frente, un poco desde arriba, con el objeto entero. */
export function orbitaInicial(radio: number, fovVerticalGrados: number, aspecto: number, l: LimitesOrbita): Orbita {
  return limitar({ azimut: Math.PI / 7, polar: Math.PI * 0.4, distancia: distanciaEncuadre(radio, fovVerticalGrados, aspecto) }, l);
}

/**
 * Límites de distancia acordes al objeto: no se puede meter la cámara adentro ni alejarla hasta perderlo.
 * Los demás límites se conservan.
 */
export function limitesPara(radio: number, base: LimitesOrbita = LIMITES_BASE): LimitesOrbita {
  const r = Math.max(1e-3, radio);
  return { ...base, distanciaMin: r * 1.4, distanciaMax: r * 6 };
}

/** Giro automático lento (una vuelta cada `segundosPorVuelta`), para la vitrina de un premio. */
export function giroAutomatico(o: Orbita, dtMs: number, segundosPorVuelta = 14): Orbita {
  return { ...o, azimut: o.azimut + (2 * Math.PI * Math.max(0, dtMs)) / (segundosPorVuelta * 1000) };
}
