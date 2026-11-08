// Reglas del mock del lote 2.1: agenda (pasadas, hoy, futuras, mes) e ingresos y gastos.
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { AgendaMesSchema, ResumenAgendaSchema, TurnoAgendaSchema } from '../../contracts/agenda.ts';
import { monto } from '../../contracts/dinero.ts';
import { GastoSchema, ResumenIngresosSchema, type NuevoGasto } from '../../contracts/ingresos.ts';
import { crearApiMockConEstado } from './adaptador.ts';
import { ID } from './fixtures.ts';

const nuevo = () => crearApiMockConEstado({ escenario: 'habilitado', latenciaMs: 0 });
let n = 0;
const clave = () => `00000000-0000-4000-8000-${(0xdef000 + ++n).toString(16).padStart(12, '0')}`;
const gasto = (o: Partial<NuevoGasto> = {}): NuevoGasto => ({
  monto: monto(1_300_000),
  categoria: 'materiales',
  descripcion: 'Cartucho',
  fecha: '2026-11-17',
  trabajoId: null,
  registrarGasto: true,
  cobrarAlCliente: false,
  ...o,
});

describe('agenda (mock)', () => {
  it('el resumen cuenta pasadas, hoy y futuras y trae la semana entera', async () => {
    const { api } = nuevo();
    const r = await api.resumenAgenda();
    assert.ok(ResumenAgendaSchema.safeParse(r).success);
    assert.equal(r.hoy, '2026-11-17');
    assert.equal(r.semana.length, 7);
    assert.equal(r.semana[0]?.fecha, '2026-11-16');
    assert.equal(r.deHoy, 2, 'la jornada de la obra y la canilla');
    assert.ok(r.pasadas >= 3 && r.futuras >= 3);
    assert.equal(r.proximo?.titulo, 'Pierde la canilla');
    // Solo lo verificado cuenta como cobrado.
    assert.equal(r.cobradoMes.centavos, 5_200_000 + 2_800_000 + 3_800_000);
  });

  it('las pasadas traen su cobro (reportado ≠ verificado) y van de la más reciente a la más vieja', async () => {
    const { api } = nuevo();
    const p = await api.turnosAgenda('pasadas');
    for (const t of p.items) assert.ok(TurnoAgendaSchema.safeParse(t).success);
    const inicios = p.items.map((t) => Date.parse(t.inicio));
    assert.deepEqual(
      inicios,
      [...inicios].sort((a, b) => b - a),
    );
    assert.ok(p.items.some((t) => t.cobro?.estado === 'verificado'));
    assert.ok(p.items.some((t) => t.cobro?.estado === 'reportado'));
  });

  it('una oferta pendiente es futura pero no es un turno del mes ni de la semana', async () => {
    const { api } = nuevo();
    const f = await api.turnosAgenda('futuras');
    const oferta = f.items.find((t) => t.tipo === 'oferta');
    assert.ok(oferta, 'hay una oferta pendiente');
    assert.equal(oferta.estado, 'oferta_pendiente');
    const dia = await api.turnosDelDia(oferta.inicio.slice(0, 10));
    assert.ok(!dia.some((t) => t.id === oferta.id));
    const r = await api.resumenAgenda();
    const enSemana = r.semana.find((d) => d.fecha === oferta.inicio.slice(0, 10));
    assert.ok(enSemana === undefined || enSemana.turnos === dia.length, 'la semana cuenta turnos, no ofertas');
  });

  it('el mes marca obras y trabajos por día y se puede filtrar', async () => {
    const { api } = nuevo();
    const todo = await api.agendaMes('2026-11');
    assert.ok(AgendaMesSchema.safeParse(todo).success);
    assert.equal(todo.totales.obras, 2);
    const hoy = todo.dias.find((d) => d.fecha === '2026-11-17');
    assert.equal(hoy?.trabajos, 1);
    assert.equal(hoy?.obras.length, 1);
    const obras = await api.agendaMes('2026-11', 'obras');
    assert.equal(obras.totales.trabajos, 0);
    const trabajos = await api.agendaMes('2026-11', 'trabajos');
    assert.equal(trabajos.totales.obras, 0);
    await assert.rejects(api.agendaMes('noviembre'), { tipo: 'validacion' });
    assert.deepEqual((await api.agendaMes('2027-03')).dias, []);
  });

  it('los turnos de un día salen en orden y sin cancelados', async () => {
    const { api } = nuevo();
    const dia = await api.turnosDelDia('2026-11-17');
    assert.deepEqual(
      dia.map((t) => t.titulo),
      ['Revoque', 'Pierde la canilla'],
    );
    assert.ok(!(await api.turnosDelDia('2026-11-09')).some((t) => t.estado === 'cancelado'));
    await assert.rejects(api.turnosDelDia('17/11'), { tipo: 'validacion' });
  });
});

