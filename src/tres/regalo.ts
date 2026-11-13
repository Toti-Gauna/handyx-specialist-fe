// La caja de regalo del Camino (lote 0.3, base de G.3). Lógica pura y determinística: la pose de la caja en cada
// instante. Baja con un rebote, tiembla y se abre con luz. **Sin azar**: el premio se anunció antes de abrir (premios
// sin azar, docs/herramientas.md §1) y la animación es siempre la misma. Con «reducir movimiento» se usa la pose final.

export type FaseRegalo = 'baja' | 'tiembla' | 'abre' | 'abierta';

export interface PoseRegalo {
  fase: FaseRegalo;
  /** Altura de la base de la caja sobre el piso, en lados de caja. */
  altura: number;
  /** Inclinación de la caja al temblar (radianes, eje Z). */
  inclinacion: number;
  /** Cuánto se levantó la tapa, en lados de caja. */
  tapaAltura: number;
  /** Giro de la tapa hacia atrás (radianes, eje X). */
  tapaGiro: number;
  /** 0 a 1: la luz que sale de adentro. */
  brillo: number;
}

/** Tiempos en segundos. */
export const TIEMPOS_REGALO = { baja: 0.9, tiembla: 1.0, abre: 0.8 } as const;
export const DURACION_REGALO = TIEMPOS_REGALO.baja + TIEMPOS_REGALO.tiembla + TIEMPOS_REGALO.abre;
const ALTURA_INICIAL = 2.4;
const TEMBLOR_HZ = 7;
const TEMBLOR_MAX = 0.11;
const TAPA_ALTURA = 0.55;
const TAPA_GIRO = -1.15;

const acotar01 = (x: number) => Math.min(1, Math.max(0, x));

/** Rebote al caer (la fórmula clásica de «bounce out»). */
export function rebote(x: number): number {
  const t = acotar01(x);
  const n = 7.5625;
  const d = 2.75;
  if (t < 1 / d) return n * t * t;
  if (t < 2 / d) return n * (t - 1.5 / d) ** 2 + 0.75;
  if (t < 2.5 / d) return n * (t - 2.25 / d) ** 2 + 0.9375;
  return n * (t - 2.625 / d) ** 2 + 0.984375;
}

/** Salida suave con un pequeño pasado (la tapa salta y se acomoda). */
export function resorte(x: number): number {
  const t = acotar01(x);
  const c = 1.70158;
  return 1 + (c + 1) * (t - 1) ** 3 + c * (t - 1) ** 2;
}

export function poseRegalo(segundos: number): PoseRegalo {
  const t = Math.max(0, segundos);
  const { baja, tiembla, abre } = TIEMPOS_REGALO;
  if (t < baja) {
    return { fase: 'baja', altura: ALTURA_INICIAL * (1 - rebote(t / baja)), inclinacion: 0, tapaAltura: 0, tapaGiro: 0, brillo: 0 };
  }
  if (t < baja + tiembla) {
    const u = (t - baja) / tiembla;
    // Crece y se corta de golpe, como algo que quiere salir. Sin(0) = 0: arranca y termina derecha.
    const envolvente = Math.sin(Math.PI * u) * (0.4 + 0.6 * u);
    const inclinacion = TEMBLOR_MAX * envolvente * Math.sin(2 * Math.PI * TEMBLOR_HZ * (t - baja));
    return { fase: 'tiembla', altura: 0, inclinacion, tapaAltura: 0.04 * envolvente * Math.abs(Math.sin(2 * Math.PI * TEMBLOR_HZ * (t - baja))), tapaGiro: 0, brillo: 0.15 * u };
  }
  if (t < DURACION_REGALO) {
    const u = (t - baja - tiembla) / abre;
    const r = resorte(u);
    return { fase: 'abre', altura: 0, inclinacion: 0, tapaAltura: TAPA_ALTURA * r, tapaGiro: TAPA_GIRO * r, brillo: 0.15 + 0.85 * acotar01(u * 1.4) };
  }
  return POSE_ABIERTA;
}

export const POSE_ABIERTA: PoseRegalo = { fase: 'abierta', altura: 0, inclinacion: 0, tapaAltura: TAPA_ALTURA, tapaGiro: TAPA_GIRO, brillo: 1 };
export const POSE_CERRADA: PoseRegalo = { fase: 'baja', altura: ALTURA_INICIAL, inclinacion: 0, tapaAltura: 0, tapaGiro: 0, brillo: 0 };
