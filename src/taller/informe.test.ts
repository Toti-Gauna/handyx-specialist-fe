import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { evaluarInforme, MEDICION } from './informe.ts';

describe('informe eléctrico', () => {
  it('semáforo por medición', () => {
    assert.equal(MEDICION.puestaTierra.evaluar(8), 'bien');
    assert.equal(MEDICION.puestaTierra.evaluar(25), 'atencion');
    assert.equal(MEDICION.puestaTierra.evaluar(60), 'mal');
    assert.equal(MEDICION.disparoDiferencial.evaluar(280), 'bien');
    assert.equal(MEDICION.disparoDiferencial.evaluar(320), 'mal');
    assert.equal(MEDICION.aislacion.evaluar(0.7), 'atencion');
    assert.equal(MEDICION.tension.evaluar(236), 'atencion');
    assert.equal(MEDICION.tension.evaluar(190), 'mal');
  });

  it('todo bien: general bien y sin recomendaciones', () => {
    const r = evaluarInforme({ mediciones: { puestaTierra: 6, disparoDiferencial: 25, aislacion: 50, tension: 221 }, tablero: { diferencial: 'si', tierra: 'si' } });
    assert.equal(r.general, 'bien');
    assert.deepEqual(r.recomendaciones, []);
  });

  it('sin diferencial manda «mal» aunque las mediciones estén bien; lo que no se midió no cuenta', () => {
    const r = evaluarInforme({ mediciones: { tension: 220, aislacion: Number.NaN }, tablero: { diferencial: 'no', identificacion: 'no', bornes: 'no_aplica' } });
    assert.equal(r.general, 'mal');
    assert.equal(r.mediciones.length, 1);
    assert.equal(r.recomendaciones.length, 2);
    assert.match(r.recomendaciones[0] ?? '', /disyuntor diferencial/);
  });

  it('sin datos no hay resultado general', () => {
    assert.equal(evaluarInforme({ mediciones: {}, tablero: {} }).general, null);
  });
});
