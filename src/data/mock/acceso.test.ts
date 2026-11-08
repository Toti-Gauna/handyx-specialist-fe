// Reglas del acceso del contrato 0.11.0 que emula el mock (lote 1.1): email o teléfono, código por email o SMS,
// segunda verificación al entrar, "Recordar este teléfono" y respuestas neutras.
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { ResultadoIngresoSchema, CodigoEnviadoSchema } from '../../contracts/seguridad.ts';
import { SesionSchema } from '../../contracts/dto.ts';
import { CODIGOS_RESPALDO_PRUEBA, CUENTA_SEGUNDA_VERIFICACION_PRUEBA, normalizarTelefono } from './acceso.ts';
import { crearApiMockConEstado } from './adaptador.ts';
import { CODIGO_PRUEBA, CREDENCIALES_PRUEBA, TOKEN_RECUPERACION_PRUEBA } from './estado.ts';

const nuevo = () => crearApiMockConEstado({ escenario: 'nuevo', latenciaMs: 0 });
const clave = CREDENCIALES_PRUEBA.password;

describe('acceso 0.11 · ingreso con contraseña', () => {
  it('entra con el email y abre la sesión', async () => {
    const { api } = nuevo();
    const r = ResultadoIngresoSchema.parse(await api.ingresarConClave({ identificador: CREDENCIALES_PRUEBA.email, password: clave, recordarDispositivo: false }));
    assert.equal(r.estado, 'sesion');
    assert.ok(await api.sesion());
  });

  it('entra con el teléfono escrito de cualquier forma', async () => {
    const { api } = nuevo();
    for (const tel of ['223 555-4521', '+54 9 223 555 4521', '0223 5554521']) {
      const r = await api.ingresarConClave({ identificador: tel, password: clave, recordarDispositivo: false });
      assert.equal(r.estado, 'sesion', tel);
    }
  });

  it('el error no dice si la cuenta existe', async () => {
    const { api } = nuevo();
    const a = await api.ingresarConClave({ identificador: 'nadie@example.test', password: clave, recordarDispositivo: false }).catch((e: unknown) => e);
    const b = await api.ingresarConClave({ identificador: CREDENCIALES_PRUEBA.email, password: 'otra-clave-mal', recordarDispositivo: false }).catch((e: unknown) => e);
    assert.deepEqual([(a as { tipo: string }).tipo, (b as { tipo: string }).tipo], ['sesion', 'sesion']);
    assert.equal((a as Error).message, (b as Error).message);
  });

  it('con la segunda verificación activa no abre la sesión: devuelve el paso 2', async () => {
    const { api } = nuevo();
    const r = await api.ingresarConClave({ identificador: CUENTA_SEGUNDA_VERIFICACION_PRUEBA, password: clave, recordarDispositivo: false });
    assert.equal(r.estado, 'segunda_verificacion');
    assert.equal(await api.sesion(), null);
  });
});

describe('acceso 0.11 · segunda verificación', () => {
  async function paso2(api: ReturnType<typeof nuevo>['api']) {
    const r = await api.ingresarConClave({ identificador: CUENTA_SEGUNDA_VERIFICACION_PRUEBA, password: clave, recordarDispositivo: false });
    if (r.estado !== 'segunda_verificacion') throw new Error('se esperaba el paso 2');
    return r.desafio;
  }

  it('el código de la app abre la sesión', async () => {
    const { api } = nuevo();
    const d = await paso2(api);
    assert.deepEqual(d.metodos, ['totp', 'sms', 'email', 'respaldo']);
    SesionSchema.parse(await api.resolverSegundaVerificacion({ desafio: d.desafio, metodo: 'totp', codigo: CODIGO_PRUEBA, recordarDispositivo: false }));
  });

  it('un código equivocado descuenta intentos y al quinto obliga a volver a entrar', async () => {
    const { api } = nuevo();
    const d = await paso2(api);
    for (let i = 0; i < 4; i++) await assert.rejects(api.resolverSegundaVerificacion({ desafio: d.desafio, metodo: 'totp', codigo: '000000', recordarDispositivo: false }), { tipo: 'validacion' });
    await assert.rejects(api.resolverSegundaVerificacion({ desafio: d.desafio, metodo: 'totp', codigo: '000000', recordarDispositivo: false }), { tipo: 'limite' });
    await assert.rejects(api.resolverSegundaVerificacion({ desafio: d.desafio, metodo: 'totp', codigo: CODIGO_PRUEBA, recordarDispositivo: false }), { tipo: 'limite' });
  });

  it('el SMS solo vale después de pedirlo', async () => {
    const { api } = nuevo();
    const d = await paso2(api);
    await assert.rejects(api.resolverSegundaVerificacion({ desafio: d.desafio, metodo: 'sms', codigo: CODIGO_PRUEBA, recordarDispositivo: false }), { tipo: 'validacion' });
    const env = CodigoEnviadoSchema.parse(await api.enviarCodigoSegundaVerificacion({ desafio: d.desafio, canal: 'sms' }));
    assert.match(env.destinoEnmascarado, /termina en \d{4}$/);
    await api.resolverSegundaVerificacion({ desafio: d.desafio, metodo: 'sms', codigo: CODIGO_PRUEBA, recordarDispositivo: false });
  });

  it('un código de respaldo sirve una sola vez (con o sin guion)', async () => {
    const { api } = nuevo();
    const codigo = CODIGOS_RESPALDO_PRUEBA[0];
    await api.resolverSegundaVerificacion({ desafio: (await paso2(api)).desafio, metodo: 'respaldo', codigo: codigo.replace('-', ''), recordarDispositivo: false });
    await assert.rejects(api.resolverSegundaVerificacion({ desafio: (await paso2(api)).desafio, metodo: 'respaldo', codigo, recordarDispositivo: false }), { tipo: 'validacion' });
  });

  it('"Recordar este teléfono" no la vuelve a pedir', async () => {
    const { api } = nuevo();
    await api.resolverSegundaVerificacion({ desafio: (await paso2(api)).desafio, metodo: 'totp', codigo: CODIGO_PRUEBA, recordarDispositivo: true });
    const r = await api.ingresarConClave({ identificador: CUENTA_SEGUNDA_VERIFICACION_PRUEBA, password: clave, recordarDispositivo: false });
    assert.equal(r.estado, 'sesion');
  });
});

