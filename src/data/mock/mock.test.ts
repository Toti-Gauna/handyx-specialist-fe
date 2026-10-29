import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { z } from 'zod';
import {
  AceptacionSchema, AgendaItemSchema, AvisoSchema, BajaSchema, CajaResumenSchema, CasoSoporteDetalleSchema, CasoSoporteSchema, ConversacionSchema,
  DatosAltaSchema, DisponibilidadSchema, FeeVigenteSchema, InicioSchema, MensajeSchema, PagoSchema, PedidoDetalleSchema, PedidoElegibleSchema,
  PerfilEspecialistaSchema, PerfilPublicoSchema, PreferenciasSchema, PropuestaSchema, SesionSchema, TrabajoDetalleSchema, TrabajoSchema,
} from '../../contracts/dto.ts';
import { monto } from '../../contracts/dinero.ts';
import { crearApiMockConEstado } from './adaptador.ts';
import { crearControles } from './controles.ts';
import { CREDENCIALES_PRUEBA, type Escenario } from './estado.ts';
import { ID } from './fixtures.ts';

const nuevo = (escenario: Escenario = 'habilitado') => {
  const m = crearApiMockConEstado({ escenario, latenciaMs: 0 });
  return { ...m, controles: crearControles(m.estado, () => undefined) };
};
let n = 0;
const clave = () => `00000000-0000-4000-8000-${(++n).toString(16).padStart(12, '0')}`;
const futuro = (api: { ahora(): Date }, min = 120) => new Date(api.ahora().getTime() + min * 60_000).toISOString();
const nuevaPropuesta = (api: { ahora(): Date }, pedidoId: string, centavos = 4_500_000, reemplazaA: string | null = null) => ({
  pedidoId, monto: monto(centavos), alcance: 'Alcance de prueba', horario: { inicio: futuro(api), fin: null }, reemplazaA,
});

describe('el mock cumple el contrato', () => {
  it('todas las respuestas del escenario habilitado pasan sus esquemas Zod', async () => {
    const { api } = nuevo();
    const ok = <T extends z.ZodType>(e: T, v: unknown) => assert.ok(e.safeParse(v).success, JSON.stringify(e.safeParse(v).error?.issues));
    ok(SesionSchema, await api.sesion());
    ok(PerfilEspecialistaSchema, await api.perfil());
    ok(PerfilPublicoSchema, await api.perfilPublico());
    ok(DatosAltaSchema, await api.datosAlta());
    ok(DisponibilidadSchema, await api.disponibilidad());
    ok(InicioSchema, await api.inicio());
    const ped = await api.pedidosElegibles();
    ped.items.forEach((p) => ok(PedidoElegibleSchema, p));
    ok(PedidoDetalleSchema, await api.pedido(ID.pProgramado));
    (await api.avisos()).forEach((a) => ok(AvisoSchema, a));
    for (const v of ['activos', 'historial'] as const) (await api.trabajos(v)).items.forEach((t) => ok(TrabajoSchema, t));
    for (const id of [ID.t1, ID.t2, ID.t3, ID.t4, ID.t5]) ok(TrabajoDetalleSchema, await api.trabajo(id));
    (await api.agenda('2026-11-01T00:00:00Z', '2026-12-31T00:00:00Z')).forEach((a) => ok(AgendaItemSchema, a));
    (await api.conversaciones()).forEach((c) => ok(ConversacionSchema, c));
    (await api.mensajes(ID.c2)).forEach((m) => ok(MensajeSchema, m));
    ok(CajaResumenSchema, await api.cajaResumen());
    (await api.pagos()).items.forEach((p) => ok(PagoSchema, p));
    (await api.casos()).forEach((c) => ok(CasoSoporteSchema, c));
    ok(CasoSoporteDetalleSchema, await api.caso(ID.s2));
    ok(FeeVigenteSchema, await api.feeVigente());
    ok(PreferenciasSchema, await api.preferencias());
    ok(BajaSchema.nullable(), await api.baja());
    ok(AceptacionSchema, { propuesta: (await api.pedido(ID.pProgramado)).propuestas[0], trabajo: null });
    ok(PropuestaSchema, (await api.pedido(ID.pProgramado)).propuestas[0]);
  });
});

