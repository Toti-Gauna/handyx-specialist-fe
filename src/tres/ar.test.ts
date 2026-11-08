// La AR común (el Taller ya la usa desde el lote 2.4): en Node (sin navegador) dice que no hay AR en vez de fallar.
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import * as comun from './ar.ts';

describe('AR común', () => {
  it('sin navegador no hay AR', async () => {
    assert.equal(await comun.arInmersivoDisponible(), false);
    assert.equal(comun.soportaQuickLook(), false);
    assert.equal(await comun.modoAr(), 'ninguno');
  });
});
