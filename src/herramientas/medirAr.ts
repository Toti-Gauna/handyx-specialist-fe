// Medir con realidad aumentada (T-Medir en Android, lote 2.4). WebXR con detección de superficies: la retícula amarilla
// marca dónde apunta la cámara y cada toque (o el botón «Marcar punto» de la capa de arriba) deja un punto en el
// espacio, en metros. Entre punto y punto, una línea. La medida sale de la distancia entre puntos (± 1 cm aproximado,
// según el teléfono y la luz). Nada se guarda: los puntos viven en la memoria de la sesión. Solo navegador.
import * as THREE from 'three';
import type { Vec3 } from '../tres/cotas.ts';
import { MAX_PUNTOS } from './medir.ts';

type ConXr = Navigator & { xr?: XRSystem };

export interface SesionMedicion {
  /** Deja un punto donde está la retícula (null si todavía no encontró una superficie). */
  marcar(): Vec3 | null;
  deshacer(): void;
  terminar(): void;
}

export interface OpcionesMedicion {
  /** Lo que queda encima de la cámara (dom-overlay): instrucciones, medidas y botones. */
  capa: HTMLElement;
  alCambiar(puntos: Vec3[]): void;
  /** Si la retícula encontró una superficie (para habilitar «Marcar punto»). */
  alApuntar(hay: boolean): void;
  alSalir(): void;
  escalaBuffer?: number;
}

export async function abrirMedicionAr(o: OpcionesMedicion): Promise<SesionMedicion> {
  const xr = (navigator as ConXr).xr;
  if (!xr) throw new Error('sin WebXR');
  const session = await xr.requestSession('immersive-ar', { requiredFeatures: ['hit-test'], optionalFeatures: ['dom-overlay'], domOverlay: { root: o.capa } });
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.xr.enabled = true;
  renderer.xr.setReferenceSpaceType('local');
  if (o.escalaBuffer !== undefined) renderer.xr.setFramebufferScaleFactor(Math.min(1, Math.max(0.5, o.escalaBuffer)));
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 30);

  const amarillo = new THREE.MeshBasicMaterial({ color: 0xf5f59a });
  const blanco = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const reticula = new THREE.Mesh(new THREE.RingGeometry(0.03, 0.04, 32).rotateX(-Math.PI / 2), amarillo);
  reticula.matrixAutoUpdate = false;
  reticula.visible = false;
  scene.add(reticula);
  const bolita = new THREE.SphereGeometry(0.012, 12, 8);
  const puntos: THREE.Mesh[] = [];
  const linea = new THREE.Line(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ color: 0xf5f59a }));
  scene.add(linea);

  const posiciones = (): Vec3[] => puntos.map((p) => [p.position.x, p.position.y, p.position.z] as const);
  const actualizar = () => {
    linea.geometry.setFromPoints(puntos.map((p) => p.position));
    o.alCambiar(posiciones());
  };

  await renderer.xr.setSession(session);
  const espacioVista = await session.requestReferenceSpace('viewer');
  const fuente = await session.requestHitTestSource?.({ space: espacioVista });
  let apuntaba = false;

  const marcar = (): Vec3 | null => {
    if (!reticula.visible || puntos.length >= MAX_PUNTOS) return null;
    const p = new THREE.Mesh(bolita, puntos.length === 0 ? blanco : amarillo);
    p.position.setFromMatrixPosition(reticula.matrix);
    scene.add(p);
    puntos.push(p);
    actualizar();
    return [p.position.x, p.position.y, p.position.z];
  };
  // Un toque en la cámara marca; un toque en los botones de la capa no (dom-overlay manda el evento a los dos).
  o.capa.addEventListener('beforexrselect', (e) => e.preventDefault());
  session.addEventListener('select', () => void marcar());

  renderer.setAnimationLoop((_t: number, frame?: XRFrame) => {
    const ref = renderer.xr.getReferenceSpace();
    if (frame && fuente && ref) {
      const pose = frame.getHitTestResults(fuente)[0]?.getPose(ref);
      reticula.visible = Boolean(pose);
      if (pose) reticula.matrix.fromArray(pose.transform.matrix);
      if (Boolean(pose) !== apuntaba) {
        apuntaba = Boolean(pose);
        o.alApuntar(apuntaba);
      }
    }
    renderer.render(scene, camera);
  });

  session.addEventListener('end', () => {
    renderer.setAnimationLoop(null);
    fuente?.cancel();
    reticula.geometry.dispose();
    bolita.dispose();
    linea.geometry.dispose();
    (linea.material as THREE.Material).dispose();
    amarillo.dispose();
    blanco.dispose();
    renderer.dispose();
    o.alSalir();
  });

  return {
    marcar,
    deshacer: () => {
      const p = puntos.pop();
      if (p) scene.remove(p);
      actualizar();
    },
    terminar: () => void session.end().catch(() => undefined),
  };
}
