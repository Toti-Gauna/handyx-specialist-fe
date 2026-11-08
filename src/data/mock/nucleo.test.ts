// Reglas del mock del lote 1.3 (mapa de arreglos, tu día, demora y cobro informado), con sus esquemas Zod.
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { DiaSchema } from '../../contracts/agenda.ts';
import { monto } from '../../contracts/dinero.ts';
import { CobroSchema } from '../../contracts/ingresos.ts';
import { DestinoMapaSchema, MapaPedidosSchema, PedidoEntranteSchema } from '../../contracts/mapa.ts';
import { crearApiMockConEstado } from './adaptador.ts';
import { ID } from './fixtures.ts';
import { ID_NUCLEO } from './nucleo.ts';

const nuevo = () => crearApiMockConEstado({ escenario: 'habilitado', latenciaMs: 0 });
let n = 0;
const clave = () => `00000000-0000-4000-8000-${(0xabc000 + ++n).toString(16).padStart(12, '0')}`;
const desde = { punto: { lat: -38.006, lng: -57.572 }, precisionM: 20 };

describe('mapa de arreglos (mock)', () => {
  it('responde con los esquemas del contrato y sin dirección exacta', async () => {
    const { api } = nuevo();
    const destinos = await api.mapaDestinos();
    for (const d of destinos) assert.ok(DestinoMapaSchema.safeParse(d).success);
    assert.ok(destinos.some((d) => d.nombre === 'Batán'));
    const m = await api.mapaPedidos({ referencia: { tipo: 'mis_zonas' }, desde: null });
    assert.ok(MapaPedidosSchema.safeParse(m).success, JSON.stringify(MapaPedidosSchema.safeParse(m).error?.issues));
    // Sin desde dónde medir, no hay distancia; nada trae dirección ni teléfono.
    assert.ok(m.pedidos.every((p) => p.distanciaM === null));
    assert.ok(!JSON.stringify(m).includes('Calle De Prueba'));
    const detalle = await api.mapaPedido(m.pedidos[0]!.id);
    assert.ok(PedidoEntranteSchema.safeParse(detalle).success);
    assert.ok(!JSON.stringify(detalle).includes('Calle De Prueba'));
  });

  it('con Disponible apagado no ofrece urgentes; prendido, sí', async () => {
    const { api } = nuevo();
    let m = await api.mapaPedidos({ referencia: { tipo: 'mis_zonas' }, desde });
    assert.ok(m.pedidos.every((p) => p.tipo !== 'urgente'));
    const d = await api.disponibilidad();
    await api.actualizarDisponibilidad({ urgentesAhora: true, programados: true, version: d.version });
    m = await api.mapaPedidos({ referencia: { tipo: 'mis_zonas' }, desde });
    assert.ok(m.pedidos.some((p) => p.id === ID.pUrgente));
    // Distancias redondeadas a 100 m y ordenadas.
    const ds = m.pedidos.map((p) => p.distanciaM ?? -1);
    assert.ok(ds.every((x) => x > 0 && x % 100 === 0));
    assert.deepEqual(ds, [...ds].sort((a, b) => a - b));
  });

  it('«Me voy hasta Batán» trae el pedido de Batán aunque no sea de tus zonas', async () => {
    const { api } = nuevo();
    const tusZonas = await api.mapaPedidos({ referencia: { tipo: 'mis_zonas' }, desde });
    assert.ok(!tusZonas.pedidos.some((p) => p.id === ID_NUCLEO.pBatan));
    const batan = await api.mapaPedidos({ referencia: { tipo: 'destino', destinoId: 'Batán' }, desde });
    assert.equal(batan.referencia.nombre, 'Batán');
    assert.ok(batan.pedidos.some((p) => p.id === ID_NUCLEO.pBatan && p.ubicacion === 'en_destino'));
    await assert.rejects(api.mapaPedidos({ referencia: { tipo: 'destino', destinoId: 'Narnia' }, desde: null }), { tipo: 'no_encontrado' });
  });

  it('«Ahora no» lo saca del mapa sin ninguna otra consecuencia', async () => {
    const { api } = nuevo();
    const antes = await api.mapaPedidos({ referencia: { tipo: 'mis_zonas' }, desde: null });
    const id = antes.pedidos[0]!.id;
    await api.descartarPedido(id);
    const despues = await api.mapaPedidos({ referencia: { tipo: 'mis_zonas' }, desde: null });
    assert.ok(!despues.pedidos.some((p) => p.id === id));
    assert.equal(despues.pedidos.length, antes.pedidos.length - 1);
    // Descartar uno inexistente responde igual (no revela nada).
    await api.descartarPedido('00000000-0000-4000-8000-0000000fffff');
  });

  it('la propuesta guarda si incluye materiales y la garantía', async () => {
    const { api } = nuevo();
    const inicio = new Date(api.ahora().getTime() + 3 * 3600_000).toISOString();
    const p = await api.enviarPropuesta({ pedidoId: ID.pProgramado, monto: monto(4_700_000), alcance: 'Cambio del flexible', horario: { inicio, fin: null }, reemplazaA: null, incluyeMateriales: true, garantiaDias: 30 }, clave());
    assert.equal(p.incluyeMateriales, true);
    assert.equal(p.garantiaDias, 30);
  });
});

