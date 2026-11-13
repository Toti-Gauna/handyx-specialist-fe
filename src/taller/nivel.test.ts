import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { HERRAMIENTAS, ordenarParaRubros } from './catalogo.ts';
import { anguloDe, calibrado, cumplePendiente, desnivelMm, estadoNivel, pendientePorcentaje, suavizar } from './nivel.ts';

describe('nivel y pendiente', () => {
  it('pendiente en % desde el ángulo', () => {
    assert.equal(pendientePorcentaje(0), 0);
    assert.equal(pendientePorcentaje(45), 100);
    assert.equal(pendientePorcentaje(1.15), 2);
    assert.equal(desnivelMm(2, 3), 60);
  });

  it('eje según el modo, calibración y estado', () => {
    assert.equal(anguloDe({ beta: 3, gamma: -1 }, 'plano'), 3);
    assert.equal(anguloDe({ beta: 3, gamma: -1 }, 'canto'), -1);
    assert.equal(calibrado(1.3, 0.4), 0.9);
    assert.equal(estadoNivel(0.1), 'a_nivel');
    assert.equal(estadoNivel(-0.8), 'casi');
    assert.equal(estadoNivel(2), 'fuera');
  });

  it('suavizado y cumplimiento de pendiente', () => {
    assert.equal(suavizar(null, 5), 5);
    assert.equal(suavizar(0, 10, 0.5), 5);
    assert.equal(cumplePendiente(1.9, 2), true);
    assert.equal(cumplePendiente(1.5, 2), false);
  });
});

describe('catálogo del Taller', () => {
  it('ids únicos y el rubro del especialista primero', () => {
    assert.equal(new Set(HERRAMIENTAS.map((h) => h.id)).size, HERRAMIENTAS.length);
    const o = ordenarParaRubros(['electricidad']);
    assert.ok(o.tuyas.length > 0 && o.tuyas.every((h) => h.rubro === 'electricidad'));
    assert.ok(o.comunes.every((h) => h.rubro === 'todos'));
    assert.ok(o.otras.every((h) => h.rubro !== 'electricidad' && h.rubro !== 'todos'));
  });
});
