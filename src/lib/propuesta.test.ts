import assert from 'node:assert/strict';
import { it } from 'node:test';
import { opcionesCuando, sumarFrase } from './propuesta.ts';

const AHORA = new Date('2026-11-17T15:07:00.000Z'); // 12:07 en Buenos Aires

it('urgentes: en 30 min, 1 h y 2 h, redondeado al cuarto de hora', () => {
  const op = opcionesCuando('urgente', null, AHORA);
  assert.deepEqual(op.map((o) => o.inicio), ['2026-11-17T15:45:00.000Z', '2026-11-17T16:15:00.000Z', '2026-11-17T17:15:00.000Z']);
  assert.match(op[0]!.texto, /^En 30 min · 12:45$/);
});

it('programados: el día que pidió (si es a futuro); en una contraoferta, primero lo que propuso el cliente', () => {
  assert.deepEqual(opcionesCuando('programado', '2026-11-19T13:00:00.000Z', AHORA).map((o) => o.id), ['pedida']);
  assert.deepEqual(opcionesCuando('programado', '2026-11-10T13:00:00.000Z', AHORA), []);
  assert.deepEqual(opcionesCuando('obra', '2026-11-19T13:00:00.000Z', AHORA, '2026-11-20T13:00:00.000Z').map((o) => o.id), ['cliente', 'pedida']);
  assert.deepEqual(opcionesCuando('obra', '2026-11-19T13:00:00.000Z', AHORA, '2026-11-19T13:00:00.000Z').map((o) => o.id), ['cliente'], 'sin repetir la misma fecha');
});

it('qué incluye: suma frases sin repetirlas', () => {
  assert.equal(sumarFrase('', 'Mano de obra'), 'Mano de obra.');
  assert.equal(sumarFrase('Cambio del flexible', 'Materiales incluidos'), 'Cambio del flexible. Materiales incluidos.');
  assert.equal(sumarFrase('Mano de obra. ', 'mano de obra'), 'Mano de obra.');
});