describe('acceso 0.11 · entrar con un código', () => {
  it('respuesta neutra: igual para una cuenta que no existe, y el destino sale de lo escrito', async () => {
    const { api } = nuevo();
    const a = await api.pedirCodigoIngreso({ identificador: 'nadie@example.test', canal: 'email' });
    const b = await api.pedirCodigoIngreso({ identificador: CREDENCIALES_PRUEBA.email, canal: 'email' });
    assert.equal(a.destinoEnmascarado, 'na•••@example.test');
    assert.equal(b.destinoEnmascarado, 'es•••@example.test');
    const c = await api.pedirCodigoIngreso({ identificador: CREDENCIALES_PRUEBA.email, canal: 'sms' });
    assert.equal(c.destinoEnmascarado, 'el teléfono de tu cuenta');
    // Con una cuenta que no existe, el código "correcto" falla igual que uno equivocado.
    await assert.rejects(api.ingresarConCodigo({ solicitud: a.solicitud, codigo: CODIGO_PRUEBA, recordarDispositivo: false }), { tipo: 'validacion' });
  });

  it('el código abre la sesión, y con la segunda verificación pide el paso 2', async () => {
    const { api } = nuevo();
    const a = await api.pedirCodigoIngreso({ identificador: '2235554521', canal: 'sms' });
    assert.equal(a.destinoEnmascarado, 'el teléfono que termina en 4521');
    assert.equal((await api.ingresarConCodigo({ solicitud: a.solicitud, codigo: CODIGO_PRUEBA, recordarDispositivo: false })).estado, 'sesion');
    const b = await api.pedirCodigoIngreso({ identificador: CUENTA_SEGUNDA_VERIFICACION_PRUEBA, canal: 'email' });
    assert.equal((await api.ingresarConCodigo({ solicitud: b.solicitud, codigo: CODIGO_PRUEBA, recordarDispositivo: false })).estado, 'segunda_verificacion');
  });

  it('a los 5 intentos equivocados hay que pedir otro código', async () => {
    const { api } = nuevo();
    const a = await api.pedirCodigoIngreso({ identificador: CREDENCIALES_PRUEBA.email, canal: 'email' });
    for (let i = 0; i < 4; i++) await assert.rejects(api.ingresarConCodigo({ solicitud: a.solicitud, codigo: '111111', recordarDispositivo: false }), { tipo: 'validacion' });
    await assert.rejects(api.ingresarConCodigo({ solicitud: a.solicitud, codigo: '111111', recordarDispositivo: false }), { tipo: 'limite' });
    await assert.rejects(api.ingresarConCodigo({ solicitud: a.solicitud, codigo: CODIGO_PRUEBA, recordarDispositivo: false }), { tipo: 'limite' });
  });
});

describe('acceso 0.11 · recuperar con email o teléfono', () => {
  it('con el teléfono también deja el enlace (que va al email de la cuenta), y es neutra', async () => {
    const { api } = nuevo();
    await api.pedirRecuperacion({ identificador: 'nadie@example.test' });
    assert.equal((await api.estadoRecuperacion(TOKEN_RECUPERACION_PRUEBA)).estado, 'vencido');
    await api.pedirRecuperacion({ identificador: '223 555-4521' });
    assert.equal((await api.estadoRecuperacion(TOKEN_RECUPERACION_PRUEBA)).estado, 'valido');
  });

  it('normaliza teléfonos argentinos', () => {
    assert.equal(normalizarTelefono('223 555-4521'), '+5492235554521');
    assert.equal(normalizarTelefono('+54 9 223 555 4521'), '+5492235554521');
    assert.equal(normalizarTelefono('555-4521'), null);
  });
});
