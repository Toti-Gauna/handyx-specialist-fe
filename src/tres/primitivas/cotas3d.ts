// Cotas en 3D (lote 0.3): una línea de cota con sus líneas de referencia, marcas en los extremos y la medida en una
// etiqueta que mira a la cámara. El trazado sale de cotas.ts (lógica pura con pruebas).
import * as THREE from 'three';
import type { TrazoCota, Vec3 } from '../cotas.ts';
import { crearEtiqueta, type Materiales } from '../marca.ts';

const v = (p: Vec3) => new THREE.Vector3(p[0], p[1], p[2]);

/** Una cota lista para agregar a la escena. `texto` es lo que se lee («85 cm», «Ø 45 cm»). */
export function crearCota(trazo: TrazoCota, texto: string, m: Materiales, altoEtiqueta = 0.06): THREE.Group {
  const g = new THREE.Group();
  g.name = 'cota';
  const principal = new THREE.BufferGeometry().setFromPoints([v(trazo.linea[0]), v(trazo.linea[1]), ...trazo.marcas.flatMap(([a, b]) => [v(a), v(b)])]);
  g.add(new THREE.LineSegments(principal, m.linea));
  const guias = new THREE.BufferGeometry().setFromPoints(trazo.referencias.flatMap(([a, b]) => [v(a), v(b)]));
  g.add(new THREE.LineSegments(guias, m.lineaSuave));
  const etiqueta = crearEtiqueta(texto, altoEtiqueta);
  if (etiqueta) {
    etiqueta.position.copy(v(trazo.medio));
    g.add(etiqueta);
  }
  return g;
}
