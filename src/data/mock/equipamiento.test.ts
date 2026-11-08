// Reglas del mock del equipamiento (lote 2.4): esquemas del contrato, alertas, préstamo, mover, «Ya no la tengo»,
// versión, lista de compras, código de barras y adjuntos del trabajo.
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { ItemCompraSchema, ItemEquipoDetalleSchema, ItemEquipoSchema, ResumenEquipamientoSchema } from '../../contracts/equipamiento.ts';
import { AdjuntoTrabajoSchema } from '../../contracts/modo-trabajo.ts';
import { crearApiMockConEstado } from './adaptador.ts';
import { ID_EQUIPO } from './equipamiento.ts';

const nuevo = () => crearApiMockConEstado({ escenario: 'habilitado', latenciaMs: 0 });
let n = 0;
const clave = () => `00000000-0000-4000-8000-${(0x24c000 + ++n).toString(16).padStart(12, '0')}`;
const rechaza = async (p: Promise<unknown>, status: number) => {
  await assert.rejects(p, (e: { status?: number }) => e.status === status);
};

describe('equipamiento (mock)', () => {
  it('resume por categoría con la alerta más importante y responde con el contrato', async () => {
    const { api } = nuevo();
    const r = await api.equipamiento();
    assert.ok(ResumenEquipamientoSchema.safeParse(r).success);
    const cat = Object.fromEntries(r.categorias.map((c) => [c.categoria, c]));
    assert.equal(cat.electricas?.cantidad, 8);
    assert.equal(cat.seguridad?.alerta, 'Matafuego vence 12/12');
    assert.equal(cat.consumibles?.alerta, '3 quedan pocos');
    assert.equal(cat.medicion?.alerta, '1 por calibrar');
    assert.equal(r.prestados, 1);
    assert.equal(r.listaCompras, 3);
    const p = await api.equipamientoItems({ categoria: 'electricas' });
    for (const i of p.items) assert.ok(ItemEquipoSchema.safeParse(i).success, JSON.stringify(ItemEquipoSchema.safeParse(i).error?.issues));
    const amoladora = p.items.find((i) => i.id === ID_EQUIPO.amoladora);
    assert.deepEqual(amoladora?.alertas.map((a) => a.texto), ['Cambiar escobillas']);
    const termo = p.items.find((i) => i.id === ID_EQUIPO.termofusora);
    assert.equal(termo?.alertas[0]?.texto, 'Vuelve el 20/11');
  });

  it('filtra por ubicación, prestados y búsqueda', async () => {
    const { api } = nuevo();
    assert.ok((await api.equipamientoItems({ ubicacion: 'taller' })).items.every((i) => i.ubicacion === 'taller' && !i.prestamo));
    assert.deepEqual((await api.equipamientoItems({ prestados: true })).items.map((i) => i.id), [ID_EQUIPO.termofusora]);
    assert.deepEqual((await api.equipamientoItems({ q: 'amolad' })).items.map((i) => i.nombre), ['Amoladora 115 mm']);
  });

  it('presta, devuelve y mueve con la versión; prestada no se mueve', async () => {
    const { api } = nuevo();
    let d = await api.equipamientoItem(ID_EQUIPO.taladro);
    assert.ok(ItemEquipoDetalleSchema.safeParse(d).success);
    d = await api.prestarEquipamiento(d.id, { profesionalId: null, aNombre: 'Diego Herrera', vuelveEl: '2026-11-24', version: d.version });
    assert.equal(d.prestamo?.aNombre, 'Diego Herrera');
    assert.match(d.historial[0]!.texto, /Prestada a Diego Herrera · vuelve el 24\/11/);
    await rechaza(api.moverEquipamiento(d.id, { ubicacion: 'taller', version: d.version }), 409);
    // Con una versión vieja: 409 (otra pantalla la cambió).
    await rechaza(api.devolverEquipamiento(d.id, d.version - 1), 409);
    d = await api.devolverEquipamiento(d.id, d.version);
    assert.equal(d.prestamo, null);
    d = await api.moverEquipamiento(d.id, { ubicacion: 'taller', version: d.version });
    assert.equal(d.ubicacion, 'taller');
    assert.equal(d.historial[0]!.texto, 'La moviste al taller');
  });

  it('«Ya no la tengo» la saca, deja el historial y la suma a la lista de compras', async () => {
    const { api } = nuevo();
    const d = await api.equipamientoItem(ID_EQUIPO.amoladora);
    const r = await api.bajaEquipamiento(d.id, { motivo: 'se_rompio', detalle: null, reponer: 'lista_compras', version: d.version });
    assert.equal(r.item.historial[0]!.tipo, 'baja');
    assert.ok(r.item.historial.some((e) => e.texto.includes('Baño completo')), 'el historial de trabajos queda');
    assert.ok(r.listaComprasId);
    assert.equal(r.pedidoFerreteriaId, null);
    await rechaza(api.equipamientoItem(d.id), 404);
    const lista = await api.listaCompras();
    assert.ok(lista.some((c) => c.equipoId === d.id && ItemCompraSchema.safeParse(c).success));
    assert.equal((await api.equipamiento()).categorias.find((c) => c.categoria === 'electricas')?.cantidad, 7);
    // Prestada, primero tiene que volver.
    const t = await api.equipamientoItem(ID_EQUIPO.termofusora);
    await rechaza(api.bajaEquipamiento(t.id, { motivo: 'la_perdi', detalle: null, reponer: 'no_reponer', version: t.version }), 409);
  });

  it('agrega con foto y es idempotente; rechaza lo que no es imagen', async () => {
    const { api } = nuevo();
    const datos = { nombre: 'Amoladora angular 115 mm', categoria: 'electricas' as const, marcaModelo: null, codigoBarras: '7790000000017', ubicacion: 'camioneta' as const, compradaEn: null, garantiaHasta: null, venceEn: null, cantidad: null, unidad: null, minimo: null, mantenimiento: { descripcion: 'Escobillas', cadaDias: 180 } };
    const k = clave();
    const foto = new Blob([new Uint8Array([1, 2, 3])], { type: 'image/jpeg' });
    const a = await api.agregarEquipamiento(datos, foto, k);
    const b = await api.agregarEquipamiento(datos, foto, k);
    assert.equal(a.id, b.id);
    assert.ok(a.foto);
    assert.equal(a.mantenimientos[0]?.proximoEl, '2027-05-16');
    await rechaza(api.agregarEquipamiento(datos, new Blob(['x'], { type: 'text/plain' }), clave()), 415);
    await rechaza(api.agregarEquipamiento({ ...datos, nombre: '' }, null, clave()), 400);
  });

  it('sugiere el nombre de un código sin precio y marca el mantenimiento hecho', async () => {
    const { api } = nuevo();
    const s = await api.sugerenciaCodigo('7790000000017');
    assert.deepEqual(s, { codigoBarras: '7790000000017', nombre: 'Amoladora angular 115 mm', categoria: 'electricas' });
    assert.equal((await api.sugerenciaCodigo('1234567890128')).nombre, null);
    let d = await api.equipamientoItem(ID_EQUIPO.amoladora);
    const m = d.mantenimientos[0]!;
    d = await api.mantenimientoHecho(d.id, m.id, d.version);
    assert.equal(d.mantenimientos[0]!.ultimoEl, '2026-11-17');
    assert.equal(d.alertas.length, 0);
  });

  it('guarda un modelo 3D en un trabajo propio; ajeno es 404', async () => {
    const { api, estado } = nuevo();
    const t = estado.trabajos[0]!.trabajo.id;
    const glb = new Blob([new Uint8Array(64)], { type: 'model/gltf-binary' });
    const a = await api.guardarAdjuntoTrabajo(t, { tipo: 'modelo_3d', nombre: 'Termotanque · 85 × 45 cm' }, glb, clave());
    assert.ok(AdjuntoTrabajoSchema.safeParse(a).success);
    assert.equal((await api.adjuntosTrabajo(t)).length, 1);
    await rechaza(api.guardarAdjuntoTrabajo(t, { tipo: 'modelo_3d', nombre: 'x' }, new Blob(['x'], { type: 'application/pdf' }), clave()), 415);
    await rechaza(api.adjuntosTrabajo('00000000-0000-4000-8000-00000000ffff'), 404);
  });
});
