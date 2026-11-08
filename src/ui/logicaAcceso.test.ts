import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { esperaEnPalabras, normalizarRespaldo, segundosHasta, textoEspera } from './logicaAcceso.ts';

describe('logicaAcceso', () => {
  it('cuenta los segundos hasta poder pedir otro código', () => {
    const ahora = Date.parse('2026-11-17T15:00:00.000Z');
    assert.equal(segundosHasta('2026-11-17T15:00:42.000Z', ahora), 42);
    assert.equal(segundosHasta('2026-11-17T15:00:41.200Z', ahora), 42);
    assert.equal(segundosHasta('2026-11-17T14:59:00.000Z', ahora), 0);
  });
  it('escribe la espera como un reloj y en palabras', () => {
    assert.equal(textoEspera(42), '0:42');
    assert.equal(textoEspera(65), '1:05');
    assert.equal(esperaEnPalabras(42), '42 segundos');
    assert.equal(esperaEnPalabras(61), '1 minuto y 1 segundo');
    assert.equal(esperaEnPalabras(120), '2 minutos');
  });
  it('normaliza el código de respaldo', () => {
    assert.equal(normalizarRespaldo('hx7kp2m9qd'), 'HX7KP-2M9QD');
    assert.equal(normalizarRespaldo('HX7KP-2M9QD'), 'HX7KP-2M9QD');
    assert.equal(normalizarRespaldo('hx7'), 'HX7');
  });
});
