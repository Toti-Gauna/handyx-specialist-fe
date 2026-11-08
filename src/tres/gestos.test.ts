import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { crearSeguimiento, DOBLE_TOQUE_MS, esDobleToque, factorRueda } from './gestos.ts';

describe('gestos del visor 3D', () => {
  it('un dedo gira con el desplazamiento', () => {
    const s = crearSeguimiento();
    s.bajar({ id: 1, x: 100, y: 100, t: 0 });
    assert.deepEqual(s.mover({ id: 1, x: 130, y: 90, t: 16 }), { tipo: 'girar', dx: 30, dy: -10 });
    assert.equal(s.activos, 1);
  });

  it('dos dedos que se separan acercan (factor < 1) y que se juntan alejan', () => {
    const s = crearSeguimiento();
    s.bajar({ id: 1, x: 100, y: 100, t: 0 });
    s.bajar({ id: 2, x: 200, y: 100, t: 0 });
    const abre = s.mover({ id: 2, x: 300, y: 100, t: 16 });
    assert.deepEqual(abre, { tipo: 'pellizco', factor: 0.5 });
    const cierra = s.mover({ id: 2, x: 200, y: 100, t: 32 });
    assert.deepEqual(cierra, { tipo: 'pellizco', factor: 2 });
  });

  it('al levantar un dedo de dos, el otro sigue girando sin salto y no cuenta como toque', () => {
    const s = crearSeguimiento();
    s.bajar({ id: 1, x: 100, y: 100, t: 0 });
    s.bajar({ id: 2, x: 200, y: 100, t: 0 });
    assert.equal(s.subir({ id: 2, x: 200, y: 100, t: 50 }), null);
    assert.deepEqual(s.mover({ id: 1, x: 105, y: 100, t: 60 }), { tipo: 'girar', dx: 5, dy: 0 });
    assert.equal(s.subir({ id: 1, x: 105, y: 100, t: 80 }), null);
  });

  it('doble toque: dos toques cortos y cerca', () => {
    const s = crearSeguimiento();
    s.bajar({ id: 1, x: 50, y: 50, t: 0 });
    assert.equal(s.subir({ id: 1, x: 51, y: 50, t: 80 }), null);
    s.bajar({ id: 2, x: 55, y: 52, t: 200 });
    assert.deepEqual(s.subir({ id: 2, x: 55, y: 52, t: 260 }), { tipo: 'doble-toque' });
  });

  it('un arrastre no es toque y dos toques lejos o lentos no son doble toque', () => {
    const s = crearSeguimiento();
    s.bajar({ id: 1, x: 0, y: 0, t: 0 });
    s.mover({ id: 1, x: 80, y: 0, t: 50 });
    assert.equal(s.subir({ id: 1, x: 80, y: 0, t: 100 }), null);
    s.bajar({ id: 2, x: 80, y: 0, t: 150 });
    assert.equal(s.subir({ id: 2, x: 80, y: 0, t: 200 }), null);
    assert.ok(!esDobleToque({ x: 0, y: 0, t: 0 }, { x: 100, y: 0, t: 100 }));
    assert.ok(!esDobleToque({ x: 0, y: 0, t: 0 }, { x: 0, y: 0, t: DOBLE_TOQUE_MS + 1 }));
    assert.ok(!esDobleToque(null, { x: 0, y: 0, t: 0 }));
  });

  it('la rueda acerca o aleja un 10 % por paso, con tope', () => {
    assert.ok(Math.abs(factorRueda(100) - Math.exp(0.1)) < 1e-12);
    assert.ok(factorRueda(-100) < 1);
    assert.equal(factorRueda(10_000), factorRueda(100));
  });

  it('mover un dedo que no se apoyó no hace nada', () => {
    assert.equal(crearSeguimiento().mover({ id: 9, x: 0, y: 0, t: 0 }), null);
  });
});
