// Objeto escaneado de ejemplo y anillo de tomas (lote 0.3, base de T-Escanear y T-Modelo3D del lote 2.4). Todo nativo:
// un termotanque hecho por código, con sus cotas de alto y diámetro. Unidades: metros; el origen es el centro de la base.
import * as THREE from 'three';
import { cotaAlto, cotaDiametro, describirMedidas, formatearDiametro, formatearMedida } from '../cotas.ts';
import { posicionesTomas, TOMAS_ESCANEO } from '../escaneo.ts';
import { crearSombraContacto, type Materiales } from '../marca.ts';
import { segmentosPara, type Presupuesto } from '../presupuesto.ts';
import { crearCota } from './cotas3d.ts';

export interface MedidasTermotanque {
  altoM: number;
  diametroM: number;
}

export const TERMOTANQUE_EJEMPLO: MedidasTermotanque = { altoM: 0.85, diametroM: 0.45 };

/** Termotanque eléctrico de pie: cuerpo, tapa abovedada, zócalo, caños de entrada y salida y el termostato. */
export function crearTermotanque(m: Materiales, p: Presupuesto, medidas: MedidasTermotanque = TERMOTANQUE_EJEMPLO): THREE.Group {
  const g = new THREE.Group();
  g.name = 'termotanque';
  const r = medidas.diametroM / 2;
  const seg = segmentosPara(p, 1, 12);
  const zocalo = 0.04;
  const domo = r * 0.35;
  const cuerpoAlto = Math.max(0.05, medidas.altoM - zocalo - domo);

  const base = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.92, r * 0.92, zocalo, seg), m.noche);
  base.position.y = zocalo / 2;
  g.add(base);
  const cuerpo = new THREE.Mesh(new THREE.CylinderGeometry(r, r, cuerpoAlto, seg), m.superficie);
  cuerpo.position.y = zocalo + cuerpoAlto / 2;
  g.add(cuerpo);
  // Tapa: media esfera achatada para que el alto total sea exacto.
  const tapa = new THREE.Mesh(new THREE.SphereGeometry(r, seg, Math.max(4, Math.round(seg / 4)), 0, Math.PI * 2, 0, Math.PI / 2), m.superficie);
  tapa.scale.y = domo / r;
  tapa.position.y = zocalo + cuerpoAlto;
  g.add(tapa);
  // Franja de marca a media altura.
  const franja = new THREE.Mesh(new THREE.CylinderGeometry(r * 1.004, r * 1.004, 0.035, seg, 1, true), m.azul);
  franja.position.y = zocalo + cuerpoAlto * 0.62;
  g.add(franja);
  // Termostato al frente.
  const termostato = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.02, Math.max(8, seg / 2)).rotateX(Math.PI / 2), m.azul);
  termostato.position.set(0, zocalo + cuerpoAlto * 0.25, r + 0.008);
  g.add(termostato);
  // Caños arriba (entrada fría y salida caliente).
  for (const x of [-r * 0.4, r * 0.4]) {
    const cano = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.09, 8), m.metal);
    cano.position.set(x, medidas.altoM - domo * 0.35 + 0.045, 0);
    // Las conexiones asoman sobre la tapa: no cuentan en el alto del equipo (la cota mide el cuerpo).
    cano.name = 'conexion';
    g.add(cano);
  }
  g.add(crearSombraContacto(r * 1.6));
  return g;
}

export interface ObjetoEscaneado {
  grupo: THREE.Group;
  /** Solo las cotas, para mostrarlas u ocultarlas. */
  cotas: THREE.Group;
  /** «Alto 85 cm · diámetro 45 cm · aprox.» */
  descripcion: string;
}

/** El termotanque de ejemplo con sus cotas de alto y diámetro (como en T-Modelo3D). */
export function crearObjetoEscaneado(m: Materiales, p: Presupuesto, medidas: MedidasTermotanque = TERMOTANQUE_EJEMPLO): ObjetoEscaneado {
  const grupo = new THREE.Group();
  grupo.add(crearTermotanque(m, p, medidas));
  const r = medidas.diametroM / 2;
  const cotas = new THREE.Group();
  cotas.name = 'cotas';
  const alto = cotaAlto({ min: [-r, 0, -r], max: [r, medidas.altoM, 0] }, 0.1);
  cotas.add(crearCota(alto, formatearMedida(medidas.altoM), m));
  const diametro = cotaDiametro([0, 0, 0], r, medidas.altoM, 0.08);
  cotas.add(crearCota(diametro, formatearDiametro(medidas.diametroM), m));
  grupo.add(cotas);
  return { grupo, cotas, descripcion: describirMedidas({ alto: medidas.altoM, diametro: medidas.diametroM }) };
}

export interface AnilloTomas {
  grupo: THREE.Group;
  /** Marca como tomadas las primeras `n` (puntos amarillos). Pedí un cuadro después. */
  marcar(n: number): void;
}

/** Los puntos de las fotos alrededor del objeto: amarillos los tomados, grises los que faltan (T-Escanear). */
export function crearAnilloTomas(m: Materiales, o: { total?: number; radio?: number; altura?: number; tomadas?: number } = {}): AnilloTomas {
  const total = o.total ?? TOMAS_ESCANEO;
  const puntos = posicionesTomas(total, o.radio ?? 0.6, o.altura ?? 0.45);
  const geo = new THREE.SphereGeometry(0.018, 10, 6);
  const grupo = new THREE.Group();
  grupo.name = 'anillo-tomas';
  const esferas = puntos.map(([x, y, z]) => {
    const e = new THREE.Mesh(geo, m.superficieHonda);
    e.position.set(x, y, z);
    grupo.add(e);
    return e;
  });
  const marcar = (n: number) => esferas.forEach((e, i) => (e.material = i < n ? m.amarillo : m.superficieHonda));
  marcar(o.tomadas ?? 0);
  return { grupo, marcar };
}