describe('alta: del registro a la habilitación', () => {
  it('la cuenta nueva se registra, completa el alta y no se habilita sola', async () => {
    const { api, controles } = nuevo('nuevo');
    assert.equal(await api.sesion(), null);
    await api.registrar({ email: 'nueva@example.test', password: 'una-clave-larga-123', terminos: 'esp-terminos-2026-10-29-prov', privacidad: 'esp-privacidad-2026-10-29-prov' });
    assert.ok(await api.sesion());
    let perfil = await api.perfil();
    assert.equal(perfil.estadoAlta, 'borrador');
    // Enviar incompleto es un error por campo, no un éxito
    await assert.rejects(api.enviarAlta(), (e: { tipo: string; detalle?: { campos?: Array<{ campo: string }> } }) => e.tipo === 'validacion' && (e.detalle?.campos?.length ?? 0) >= 4);
    let datos = await api.datosAlta();
    datos = await api.guardarDatosAlta({ nombre: 'Persona', apellido: 'De Prueba', fechaNacimiento: '1990-01-31', nacionalidad: 'Argentina', genero: 'otro', ciudad: 'Mar del Plata', dni: '30111222', cuitCuil: '20301112229', version: datos.version });
    assert.equal(datos.dniUltimos, '••••222'); // nunca vuelve completo
    await api.cargarDocumento('dni');
    await api.cargarDocumento('cuit_cuil');
    await api.cargarDocumento('foto_cara');
    perfil = await api.elegirRubros(['plomeria', 'gas']);
    assert.ok(perfil.faltantesEnvio.includes('matricula'));
    await api.cargarDocumento('matricula', 'gas');
    perfil = await api.enviarAlta();
    assert.equal(perfil.estadoAlta, 'enviada');
    assert.equal(perfil.documentos.dni, 'cargado'); // cargado ≠ verificado
    // En revisión no se edita
    await assert.rejects(api.guardarDatosAlta({ nombre: 'Otro', version: (await api.datosAlta()).version }), { tipo: 'conflicto' });
    // Operations: no se puede habilitar con documentos solo cargados
    controles.ejecutar('ops_revision');
    controles.ejecutar('ops_habilitar');
    assert.match(controles.vista().nota ?? '', /No se puede habilitar/);
    assert.equal((await api.perfil()).estadoAlta, 'en_revision');
    controles.ejecutar('ops_verificar');
    controles.ejecutar('ops_habilitar');
    assert.match(controles.vista().nota ?? '', /antecedentes/); // falta la verificación presencial
    controles.ejecutar('ops_cita');
    controles.ejecutar('ops_aprobar');
    controles.ejecutar('ops_habilitar');
    perfil = await api.perfil();
    assert.equal(perfil.estadoAlta, 'habilitada');
    assert.deepEqual(perfil.rubros.map((r) => [r.rubro, r.estado]), [['plomeria', 'habilitado'], ['gas', 'habilitado']]);
    assert.equal((await api.perfilPublico()).verificado, true);
    // Sin disponibilidad declarada no ve pedidos
    assert.equal((await api.pedidosElegibles()).items.length, 0);
  });

  it('una corrección permite volver a cargar solo lo rechazado y reenviar', async () => {
    const { api } = nuevo('correccion');
    const p = await api.perfil();
    assert.equal(p.estadoAlta, 'requiere_correccion');
    assert.equal(p.documentos.dni, 'rechazado');
    await assert.rejects(api.cargarDocumento('cuit_cuil'), { tipo: 'conflicto' }); // ya está en revisión
    const despues = await api.cargarDocumento('dni');
    assert.equal(despues.documentos.dni, 'cargado');
    assert.equal((await api.enviarAlta()).estadoAlta, 'enviada');
  });

  it('el especialista no puede cargar antecedentes como documento', async () => {
    const { api } = nuevo('incompleto');
    await assert.rejects(api.cargarDocumento('antecedentes' as never), (e: { detalle?: { codigo: string } }) => e.detalle?.codigo === 'tipo_archivo_prohibido');
  });

  it('acceso: credenciales incorrectas, bloqueo por intentos y respuesta neutra', async () => {
    const { api } = nuevo('nuevo');
    for (let i = 0; i < 5; i++) await assert.rejects(api.ingresar({ email: CREDENCIALES_PRUEBA.email, password: 'incorrecta' }), { tipo: 'sesion' });
    await assert.rejects(api.ingresar(CREDENCIALES_PRUEBA), { tipo: 'limite' });
    await api.recuperar('nadie@example.test'); // no revela si existe
    await api.registrar({ email: CREDENCIALES_PRUEBA.email, password: 'otra-clave-larga-12', terminos: 'a', privacidad: 'b' });
    assert.equal(await api.sesion(), null); // la cuenta ya existía: sin sesión, sin pistas
  });
});

