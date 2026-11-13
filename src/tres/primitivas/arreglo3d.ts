// Escena isométrica 3D de un arreglo que se construye (lote 0.3, opcional: complementa las ilustraciones SVG del kit).
// Un rincón de la casa (piso de mosaico y dos paredes, con una ventana amarilla como en la ciudad de la landing) y el
// objeto del rubro que se arma pieza por pieza. El orden y los tiempos salen de arreglo.ts (lógica pura con pruebas).
// Unidades: el lado del piso mide 1; el origen es el centro del piso. Hecho para la vista isométrica del visor.
import * as THREE from 'three';
import type { Rubro } from '../../contracts/rubros.ts';
import { duracionArmado, OBJETOS_ARREGLO, PIEZA_ARMADA, piezasArmadas, posePieza, type PosePieza } from '../arreglo.ts';
import type { Materiales } from '../marca.ts';
import { segmentosPara, type Presupuesto } from '../presupuesto.ts';
import type { Animador } from './animador.ts';

/** Cara de la pared del fondo (z) y de la izquierda (x). */
const PARED = -0.44;
const ALTO_PARED = 0.8;

type Mat = THREE.Material;

function caja(ancho: number, alto: number, fondo: number, mat: Mat, x = 0, y = 0, z = 0): THREE.Mesh {
  const malla = new THREE.Mesh(new THREE.BoxGeometry(ancho, alto, fondo), mat);
  malla.position.set(x, y, z);
  return malla;
}

/** Cilindro vertical; `eje` lo acuesta a lo largo de X o de Z. */
function cilindro(radio: number, largo: number, mat: Mat, seg: number, eje: 'y' | 'x' | 'z' = 'y', x = 0, y = 0, z = 0): THREE.Mesh {
  const geo = new THREE.CylinderGeometry(radio, radio, largo, seg);
  if (eje === 'x') geo.rotateZ(Math.PI / 2);
  if (eje === 'z') geo.rotateX(Math.PI / 2);
  const malla = new THREE.Mesh(geo, mat);
  malla.position.set(x, y, z);
  return malla;
}

/**
 * Una pieza: un grupo con el pivote en su centro (para que gire y se agrande sobre sí misma) y las mallas adentro en
 * coordenadas de la escena.
 */
function pieza(nombre: string, mallas: THREE.Object3D[]): THREE.Group {
  const g = new THREE.Group();
  g.name = nombre;
  const centro = new THREE.Box3();
  mallas.forEach((m) => centro.expandByObject(m));
  const c = centro.isEmpty() ? new THREE.Vector3() : centro.getCenter(new THREE.Vector3());
  g.position.copy(c);
  mallas.forEach((m) => {
    m.position.sub(c);
    g.add(m);
  });
  g.userData.reposo = c.clone();
  return g;
}

/** El rincón: piso de mosaico con canto azul, pared del fondo y pared izquierda con una ventana amarilla. */
export function crearRincon(m: Materiales): THREE.Group {
  const g = new THREE.Group();
  g.name = 'rincon';
  g.add(caja(1, 0.06, 1, m.mosaico, 0, -0.03, 0));
  g.add(caja(1.02, 0.05, 1.02, m.azulHondo, 0, -0.085, 0));
  g.add(caja(1, ALTO_PARED, 0.06, m.superficie, 0, ALTO_PARED / 2, PARED - 0.03));
  g.add(caja(0.06, ALTO_PARED, 1, m.superficie, PARED - 0.03, ALTO_PARED / 2, 0));
  // Ventana: marco azul y vidrio amarillo, como las ventanas encendidas de la ciudad isométrica.
  g.add(caja(0.012, 0.24, 0.24, m.azul, PARED + 0.002, 0.52, 0.18));
  g.add(caja(0.014, 0.2, 0.2, m.amarillo, PARED + 0.004, 0.52, 0.18));
  g.add(caja(0.016, 0.2, 0.012, m.azul, PARED + 0.006, 0.52, 0.18));
  return g;
}

type Constructor = (m: Materiales, seg: number) => THREE.Group[];

