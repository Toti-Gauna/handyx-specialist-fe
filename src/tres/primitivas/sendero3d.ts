// Sendero con estaciones (lote 0.3, base de G.2 «El camino»): un camino que serpentea hacia el fondo, una plataforma por
// estación (lograda en azul, la actual en amarillo con bandera, las próximas en gris), el tramo recorrido pintado de
// azul y un faro al final (Mar del Plata). El estado de cada estación también va en texto (describirSendero).
import * as THREE from 'three';
import type { Vec3 } from '../cotas.ts';
import { crearEtiqueta, type Materiales } from '../marca.ts';
import { segmentosPara, type Presupuesto } from '../presupuesto.ts';
import { puntosCurva, recorrido, trazarSendero, type Estacion, type OpcionesSendero } from '../sendero.ts';

export interface Sendero {
  grupo: THREE.Group;
  posiciones: Vec3[];
  /** Centro y radio para encuadrar la estación actual (o la última si se llegó al final). */
  foco: { centro: Vec3; radio: number };
}

function faro(m: Materiales, seg: number): THREE.Group {
  const g = new THREE.Group();
  g.name = 'faro';
  const franjas = 4;
  const alto = 1.4;
  for (let i = 0; i < franjas; i++) {
    const r0 = 0.24 - i * 0.025;
    const r1 = 0.24 - (i + 1) * 0.025;
    const f = new THREE.Mesh(new THREE.CylinderGeometry(r1, r0, alto / franjas, seg), i % 2 ? m.azul : m.superficie);
    f.position.y = (alto / franjas) * (i + 0.5);
    g.add(f);
  }
  const linterna = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.16, seg), m.luz);
  linterna.position.y = alto + 0.08;
  g.add(linterna);
  const techo = new THREE.Mesh(new THREE.ConeGeometry(0.15, 0.16, seg), m.noche);
  techo.position.y = alto + 0.24;
  g.add(techo);
  return g;
}

export function crearSendero(m: Materiales, p: Presupuesto, estaciones: readonly Estacion[], o: OpcionesSendero & { avance?: number; conFaro?: boolean } = {}): Sendero {
  const grupo = new THREE.Group();
  grupo.name = 'sendero';
  const posiciones = trazarSendero(estaciones.length, o);
  const seg = segmentosPara(p, 0.75, 10);
  const indiceActual = estaciones.findIndex((e) => e.estado === 'actual');
  const actual = indiceActual >= 0 ? indiceActual : Math.max(0, estaciones.length - 1);

  const curvaPts = puntosCurva(posiciones, o);
  if (curvaPts.length >= 2) {
    const curva = new THREE.CatmullRomCurve3(curvaPts.map(([x, y, z]) => new THREE.Vector3(x, y, z)), false, 'centripetal');
    const tramos = Math.max(32, posiciones.length * 16);
    const radial = 6;
    // Camino aplastado: un tubo con poca altura parece una cinta con borde redondeado.
    const camino = new THREE.Mesh(new THREE.TubeGeometry(curva, tramos, 0.26, radial, false), m.mosaico);
    camino.scale.y = 0.12;
    grupo.add(camino);
    // Tramo recorrido: el mismo tubo, un poco más alto, dibujado hasta el avance.
    const hecho = new THREE.TubeGeometry(curva, tramos, 0.2, radial, false);
    const recorridoMalla = new THREE.Mesh(hecho, m.azul);
    recorridoMalla.scale.y = 0.16;
    // El tubo va por longitud de arco: se busca qué parte de la curva corresponde a cada estación.
    const muestras = curva.getSpacedPoints(400);
    const uDe = (pos: Vec3 | undefined) => {
      if (!pos) return 0;
      let mejor = 0;
      let dist = Infinity;
      muestras.forEach((s, i) => {
        const d = Math.hypot(s.x - pos[0], s.z - pos[2]);
        if (d < dist) {
          dist = d;
          mejor = i;
        }
      });
      return mejor / (muestras.length - 1);
    };
    const uIni = uDe(posiciones[0]);
    const uFin = uDe(posiciones[posiciones.length - 1]);
    const fraccion = recorrido(estaciones.length, indiceActual >= 0 ? indiceActual : estaciones.length - 1, indiceActual >= 0 ? (o.avance ?? 0) : 1);
    const u = uIni + (uFin - uIni) * fraccion;
    const porTramo = radial * 6;
    hecho.setDrawRange(0, Math.floor(u * tramos) * porTramo);
    grupo.add(recorridoMalla);
  }

  const plataformaGeo = new THREE.CylinderGeometry(0.42, 0.46, 0.14, seg);
  estaciones.forEach((e, i) => {
    const pos = posiciones[i];
    if (!pos) return;
    const est = new THREE.Group();
    est.name = `estacion-${i}`;
    est.position.set(pos[0], 0, pos[2]);
    const material = e.estado === 'lograda' ? m.azul : e.estado === 'actual' ? m.amarillo : m.superficieHonda;
    const plataforma = new THREE.Mesh(plataformaGeo, material);
    plataforma.position.y = 0.07;
    est.add(plataforma);
    if (e.estado === 'actual') {
      const aro = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.03, 6, seg).rotateX(Math.PI / 2), m.azul);
      aro.position.y = 0.05;
      est.add(aro);
      const mastil = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.7, 6), m.noche);
      mastil.position.set(0.18, 0.49, 0);
      est.add(mastil);
      const bandera = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.16, 0.01), m.azul);
      bandera.position.set(0.31, 0.75, 0);
      est.add(bandera);
    }
    const numero = crearEtiqueta(String(i), 0.16, e.estado === 'lograda' ? { fondo: '#1F57A8', color: '#FFFFFF' } : {});
    if (numero) {
      numero.position.y = 0.32;
      est.add(numero);
    }
    grupo.add(est);
  });

  const ultima = posiciones[posiciones.length - 1];
  if (o.conFaro !== false && ultima) {
    const f = faro(m, seg);
    f.position.set(ultima[0] + 1.1, 0, ultima[2] - 0.9);
    grupo.add(f);
  }
  const centro = posiciones[actual] ?? ([0, 0, 0] as Vec3);
  return { grupo, posiciones, foco: { centro: [centro[0], 0.3, centro[2] - 0.8], radio: 1.9 } };
}
