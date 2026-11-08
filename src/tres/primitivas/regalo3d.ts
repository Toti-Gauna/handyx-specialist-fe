// Caja de regalo nativa (lote 0.3, base de G.3 «El regalo»). Baja, tiembla y se abre con luz, siempre igual (sin
// azar). La pose de cada instante sale de regalo.ts (lógica pura con pruebas); acá solo se arma y se aplica.
// Unidades: el lado de la caja; el origen es el centro de la base.
import * as THREE from 'three';
import { crearSombraContacto, type Materiales } from '../marca.ts';
import { segmentosPara, type Presupuesto } from '../presupuesto.ts';
import { DURACION_REGALO, POSE_ABIERTA, POSE_CERRADA, poseRegalo, type FaseRegalo, type PoseRegalo } from '../regalo.ts';

export interface CajaRegalo {
  grupo: THREE.Group;
  /** Donde va el premio (un modelo nativo o, más adelante, el de la fase D). Sube cuando la caja se abre. */
  hueco: THREE.Group;
  aplicar(pose: PoseRegalo): void;
}

export function crearCajaRegalo(m: Materiales, p: Presupuesto, lado = 0.6): CajaRegalo {
  const grupo = new THREE.Group();
  grupo.name = 'caja-regalo';
  const caja = new THREE.Group(); // tiembla y baja
  grupo.add(caja);
  const alto = lado * 0.82;
  const cuerpo = new THREE.Mesh(new THREE.BoxGeometry(lado, alto, lado), m.azul);
  cuerpo.position.y = alto / 2;
  caja.add(cuerpo);
  // Cintas del cuerpo, en cruz.
  const cinta = lado * 0.16;
  for (const rot of [0, Math.PI / 2]) {
    const c = new THREE.Mesh(new THREE.BoxGeometry(cinta, alto * 1.002, lado * 1.01), m.amarillo);
    c.rotation.y = rot;
    c.position.y = alto / 2;
    caja.add(c);
  }
  // Interior que brilla (se ve al abrir).
  const interior = new THREE.Mesh(new THREE.PlaneGeometry(lado * 0.94, lado * 0.94).rotateX(-Math.PI / 2), m.luz.clone());
  interior.position.y = alto - 0.002;
  caja.add(interior);
  const luz = new THREE.PointLight(0xfff6c8, 0, lado * 6, 1.5);
  luz.position.y = alto + lado * 0.3;
  caja.add(luz);

  // Tapa con bisagra en el borde de atrás: el pivote está ahí y la tapa cuelga hacia adelante.
  const bisagra = new THREE.Group();
  bisagra.position.set(0, alto, -lado / 2);
  caja.add(bisagra);
  const tapa = new THREE.Group();
  tapa.position.z = lado / 2;
  bisagra.add(tapa);
  const altoTapa = lado * 0.2;
  const tapaMalla = new THREE.Mesh(new THREE.BoxGeometry(lado * 1.08, altoTapa, lado * 1.08), m.azul);
  tapaMalla.position.y = altoTapa / 2 - altoTapa * 0.3;
  tapa.add(tapaMalla);
  for (const rot of [0, Math.PI / 2]) {
    const c = new THREE.Mesh(new THREE.BoxGeometry(cinta, altoTapa * 1.02, lado * 1.09), m.amarillo);
    c.rotation.y = rot;
    c.position.y = tapaMalla.position.y;
    tapa.add(c);
  }
  // Moño: dos lazos (toros) y el nudo.
  const seg = segmentosPara(p, 0.75, 10);
  const lazoGeo = new THREE.TorusGeometry(lado * 0.13, lado * 0.035, Math.max(6, Math.round(seg / 3)), seg);
  for (const lado1 of [-1, 1]) {
    const lazo = new THREE.Mesh(lazoGeo, m.amarillo);
    lazo.position.set(lado1 * lado * 0.12, altoTapa * 0.7 + lado * 0.08, 0);
    lazo.rotation.set(0, Math.PI / 2, lado1 * 0.5);
    tapa.add(lazo);
  }
  const nudo = new THREE.Mesh(new THREE.SphereGeometry(lado * 0.06, seg, Math.max(4, seg / 2)), m.amarillo);
  nudo.position.y = altoTapa * 0.7 + lado * 0.02;
  tapa.add(nudo);

  const hueco = new THREE.Group();
  hueco.name = 'hueco';
  caja.add(hueco);
  const sombra = crearSombraContacto(lado * 1.1);
  grupo.add(sombra);
  const materialInterior = interior.material as THREE.MeshStandardMaterial;

  function aplicar(pose: PoseRegalo) {
    caja.position.y = pose.altura * lado;
    caja.rotation.z = pose.inclinacion;
    bisagra.rotation.x = pose.tapaGiro;
    bisagra.position.y = alto + pose.tapaAltura * lado * 0.35;
    materialInterior.emissiveIntensity = 0.2 + 1.6 * pose.brillo;
    luz.intensity = 3 * pose.brillo;
    hueco.position.y = alto * (0.15 + 0.85 * pose.brillo);
    hueco.visible = pose.brillo > 0.2;
    // La sombra se achica mientras la caja está en el aire.
    const s = 1 / (1 + pose.altura * 0.6);
    sombra.scale.setScalar(s);
    (sombra.material as THREE.MeshBasicMaterial).opacity = 0.28 * s;
  }
  aplicar(POSE_CERRADA);
  return { grupo, hueco, aplicar };
}

/** Lo que el visor le da a una animación (ContextoVisor cumple con esto). */
export interface Animador {
  animar(paso: (dtMs: number) => boolean): () => void;
  pedirCuadro(): void;
  sinMovimiento: boolean;
}

/**
 * Reproduce la apertura. `alCambiarFase` avisa cada fase (para vibrar en Android al abrir o tirar los papelitos con
 * useConfeti). Con «reducir movimiento» pasa directo a la caja abierta. Devuelve cómo cancelarla.
 */
export function reproducirRegalo(caja: CajaRegalo, a: Animador, alCambiarFase?: (f: FaseRegalo) => void): () => void {
  if (a.sinMovimiento) {
    caja.aplicar(POSE_ABIERTA);
    a.pedirCuadro();
    alCambiarFase?.('abierta');
    return () => undefined;
  }
  let t = 0;
  let fase: FaseRegalo | null = null;
  return a.animar((dt) => {
    t += dt / 1000;
    const pose = poseRegalo(t);
    caja.aplicar(pose);
    if (pose.fase !== fase) {
      fase = pose.fase;
      alCambiarFase?.(fase);
    }
    return t < DURACION_REGALO;
  });
}