describe('disponibilidad y elegibilidad', () => {
  it('opt-in urgente apagado no ofrece urgencias; prenderlo sí; revocarlo las corta', async () => {
    const { api } = nuevo();
    const tipos = async () => (await api.pedidosElegibles()).items.map((p) => p.tipo);
    assert.equal((await tipos()).includes('urgente'), false);
    let d = await api.disponibilidad();
    d = await api.actualizarDisponibilidad({ urgentesAhora: true, programados: true, version: d.version });
    assert.ok(d.urgentesCambiadoEn);
    assert.equal((await tipos()).filter((t) => t === 'urgente').length, 2);
    await api.actualizarDisponibilidad({ urgentesAhora: false, programados: true, version: d.version });
    assert.equal((await tipos()).includes('urgente'), false);
  });
  it('rubro sin matrícula, rubro no elegido y pedido ajeno responden igual: no existen para vos', async () => {
    const { api } = nuevo();
    const ids = (await api.pedidosElegibles()).items.map((p) => p.id);
    assert.ok(!ids.includes(ID.pGas) && !ids.includes(ID.pAire));
    for (const id of [ID.pGas, ID.pAire]) await assert.rejects(api.pedido(id), { tipo: 'no_encontrado' });
    await assert.rejects(api.enviarPropuesta(nuevaPropuesta(api, ID.pGas), clave()), { tipo: 'no_encontrado' });
  });
  it('sin alta habilitada: bandeja vacía y sin permiso para ofertar', async () => {
    const { api } = nuevo('en_revision');
    assert.equal((await api.pedidosElegibles()).items.length, 0);
    await assert.rejects(api.actualizarDisponibilidad({ urgentesAhora: true, programados: true, version: 1 }), { tipo: 'permiso' });
  });
  it('la bandeja va por orden de llegada, sin ranking', async () => {
    const { api } = nuevo();
    const { items } = await api.pedidosElegibles();
    const t = items.map((p) => Date.parse(p.creadoEn));
    assert.deepEqual(t, [...t].sort((a, b) => a - b));
  });
  it('la búsqueda urgente vence a los 20 minutos y no admite más propuestas', async () => {
    const { api, controles } = nuevo();
    const d = await api.disponibilidad();
    await api.actualizarDisponibilidad({ urgentesAhora: true, programados: true, version: d.version });
    const antes = (await api.pedidosElegibles()).items.find((p) => p.id === ID.pUrgente);
    assert.equal(antes?.estado, 'buscando');
    controles.fijarReloj('mas20');
    assert.equal((await api.pedidosElegibles()).items.find((p) => p.id === ID.pUrgente)?.estado, 'sin_propuestas');
    await assert.rejects(api.enviarPropuesta(nuevaPropuesta(api, ID.pUrgente), clave()), (e: { detalle?: { codigo: string } }) => e.detalle?.codigo === 'pedido_no_elegible');
  });
});

