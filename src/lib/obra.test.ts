import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { monto } from '../contracts/dinero.ts';
import type { EtapaObra, Jornada, Pago, TrabajoDetalle } from '../contracts/dto.ts';
import { avanceObra, etapaEnCurso, fechasEtapa, jornadaDeHoy, montosObra, proximaJornada, totalEtapa } from './obra.ts';

const id = (n: number) => `00000000-0000-4000-8000-${n.toString(16).padStart(12, '0')}`;
const etapa = (n: number, estado: EtapaObra['estado'], pesos: number): EtapaObra => ({ id: id(n), orden: n, nombre: `Etapa ${n}`, incluye: '', monto: monto(pesos * 100), estado, terminadaEn: null, pagoId: null });
// Jornadas de 9 a 17 (hora de Buenos Aires = UTC−3)
const jornada = (n: number, etapaId: string, dia: string, estado: Jornada['estado'] = 'programada'): Jornada => ({ id: id(0x100 + n), etapaId, numero: n, horario: { inicio: `${dia}T12:00:00.000Z`, fin: `${dia}T20:00:00.000Z` }, estado, cambioPendiente: null });

describe('obras de varios días (lote 4.7)', () => {
  const etapas = [etapa(1, 'terminada', 60000), etapa(2, 'en_curso', 150000), etapa(3, 'pendiente', 40000)];
  const jornadas = [jornada(1, id(1), '2026-11-18', 'hecha'), jornada(2, id(2), '2026-11-19'), jornada(3, id(2), '2026-11-20'), jornada(4, id(3), '2026-11-23')];

  it('avance y etapa en curso', () => {
    assert.deepEqual(avanceObra(etapas), { hechas: 1, total: 3 });
    assert.equal(etapaEnCurso(etapas)?.id, id(2));
    assert.equal(etapaEnCurso([etapa(1, 'terminada', 1)]), null);
  });

  it('la próxima jornada cuenta la de hoy mientras no terminó, y la de hoy se busca en hora de Buenos Aires', () => {
    assert.equal(proximaJornada(jornadas, new Date('2026-11-19T15:00:00.000Z'))?.numero, 2, 'hoy a las 12');
    assert.equal(proximaJornada(jornadas, new Date('2026-11-19T21:00:00.000Z'))?.numero, 3, 'hoy después de las 17');
    assert.equal(proximaJornada(jornadas, new Date('2026-12-01T12:00:00.000Z')), null);
    assert.equal(jornadaDeHoy(jornadas, new Date('2026-11-20T02:00:00.000Z'))?.numero, 2, 'las 23 del 19 en Buenos Aires siguen siendo el 19');
  });

  it('las fechas de una etapa salen de sus jornadas', () => {
    assert.deepEqual(fechasEtapa(id(2), jornadas), { desde: '2026-11-19T12:00:00.000Z', hasta: '2026-11-20T12:00:00.000Z', cantidad: 2 });
    assert.equal(fechasEtapa(id(9), jornadas), null);
  });

  it('lo cobrado separa lo verificado de lo informado, y la etapa suma sus adicionales aceptados', () => {
    const d = { trabajo: { id: id(0xc6) }, totalVigente: monto(25_500_000) } as Pick<TrabajoDetalle, 'trabajo' | 'totalVigente'>;
    const pago = (n: number, estado: Pago['estado'], pesos: number, trabajoId = id(0xc6)) => ({ id: id(0x200 + n), trabajoId, estado, monto: monto(pesos * 100) }) as Pago;
    assert.deepEqual(montosObra(d, [pago(1, 'verificado', 65000), pago(2, 'reportado', 150000), pago(3, 'pendiente', 40000), pago(4, 'verificado', 999, id(1))]), { total: 25_500_000, verificado: 6_500_000, informado: 15_000_000, falta: 4_000_000 });
    const adicionales = [
      { etapaId: id(1), estado: 'aceptado', monto: monto(500_000) },
      { etapaId: id(1), estado: 'pendiente', monto: monto(300_000) },
      { etapaId: id(2), estado: 'aceptado', monto: monto(100_000) },
    ] as TrabajoDetalle['adicionales'];
    assert.equal(totalEtapa(etapas[0]!, adicionales), 6_500_000);
  });
});
