// Modelos 3D nativos del Taller (Three.js, hechos por código: sin archivos externos). Unidades: metros.
import * as THREE from 'three';

/** Plafón LED redondo (por defecto, 30 cm). La cara que ilumina mira hacia +Y (sigue la normal del techo en AR). */
export function crearPlafon(diametroM = 0.3): THREE.Group {
  const g = new THREE.Group();
  const r = diametroM / 2;
  const marco = new THREE.Mesh(new THREE.CylinderGeometry(r, r * 0.96, 0.035, 48), new THREE.MeshStandardMaterial({ color: 0xf4f5f7, roughness: 0.5 }));
  marco.position.y = 0.0175;
  g.add(marco);
  const difusor = new THREE.Mesh(
    new THREE.CircleGeometry(r * 0.9, 48).rotateX(-Math.PI / 2),
    new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xfff6dc, emissiveIntensity: 1.2 }),
  );
  difusor.position.y = 0.036;
  g.add(difusor);
  return g;
}

/** Panel LED cuadrado (por defecto, 60 × 60 cm). */
export function crearPanel(ladoM = 0.6): THREE.Group {
  const g = new THREE.Group();
  const marco = new THREE.Mesh(new THREE.BoxGeometry(ladoM, 0.012, ladoM), new THREE.MeshStandardMaterial({ color: 0xe9ecf1, roughness: 0.45, metalness: 0.2 }));
  marco.position.y = 0.006;
  g.add(marco);
  const difusor = new THREE.Mesh(
    new THREE.PlaneGeometry(ladoM * 0.94, ladoM * 0.94).rotateX(-Math.PI / 2),
    new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xfffaf0, emissiveIntensity: 1.1 }),
  );
  difusor.position.y = 0.0125;
  g.add(difusor);
  return g;
}
