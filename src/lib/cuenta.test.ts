import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { diaMes, mesYAnio, ultimosEnmascarados, venceMesAnio } from './cuenta.ts';

describe('textos de cuenta', () => {
  it('mes y año', () => {
    assert.equal(mesYAnio('2026-11'), 'nov 2026');
    assert.equal(mesYAnio('2027-01'), 'ene 2027');
    assert.equal(mesYAnio('raro'), 'raro');
  });
  it('vencimiento de una matrícula', () => assert.equal(venceMesAnio('2028-03-31'), '03/2028'));
  it('día y mes en hora de Buenos Aires', () => {
    assert.equal(diaMes('2026-11-10T15:00:00Z'), '10/11');
    assert.equal(diaMes('2026-11-11T01:00:00Z'), '10/11'); // 22:00 del 10 en Buenos Aires
  });
  it('solo los últimos números', () => {
    assert.equal(ultimosEnmascarados('678'), '•• ••• 678');
    assert.equal(ultimosEnmascarados(null), 'Sin cargar');
  });
});
