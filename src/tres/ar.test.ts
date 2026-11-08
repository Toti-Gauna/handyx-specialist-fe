// La AR común reemplaza a la del Taller sin cambiar su comportamiento: exporta todo lo que el Taller usa hoy y,
// en Node (sin navegador), dice que no hay AR en vez de fallar.
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import * as taller from '../taller/ar.ts';
import * as comun from './ar.ts';

describe('AR común', () => {
  it('exporta lo mismo que src/taller/ar.ts (el Taller migra cambiando solo el import)', () => {
    for (const nombre of Object.keys(taller)) assert.equal(typeof (comun as Record<string, unknown>)[nombre], typeof (taller as Record<string, unknown>)[nombre], nombre);
  });

  it('sin navegador no hay AR', async () => {
    assert.equal(await comun.arInmersivoDisponible(), false);
    assert.equal(comun.soportaQuickLook(), false);
    assert.equal(await comun.modoAr(), 'ninguno');
  });
});
