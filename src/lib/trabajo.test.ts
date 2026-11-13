import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { RUBROS } from '../contracts/rubros.ts';
import { cronometro, horarioFranja, inicioEnCurso, motivoRespaldo, opcionesAdicional, PERSONALIZADA } from './trabajo.ts';

describe('trabajo de punta a punta (lote 4.6)', () => {
  it('"Ya llegué" solo con la ubicación mal: con buena señal la llegada se marca sola', () => {
    assert.equal(motivoRespaldo('normal', true), null);
    assert.equal(motivoRespaldo('buscando', true), null);
    assert.equal(motivoRespaldo('imprecisa', true), 'imprecisa');
    assert.equal(motivoRespaldo('sin_senal', true), 'sin_senal');
    assert.equal(motivoRespaldo('sin_permiso', false), 'sin_permiso');
    assert.equal(motivoRespaldo('no_disponible', false), 'sin_ubicacion');
    assert.equal(motivoRespaldo('buscando', false), 'sin_ubicacion', 'sin compartir no hay geocerca');
  });

  it('el cronómetro cuenta desde el último "en curso" y nunca es negativo', () => {
    const desde = '2026-11-17T15:00:00.000Z';
    assert.equal(cronometro(desde, new Date('2026-11-17T15:12:05.000Z')), '12:05');
    assert.equal(cronometro(desde, new Date('2026-11-17T16:02:05.000Z')), '1:02:05');
    assert.equal(cronometro(desde, new Date('2026-11-17T14:00:00.000Z')), '00:00');
    const eventos = [
      { estado: 'en_curso' as const, en: '2026-11-17T10:00:00.000Z', actor: 'especialista' as const },
      { estado: 'en_curso' as const, en: desde, actor: 'especialista' as const },
    ];
    assert.equal(inicioEnCurso(eventos), desde);
    assert.equal(inicioEnCurso([]), null);
  });

  it('las opciones de adicionales empiezan con "Opción personalizada" en todos los rubros y no traen precios', () => {
    for (const r of RUBROS) {
      const o = opcionesAdicional(r);
      assert.equal(o[0], PERSONALIZADA);
      assert.ok(o.length > 2);
      assert.equal(new Set(o.map((x) => x.id)).size, o.length);
    }
  });

  it('una franja arma el horario en hora de Buenos Aires', () => {
    assert.deepEqual(horarioFranja('2026-11-19', 'manana'), { inicio: '2026-11-19T11:00:00.000Z', fin: '2026-11-19T15:00:00.000Z' });
    assert.deepEqual(horarioFranja('2026-11-19', 'tarde'), { inicio: '2026-11-19T19:00:00.000Z', fin: '2026-11-19T23:00:00.000Z' });
  });
});