describe('ingresos y gastos (mock)', () => {
  it('neto = bruto − gastos, con lo informado aparte y sin tarifa de Handyx', async () => {
    const { api } = nuevo();
    const r = await api.resumenIngresos('2026-11');
    assert.ok(ResumenIngresosSchema.safeParse(r).success);
    const { bruto } = r;
    assert.equal(bruto.total.centavos, bruto.enHandyxVerificado.centavos + bruto.enHandyxInformado.centavos + bruto.porFuera.centavos);
    assert.equal(r.neto?.centavos, bruto.total.centavos - r.gastos.total.centavos);
    assert.equal(r.gastos.total.centavos, 8_050_000);
    assert.equal(r.perdida, null);
    assert.ok(!JSON.stringify(r).toLowerCase().includes('fee'));
    const suma = r.porTrabajo.reduce((c, t) => c + t.cobrado.centavos, 0);
    assert.equal(suma, bruto.enHandyxVerificado.centavos + bruto.enHandyxInformado.centavos);
  });

  it('un gasto nuevo baja el neto; si los gastos superan al bruto se informa la pérdida', async () => {
    const { api } = nuevo();
    const antes = await api.resumenIngresos('2026-11');
    const g = await api.cargarGasto(gasto(), null, clave());
    assert.ok(GastoSchema.safeParse(g).success);
    const despues = await api.resumenIngresos('2026-11');
    assert.equal((antes.neto?.centavos ?? 0) - (despues.neto?.centavos ?? 0), 1_300_000);
    await api.cargarGasto(gasto({ monto: monto(90_000_000) }), null, clave());
    const perdida = await api.resumenIngresos('2026-11');
    assert.equal(perdida.neto, null);
    assert.ok((perdida.perdida?.centavos ?? 0) > 0);
  });

  it('repetir la misma clave no duplica el gasto', async () => {
    const { api } = nuevo();
    const k = clave();
    const a = await api.cargarGasto(gasto(), null, k);
    const b = await api.cargarGasto(gasto(), null, k);
    assert.equal(a.id, b.id);
    assert.equal((await api.gastos({ mes: '2026-11' })).items.filter((x) => x.descripcion === 'Cartucho').length, 1);
  });

  it('se puede borrar un gasto (deshacer) y uno ajeno o inexistente es 404', async () => {
    const { api } = nuevo();
    const g = await api.cargarGasto(gasto(), null, clave());
    await api.borrarGasto(g.id);
    assert.ok(!(await api.gastos({ mes: '2026-11' })).items.some((x) => x.id === g.id));
    await assert.rejects(api.borrarGasto(g.id), { tipo: 'no_encontrado' });
  });

  it('valida: importe mayor a cero, al menos una casilla y trabajo para cobrárselo al cliente', async () => {
    const { api } = nuevo();
    await assert.rejects(api.cargarGasto(gasto({ monto: monto(0) }), null, clave()), { tipo: 'validacion' });
    await assert.rejects(api.cargarGasto(gasto({ registrarGasto: false }), null, clave()), { tipo: 'validacion' });
    await assert.rejects(api.cargarGasto(gasto({ cobrarAlCliente: true }), null, clave()), { tipo: 'validacion' });
    await assert.rejects(api.cargarGasto(gasto({ trabajoId: '00000000-0000-4000-8000-0000000000ff' }), null, clave()), { tipo: 'no_encontrado' });
  });

  it('«cobrárselo al cliente» crea un adicional pendiente solo con el trabajo en curso', async () => {
    const { api } = nuevo();
    // El trabajo agendado todavía no se puede.
    await assert.rejects(api.cargarGasto(gasto({ trabajoId: ID.t1, cobrarAlCliente: true }), null, clave()), { tipo: 'conflicto' });
    // La obra en curso: el adicional va a la etapa en curso.
    const g = await api.cargarGasto(gasto({ trabajoId: ID.t4, cobrarAlCliente: true }), null, clave());
    assert.ok(g.adicionalId);
    const d = await api.trabajo(ID.t4);
    const a = d.adicionales.find((x) => x.id === g.adicionalId);
    assert.equal(a?.estado, 'pendiente');
    assert.equal(d.totalVigente.centavos, 32_000_000, 'el pendiente no suma al precio');
  });

  it('solo cobrárselo al cliente no baja tu neto', async () => {
    const { api } = nuevo();
    const antes = await api.resumenIngresos('2026-11');
    await api.cargarGasto(gasto({ trabajoId: ID.t4, registrarGasto: false, cobrarAlCliente: true }), null, clave());
    assert.deepEqual((await api.resumenIngresos('2026-11')).neto, antes.neto);
  });

  it('la foto del ticket tiene que ser una imagen de hasta 5 MB', async () => {
    const { api } = nuevo();
    await assert.rejects(api.cargarGasto(gasto(), new Blob(['x'], { type: 'application/pdf' }), clave()), { status: 415 });
    const g = await api.cargarGasto(gasto(), new Blob(['x'], { type: 'image/jpeg' }), clave());
    assert.ok(g.ticket);
  });
});
