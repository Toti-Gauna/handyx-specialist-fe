import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { aCartesianas, acercar, amortiguar, ANGULOS_VISTA, asentada, distanciaEncuadre, giroAutomatico, girar, LIMITES_BASE, limitar, limitesPara, orbitaInicial, type Orbita } from './orbita.ts';

const o: Orbita = { azimut: 0, polar: Math.PI / 3, distancia: 4 };
const l = { ...LIMITES_BASE, distanciaMin: 1, distanciaMax: 10 };

describe('órbita del visor 3D', () => {
  it('girar: arrastrar el alto del visor es media vuelta y a la derecha gira el objeto a la derecha', () => {
    const g = girar(o, 400, 0, 400, l);
    assert.ok(Math.abs(g.azimut + Math.PI) < 1e-9);
    assert.equal(g.polar, o.polar);
  });

  it('el giro vertical respeta los topes (no se mira desde abajo del piso)', () => {
    assert.equal(girar(o, 0, 10_000, 400, l).polar, l.polarMin);
    assert.equal(girar(o, 0, -10_000, 400, l).polar, l.polarMax);
  });

  it('acercar y alejar con topes; un factor inválido no cambia nada', () => {
    assert.equal(acercar(o, 0.5, l).distancia, 2);
    assert.equal(acercar(o, 0.01, l).distancia, 1);
    assert.equal(acercar(o, 100, l).distancia, 10);
    assert.deepEqual(acercar(o, Number.NaN, l), o);
    assert.deepEqual(acercar(o, -1, l), o);
  });

  it('la amortiguación no depende de los cuadros por segundo', () => {
    const objetivo = { ...o, azimut: 1 };
    const a60 = Array.from({ length: 6 }).reduce<Orbita>((acc) => amortiguar(acc, objetivo, 1000 / 60), o);
    const a30 = Array.from({ length: 3 }).reduce<Orbita>((acc) => amortiguar(acc, objetivo, 1000 / 30), o);
    assert.ok(Math.abs(a60.azimut - a30.azimut) < 1e-9);
    // En una vida media recorre la mitad.
    assert.ok(Math.abs(amortiguar(o, objetivo, 90).azimut - 0.5) < 1e-9);
  });

  it('asentada: deja de dibujar cuando ya llegó', () => {
    assert.ok(asentada(o, { ...o, azimut: o.azimut + 1e-6 }));
    assert.ok(!asentada(o, { ...o, azimut: o.azimut + 0.01 }));
  });

  it('cartesianas: con polar π/2 y azimut 0 la cámara está de frente (+Z)', () => {
    const [x, y, z] = aCartesianas({ azimut: 0, polar: Math.PI / 2, distancia: 3 }, [1, 1, 1]);
    assert.ok(Math.abs(x - 1) < 1e-9 && Math.abs(y - 1) < 1e-9 && Math.abs(z - 4) < 1e-9);
  });

  it('el encuadre se aleja más en un celular vertical (manda el ancho) y con campo visual angosto', () => {
    assert.ok(distanciaEncuadre(1, 35, 0.5) > distanciaEncuadre(1, 35, 1.5));
    assert.ok(distanciaEncuadre(1, 20, 1) > distanciaEncuadre(1, 35, 1));
  });

  it('el tope de alejar nunca deja afuera la vista inicial', () => {
    for (const [fov, aspecto] of [[35, 0.45], [20, 0.45], [20, 1], [35, 2]] as const) {
      const d = distanciaEncuadre(0.8, fov, aspecto);
      const lim = limitesPara(0.8, LIMITES_BASE, d);
      assert.equal(orbitaInicial(0.8, fov, aspecto, lim).distancia, d);
      assert.ok(lim.distanciaMax > d);
      assert.ok(lim.distanciaMin < d);
    }
  });

  it('vista isométrica: 45° y el ángulo clásico desde arriba', () => {
    const i = orbitaInicial(1, 20, 1, limitesPara(1, LIMITES_BASE, 100), 'isometrica');
    assert.equal(i.azimut, Math.PI / 4);
    assert.ok(Math.abs(i.polar - 0.9553) < 1e-3);
    assert.deepEqual(ANGULOS_VISTA['tres-cuartos'], { azimut: Math.PI / 7, polar: Math.PI * 0.4 });
  });

  it('giro automático: una vuelta cada 14 s', () => {
    assert.ok(Math.abs(giroAutomatico(o, 14_000).azimut - 2 * Math.PI) < 1e-9);
    assert.equal(giroAutomatico(o, -5).azimut, 0);
  });

  it('limitar con tope horizontal opcional', () => {
    assert.equal(limitar({ ...o, azimut: 5 }, { ...l, azimutMin: -1, azimutMax: 1 }).azimut, 1);
    assert.equal(limitar({ ...o, azimut: 5 }, l).azimut, 5);
  });
});