const CONSTRUCTORES: Record<Rubro, Constructor> = {
  electricidad: (m) => {
    const z = PARED + 0.04;
    const frente = PARED + 0.08;
    const termicas: THREE.Object3D[] = [0.0, 0.06, 0.12].flatMap((x) => [caja(0.05, 0.12, 0.04, m.superficie, x, 0.45, frente + 0.02), caja(0.02, 0.035, 0.02, m.amarillo, x, 0.46, frente + 0.05)]);
    return [
      pieza('Caja', [caja(0.42, 0.5, 0.08, m.superficieHonda, 0, 0.45, z)]),
      pieza('Riel', [caja(0.36, 0.025, 0.012, m.metal, 0, 0.45, frente + 0.006)]),
      pieza('Disyuntor', [caja(0.1, 0.12, 0.04, m.azul, -0.11, 0.45, frente + 0.02), caja(0.03, 0.035, 0.02, m.amarillo, -0.11, 0.46, frente + 0.05)]),
      pieza('Llaves térmicas', termicas),
      pieza('Tapa', [
        caja(0.44, 0.03, 0.014, m.azul, 0, 0.705, frente + 0.007),
        caja(0.44, 0.03, 0.014, m.azul, 0, 0.195, frente + 0.007),
        caja(0.03, 0.48, 0.014, m.azul, -0.205, 0.45, frente + 0.007),
        caja(0.03, 0.48, 0.014, m.azul, 0.205, 0.45, frente + 0.007),
      ]),
    ];
  },
  plomeria: (m, seg) => [
    pieza('Bacha', [caja(0.5, 0.3, 0.3, m.azul, 0, 0.15, PARED + 0.15), caja(0.5, 0.12, 0.3, m.superficie, 0, 0.36, PARED + 0.15), caja(0.36, 0.004, 0.18, m.noche, 0, 0.421, PARED + 0.17)]),
    pieza('Caño', [cilindro(0.02, 0.08, m.metal, seg, 'z', 0, 0.62, PARED + 0.04)]),
    pieza('Cuerpo', [cilindro(0.035, 0.08, m.metal, seg, 'y', 0, 0.62, PARED + 0.1)]),
    pieza('Pico', [cilindro(0.016, 0.14, m.metal, seg, 'z', 0, 0.645, PARED + 0.17), cilindro(0.016, 0.05, m.metal, seg, 'y', 0, 0.62, PARED + 0.235)]),
    pieza('Manija', [cilindro(0.012, 0.03, m.metal, seg, 'y', 0, 0.675, PARED + 0.1), caja(0.13, 0.02, 0.03, m.azul, 0.04, 0.695, PARED + 0.1)]),
  ],
  gas: (m, seg) => {
    const z = PARED + 0.03;
    const codo = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.025, Math.max(6, Math.round(seg / 3)), seg, Math.PI / 2), m.amarillo);
    codo.position.set(0.1, 0.56, z);
    return [
      pieza('Tramo de la pared', [cilindro(0.025, 0.5, m.amarillo, seg, 'x', -0.15, 0.62, z)]),
      pieza('Codo', [codo]),
      pieza('Bajada', [cilindro(0.025, 0.36, m.amarillo, seg, 'y', 0.16, 0.38, z)]),
      pieza('Llave de paso', [cilindro(0.036, 0.07, m.metal, seg, 'y', 0.16, 0.3, z), caja(0.12, 0.02, 0.022, m.azul, 0.2, 0.3, z + 0.045)]),
    ];
  },
  cerrajeria: (m, seg) => {
    const frente = PARED + 0.04;
    const anillo = new THREE.Mesh(new THREE.TorusGeometry(0.02, 0.006, 6, Math.max(10, seg)), m.amarillo);
    anillo.position.set(0.15, 0.32, frente + 0.085);
    return [
      pieza('Puerta', [caja(0.5, 0.74, 0.04, m.azul, 0, 0.37, PARED + 0.02), caja(0.42, 0.28, 0.006, m.azulHondo, -0.02, 0.56, frente + 0.003)]),
      pieza('Caja', [caja(0.1, 0.2, 0.02, m.metal, 0.15, 0.38, frente + 0.01)]),
      pieza('Cilindro', [cilindro(0.024, 0.02, m.noche, seg, 'z', 0.15, 0.32, frente + 0.03)]),
      pieza('Picaporte', [cilindro(0.022, 0.02, m.metal, seg, 'z', 0.15, 0.43, frente + 0.03), caja(0.11, 0.018, 0.018, m.metal, 0.11, 0.43, frente + 0.05)]),
      pieza('Llave', [caja(0.012, 0.01, 0.05, m.amarillo, 0.15, 0.32, frente + 0.055), anillo]),
    ];
  },
  albanileria: (m) => {
    const ladrillo = { ancho: 0.16, alto: 0.075, fondo: 0.1, junta: 0.012 };
    const z = 0.02;
    const hilada = (i: number) => {
      // Trabado: las hiladas impares corren medio ladrillo. Los colores alternan sin azar.
      const corrida = i % 2 === 0 ? 0 : (ladrillo.ancho + ladrillo.junta) / 2;
      const xs = [-1.5, -0.5, 0.5, 1.5].map((k) => k * (ladrillo.ancho + ladrillo.junta) + corrida).filter((x) => Math.abs(x) < 0.33);
      const y = ladrillo.alto / 2 + i * (ladrillo.alto + ladrillo.junta);
      return xs.map((x, j) => caja(ladrillo.ancho, ladrillo.alto, ladrillo.fondo, (i + j) % 2 ? m.azulHondo : m.azul, x, y, z));
    };
    const altoMuro = 4 * (ladrillo.alto + ladrillo.junta);
    return [
      pieza('Primera hilada', hilada(0)),
      pieza('Segunda hilada', hilada(1)),
      pieza('Tercera hilada', hilada(2)),
      pieza('Cuarta hilada', hilada(3)),
      pieza('Revoque', [caja(0.66, altoMuro - ladrillo.junta, 0.012, m.superficie, 0, (altoMuro - ladrillo.junta) / 2, z + ladrillo.fondo / 2 + 0.008)]),
    ];
  },
  aire_acondicionado: (m) => {
    const z = PARED + 0.06;
    const frente = PARED + 0.12;
    return [
      pieza('Soporte', [caja(0.03, 0.03, 0.1, m.metal, -0.2, 0.52, PARED + 0.05), caja(0.03, 0.03, 0.1, m.metal, 0.2, 0.52, PARED + 0.05)]),
      pieza('Equipo', [caja(0.56, 0.17, 0.12, m.superficie, 0, 0.62, z), caja(0.56, 0.012, 0.122, m.azul, 0, 0.7, z)]),
      pieza('Rejilla', [0.55, 0.565, 0.58].map((y) => caja(0.48, 0.007, 0.012, m.noche, 0, y, frente + 0.006))),
      pieza('Luz de encendido', [caja(0.03, 0.012, 0.006, m.luz, 0.22, 0.64, frente + 0.003)]),
    ];
  },
};

