// Escaneo 3D (lote 0.3, base para T-Escanear de la ola 2). Lógica pura del anillo de fotos: dónde va cada toma alrededor
// del objeto y cómo se cuenta el avance. Dónde se arma el modelo (en el teléfono o en el servidor) lo decide Ignacio
// antes del lote 2.4; esto no depende de eso.
import type { Vec3 } from './cotas.ts';

export const TOMAS_ESCANEO = 30;

/**
 * Posición de cada toma en un anillo de `radio` a la `altura` indicada, empezando por el frente (+Z) y girando en el
 * sentido de las agujas del reloj visto desde arriba (como camina la persona alrededor del objeto).
 */
export function posicionesTomas(total = TOMAS_ESCANEO, radio = 1, altura = 0): Vec3[] {
  const n = Math.max(1, Math.floor(total));
  return Array.from({ length: n }, (_, i) => {
    const a = (-2 * Math.PI * i) / n;
    // `+ 0` evita el −0 de sin(−0).
    return [radio * Math.sin(a) + 0, altura, radio * Math.cos(a) + 0] as Vec3;
  });
}

export interface AvanceEscaneo {
  tomadas: number;
  total: number;
  fraccion: number;
  listo: boolean;
  /** «18 de 30 fotos» */
  texto: string;
}

export function avanceEscaneo(tomadas: number, total = TOMAS_ESCANEO): AvanceEscaneo {
  const t = Math.max(1, Math.floor(total));
  const hechas = Math.min(t, Math.max(0, Math.floor(tomadas)));
  return { tomadas: hechas, total: t, fraccion: hechas / t, listo: hechas >= t, texto: `${hechas} de ${t} fotos` };
}
