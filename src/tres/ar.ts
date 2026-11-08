// AR común de Handyx (lote 0.3; generaliza la AR del Taller, H1.4). En Android, WebXR: la cámara busca superficies
// (hit-test), una retícula amarilla marca dónde va y un toque coloca el objeto en tamaño real. En iPhone no hay
// WebXR: AR Quick Look con un USDZ que se arma en el teléfono. Sin ninguno de los dos, la pantalla no ofrece AR.
// Solo navegador. La escena de la AR se dibuja con el bucle de XR, que el sistema corta al salir.
//
// Compatible con src/taller/ar.ts: mismas funciones y tipos, con opciones nuevas que no cambian lo que ya existía.
import * as THREE from 'three';
import { elegirModoAr, quickLookDisponible, type ModoAr } from './capacidades.ts';
import { ponerLucesAr } from './marca.ts';

type ConXr = Navigator & { xr?: XRSystem };

export type { ModoAr } from './capacidades.ts';

export async function arInmersivoDisponible(): Promise<boolean> {
  const xr = typeof navigator === 'undefined' ? undefined : (navigator as ConXr).xr;
  if (!xr) return false;
  try {
    return await xr.isSessionSupported('immersive-ar');
  } catch {
    return false;
  }
}

export function soportaQuickLook(): boolean {
  if (typeof document === 'undefined') return false;
  return quickLookDisponible(() => document.createElement('a'));
}

/** Qué AR tiene este teléfono: WebXR (Android), Quick Look (iPhone) o ninguna. */
export async function modoAr(): Promise<ModoAr> {
  return elegirModoAr({ webxrAr: await arInmersivoDisponible(), quickLook: soportaQuickLook() });
}

/** `pared`: el frente del objeto (+Z) mira hacia afuera de la pared. `techo` y `piso`: el objeto sigue la normal (+Y). */
export type Superficie = 'pared' | 'techo' | 'piso';

export interface SesionAr {
  terminar(): void;
}

export interface OpcionesAr {
  objeto: THREE.Object3D;
  /** Pasa las unidades de la escena a metros (el tablero se dibuja en decímetros: 0,1). */
  escala: number;
  superficie: Superficie;
  /** El elemento que queda encima de la cámara (instrucciones y botón de salir: dom-overlay). */
  capa: HTMLElement;
  alColocar?: () => void;
  alSalir: () => void;
  /**
   * Resolución de la cámara de XR respecto de la nativa (1 = nativa). En gama baja, 0,75 alivia la GPU sin que se
   * note en un objeto chico. Sin dato, la del sistema.
   */
  escalaBuffer?: number;
}

/** Abre la cámara en AR. */
export async function abrirAr(o: OpcionesAr): Promise<SesionAr> {
  const xr = (navigator as ConXr).xr;
  if (!xr) throw new Error('sin WebXR');
  const session = await xr.requestSession('immersive-ar', {
    requiredFeatures: ['hit-test'],
    optionalFeatures: ['dom-overlay'],
    domOverlay: { root: o.capa },
  });
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.xr.enabled = true;
  renderer.xr.setReferenceSpaceType('local');
  if (o.escalaBuffer !== undefined) renderer.xr.setFramebufferScaleFactor(Math.min(1, Math.max(0.5, o.escalaBuffer)));
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 30);
  ponerLucesAr(scene);

  const reticula = new THREE.Mesh(new THREE.RingGeometry(0.07, 0.09, 40).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0xf5f59a }));
  reticula.matrixAutoUpdate = false;
  reticula.visible = false;
  scene.add(reticula);

  // El objeto en tamaño real, orientado según la superficie.
  const modelo = new THREE.Group();
  const copia = o.objeto.clone(true);
  copia.scale.setScalar(o.escala);
  if (o.superficie === 'pared') copia.rotation.x = -Math.PI / 2;
  modelo.add(copia);
  let colocado = false;

  await renderer.xr.setSession(session);
  const espacioVista = await session.requestReferenceSpace('viewer');
  const fuente = await session.requestHitTestSource?.({ space: espacioVista });

  session.addEventListener('select', () => {
    if (!reticula.visible) return;
    reticula.matrix.decompose(modelo.position, modelo.quaternion, new THREE.Vector3());
    if (!colocado) scene.add(modelo);
    colocado = true;
    o.alColocar?.();
  });

  renderer.setAnimationLoop((_t: number, frame?: XRFrame) => {
    const ref = renderer.xr.getReferenceSpace();
    if (frame && fuente && ref) {
      const pose = frame.getHitTestResults(fuente)[0]?.getPose(ref);
      reticula.visible = Boolean(pose);
      if (pose) reticula.matrix.fromArray(pose.transform.matrix);
    }
    renderer.render(scene, camera);
  });

  session.addEventListener('end', () => {
    renderer.setAnimationLoop(null);
    fuente?.cancel();
    reticula.geometry.dispose();
    (reticula.material as THREE.Material).dispose();
    renderer.dispose();
    o.alSalir();
  });
  return { terminar: () => void session.end().catch(() => undefined) };
}

/**
 * Modelo USDZ para AR Quick Look (iPhone), en metros. El exportador se carga recién cuando hace falta: no pesa en las
 * pantallas que no ofrecen AR.
 */
export async function prepararUsdz(objeto: THREE.Object3D, escala: number): Promise<Blob> {
  const { USDZExporter } = await import('three/addons/exporters/USDZExporter.js');
  const copia = objeto.clone(true);
  copia.scale.setScalar(escala);
  const datos = await new USDZExporter().parseAsync(copia);
  return new Blob([datos as BlobPart], { type: 'model/vnd.usdz+zip' });
}
