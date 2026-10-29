import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { crearApiMock } from './adaptador.ts';
import { perfilEnRevision } from './fixtures.ts';
import { filtrarElegibles } from './reglas.ts';
import { disponibilidadInicial, pedidosFixture, perfilHabilitado } from './fixtures.ts';

describe('mock de api-especialista', () => {
  it('con opt-in urgente apagado no ofrece urgencias; al prenderlo sí; al revocarlo deja de ofrecerlas', async () => {
    const api = crearApiMock({ latenciaMs: 0 });
    const tipos = async () => (await api.pedidosElegibles()).items.map((p) => p.tipo);
    assert.deepEqual(await tipos(), ['programado']);
    let d = await api.disponibilidad();
    d = await api.actualizarDisponibilidad({ urgentesAhora: true, programados: true, version: d.version });
    assert.ok(d.urgentesCambiadoEn);
    assert.deepEqual(await tipos(), ['urgente', 'programado']);
    await api.actualizarDisponibilidad({ urgentesAhora: false, programados: true, version: d.version });
    assert.deepEqual(await tipos(), ['programado']);
  });
  it('un rubro sin matrícula verificada no recibe pedidos', () => {
    const items = filtrarElegibles(pedidosFixture, perfilHabilitado, { ...disponibilidadInicial, urgentesAhora: true });
    assert.equal(items.some((p) => p.rubro === 'gas'), false);
  });
  it('sin alta habilitada no hay bandeja', () => {
    assert.deepEqual(filtrarElegibles(pedidosFixture, perfilEnRevision, { ...disponibilidadInicial, urgentesAhora: true }), []);
  });
  it('rechaza un cambio con versión vieja (conflicto)', async () => {
    const api = crearApiMock({ latenciaMs: 0 });
    await assert.rejects(api.actualizarDisponibilidad({ urgentesAhora: true, programados: true, version: 99 }), { tipo: 'conflicto' });
  });
  it('simula caída de red', async () => {
    await assert.rejects(crearApiMock({ latenciaMs: 0, falla: 'red' }).perfil(), { tipo: 'red' });
  });
  it('el fee de la demo llega con 0 bps para el especialista', async () => {
    const f = await crearApiMock({ latenciaMs: 0 }).feeVigente();
    assert.equal(f.politica?.bpsEspecialista, 0);
  });
});