describe('tu día (mock)', () => {
  it('paradas de hoy en orden, la primera sin hacer es la próxima y nada promete al cliente', async () => {
    const { api } = nuevo();
    const d = await api.dia();
    assert.ok(DiaSchema.safeParse(d).success, JSON.stringify(DiaSchema.safeParse(d).error?.issues));
    assert.equal(d.paradas.length, 3);
    assert.deepEqual(d.paradas.map((p) => p.estado), ['hecha', 'proxima', 'pendiente']);
    assert.equal(d.paradas[1]!.turno.trabajoId, ID_NUCLEO.canilla);
    assert.equal(d.paradas[2]!.opcional, true);
    const r = await api.recorridoDia({ desde });
    assert.ok(r.paradas[1]!.tramo && r.paradas[1]!.tramo.distanciaM > 0);
  });

  it('reordenar exige la versión y todas las paradas; no cambia horarios', async () => {
    const { api } = nuevo();
    const d = await api.dia();
    const ids = d.paradas.map((p) => p.turno.id);
    const nuevo2 = [ids[0]!, ids[2]!, ids[1]!];
    const r = await api.ordenarDia({ turnos: nuevo2, version: d.version });
    assert.deepEqual(r.paradas.map((p) => p.turno.id), nuevo2);
    assert.equal(r.paradas[1]!.estado, 'proxima');
    assert.equal(r.paradas[2]!.turno.inicio, d.paradas[1]!.turno.inicio);
    await assert.rejects(api.ordenarDia({ turnos: nuevo2, version: d.version }), { tipo: 'conflicto' });
    await assert.rejects(api.ordenarDia({ turnos: [ids[0]!], version: r.version }), { tipo: 'validacion' });
  });

  it('avisar una demora deja una tarjeta en el chat y se repite igual con la misma clave', async () => {
    const { api } = nuevo();
    const k = clave();
    const m = await api.avisarDemora(ID_NUCLEO.canilla, { minutos: 15 }, k);
    assert.equal(m.tarjeta?.tipo, 'demora');
    const otra = await api.avisarDemora(ID_NUCLEO.canilla, { minutos: 15 }, k);
    assert.equal(otra.id, m.id);
    await assert.rejects(api.avisarDemora(ID_NUCLEO.canilla, { minutos: 20 } as unknown as { minutos: 15 }, clave()), { tipo: 'validacion' });
  });
});

describe('cobro informado (mock)', () => {
  it('no se informa antes de hacer el trabajo; después queda reportado, nunca verificado', async () => {
    const { api } = nuevo();
    const c = await api.cobro(ID_NUCLEO.canillaPago);
    assert.ok(CobroSchema.safeParse(c).success);
    assert.equal(c.estado, 'pendiente');
    await assert.rejects(api.informarCobro(ID_NUCLEO.canillaPago, { metodo: 'efectivo', monto: c.monto, version: c.version }, clave()), { tipo: 'conflicto' });
    const t = await api.trabajo(ID_NUCLEO.canilla);
    await api.marcarLlegada(ID_NUCLEO.canilla, 'sin_ubicacion', t.trabajo.version, clave()).catch(() => undefined);
    const t2 = await api.trabajo(ID_NUCLEO.canilla);
    if (t2.trabajo.estado === 'agendado') {
      const enCamino = await api.avanzarTrabajo(ID_NUCLEO.canilla, 'en_camino', t2.trabajo.version, clave());
      await api.marcarLlegada(ID_NUCLEO.canilla, 'sin_ubicacion', enCamino.version, clave());
    }
    await assert.rejects(api.informarCobro(ID_NUCLEO.canillaPago, { metodo: 'efectivo', monto: monto(9_000_000), version: 0 }, clave()), { tipo: 'validacion' });
    const r = await api.informarCobro(ID_NUCLEO.canillaPago, { metodo: 'transferencia', monto: monto(4_000_000), version: 0 }, clave());
    assert.equal(r.estado, 'reportado');
    assert.equal(r.metodo, 'transferencia');
    assert.equal(r.informado?.centavos, 4_000_000);
    assert.equal(r.fuenteConfirmacion, 'reporte_especialista');
  });
});
