import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { AvisoBandeja } from '../contracts/cuenta.ts';
import { agruparAvisos, textoIngreso, diasDeDistancia, grupoDeAviso, momentoDeAviso } from './avisos.ts';

const ahora = new Date('2026-11-17T21:00:00Z'); // martes 18:00 en Buenos Aires
const aviso = (n: number, creadoEn: string): AvisoBandeja => ({ id: `00000000-0000-4000-8000-${n.toString().padStart(12, '0')}`, tipo: 'mensaje', titulo: 't', cuerpo: 'c', iniciales: null, creadoEn, leido: false, destino: { ruta: 'chat', id: null } });

describe('bandeja de avisos', () => {
  it('cuenta días de calendario en hora de Buenos Aires', () => {
    assert.equal(diasDeDistancia('2026-11-17T15:00:00Z', ahora), 0);
    assert.equal(diasDeDistancia('2026-11-16T23:30:00Z', ahora), 1); // 20:30 del lunes
    assert.equal(diasDeDistancia('2026-11-18T02:00:00Z', ahora), 0); // 23:00 del martes
  });
  it('agrupa en hoy, esta semana y antes', () => {
    assert.equal(grupoDeAviso('2026-11-17T20:40:00Z', ahora), 'hoy');
    assert.equal(grupoDeAviso('2026-11-12T15:00:00Z', ahora), 'semana');
    assert.equal(grupoDeAviso('2026-11-03T15:00:00Z', ahora), 'antes');
  });
  it('dice la hora, el día o la fecha', () => {
    assert.equal(momentoDeAviso('2026-11-17T20:40:00Z', ahora), '17:40');
    assert.equal(momentoDeAviso('2026-11-16T15:00:00Z', ahora), 'Lun');
    assert.equal(momentoDeAviso('2026-11-03T15:00:00Z', ahora), '03/11');
  });
  it('no devuelve grupos vacíos y ordena de más nuevo a más viejo', () => {
    const g = agruparAvisos([aviso(1, '2026-11-12T15:00:00Z'), aviso(2, '2026-11-17T20:40:00Z'), aviso(3, '2026-11-17T21:00:00Z')], ahora);
    assert.deepEqual(g.map((x) => x.grupo), ['hoy', 'semana']);
    assert.deepEqual(g[0]?.items.map((a) => a.id.slice(-1)), ['3', '2']);
  });
  it('dice cuándo entró', () => {
    assert.equal(textoIngreso('2026-11-17T20:40:00Z', ahora), 'hoy 17:40');
    assert.match(textoIngreso('2026-11-12T15:00:00Z', ahora), /12\/11 · 12:00$/);
  });
});