describe('propuestas y acuerdos', () => {
  it('la propuesta es idempotente, vence a los 5 min en urgentes y no se duplica', async () => {
    const { api, controles } = nuevo();
    const d = await api.disponibilidad();
    await api.actualizarDisponibilidad({ urgentesAhora: true, programados: true, version: d.version });
    const k = clave();
    const a = await api.enviarPropuesta(nuevaPropuesta(api, ID.pUrgente), k);
    const b = await api.enviarPropuesta(nuevaPropuesta(api, ID.pUrgente), k);
    assert.equal(a.id, b.id); // mismo reintento, mismo resultado
    const resto = Date.parse(a.venceEn) - api.ahora().getTime();
    assert.ok(resto <= 5 * 60_000 && resto > 5 * 60_000 - 2_000, `vigencia de 5 min, quedan ${resto} ms`);
    await assert.rejects(api.enviarPropuesta(nuevaPropuesta(api, ID.pUrgente), clave()), { tipo: 'conflicto' }); // ya hay una pendiente
    controles.fijarReloj('mas5');
    const detalle = await api.pedido(ID.pUrgente);
    assert.equal(Date.parse(detalle.propuestas[0]?.venceEn ?? '') <= api.ahora().getTime(), true);
  });

  it('aceptar una propuesta del usuario crea el trabajo; la doble aceptación pierde; nada se contrata dos veces', async () => {
    const { api, controles } = nuevo();
    const antes = (await api.trabajos('activos')).items.length;
    controles.alternar('conflicto');
    await assert.rejects(api.responderPropuesta(ID.pr1, 'aceptar', 0, clave()), (e: { detalle?: { codigo: string } }) => e.detalle?.codigo === 'propuesta_no_disponible');
    assert.equal((await api.trabajos('activos')).items.length, antes); // no se contrató
    // La propuesta quedó reemplazada: ya no se puede aceptar
    await assert.rejects(api.responderPropuesta(ID.pr1, 'aceptar', 0, clave()), { tipo: 'conflicto' });

    const otro = nuevo();
    const k = clave();
    const r = await otro.api.responderPropuesta(ID.pr1, 'aceptar', 0, k);
    assert.ok(r.trabajo);
    assert.equal(r.trabajo.estado, 'agendado');
    assert.equal(r.trabajo.acuerdo.monto.centavos, 3_800_000);
    const repetido = await otro.api.responderPropuesta(ID.pr1, 'aceptar', 0, k); // mismo reintento
    assert.equal(repetido.trabajo?.id, r.trabajo.id);
    assert.equal((await otro.api.trabajos('activos')).items.length, antes + 1);
    await assert.rejects(otro.api.responderPropuesta(ID.pr1, 'aceptar', 1, clave()), { tipo: 'conflicto' });
  });

  it('quien envía una propuesta no puede aceptarla; una vencida tampoco; se puede retirar', async () => {
    const { api } = nuevo();
    const p = await api.enviarPropuesta(nuevaPropuesta(api, ID.pProgramado, 4_000_000, ID.pr1), clave());
    assert.equal((await api.pedido(ID.pProgramado)).propuestas.find((x) => x.id === ID.pr1)?.estado, 'reemplazada'); // la contraoferta reemplaza a la anterior
    await assert.rejects(api.responderPropuesta(p.id, 'aceptar', p.version, clave()), (e: { detalle?: { codigo: string } }) => e.detalle?.codigo === 'propuesta_no_disponible');
    assert.equal((await api.retirarPropuesta(p.id)).estado, 'retirada');
    const w = nuevo();
    w.controles.fijarReloj('mas12h'); // la propuesta del usuario vence a las 6 h
    await assert.rejects(w.api.responderPropuesta(ID.pr1, 'aceptar', 0, clave()), (e: { detalle?: { codigo: string } }) => e.detalle?.codigo === 'propuesta_no_disponible');
  });

  it('un cambio de fecha no modifica el acuerdo hasta que la otra parte acepta', async () => {
    const { api } = nuevo();
    const antes = (await api.trabajo(ID.t1)).trabajo.acuerdo;
    const nuevaFecha = futuro(api, 60 * 48);
    const p = await api.proponerCambio(ID.t1, { horario: { inicio: nuevaFecha, fin: null }, alcance: antes.alcance, monto: null }, clave());
    const detalle = await api.trabajo(ID.t1);
    assert.equal(detalle.cambioPendiente?.id, p.id);
    assert.deepEqual(detalle.trabajo.acuerdo, antes); // sigue igual
    await assert.rejects(api.proponerCambio(ID.t1, { horario: { inicio: nuevaFecha, fin: null }, alcance: 'x', monto: null }, clave()), { tipo: 'conflicto' });
  });

  it('si el usuario pide mover la fecha y el especialista acepta, el acuerdo cambia con historial; si rechaza, queda igual', async () => {
    const { api, controles } = nuevo();
    const antes = (await api.trabajo(ID.t1)).trabajo;
    controles.ejecutar('usuario_cambio');
    const d = await api.trabajo(ID.t1);
    assert.equal(d.cambioPendiente?.autorRol, 'usuario');
    assert.equal(d.trabajo.acuerdo.horario.inicio, antes.acuerdo.horario.inicio);
    const r = await api.responderPropuesta(d.cambioPendiente!.id, 'aceptar', d.cambioPendiente!.version, clave());
    assert.equal(r.trabajo?.id, ID.t1); // mismo trabajo, no se crea otro
    const despues = await api.trabajo(ID.t1);
    assert.equal(despues.cambioPendiente, null);
    assert.equal(Date.parse(despues.trabajo.acuerdo.horario.inicio) - Date.parse(antes.acuerdo.horario.inicio), 24 * 3_600_000);
    assert.equal(despues.trabajo.version, antes.version + 1);
    assert.equal(despues.trabajo.propuestaAceptadaId, d.cambioPendiente!.id);

    const w = nuevo();
    w.controles.ejecutar('usuario_cambio');
    const c = (await w.api.trabajo(ID.t1)).cambioPendiente!;
    await w.api.responderPropuesta(c.id, 'rechazar', c.version, clave());
    const igual = await w.api.trabajo(ID.t1);
    assert.equal(igual.cambioPendiente, null);
    assert.equal(igual.trabajo.acuerdo.horario.inicio, antes.acuerdo.horario.inicio);
  });
});

