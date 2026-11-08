// Las primitivas se arman en Node (Three.js no necesita navegador para la geometría): entran en el presupuesto de
// gama baja, se liberan enteras y respetan «reducir movimiento».
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import * as THREE from 'three';
import { RUBROS } from '../contracts/rubros.ts';
import { OBJETOS_ARREGLO } from './arreglo.ts';
import { contarTriangulos, esferaDe, liberar } from './limpieza.ts';
import { crearMateriales } from './marca.ts';
import { PRESUPUESTOS } from './presupuesto.ts';
import type { Animador } from './primitivas/animador.ts';
import { crearArreglo, reproducirArreglo } from './primitivas/arreglo3d.ts';
import { crearAnilloTomas, crearObjetoEscaneado } from './primitivas/escaneo3d.ts';
import { crearCajaRegalo, reproducirRegalo } from './primitivas/regalo3d.ts';
import { crearSendero } from './primitivas/sendero3d.ts';
import { estadosEstaciones } from './sendero.ts';
import { POSE_ABIERTA } from './regalo.ts';

const bajo = PRESUPUESTOS.bajo;

/** Un animador de prueba: corre los pasos con un reloj fijo de 33 ms. */
function animadorDePrueba(sinMovimiento: boolean) {
  const pasos = new Set<(dt: number) => boolean>();
  let cuadros = 0;
  const a: Animador = {
    sinMovimiento,
    pedirCuadro: () => void cuadros++,
    animar(paso) {
      pasos.add(paso);
      return () => void pasos.delete(paso);
    },
  };
  const correr = (ms: number) => {
    for (let t = 0; t < ms; t += 33) pasos.forEach((p) => p(33) || pasos.delete(p));
  };
  return { a, correr, pasos, cuadros: () => cuadros };
}

function contarRecursos(raiz: THREE.Object3D) {
  const geos = new Set<THREE.BufferGeometry>();
  const mats = new Set<THREE.Material>();
  raiz.traverse((o) => {
    const m = o as Partial<THREE.Mesh>;
    if (m.geometry) geos.add(m.geometry);
    if (m.material) (Array.isArray(m.material) ? m.material : [m.material]).forEach((x) => mats.add(x));
  });
  return { geos, mats };
}

