// Mock de presupuestos y lista de precios (lote 2.2): las reglas del servidor que la interfaz da por hechas.
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { monto } from '../../contracts/dinero.ts';
import { ManoDeObraSchema, PrecioDetalleSchema, PrecioMaterialSchema, PresupuestoSchema, RevisionLecturaSchema } from '../../contracts/presupuestos.ts';
import { crearApiMockConEstado } from './adaptador.ts';
import { crearControles } from './controles.ts';
import { ID_PRESUPUESTOS as I, TRABAJO_PRESUPUESTO } from './presupuestos.ts';

const nuevo = () => crearApiMockConEstado({ escenario: 'habilitado', latenciaMs: 0 });
let n = 0;
const clave = () => `00000000-0000-4000-a000-${(++n).toString(16).padStart(12, '0')}`;
const pesos = (p: number) => monto(p * 100);

describe('presupuestos (lote 2.2)', () => {
  it('el borrador de Lucía suma mano de obra y materiales: $ 47.000', async () => {
    const { api } = nuevo();
    const p = await api.presupuesto(I.v2);
    assert.ok(PresupuestoSchema.safeParse(p).success);
    assert.equal(p.estado, 'borrador');
    assert.equal(p.numeroVersion, 2);
    assert.equal(p.trabajoId, TRABAJO_PRESUPUESTO);
    assert.deepEqual(p.totales, { manoDeObra: pesos(34_000), materiales: pesos(13_000), total: pesos(47_000) });
    const abiertos = await api.presupuestos('abiertos');
    assert.ok(abiertos.items.every((x) => PresupuestoSchema.safeParse(x).success));
  });

  it('agregar suma cantidad del mismo material; lo que no se cobra no suma al cliente', async () => {
    const { api } = nuevo();
    let p = await api.presupuesto(I.v2);
    const base = { nombre: null, unidad: null, precioUnitario: null, modoPrecio: 'actualiza' as const, cobrarAlCliente: true, registrarGasto: true };
    p = await api.agregarMateriales(p.id, { materiales: [{ ...base, precioId: I.cartucho, cantidad: 1 }], version: p.version });
    assert.equal(p.materiales.find((m) => m.precioId === I.cartucho)?.cantidad, 2);
    assert.equal(p.totales.total.centavos, pesos(56_800).centavos);
    p = await api.agregarMateriales(p.id, { materiales: [{ ...base, precioId: I.teflon, cantidad: 1, cobrarAlCliente: false }], version: p.version });
    assert.equal(p.totales.total.centavos, pesos(56_800).centavos, 'el teflón es gasto tuyo, no del cliente');
    await assert.rejects(api.agregarMateriales(p.id, { materiales: [{ ...base, precioId: I.teflon, cantidad: 1 }], version: p.version - 1 }), { tipo: 'conflicto' });
  });

  it('mandarlo deja un mensaje en el chat y reemplaza la versión anterior; ya no se edita', async () => {
    const { api } = nuevo();
    const p = await api.presupuesto(I.v2);
    const k = clave();
    const e = await api.enviarPresupuesto(p.id, { vigenteHasta: null, version: p.version }, k);
    assert.equal(e.estado, 'enviado');
    assert.ok(e.mensajeId);
    const otra = await api.enviarPresupuesto(p.id, { vigenteHasta: null, version: p.version }, k);
    assert.equal(otra.id, e.id, 'misma clave, mismo resultado');
    assert.equal((await api.presupuesto(I.v1)).estado, 'reemplazado');
    const t = await api.trabajo(TRABAJO_PRESUPUESTO);
    const msgs = await api.mensajes(t.trabajo.conversacionId);
    assert.match(msgs.at(-1)?.texto ?? '', /versión 2 .* \$ 47\.000/);
    await assert.rejects(api.quitarMaterial(e.id, e.materiales[0]!.id), { tipo: 'conflicto' });
  });

  it('si la lista cambia, el enviado avisa y la versión nueva toma el precio de hoy', async () => {
    const m = nuevo();
    const { api } = m;
    const panel = crearControles(m.estado, () => undefined);
    let p = await api.presupuesto(I.v2);
    p = await api.enviarPresupuesto(p.id, { vigenteHasta: null, version: p.version }, clave());
    panel.ejecutar('lista_sube');
    p = await api.presupuesto(p.id);
    assert.equal(p.actualizacionPendiente, true);
    const item = p.materiales.find((x) => x.precioId === I.cartucho)!;
    assert.equal(item.precioUnitario.centavos, pesos(9_800).centavos, 'el enviado no cambia solo');
    assert.equal(item.precioNuevo?.centavos, pesos(10_800).centavos);
    const v3 = await api.versionNuevaPresupuesto(p.id, { version: p.version }, clave());
    assert.equal(v3.numeroVersion, 3);
    assert.equal(v3.estado, 'borrador');
    assert.equal(v3.materiales.find((x) => x.precioId === I.cartucho)?.precioUnitario.centavos, pesos(10_800).centavos);
    assert.equal(v3.materiales.find((x) => x.precioId === I.flexible)?.precioUnitario.centavos, pesos(1_600).centavos, 'el fijo queda congelado');
  });

  it('el cliente acepta desde el panel y el total del trabajo pasa a ser el del presupuesto', async () => {
    const m = nuevo();
    const { api } = m;
    const panel = crearControles(m.estado, () => undefined);
    let p = await api.presupuesto(I.v2);
    p = await api.quitarManoObra(p.id, p.manoDeObra[1]!.id);
    p = await api.enviarPresupuesto(p.id, { vigenteHasta: null, version: p.version }, clave());
    panel.ejecutar('presupuesto_acepta');
    assert.equal((await api.presupuesto(p.id)).estado, 'aceptado');
    assert.equal((await api.trabajo(TRABAJO_PRESUPUESTO)).trabajo.acuerdo.monto.centavos, pesos(41_000).centavos);
  });

  it('presupuesto nuevo atado a un solo trabajo; nunca a uno que no existe', async () => {
    const { api } = nuevo();
    const p = await api.crearPresupuesto({ pedidoId: null, trabajoId: TRABAJO_PRESUPUESTO, obraId: null, titulo: 'Otro arreglo', plantillaId: null }, clave());
    assert.equal(p.numeroVersion, 1);
    await assert.rejects(api.crearPresupuesto({ pedidoId: null, trabajoId: '00000000-0000-4000-8000-0000000fffff', obraId: null, titulo: 'X', plantillaId: null }, clave()), { tipo: 'no_encontrado' });
    await assert.rejects(api.crearPresupuesto({ pedidoId: null, trabajoId: null, obraId: null, titulo: 'X', plantillaId: null }, clave()), { tipo: 'validacion' });
  });
});