describe('trabajo, caja y soporte', () => {
  it('las transiciones respetan la máquina: no se salta "Llegué" ni se reabre un trabajo cerrado', async () => {
    const { api } = nuevo();
    const t = (await api.trabajo(ID.t1)).trabajo;
    await assert.rejects(api.avanzarTrabajo(t.id, 'en_curso', t.version, clave()), { tipo: 'conflicto' });
    let x = await api.avanzarTrabajo(t.id, 'en_camino', t.version, clave());
    x = await api.avanzarTrabajo(t.id, 'en_sitio', x.version, clave());
    x = await api.avanzarTrabajo(t.id, 'en_curso', x.version, clave());
    await assert.rejects(api.avanzarTrabajo(t.id, 'en_curso', 0, clave()), { tipo: 'conflicto' }); // versión vieja
    const pagosAntes = (await api.pagos()).items.length;
    const fin = await api.avanzarTrabajo(t.id, 'finalizado', x.version, clave());
    assert.equal(fin.estado, 'finalizado');
    assert.equal((await api.trabajo(t.id)).eventos.at(-1)?.estado, 'finalizado');
    await assert.rejects(api.avanzarTrabajo(t.id, 'en_camino', fin.version, clave()), { tipo: 'conflicto' });
    assert.equal((await api.pagos()).items.length, pagosAntes); // t1 ya tenía su pago pendiente
  });

  it('la caja: reportado no es verificado, Handy no cobra nada en la demo y el dinero no es de Handy', async () => {
    const { api, controles } = nuevo();
    const antes = await api.cajaResumen();
    assert.equal(antes.feeHandyPeriodo.centavos, 0);
    const pendiente = (await api.pagos()).items.find((p) => p.estado === 'pendiente');
    assert.ok(pendiente);
    const k = clave();
    const rep = await api.reportarCobro(pendiente.id, k);
    assert.equal(rep.estado, 'reportado');
    assert.equal(rep.fuenteConfirmacion, 'reporte_especialista');
    assert.equal((await api.reportarCobro(pendiente.id, k)).id, rep.id); // idempotente
    const despues = await api.cajaResumen();
    assert.equal(despues.verificado.centavos, antes.verificado.centavos); // no sumó a lo verificado
    assert.equal(despues.reportado.centavos, antes.reportado.centavos + pendiente.neto.centavos);
    assert.equal((await api.marcarDiscrepancia(pendiente.id, clave())).estado, 'en_discrepancia');
    controles.ejecutar('pago_ops_verifica');
    assert.equal((await api.pagos()).items.find((p) => p.id === pendiente.id || p.estado === 'verificado')?.estado, 'verificado');
    assert.ok((await api.pagos()).items.every((p) => p.feeHandy.centavos === 0));
  });

  it('la simulación post-demo está rotulada y sale solo del mock', async () => {
    const { api } = nuevo();
    const sim = await api.simulacionPostDemo?.();
    assert.match(sim?.rotulo ?? '', /NO vigente/);
    assert.ok((sim?.entradas.length ?? 0) > 0);
  });

  it('chat: un mensaje fallido se reintenta con la misma clave sin duplicarse; chat previo al trabajo', async () => {
    const { api, controles } = nuevo();
    const antes = (await api.mensajes(ID.c2)).length;
    controles.alternar('mensaje');
    const k = clave();
    await assert.rejects(api.enviarMensaje(ID.c2, { tipo: 'texto', texto: 'Hola, sí puedo' }, k), { tipo: 'red' });
    assert.equal((await api.mensajes(ID.c2)).length, antes);
    await api.enviarMensaje(ID.c2, { tipo: 'texto', texto: 'Hola, sí puedo' }, k);
    await api.enviarMensaje(ID.c2, { tipo: 'texto', texto: 'Hola, sí puedo' }, k);
    assert.equal((await api.mensajes(ID.c2)).length, antes + 1);
    assert.equal((await api.conversacion(ID.c2)).etapa, 'cotizando'); // antes de contratar
    await assert.rejects(api.enviarMensaje(ID.c3, { tipo: 'texto', texto: 'hola' }, clave()), { tipo: 'conflicto' }); // cerrada
  });

  it('soporte: abrir un reclamo desde un trabajo y responder', async () => {
    const { api } = nuevo();
    const c = await api.abrirCaso({ categoria: 'reclamo', trabajoId: ID.t2, pedidoId: null, asunto: 'Prueba de reclamo', detalle: 'Detalle de prueba', adjuntos: 1 }, clave());
    assert.equal(c.estado, 'abierto');
    const d = await api.responderCaso(c.id, 'Agrego un dato', clave());
    assert.equal(d.eventos.length, 2);
    await assert.rejects(api.abrirCaso({ categoria: 'reclamo', trabajoId: idInexistente, pedidoId: null, asunto: 'x', detalle: 'y', adjuntos: 0 }, clave()), { tipo: 'validacion' });
  });
});