export interface Arreglo {
  rubro: Rubro;
  grupo: THREE.Group;
  /** Las piezas del objeto, en el orden en que se arman (mismo orden que OBJETOS_ARREGLO). */
  piezas: THREE.Group[];
  /** Segundos que tarda en armarse entero. */
  duracion: number;
  /** Pone cada pieza como está a los `segundos` de empezar (Infinity = todo armado). */
  aplicar(segundos: number): void;
  /** Centro y radio para encuadrar el rincón entero (las piezas bajan desde arriba: no uses el encuadre automático). */
  foco: { centro: [number, number, number]; radio: number };
}

function ponerPose(g: THREE.Group, pose: PosePieza) {
  const reposo = g.userData.reposo as THREE.Vector3;
  g.visible = pose.visible;
  g.position.set(reposo.x, reposo.y + pose.subida, reposo.z);
  g.rotation.y = pose.giro;
  g.scale.setScalar(pose.escala);
}

/** El rincón con el objeto del rubro, listo para armarse. Arranca desarmado (o armado, con `armado: true`). */
export function crearArreglo(rubro: Rubro, m: Materiales, p: Presupuesto, o: { conRincon?: boolean; armado?: boolean } = {}): Arreglo {
  const grupo = new THREE.Group();
  grupo.name = `arreglo-${rubro}`;
  if (o.conRincon !== false) grupo.add(crearRincon(m));
  const piezas = CONSTRUCTORES[rubro](m, segmentosPara(p, 0.5, 10));
  piezas.forEach((g) => grupo.add(g));
  const aplicar = (segundos: number) => piezas.forEach((g, i) => ponerPose(g, Number.isFinite(segundos) ? posePieza(i, segundos) : PIEZA_ARMADA));
  aplicar(o.armado ? Infinity : 0);
  return { rubro, grupo, piezas, duracion: duracionArmado(piezas.length), aplicar, foco: { centro: [0, 0.32, 0], radio: 0.82 } };
}

/**
 * Arma el objeto. `alAvanzar` avisa cada pieza que encastra (para un texto «Paso 3 de 5» o un sonido). Con «reducir
 * movimiento», todo armado de una vez. Devuelve cómo cortarla (queda donde estaba).
 */
export function reproducirArreglo(a: Arreglo, an: Animador, alAvanzar?: (armadas: number, total: number) => void): () => void {
  const total = a.piezas.length;
  if (an.sinMovimiento) {
    a.aplicar(Infinity);
    an.pedirCuadro();
    alAvanzar?.(total, total);
    return () => undefined;
  }
  let t = 0;
  let armadas = 0;
  a.aplicar(0);
  return an.animar((dt) => {
    t += dt / 1000;
    a.aplicar(t);
    const n = piezasArmadas(total, t);
    if (n !== armadas) {
      armadas = n;
      alAvanzar?.(n, total);
    }
    return t < a.duracion;
  });
}

/** Nombres de las piezas (iguales a los de arreglo.ts): para el texto de la pantalla. */
export const piezasDe = (rubro: Rubro) => OBJETOS_ARREGLO[rubro].piezas;