describe('lista de precios (lote 2.2)', () => {
  it('marca lo viejo y busca sin tildes', async () => {
    const { api } = nuevo();
    const l = await api.precios();
    l.items.forEach((p) => assert.ok(PrecioMaterialSchema.safeParse(p).success));
    assert.equal(l.items.find((p) => p.id === I.sellador)?.viejo, true);
    assert.equal(l.items.find((p) => p.id === I.cartucho)?.viejo, false);
    assert.deepEqual((await api.precios({ q: 'TEFLON' })).items.map((p) => p.id), [I.teflon]);
    assert.ok((await api.precios({ viejos: true })).items.every((p) => p.viejo));
  });

  it('un material nuevo propone su nombre al catálogo, nunca el precio', async () => {
    const m = nuevo();
    const { api } = m;
    const p = await api.crearPrecio({ catalogoId: null, nombre: 'Termofusión codo 25 mm', categoria: 'plomeria', unidad: 'unidad', costo: pesos(1_450), precioCliente: null, proveedor: null, modoPrecio: 'fijo', sumarAlCatalogo: true }, clave());
    assert.equal(p.fuente, 'material_nuevo');
    assert.equal(p.precioCliente.centavos, p.costo.centavos);
    // El catálogo es de nombres: nada de lo que devuelve trae precio, y lo propuesto no aparece hasta que lo revise Operations.
    const cat = await api.buscarCatalogo('termofusion');
    assert.ok(cat.every((c) => !('costo' in c) && !('precio' in c)));
    assert.ok(!cat.some((c) => c.nombre === 'Termofusión codo 25 mm'));
    await assert.rejects(api.buscarCatalogo('t'), { tipo: 'validacion' });
    await assert.rejects(api.crearPrecio({ catalogoId: null, nombre: 'teflon 12 mm', categoria: 'plomeria', unidad: 'unidad', costo: pesos(1), precioCliente: null, proveedor: null, modoPrecio: 'fijo', sumarAlCatalogo: false }, clave()), { tipo: 'conflicto' });
  });

  it('el detalle trae el historial y cambiar el costo lo suma', async () => {
    const { api } = nuevo();
    const d = await api.precio(I.cartucho);
    assert.ok(PrecioDetalleSchema.safeParse(d).success);
    assert.equal(d.historial.length, 4);
    await api.cambiarPrecio(I.cartucho, { costo: pesos(10_000), version: d.version });
    const d2 = await api.precio(I.cartucho);
    assert.equal(d2.historial.at(-1)?.costo.centavos, pesos(10_000).centavos);
    await assert.rejects(api.cambiarPrecio(I.cartucho, { costo: pesos(1), version: d.version }), { tipo: 'conflicto' });
  });

  it('revisar lo leído no guarda; guardar crea, actualiza y confirma', async () => {
    const { api } = nuevo();
    const lectura = {
      proveedor: 'Corralón Simulación',
      fecha: '2026-11-17',
      filas: [
        { nombre: 'Cartucho cerámico 35 mm', unidad: 'unidad' as const, costo: pesos(10_600), precioId: null },
        { nombre: 'Flexible 40 cm', unidad: 'unidad' as const, costo: pesos(1_600), precioId: null },
        { nombre: 'Termofusión 20 mm (tira)', unidad: 'unidad' as const, costo: pesos(5_900), precioId: null },
        { nombre: 'Codo 20 mm', unidad: 'unidad' as const, costo: pesos(9_500), precioId: null },
      ],
    };
    const r = await api.revisarLectura(lectura);
    assert.ok(RevisionLecturaSchema.safeParse(r).success);
    assert.deepEqual(r.filas.map((f) => f.resultado), ['sube', 'igual', 'nuevo', 'revisar']);
    assert.equal(r.filas[0]?.variacionBps, 816);
    assert.equal((await api.precio(I.cartucho)).costo.centavos, pesos(9_800).centavos, 'revisar no guarda');
    const g = await api.guardarLectura({ ...lectura, filas: lectura.filas.slice(0, 3) }, clave());
    assert.deepEqual(g, { creados: 1, actualizados: 1, sinCambios: 1 });
    assert.equal((await api.precio(I.cartucho)).costo.centavos, pesos(10_600).centavos);
  });

  it('mano de obra: tarifas base con versión y tareas', async () => {
    const { api } = nuevo();
    const m = await api.manoDeObra();
    assert.ok(ManoDeObraSchema.safeParse(m).success);
    const g = await api.guardarTarifasBase({ hora: pesos(25_000), visita: m.visita, urgenciaBps: 2_000, version: m.version });
    assert.equal(g.hora?.centavos, pesos(25_000).centavos);
    await assert.rejects(api.guardarTarifasBase({ hora: null, visita: null, urgenciaBps: null, version: m.version }), { tipo: 'conflicto' });
    const t = await api.crearTarifaTarea({ rubro: 'plomeria', nombre: 'Cambio de sifón', detalle: null, monto: pesos(12_000) });
    const c = await api.cambiarTarifaTarea(t.id, { monto: pesos(13_000), version: t.version });
    assert.equal(c.monto.centavos, pesos(13_000).centavos);
    await api.quitarTarifaTarea(t.id);
    assert.ok(!(await api.manoDeObra()).tareas.some((x) => x.id === t.id));
  });
});