describe('primitivas 3D', () => {
  it('cada arreglo entra en gama baja y tiene una pieza por cada nombre', () => {
    const m = crearMateriales();
    for (const r of RUBROS) {
      const a = crearArreglo(r, m, bajo);
      assert.equal(a.piezas.length, OBJETOS_ARREGLO[r].piezas.length, r);
      assert.deepEqual(
        a.piezas.map((p) => p.name),
        [...OBJETOS_ARREGLO[r].piezas],
      );
      const tri = contarTriangulos(a.grupo);
      assert.ok(tri > 0 && tri < bajo.triangulosMax / 4, `${r}: ${tri} triángulos`);
    }
    m.liberar();
  });

  it('el arreglo arranca desarmado y queda armado en su lugar', () => {
    const m = crearMateriales();
    const a = crearArreglo('plomeria', m, bajo);
    assert.ok(a.piezas.every((p) => !p.visible));
    const { a: an, correr, pasos } = animadorDePrueba(false);
    const avisos: number[] = [];
    reproducirArreglo(a, an, (n) => avisos.push(n));
    correr(a.duracion * 1000 + 100);
    assert.equal(pasos.size, 0, 'la animación termina sola');
    assert.deepEqual(avisos, [1, 2, 3, 4, 5]);
    for (const p of a.piezas) {
      assert.ok(p.visible);
      assert.ok(p.position.equals(p.userData.reposo as THREE.Vector3));
      assert.equal(p.scale.x, 1);
    }
  });

  it('con «reducir movimiento», el arreglo y el regalo aparecen terminados sin animar', () => {
    const m = crearMateriales();
    const a = crearArreglo('gas', m, bajo);
    const { a: an, pasos, cuadros } = animadorDePrueba(true);
    const avisos: number[] = [];
    reproducirArreglo(a, an, (n) => avisos.push(n));
    assert.equal(pasos.size, 0);
    assert.ok(a.piezas.every((p) => p.visible));
    assert.deepEqual(avisos, [4]);
    const caja = crearCajaRegalo(m, bajo);
    const fases: string[] = [];
    reproducirRegalo(caja, an, (f) => fases.push(f));
    assert.equal(pasos.size, 0);
    assert.deepEqual(fases, ['abierta']);
    assert.ok(cuadros() >= 2);
    assert.ok(caja.hueco.visible);
  });

  it('el regalo pasa por todas las fases y termina abierto', () => {
    const m = crearMateriales();
    const caja = crearCajaRegalo(m, bajo);
    assert.ok(!caja.hueco.visible, 'el premio no se ve con la caja cerrada');
    const { a, correr, pasos } = animadorDePrueba(false);
    const fases: string[] = [];
    reproducirRegalo(caja, a, (f) => fases.push(f));
    correr(3000);
    assert.equal(pasos.size, 0);
    assert.deepEqual(fases, ['baja', 'tiembla', 'abre', 'abierta']);
    caja.aplicar(POSE_ABIERTA);
    assert.ok(contarTriangulos(caja.grupo) < bajo.triangulosMax / 4);
  });

  it('sendero, objeto escaneado y anillo de tomas entran en gama baja', () => {
    const m = crearMateriales();
    const estados = estadosEstaciones(5, 3);
    const s = crearSendero(
      m,
      bajo,
      estados.map((estado, i) => ({ titulo: `Estación ${i}`, requisito: `${i * 5} trabajos`, estado })),
      { avance: 0.8 },
    );
    assert.equal(s.posiciones.length, 5);
    assert.ok(s.grupo.getObjectByName('faro'));
    const obj = crearObjetoEscaneado(m, bajo);
    assert.equal(obj.descripcion, 'Alto 85 cm · diámetro 45 cm · aprox.');
    const caja = new THREE.Box3();
    obj.grupo.getObjectByName('termotanque')!.traverse((o) => {
      if (o instanceof THREE.Mesh && o.name !== 'conexion' && o.name !== 'sombra') caja.expandByObject(o, true);
    });
    assert.ok(Math.abs(caja.max.y - 0.85) < 0.005, `alto ${caja.max.y}`);
    assert.ok(Math.abs(caja.max.x - caja.min.x - 0.45) < 0.03, `diámetro ${caja.max.x - caja.min.x}`);
    const anillo = crearAnilloTomas(m, { tomadas: 12 });
    assert.equal(anillo.grupo.children.filter((c) => (c as THREE.Mesh).material === m.amarillo).length, 12);
    anillo.marcar(30);
    assert.ok(anillo.grupo.children.every((c) => (c as THREE.Mesh).material === m.amarillo));
    for (const g of [s.grupo, obj.grupo, anillo.grupo]) assert.ok(contarTriangulos(g) < bajo.triangulosMax / 4);
  });

  it('liberar suelta geometrías y materiales propios, y conserva los comunes', () => {
    const m = crearMateriales();
    const a = crearArreglo('cerrajeria', m, bajo);
    const caja = crearCajaRegalo(m, bajo);
    const raiz = new THREE.Group().add(a.grupo, caja.grupo);
    const { geos, mats } = contarRecursos(raiz);
    const sueltas = new Set<object>();
    geos.forEach((g) => g.addEventListener('dispose', () => sueltas.add(g)));
    const comunes = new Set<THREE.Material>(m.todos());
    const propios = [...mats].filter((x) => !comunes.has(x));
    assert.ok(propios.length > 0, 'la caja tiene materiales propios (sombra, interior)');
    const matsSueltos = new Set<object>();
    mats.forEach((x) => x.addEventListener('dispose', () => matsSueltos.add(x)));
    liberar(raiz, comunes);
    assert.equal(sueltas.size, geos.size);
    assert.ok(propios.every((x) => matsSueltos.has(x)));
    assert.ok(m.todos().every((x) => !matsSueltos.has(x)));
  });

  it('esfera para encuadrar: vacía da una chica en el origen', () => {
    assert.deepEqual(esferaDe(new THREE.Group()), { centro: [0, 0, 0], radio: 0.5 });
    const m = crearMateriales();
    const e = esferaDe(crearArreglo('electricidad', m, bajo, { armado: true }).grupo);
    assert.ok(e.radio > 0.5 && e.radio < 1.2);
  });
});
