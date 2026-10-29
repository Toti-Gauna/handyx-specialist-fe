import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { aInputLocal, centavosDesdeTexto, deInputLocal, fechaHora, haceCuanto, hora, nuevaClave, plural, restante } from './formato.ts';

describe('formato', () => {
  it('muestra las horas en Buenos Aires', () => {
    assert.equal(hora('2026-11-17T15:00:00Z'), '12:00');
    assert.equal(fechaHora('2026-11-17T15:00:00Z'), 'mar 17/11 · 12:00');
    assert.equal(fechaHora('2026-12-11T02:30:00Z'), 'jue 10/12 · 23:30');
  });
  it('ida y vuelta con datetime-local', () => {
    assert.equal(aInputLocal('2026-11-19T13:00:00Z'), '2026-11-19T10:00');
    assert.equal(deInputLocal('2026-11-19T10:00'), '2026-11-19T13:00:00.000Z');
    assert.equal(deInputLocal('mañana'), null);
  });
  it('convierte pesos escritos a centavos enteros sin floats', () => {
    assert.equal(centavosDesdeTexto('45.000'), 4_500_000);
    assert.equal(centavosDesdeTexto('$ 45.000,50'), 4_500_050);
    assert.equal(centavosDesdeTexto('0,1'), 10);
    assert.equal(centavosDesdeTexto('12abc'), null);
    assert.equal(centavosDesdeTexto('-5'), null);
    assert.equal(centavosDesdeTexto(''), null);
  });
  it('cuenta regresiva y antigüedad', () => {
    const ahora = new Date('2026-11-17T15:00:00Z');
    assert.equal(restante('2026-11-17T15:04:32Z', ahora), '4:32');
    assert.equal(restante('2026-11-17T18:10:00Z', ahora), '3 h 10 min');
    assert.equal(restante('2026-11-17T15:00:00Z', ahora), null);
    assert.equal(haceCuanto('2026-11-17T14:52:00Z', ahora), 'hace 8 min');
    assert.equal(haceCuanto('2026-11-15T15:00:00Z', ahora), 'hace 2 días');
  });
  it('concuerda el plural con la cantidad', () => {
    assert.equal(plural(1, 'propuesta', 'propuestas'), '1 propuesta');
    assert.equal(plural(0, 'propuesta', 'propuestas'), '0 propuestas');
  });
  it('genera claves de idempotencia únicas con forma de UUID', () => {
    const a = nuevaClave();
    assert.match(a, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    assert.notEqual(a, nuevaClave());
  });
});
