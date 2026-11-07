// AR inmersiva en Android (fase H1.4) con WebXR: la cámara busca superficies, una retícula marca dónde va y un toque
// coloca el objeto en tamaño real. En iPhone no hay WebXR: ahí se usa AR Quick Look (USDZ) desde la pantalla.
// Solo navegador. La escena se dibuja con el bucle de XR (que el sistema corta al salir).
import * as THREE from 'three';

type ConXr = Navigator & { xr?: XRSystem };

export async function arInmersivoDisponible(): Promise<boolean> {
  const xr = typeof navigator === 'undefined' ? undefined : (navigator as ConXr).xr;
  if (!xr) return false;
  try {
    return await xr.isSessionSupported('immersive-ar');
  } catch {
    return false;
  }
}

/** `pared`: el frente del objeto (+Z) mira hacia afuera de la pared. `techo` y `piso`: el objeto sigue la normal (+Y). */
export type Superficie = 'pared' | 'techo' | 'piso';

export interface SesionAr {
  terminar(): void;
}

/**
 * Abre la cámara en AR. `capa` es el elemento que queda encima (instrucciones y botón de salir: dom-overlay).
 * `escala` pasa las unidades de la escena a metros (el tablero se dibuja en decímetros: 0,1).
 */
export async function abrirAr(o: { objeto: THREE.Object3D; escala: number; superficie: Superficie; capa: HTMLElement; alColocar?: () => void; alSalir: () => void }): Promise<SesionAr> {
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
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 30);
  scene.add(new THREE.HemisphereLight(0xffffff, 0xc8d0de, 2.6));
  const luz = new THREE.DirectionalLight(0xffffff, 1.4);
  luz.position.set(0.5, 1, 0.8);
  scene.add(luz);

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
    renderer.dispose();
    o.alSalir();
  });
  return { terminar: () => void session.end().catch(() => undefined) };
}