const idInexistente: string = '00000000-0000-4000-8000-0000000fffff';

describe('cuenta, baja y fallas', () => {
  it('la baja se solicita con estado honesto, bloquea la sesión y se puede cancelar mientras está solicitada', async () => {
    const { api, controles } = nuevo();
    const b = await api.solicitarBaja();
    assert.equal(b.estado, 'solicitada');
    assert.equal(await api.sesion(), null); // sesiones bloqueadas
    await api.ingresar(CREDENCIALES_PRUEBA);
    assert.equal((await api.perfil()).baja, 'solicitada');
    controles.ejecutar('baja_procesar');
    controles.ejecutar('baja_procesar');
    const fin = await api.baja();
    assert.equal(fin?.estado, 'completada_con_retencion');
    assert.match(fin?.mensaje ?? '', /obliga/);
    await assert.rejects(api.cancelarBaja(), { tipo: 'conflicto' });
  });

  it('sesión expirada, red caída y error del servidor llegan como fallos, sin datos de muestra', async () => {
    const { api, controles } = nuevo();
    controles.ejecutar('sesion_expira');
    await assert.rejects(api.perfil(), { tipo: 'sesion' });
    assert.equal(await api.sesion(), null);
    const r = nuevo();
    r.controles.alternar('falla');
    await assert.rejects(r.api.inicio(), { tipo: 'red' });
    r.controles.alternar('falla');
    r.controles.alternar('servidor');
    await assert.rejects(r.api.inicio(), { tipo: 'servidor' });
  });

  it('el aviso del fee 0 % se acepta una sola vez y el push puede ser rechazado', async () => {
    const { api, controles } = nuevo('incompleto');
    const f = await api.feeVigente();
    assert.equal(f.politica?.bpsEspecialista, 0);
    assert.equal(f.avisoAceptadoEn, null);
    const ok = await api.aceptarAvisoFee(f.politica!.id, f.politica!.version);
    assert.ok(ok.avisoAceptadoEn);
    assert.equal((await api.aceptarAvisoFee(f.politica!.id, f.politica!.version)).avisoAceptadoEn, ok.avisoAceptadoEn);
    controles.alternar('push');
    assert.equal((await api.activarPush()).push, 'rechazado');
  });

  it('el inicio no expone tasas de aceptación, tiempos de respuesta ni puntualidad', async () => {
    const { api } = nuevo();
    const claves = Object.keys(await api.inicio()).join(' ');
    assert.doesNotMatch(claves, /acept|respuesta|puntual|ranking/i);
  });
});
