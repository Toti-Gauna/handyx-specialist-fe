import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { TurnoAgenda } from '../contracts/agenda.ts';
import { monto } from '../contracts/dinero.ts';
import { agruparPorDia, chipCobro, chipTurno, lunesDe, moverMesTexto, nombreMes, rotuloDia, textoBarra, textoTurnos, totalDelDia, tramosNeto } from './agendaTaller.ts';
import { diaLocal } from './formato.ts';

const turno = (inicio: string, o: Partial<TurnoAgenda> = {}): TurnoAgenda => ({
  id: '00000000-0000-4000-8000-000000000001',
  tipo: 'trabajo',
  trabajoId: null,
  obraId: null,
  jornadaId: null,
  pedidoId: null,
  pedidoFerreteriaId: null,
  titulo: 'Pierde la canilla',
  detalle: 'Plomería · Centro',
  rubro: 'plomeria',
  barrio: 'Centro',
  cliente: null,
  equipo: [],
  inicio,
  fin: null,
  estado: 'agendado',
  monto: null,
  cobro: null,
  superpuesto: false,
  ...o,
});

describe('fechas de la agenda', () => {
  it('la semana empieza el lunes', () => {
    assert.equal(lunesDe('2026-11-17'), '2026-11-16');
    assert.equal(lunesDe('2026-11-16'), '2026-11-16');
    assert.equal(lunesDe('2026-11-22'), '2026-11-16');
    assert.equal(lunesDe('2026-11-23'), '2026-11-23');
  });
  it('rotula hoy, ayer y mañana', () => {
    assert.equal(rotuloDia('2026-11-17', '2026-11-17'), 'Hoy · martes 17');
    assert.equal(rotuloDia('2026-11-16', '2026-11-17'), 'Ayer · lunes 16');
    assert.equal(rotuloDia('2026-11-18', '2026-11-17'), 'Mañana · miércoles 18');
    assert.equal(rotuloDia('2026-11-13', '2026-11-17'), 'viernes 13');
  });
  it('mueve el mes y lo nombra', () => {
    assert.equal(moverMesTexto('2026-11', 1), '2026-12');
    assert.equal(moverMesTexto('2026-12', 1), '2027-01');
    assert.equal(moverMesTexto('2026-01', -1), '2025-12');
    assert.equal(nombreMes('2026-11'), 'Noviembre 2026');
  });
  it('agrupa por día conservando el orden y suma sin contar ofertas', () => {
    const l = [
      turno('2026-11-17T21:00:00.000Z', { monto: monto(4_700_000) }),
      turno('2026-11-17T23:00:00.000Z', {
        monto: monto(1_000_000),
        tipo: 'oferta',
        estado: 'oferta_pendiente',
      }),
      turno('2026-11-18T13:00:00.000Z'),
    ];
    const g = agruparPorDia(l, diaLocal);
    assert.deepEqual(
      g.map((x) => [x.fecha, x.turnos.length]),
      [
        ['2026-11-17', 2],
        ['2026-11-18', 1],
      ],
    );
    assert.equal(totalDelDia(g[0]!.turnos), 4_700_000);
  });
  it('un turno de la noche cae en su día de Buenos Aires, no en el UTC', () => {
    // 02:00 UTC del 18 son las 23:00 del 17 en Buenos Aires.
    assert.equal(agruparPorDia([turno('2026-11-18T02:00:00.000Z')], diaLocal)[0]?.fecha, '2026-11-17');
  });
  it('cuenta los turnos con palabras', () => {
    assert.equal(textoTurnos(0), 'Sin turnos');
    assert.equal(textoTurnos(1), '1 turno');
    assert.equal(textoTurnos(2), '2 turnos');
  });
});

describe('estados con ícono y texto', () => {
  it('cada turno dice su estado, y la oferta no pasa por turno agendado', () => {
    assert.equal(chipTurno({ tipo: 'trabajo', estado: 'agendado' }).texto, 'Agendado');
    assert.equal(chipTurno({ tipo: 'jornada', estado: 'agendado' }).texto, 'Obra');
    assert.equal(chipTurno({ tipo: 'oferta', estado: 'oferta_pendiente' }).texto, 'Oferta sin confirmar');
    assert.equal(chipTurno({ tipo: 'trabajo', estado: 'cambio_pendiente' }).texto, 'Cambio pendiente');
    assert.equal(chipTurno({ tipo: 'trabajo', estado: 'hecho' }).texto, 'Hecho');
  });
  it('informado no se muestra como verificado', () => {
    assert.equal(chipCobro('verificado').texto, 'Cobrado · verificado');
    assert.equal(chipCobro('reportado').texto, 'Informado');
    assert.notEqual(chipCobro('reportado').tono, 'exito');
  });
});

describe('la barra del neto', () => {
  const r = (bruto: number, gastos: Array<['materiales' | 'combustible_viaticos', number]>, neto: number | null) => ({
    bruto: {
      total: monto(bruto),
      enHandyxVerificado: monto(0),
      enHandyxInformado: monto(0),
      porFuera: monto(0),
    },
    gastos: {
      total: monto(gastos.reduce((n, g) => n + g[1], 0)),
      porCategoria: gastos.map(([categoria, c]) => ({
        categoria,
        total: monto(c),
      })),
    },
    neto: neto === null ? null : monto(neto),
  });
  it('reparte el bruto entre el neto y cada gasto', () => {
    const t = tramosNeto(
      r(
        32_000_000,
        [
          ['materiales', 6_850_000],
          ['combustible_viaticos', 1_200_000],
        ],
        23_950_000,
      ),
    );
    assert.deepEqual(
      t.map((x) => x.clave),
      ['neto', 'materiales', 'combustible_viaticos'],
    );
    assert.equal(Math.round(t.reduce((n, x) => n + x.porcentaje, 0)), 100);
    assert.equal(textoBarra(t), '75 % neto, 21 % materiales, 4 % combustible y viáticos');
  });
  it('con pérdida, toda la barra es de gastos', () => {
    const t = tramosNeto(r(1_000_000, [['materiales', 5_000_000]], null));
    assert.deepEqual(
      t.map((x) => [x.clave, x.porcentaje]),
      [['materiales', 100]],
    );
  });
  it('sin ingresos ni gastos no hay barra y se dice', () => {
    const t = tramosNeto(r(0, [], 0));
    assert.deepEqual(t, []);
    assert.match(textoBarra(t), /Todavía no hay/);
  });
});
