// Reglas del registro por pasos en el mock (lote 1.2): las mismas que tiene que aplicar el servidor.
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { FalloApi } from '../errores.ts';
import { crearApiMockConEstado } from './adaptador.ts';
import { crearControles } from './controles.ts';
import { CODIGO_PRUEBA } from './estado.ts';

const nuevo = (escenario: 'nuevo' | 'incompleto' | 'en_revision' | 'habilitado' = 'nuevo') => crearApiMockConEstado({ escenario, latenciaMs: 0 });
const falla = async (p: Promise<unknown>, status: number) => {
  await assert.rejects(p, (e) => e instanceof FalloApi && e.status === status);
};
const CUENTA = { nombre: 'Julián', apellido: 'Ortiz', telefono: '+5492235554521', email: 'julian@example.test', password: 'una-clave-larga-123', terminos: 't', privacidad: 'p' };

async function hastaRevision() {
  const m = nuevo();
  const { api } = m;
  await api.crearCuenta(CUENTA);
  await api.verificarEmail({ codigo: CODIGO_PRUEBA });
  let r = await api.registro();
  assert.equal(r.pasoActual, 'domicilio', 'los datos ya vienen de la cuenta');
  r = await api.guardarDomicilio({ calle: 'Calle De Prueba', numero: '123', pisoDepto: null, barrioId: 'La Perla', barrio: 'La Perla', ciudad: 'Mar del Plata', punto: null, version: r.version });
  r = await api.guardarRubrosRegistro({ rubros: ['plomeria', 'gas'], version: r.version });
  r = await api.guardarZonas({ barrios: ['Centro', 'La Perla'], version: r.version });
  r = await api.cargarSelfie(null, r.version);
  r = await api.cargarDni({ frente: null, dorso: null, numero: '30111222', version: r.version });
  r = await api.guardarCuit({ cuitCuil: '20123456786', facturacion: 'monotributo', version: r.version });
  return { ...m, r };
}

describe('registro por pasos (mock)', () => {
  it('crea la cuenta con respuesta neutra y retoma en el primer paso sin completar', async () => {
    const { api } = nuevo();
    await api.crearCuenta(CUENTA);
    await falla(api.registro(), 403); // falta verificar el email
    await api.verificarEmail({ codigo: CODIGO_PRUEBA });
    const r = await api.registro();
    assert.equal(r.datos.nombre, 'Julián');
    assert.equal(r.datos.telefonoEnmascarado, '223 •••-4521');
    assert.equal(r.pasoActual, 'domicilio');
  });

  it('nunca devuelve el domicilio ni los números completos', async () => {
    const { r } = await hastaRevision();
    assert.deepEqual(r.domicilio, { cargado: true, barrio: 'La Perla' });
    assert.equal(r.dni.ultimos, '222');
    assert.equal(r.cuitCuil.ultimos, '6786');
    assert.ok(!JSON.stringify(r).includes('Calle De Prueba'));
    assert.ok(!JSON.stringify(r).includes('30111222'));
  });

  it('Gas pide matrícula: sin ella no se manda el alta; los antecedentes no frenan el envío', async () => {
    const { api, r } = await hastaRevision();
    assert.equal(r.pasoActual, 'certificados');
    assert.ok(r.faltantesEnvio.includes('matricula'));
    await falla(api.enviarRegistro({ terminosEspecialista: 't', privacidadEspecialista: 'p', version: r.version }), 400);
    await api.cargarCertificado({ tipo: 'matricula', rubro: 'gas', nombre: 'Matrícula de gasista' }, { archivo: null, formato: 'pdf' });
    const r2 = await api.registro();
    assert.equal(r2.pasoActual, 'revision');
    assert.deepEqual(r2.faltantesEnvio, []);
    assert.ok(r2.faltantesHabilitacion.includes('antecedentes'));
    const enviado = await api.enviarRegistro({ terminosEspecialista: 't', privacidadEspecialista: 'p', version: r2.version });
    assert.equal(enviado.estadoAlta, 'enviada');
    // Enviada: no se edita, pero los antecedentes se pueden cargar después.
    await falla(api.guardarZonas({ barrios: ['Centro'], version: enviado.version }), 409);
    const conAnt = await api.cargarAntecedentes({ archivo: null, formato: 'foto' });
    assert.equal(conAnt.antecedentes.estado, 'cargado');
  });

  it('un cambio con una versión vieja es 409', async () => {
    const { api, r } = await hastaRevision();
    await falla(api.guardarZonas({ barrios: ['Centro'], version: r.version - 1 }), 409);
  });

  it('Operations: cargado no habilita; verificar borra el archivo de antecedentes; habilitar muestra la bienvenida', async () => {
    const { api, estado } = await hastaRevision();
    const ops = crearControles(estado, () => undefined);
    await api.cargarCertificado({ tipo: 'matricula', rubro: 'gas', nombre: 'Matrícula de gasista' }, { archivo: null, formato: 'pdf' });
    await api.cargarAntecedentes({ archivo: null, formato: 'pdf' });
    const r = await api.registro();
    await api.enviarRegistro({ terminosEspecialista: 't', privacidadEspecialista: 'p', version: r.version });
    ops.ejecutar('ops_revision');
    ops.ejecutar('ops_habilitar');
    assert.match(ops.vista().nota ?? '', /No se puede habilitar/);
    ops.ejecutar('ops_verificar');
    const v = await api.registro();
    assert.equal(v.antecedentes.estado, 'verificado');
    assert.equal(v.antecedentes.archivoBorrado, true);
    ops.ejecutar('ops_habilitar');
    assert.equal((await api.registro()).estadoAlta, 'habilitada');
    const o = await api.onboarding();
    assert.equal(o.bienvenidaVista, false);
    assert.deepEqual(o.rubrosHabilitados, ['plomeria', 'gas']);
    const o2 = await api.marcarOnboarding({ bienvenidaVista: true, version: o.version });
    assert.equal(o2.bienvenidaVista, true);
  });

  it('una corrección pedida vuelve el alta editable y marca el paso con su motivo', async () => {
    const { api, estado } = nuevo('en_revision');
    const ops = crearControles(estado, () => undefined);
    ops.ejecutar('ops_correccion');
    const r = await api.registro();
    assert.equal(r.estadoAlta, 'requiere_correccion');
    assert.equal(r.pasoActual, 'selfie');
    assert.match(r.pasos.find((p) => p.paso === 'selfie')?.motivo ?? '', /selfie/);
    const r2 = await api.cargarSelfie(null, r.version);
    assert.equal(r2.pasos.find((p) => p.paso === 'selfie')?.estado, 'completo');
  });

  it('el escenario incompleto retoma en las zonas', async () => {
    const { api } = nuevo('incompleto');
    assert.equal((await api.registro()).pasoActual, 'zonas');
  });
});
