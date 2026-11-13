// Limpieza y conteo de la escena (lote 0.3). Three.js no libera la memoria de la GPU solo: cada geometría, material y
// textura se libera a mano al rearmar o desmontar. En un teléfono de 2 GB, olvidarlo cierra la pestaña.
import * as THREE from 'three';

function texturasDe(m: THREE.Material): THREE.Texture[] {
  return Object.values(m).filter((v): v is THREE.Texture => v instanceof THREE.Texture);
}

/**
 * Libera todo lo que cuelga de `raiz` (geometrías, materiales y sus texturas). Los materiales de `conservar` (los
 * comunes del visor) no se tocan: se liberan una sola vez al desmontar el visor.
 */
export function liberar(raiz: THREE.Object3D, conservar: ReadonlySet<THREE.Material> = new Set()): void {
  const materiales = new Set<THREE.Material>();
  raiz.traverse((o) => {
    const conGeo = o as Partial<THREE.Mesh>;
    if (conGeo.geometry instanceof THREE.BufferGeometry) conGeo.geometry.dispose();
    const mat = conGeo.material;
    if (mat) (Array.isArray(mat) ? mat : [mat]).forEach((m) => materiales.add(m));
  });
  materiales.forEach((m) => {
    if (conservar.has(m)) return;
    texturasDe(m).forEach((t) => t.dispose());
    m.dispose();
  });
}

/** Triángulos que dibuja la escena (mallas; las líneas y los sprites son despreciables). */
export function contarTriangulos(raiz: THREE.Object3D): number {
  let total = 0;
  raiz.traverse((o) => {
    if (!(o instanceof THREE.Mesh) || !o.visible) return;
    const g = o.geometry as THREE.BufferGeometry;
    const vertices = g.index ? g.index.count : (g.getAttribute('position')?.count ?? 0);
    const instancias = o instanceof THREE.InstancedMesh ? o.count : 1;
    total += Math.floor(vertices / 3) * instancias;
  });
  return total;
}

/** Esfera que contiene a `raiz` (para encuadrar la cámara). Sin nada adentro, una esfera chica en el origen. */
export function esferaDe(raiz: THREE.Object3D): { centro: [number, number, number]; radio: number } {
  const caja = new THREE.Box3().setFromObject(raiz);
  if (caja.isEmpty()) return { centro: [0, 0, 0], radio: 0.5 };
  const esfera = caja.getBoundingSphere(new THREE.Sphere());
  return { centro: [esfera.center.x, esfera.center.y, esfera.center.z], radio: Math.max(0.05, esfera.radius) };
}
