// Arreglo que se construye (lote 0.3, escena isométrica 3D opcional). Lógica pura: qué piezas tiene el objeto de cada
// rubro, en qué orden entran y cómo está cada una en un instante. Complementa las ilustraciones SVG del kit (que usan
// GSAP): las piezas bajan y se encastran, siempre igual (sin azar). Con «reducir movimiento», todo armado de entrada.
// La escena 3D está en primitivas/arreglo3d.ts.
import type { Rubro } from '../contracts/rubros.ts';

export interface ObjetoArreglo {
  /** «una canilla», para la descripción en texto. */
  nombre: string;
  /** Piezas en el orden en que se arman, en palabras simples. */
  piezas: readonly string[];
}

/** El objeto que se arma por rubro (los mismos de las ilustraciones: canilla, tablero, caño, cerradura, aire, pared). */
export const OBJETOS_ARREGLO: Record<Rubro, ObjetoArreglo> = {
  electricidad: { nombre: 'un tablero eléctrico', piezas: ['Caja', 'Riel', 'Disyuntor', 'Llaves térmicas', 'Tapa'] },
  plomeria: { nombre: 'una canilla', piezas: ['Bacha', 'Caño', 'Cuerpo', 'Pico', 'Manija'] },
  gas: { nombre: 'un caño de gas', piezas: ['Tramo de la pared', 'Codo', 'Bajada', 'Llave de paso'] },
  cerrajeria: { nombre: 'una cerradura', piezas: ['Puerta', 'Caja', 'Cilindro', 'Picaporte', 'Llave'] },
  albanileria: { nombre: 'una pared', piezas: ['Primera hilada', 'Segunda hilada', 'Tercera hilada', 'Cuarta hilada', 'Revoque'] },
  aire_acondicionado: { nombre: 'un aire acondicionado', piezas: ['Soporte', 'Equipo', 'Rejilla', 'Luz de encendido'] },
};

/** Tiempos en segundos: cada pieza tarda `pieza` y la siguiente arranca `escalon` después de la anterior. */
export const TIEMPOS_ARMADO = { pieza: 0.55, escalon: 0.32 } as const;
/** Desde dónde baja cada pieza, en unidades de la escena (la base mide 1). */
export const ALTURA_ENTRADA = 0.7;
const GIRO_ENTRADA = 0.5;

export function duracionArmado(piezas: number): number {
  if (piezas <= 0) return 0;
  return (piezas - 1) * TIEMPOS_ARMADO.escalon + TIEMPOS_ARMADO.pieza;
}

const acotar01 = (x: number) => Math.min(1, Math.max(0, x));

/** Salida con un pequeño pasado: la pieza se pasa apenas y se encastra (como un «clic»). */
export function encastre(x: number): number {
  const t = acotar01(x);
  const c = 1.4;
  return 1 + (c + 1) * (t - 1) ** 3 + c * (t - 1) ** 2;
}

export interface PosePieza {
  /** 0 = todavía no entró, 1 = en su lugar. */
  avance: number;
  visible: boolean;
  /** Cuánto le falta bajar (unidades de la escena). */
  subida: number;
  /** Giro sobre su eje vertical mientras baja (radianes). Alterna de lado: sin azar. */
  giro: number;
  /** Escala: entra un poco más chica y se agranda al encastrar. */
  escala: number;
}

export const PIEZA_ARMADA: PosePieza = { avance: 1, visible: true, subida: 0, giro: 0, escala: 1 };

/** Pose de la pieza `i` a los `segundos` de empezar. */
export function posePieza(i: number, segundos: number): PosePieza {
  const u = acotar01((segundos - i * TIEMPOS_ARMADO.escalon) / TIEMPOS_ARMADO.pieza);
  // Con un margen: la suma de los tiempos en coma flotante no da exacto al final.
  if (u >= 1 - 1e-9) return PIEZA_ARMADA;
  const e = encastre(u);
  const lado = i % 2 === 0 ? 1 : -1;
  return { avance: u, visible: u > 0, subida: ALTURA_ENTRADA * (1 - e), giro: lado * GIRO_ENTRADA * (1 - e), escala: 0.7 + 0.3 * Math.min(1, e) };
}

/** Cuántas piezas ya están en su lugar (para el texto «Paso 3 de 5»). */
export function piezasArmadas(piezas: number, segundos: number): number {
  let n = 0;
  for (let i = 0; i < piezas; i++) if (posePieza(i, segundos).avance >= 1) n++;
  return n;
}

/** Descripción en texto para el visor: el 3D es decorativo y lo importante lo dice la pantalla al lado. */
export function describirArreglo(rubro: Rubro): string {
  const o = OBJETOS_ARREGLO[rubro];
  const lista = o.piezas.map((p) => p.toLowerCase());
  const ultima = lista.pop();
  return `Dibujo en 3D de ${o.nombre} que se arma pieza por pieza: ${lista.length ? `${lista.join(', ')} y ${ultima}` : ultima}.`;
}
