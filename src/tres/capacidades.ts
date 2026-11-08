// Detección de capacidades para el 3D y la AR (lote 0.3). Funciones puras que reciben lo que el navegador expone (así
// se prueban sin navegador). El visor y el botón de AR les pasan `navigator`, `window` y un lienzo de prueba.
import type { Equipo } from './presupuesto.ts';

export type ModoAr = 'webxr' | 'quicklook' | 'ninguno';

/** Android con WebXR primero (ubica en el lugar con detección de superficies); si no, Quick Look de iPhone; si no, nada. */
export function elegirModoAr(c: { webxrAr: boolean; quickLook: boolean }): ModoAr {
  if (c.webxrAr) return 'webxr';
  if (c.quickLook) return 'quicklook';
  return 'ninguno';
}

interface ContextoGl {
  getParameter(p: number): unknown;
  getExtension(nombre: string): unknown;
  readonly MAX_TEXTURE_SIZE: number;
}
interface LienzoPrueba {
  getContext(tipo: string, opciones?: object): unknown;
}

export interface Webgl {
  disponible: boolean;
  texturaMax?: number;
}

/**
 * ¿Hay WebGL? Prueba WebGL 2 y después WebGL 1 en un lienzo descartable, lee el tamaño máximo de textura y suelta el
 * contexto enseguida (los navegadores limitan cuántos contextos vivos hay).
 */
export function detectarWebgl(crearLienzo: () => LienzoPrueba | null): Webgl {
  try {
    const lienzo = crearLienzo();
    if (!lienzo) return { disponible: false };
    const gl = (lienzo.getContext('webgl2', { failIfMajorPerformanceCaveat: false }) ?? lienzo.getContext('webgl')) as ContextoGl | null;
    if (!gl) return { disponible: false };
    const max = Number(gl.getParameter(gl.MAX_TEXTURE_SIZE));
    const perder = gl.getExtension('WEBGL_lose_context') as { loseContext(): void } | null;
    perder?.loseContext();
    return Number.isFinite(max) && max > 0 ? { disponible: true, texturaMax: max } : { disponible: true };
  } catch {
    return { disponible: false };
  }
}

interface NavegadorConDatos {
  deviceMemory?: number;
  hardwareConcurrency?: number;
  connection?: { saveData?: boolean };
}

/** Lee del navegador lo que necesita el presupuesto. Lo que no informa queda sin dato. */
export function leerEquipo(nav: NavegadorConDatos | undefined, densidad: number | undefined, webgl?: Webgl): Equipo {
  const e: Equipo = { densidad: densidad && densidad > 0 ? densidad : 1 };
  if (typeof nav?.deviceMemory === 'number' && nav.deviceMemory > 0) e.memoriaGb = nav.deviceMemory;
  if (typeof nav?.hardwareConcurrency === 'number' && nav.hardwareConcurrency > 0) e.nucleos = nav.hardwareConcurrency;
  if (nav?.connection?.saveData === true) e.ahorroDatos = true;
  if (webgl?.texturaMax) e.texturaMax = webgl.texturaMax;
  return e;
}

/** AR Quick Look: Safari de iOS declara `rel="ar"` en los enlaces. */
export function quickLookDisponible(crearEnlace: () => { relList?: { supports?(t: string): boolean } } | null): boolean {
  try {
    return Boolean(crearEnlace()?.relList?.supports?.('ar'));
  } catch {
    return false;
  }
}
