// Reglas del mock del lote 2.3 (Modo trabajo y cierre), con los esquemas Zod del contrato.
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { ChatResumenSchema } from '../../contracts/chat.ts';
import { ContactoProfesionalSchema, InvitacionObraSchema } from '../../contracts/equipo.ts';
import { AntesDespuesSchema, InformeTrabajoSchema, ModoTrabajoSchema } from '../../contracts/modo-trabajo.ts';
import { crearApiMockConEstado } from './adaptador.ts';
import { crearControles } from './controles.ts';
import { ID } from './fixtures.ts';
import { ID_MODO } from './modo-trabajo.ts';
import { ID_NUCLEO } from './nucleo.ts';

const nuevo = () => crearApiMockConEstado({ escenario: 'habilitado', latenciaMs: 0 });
let n = 0;
const clave = () => `00000000-0000-4000-8000-${(0x2300a0 + ++n).toString(16).padStart(12, '0')}`;
const valido = (esquema: { safeParse(x: unknown): { success: boolean; error?: unknown } }, x: unknown) => {
  const r = esquema.safeParse(x);
  assert.ok(r.success, JSON.stringify(r.error));
};

describe('Modo trabajo (mock)', () => {
  it('se abre recién con el trabajo en curso, y las tareas empiezan por la seguridad', async () => {
    const { api } = nuevo();
    await assert.rejects(api.modoTrabajo(ID_NUCLEO.canilla), { tipo: 'conflicto' });
    let t = (await api.trabajo(ID_NUCLEO.canilla)).trabajo;
    for (const hacia of ['en_camino'] as const) t = await api.avanzarTrabajo(t.id, hacia, t.version, clave());
    await api.marcarLlegada(t.id, 'sin_senal', t.version, clave());
    t = (await api.trabajo(t.id)).trabajo;
    t = await api.avanzarTrabajo(t.id, 'en_curso', t.version, clave());
    const m = await api.modoTrabajo(t.id);
    valido(ModoTrabajoSchema, m);
    assert.equal(m.estado, 'en_curso');
    assert.equal(m.tareas[0]?.seguridad, true);
    assert.equal(m.tareaActualId, m.tareas[0]?.id);
    assert.equal(m.tramos.length, 1);
  });

  it('pausa y sigue con tramos; marcar una tarea mueve la actual', async () => {
    const { api } = nuevo();
    let m = await api.modoTrabajo(ID_MODO.deposito);
    assert.equal(m.tramos.length, 2);
    m = await api.pausarModo(m.trabajoId, m.version);
    assert.equal(m.estado, 'en_pausa');
    assert.ok(m.tramos.every((x) => x.hasta !== null));
    await assert.rejects(api.pausarModo(m.trabajoId, m.version), { tipo: 'conflicto' });
    m = await api.reanudarModo(m.trabajoId, m.version);
    assert.equal(m.estado, 'en_curso');
    const actual = m.tareas.find((x) => x.id === m.tareaActualId)!;
    await api.cambiarTarea(m.trabajoId, actual.id, { estado: 'hecha', version: actual.version });
    m = await api.modoTrabajo(m.trabajoId);
    assert.notEqual(m.tareaActualId, actual.id);
    assert.equal(m.tareas.filter((x) => x.estado === 'en_curso').length, 1);
    // Versión vieja: 409.
    await assert.rejects(api.cambiarTarea(m.trabajoId, actual.id, { estado: 'pendiente', version: actual.version }), { tipo: 'conflicto' });
  });

  it('sumar tarea, foto y nota (con idempotencia)', async () => {
    const { api } = nuevo();
    const t = await api.crearTarea(ID_MODO.deposito, { texto: 'Limpiar la zona', seguridad: false, jornadaId: null, asignadaA: null, necesitaMaterial: false, conFoto: false });
    assert.equal(t.estado, 'pendiente');
    const k = clave();
    const a = await api.subirFotoTrabajo(ID_MODO.deposito, null, 'despues', k);
    const b = await api.subirFotoTrabajo(ID_MODO.deposito, null, 'despues', k);
    assert.equal(a.fotos.length, b.fotos.length);
    const conNota = await api.guardarNota(ID_MODO.deposito, 'Dejé la llave abierta', clave());
    assert.equal(conNota.notas.at(-1)?.texto, 'Dejé la llave abierta');
    await assert.rejects(api.guardarNota(ID_MODO.deposito, '   ', clave()), { tipo: 'validacion' });
  });

  it('antes y después: la última foto de cada momento y los cambios escritos', async () => {
    const { api } = nuevo();
    const ad = await api.antesDespues(ID_MODO.deposito);
    valido(AntesDespuesSchema, ad);
    assert.ok(ad.antes && ad.despues);
    assert.equal(ad.cambios.length, 2);
    const g = await api.guardarAntesDespues(ID_MODO.deposito, { antesFotoId: ad.antes.id, despuesFotoId: ad.despues.id, cambios: [...ad.cambios, { titulo: 'Llave de paso', detalle: null }], version: ad.version });
    assert.equal(g.cambios.length, 3);
    await assert.rejects(api.guardarAntesDespues(ID_MODO.deposito, { antesFotoId: ad.despues.id, despuesFotoId: null, cambios: [], version: g.version }), { tipo: 'validacion' });
  });
});

