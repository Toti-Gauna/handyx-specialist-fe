import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { CHECKLISTS_ELECTRICIDAD, totalPasos } from './checklists.ts';
import { MATERIALES_ELECTRICOS } from './materiales.ts';
import { PREMIOS_ELECTRICIDAD } from './premios.ts';

describe('checklists, materiales y premios de Electricidad', () => {
  it('cada checklist empieza por la seguridad; los que trabajan sin tensión, verificándola con un instrumento', () => {
    for (const c of CHECKLISTS_ELECTRICIDAD) {
      assert.equal(c.secciones[0]?.titulo, 'Seguridad', c.id);
      assert.ok(totalPasos(c) >= 4, c.id);
      if (c.id !== 'falla') assert.ok(c.secciones[0]?.pasos.some((p) => /instrumento/.test(p)), c.id);
    }
    assert.equal(new Set(CHECKLISTS_ELECTRICIDAD.map((c) => c.id)).size, CHECKLISTS_ELECTRICIDAD.length);
  });

  it('materiales con ids únicos y sin precios', () => {
    assert.equal(new Set(MATERIALES_ELECTRICOS.map((m) => m.id)).size, MATERIALES_ELECTRICOS.length);
    assert.ok(!JSON.stringify(MATERIALES_ELECTRICOS).includes('$'));
  });

  it('premios en orden de hito, todos pendientes de aprobación', () => {
    assert.deepEqual(PREMIOS_ELECTRICIDAD.map((p) => p.hito), [1, 2, 3, 4, 5, 6]);
    assert.ok(PREMIOS_ELECTRICIDAD.every((p) => p.estado === 'PENDIENTE'));
  });
});
