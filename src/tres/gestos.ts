// Gestos táctiles del visor 3D (lote 0.3). Lógica pura sobre eventos de puntero ya leídos (id, x, y, tiempo): un dedo
// gira, dos dedos acercan o alejan con el pellizco y un doble toque centra. El ratón y el lápiz usan lo mismo.

export interface Punto {
  id: number;
  x: number;
  y: number;
  /** Milisegundos (performance.now o el timeStamp del evento). */
  t: number;
}

export type Gesto = { tipo: 'girar'; dx: number; dy: number } | { tipo: 'pellizco'; factor: number } | { tipo: 'doble-toque' };

/** Un toque corto y casi quieto cuenta como toque (no como arrastre). */
const TOQUE_MAX_MS = 260;
const TOQUE_MAX_PX = 10;
/** Dos toques seguidos, cerca uno del otro, son doble toque. */
export const DOBLE_TOQUE_MS = 320;
export const DOBLE_TOQUE_PX = 28;

export function separacion(a: Pick<Punto, 'x' | 'y'>, b: Pick<Punto, 'x' | 'y'>): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function esDobleToque(anterior: Pick<Punto, 'x' | 'y' | 't'> | null, actual: Pick<Punto, 'x' | 'y' | 't'>): boolean {
  if (!anterior) return false;
  return actual.t - anterior.t <= DOBLE_TOQUE_MS && separacion(anterior, actual) <= DOBLE_TOQUE_PX;
}

export interface Seguimiento {
  bajar(p: Punto): void;
  mover(p: Punto): Gesto | null;
  /** Al levantar el dedo; puede devolver el doble toque. */
  subir(p: Punto): Gesto | null;
  /** Dedos apoyados ahora. */
  readonly activos: number;
}

/**
 * Sigue los dedos apoyados. Con dos dedos, el pellizco es la razón entre la separación anterior y la actual (mayor que
 * 1 = se juntan = alejar). Cuando se levanta un dedo de dos, el que queda sigue girando sin salto.
 */
export function crearSeguimiento(): Seguimiento {
  const dedos = new Map<number, Punto>();
  const inicio = new Map<number, Punto>();
  let ultimoToque: Punto | null = null;
  let huboMultitoque = false;

  return {
    get activos() {
      return dedos.size;
    },
    bajar(p) {
      dedos.set(p.id, p);
      inicio.set(p.id, p);
      if (dedos.size > 1) huboMultitoque = true;
    },
    mover(p) {
      const previo = dedos.get(p.id);
      if (!previo) return null;
      if (dedos.size === 1) {
        dedos.set(p.id, p);
        return { tipo: 'girar', dx: p.x - previo.x, dy: p.y - previo.y };
      }
      const otro = [...dedos.values()].find((d) => d.id !== p.id);
      dedos.set(p.id, p);
      if (!otro) return null;
      const antes = separacion(previo, otro);
      const ahora = separacion(p, otro);
      if (antes < 1 || ahora < 1) return null;
      return { tipo: 'pellizco', factor: antes / ahora };
    },
    subir(p) {
      const arranque = inicio.get(p.id);
      dedos.delete(p.id);
      inicio.delete(p.id);
      if (dedos.size > 0) return null;
      const multitoque = huboMultitoque;
      huboMultitoque = false;
      const fueToque = !multitoque && arranque !== undefined && p.t - arranque.t <= TOQUE_MAX_MS && separacion(arranque, p) <= TOQUE_MAX_PX;
      if (!fueToque) {
        ultimoToque = null;
        return null;
      }
      if (esDobleToque(ultimoToque, p)) {
        ultimoToque = null;
        return { tipo: 'doble-toque' };
      }
      ultimoToque = p;
      return null;
    },
  };
}

/** Rueda del ratón o gesto del trackpad: cada «paso» acerca o aleja un 10 %. */
export function factorRueda(deltaY: number): number {
  return Math.exp(Math.max(-1, Math.min(1, deltaY / 100)) * 0.1);
}