describe('informe, conformidad y garantía (mock)', () => {
  it('se completa solo con lo cargado y no se manda antes de terminar', async () => {
    const { api } = nuevo();
    const inf = await api.informeTrabajo(ID_MODO.deposito);
    valido(InformeTrabajoSchema, inf);
    const por = Object.fromEntries(inf.secciones.map((x) => [x.seccion, x.estado]));
    assert.deepEqual(por, { causa: 'lista', antes_despues: 'automatica', pruebas: 'falta', materiales_garantia: 'automatica', recomendaciones: 'falta' });
    assert.equal(inf.completas, 3);
    assert.equal(inf.garantia, null);
    await assert.rejects(api.enviarInforme(ID_MODO.deposito, { garantiaDias: null, recordatorioMantenimiento: null, version: inf.version }, clave()), { tipo: 'conflicto' });
  });

  it('al mandarlo empieza la garantía, se pide la conformidad y queda el PDF', async () => {
    const { api } = nuevo();
    let inf = await api.informeTrabajo(ID.t3);
    assert.equal(inf.conformidad.estado, 'sin_enviar');
    inf = await api.guardarSeccionInforme(ID.t3, 'recomendaciones', { texto: 'Revisar el tablero en un año', version: inf.version });
    await assert.rejects(api.guardarSeccionInforme(ID.t3, 'causa', { texto: 'x', version: inf.version - 1 }), { tipo: 'conflicto' });
    await assert.rejects(api.enviarInforme(ID.t3, { garantiaDias: 30, recordatorioMantenimiento: '2026-11-01', version: inf.version }, clave()), { tipo: 'validacion' });
    const k = clave();
    const env = await api.enviarInforme(ID.t3, { garantiaDias: 60, recordatorioMantenimiento: '2027-11-17', version: inf.version }, k);
    valido(InformeTrabajoSchema, env);
    assert.equal(env.conformidad.estado, 'esperando');
    assert.equal(env.garantia?.dias, 60);
    assert.equal(env.garantia?.hasta, '2027-01-16');
    assert.ok(env.pdf?.url.startsWith('data:application/pdf'));
    // Repetir con la misma clave devuelve lo mismo; otra clave, 409.
    assert.equal((await api.enviarInforme(ID.t3, { garantiaDias: 60, recordatorioMantenimiento: '2027-11-17', version: inf.version }, k)).enviadoEn, env.enviadoEn);
    await assert.rejects(api.enviarInforme(ID.t3, { garantiaDias: 60, recordatorioMantenimiento: null, version: env.version }, clave()), { tipo: 'conflicto' });
    await assert.rejects(api.guardarSeccionInforme(ID.t3, 'causa', { texto: 'otra', version: env.version }), { tipo: 'conflicto' });
  });

  it('el Panel de prueba hace de cliente: conformidad u observaciones', async () => {
    const { api, estado } = nuevo();
    const panel = crearControles(estado, () => undefined);
    assert.ok(panel.vista().acciones.some((a) => a.id === 'modo_conformidad'));
    panel.ejecutar('modo_observaciones');
    assert.equal((await api.informeTrabajo(ID.t2)).conformidad.estado, 'con_observaciones');
    panel.ejecutar('modo_conformidad');
    const inf = await api.informeTrabajo(ID.t2);
    assert.equal(inf.conformidad.estado, 'dada');
    assert.ok(inf.conformidad.en);
  });

  it('el estado del lote sobrevive al cambio de escenario del Panel', async () => {
    const { api, estado } = nuevo();
    const panel = crearControles(estado, () => undefined);
    panel.elegirEscenario('habilitado');
    assert.equal((await api.informeTrabajo(ID.t2)).conformidad.estado, 'esperando');
  });
});

describe('pedir ayuda (mock)', () => {
  it('contactos con estado (nunca su ubicación), chat, llamada e invitación sin duplicar', async () => {
    const { api } = nuevo();
    const cs = await api.contactosProfesionales();
    assert.equal(cs.length, 3);
    for (const c of cs) valido(ContactoProfesionalSchema, c);
    valido(ChatResumenSchema, await api.abrirChatContacto(ID_MODO.diego));
    assert.match((await api.llamadaContacto(ID_MODO.diego)).telefono, /^\+0+$/);
    const a = await api.sumarAyuda(ID_MODO.deposito, { contactoId: ID_MODO.diego, rubro: 'electricidad' });
    valido(InvitacionObraSchema, a);
    const b = await api.sumarAyuda(ID_MODO.deposito, { contactoId: ID_MODO.diego, rubro: 'electricidad' });
    assert.equal(a.id, b.id);
    await assert.rejects(api.sumarAyuda(ID.t3, { contactoId: ID_MODO.diego, rubro: 'electricidad' }), { tipo: 'conflicto' });
  });
});
