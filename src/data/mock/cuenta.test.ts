// Mock de la cuenta (lote 1.4): perfil propio, seguridad, bandeja, descarga de datos y «Letra más grande».
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { AvisoBandejaSchema, ExportacionDatosSchema, PerfilPropioSchema } from '../../contracts/cuenta.ts';
import { RegistroEspecialistaSchema } from '../../contracts/registro.ts';
import { CodigosRespaldoSchema, SeguridadSchema } from '../../contracts/seguridad.ts';
import { crearApiMockConEstado } from './adaptador.ts';
import { CREDENCIALES_PRUEBA } from './estado.ts';
import { CODIGO_TOTP_PRUEBA } from './cuenta-estado.ts';
import type { FalloApi } from '../errores.ts';

const nuevo = () => crearApiMockConEstado({ escenario: 'habilitado', latenciaMs: 0 }).api;
const clave = { password: CREDENCIALES_PRUEBA.password, codigo: null } as const;
const campos = (e: unknown) => (e as FalloApi).detalle?.campos ?? [];

describe('cuenta (lote 1.4)', () => {
  it('perfil, registro y bandeja pasan sus esquemas', async () => {
    const api = nuevo();
    assert.ok(PerfilPropioSchema.safeParse(await api.perfilPropio()).success);
    assert.ok(RegistroEspecialistaSchema.safeParse(await api.datosYVerificacion()).success);
    assert.ok(SeguridadSchema.safeParse(await api.seguridad()).success);
    const b = await api.bandeja();
    assert.ok(b.items.length > 0);
    b.items.forEach((a) => assert.ok(AvisoBandejaSchema.safeParse(a).success));
  });

  it('la presentación respeta la versión', async () => {
    const api = nuevo();
    const p = await api.perfilPropio();
    const g = await api.guardarPresentacion({ presentacion: 'Hola, trabajo prolijo.', version: p.version });
    assert.equal(g.presentacion, 'Hola, trabajo prolijo.');
    await assert.rejects(api.guardarPresentacion({ presentacion: 'otra', version: p.version }), (e: FalloApi) => e.tipo === 'conflicto');
  });

  it('la app autenticadora: pide contraseña, confirma con código y entrega 10 códigos de respaldo', async () => {
    const api = nuevo();
    await assert.rejects(api.iniciarTotp({ password: 'incorrecta-123456', codigo: null }), (e: unknown) => campos(e)[0]?.campo === 'password');
    const alta = await api.iniciarTotp(clave);
    await assert.rejects(api.confirmarTotp({ alta: alta.alta, codigo: '000000' }), (e: unknown) => campos(e)[0]?.campo === 'codigo');
    const r = await api.confirmarTotp({ alta: alta.alta, codigo: CODIGO_TOTP_PRUEBA });
    assert.ok(CodigosRespaldoSchema.safeParse(r).success);
    const s = await api.seguridad();
    assert.equal(s.segundaVerificacion.activa, true);
    assert.equal(s.codigosRespaldo.restantes, 10);
    // Apagarla pide la contraseña o un código, y SMS no está disponible sin proveedor.
    await assert.rejects(api.cambiarSegundaVerificacion({ metodo: 'sms', activo: true, reautenticacion: clave, version: s.version }), (e: FalloApi) => e.status === 503);
    const apagada = await api.cambiarSegundaVerificacion({ metodo: 'totp', activo: false, reautenticacion: { password: null, codigo: CODIGO_TOTP_PRUEBA }, version: s.version });
    assert.equal(apagada.segundaVerificacion.activa, false);
  });

  it('cerrar un teléfono lo quita, pero el de este teléfono se queda', async () => {
    const api = nuevo();
    const antes = (await api.seguridad()).dispositivos;
    const otro = antes.find((d) => !d.esEste);
    const este = antes.find((d) => d.esEste);
    assert.ok(otro && este);
    await api.cerrarDispositivo(otro.id);
    await api.cerrarDispositivo(este.id);
    assert.deepEqual((await api.seguridad()).dispositivos.map((d) => d.id), [este.id]);
  });

  it('la bandeja marca leído, borra uno y vacía; nada acepta', async () => {
    const api = nuevo();
    const { items } = await api.bandeja();
    const sin = items.find((a) => !a.leido);
    assert.ok(sin);
    await api.marcarLeidoEnBandeja(sin.id);
    assert.equal((await api.bandeja()).items.find((a) => a.id === sin.id)?.leido, true);
    await api.borrarDeBandeja(sin.id);
    assert.equal((await api.bandeja()).items.length, items.length - 1);
    await api.vaciarBandeja();
    assert.deepEqual((await api.bandeja()).items, []);
  });

  it('descargar mis datos: una sola pedida a la vez', async () => {
    const api = nuevo();
    assert.equal(await api.exportacionDatos(), null);
    const e = await api.pedirExportacionDatos(clave);
    assert.ok(ExportacionDatosSchema.safeParse(e).success);
    assert.equal(e.estado, 'pedida');
    await assert.rejects(api.pedirExportacionDatos(clave), (x: FalloApi) => x.tipo === 'conflicto');
  });

  it('«Letra más grande» se guarda en las preferencias del servidor', async () => {
    const api = nuevo();
    const p = await api.preferencias();
    assert.equal(p.letraGrande ?? false, false);
    const g = await api.guardarPreferencias({ avisosUrgentes: p.avisosUrgentes, avisosProgramados: p.avisosProgramados, avisosMensajes: p.avisosMensajes, avisosPagos: p.avisosPagos, letraGrande: true });
    assert.equal(g.letraGrande, true);
    assert.equal((await api.preferencias()).letraGrande, true);
  });

  it('los cobros guardan la transferencia con el alias enmascarado', async () => {
    const api = nuevo();
    const m = await api.mediosCobro();
    const g = await api.guardarMediosCobro({ efectivo: m.efectivo, mercadoPago: m.mercadoPago, transferencia: { activa: true, alias: 'julian.ortiz.mdp' }, version: m.version });
    assert.equal(g.transferencia?.activa, true);
    assert.ok(!g.transferencia?.aliasEnmascarado?.includes('ortiz'));
  });
});
