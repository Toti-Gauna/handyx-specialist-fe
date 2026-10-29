import { z } from 'zod';
import {
  AceptacionSchema,
  AgendaItemSchema,
  AvisoSchema,
  TurnoAntecedentesSchema,
  BarrioSchema,
  ViajeSchema,
  BajaSchema,
  CajaResumenSchema,
  CasoSoporteDetalleSchema,
  CasoSoporteSchema,
  ConversacionSchema,
  DatosAltaSchema,
  DisponibilidadSchema,
  FeeVigenteSchema,
  InicioSchema,
  MensajeSchema,
  PagoSchema,
  paginado,
  PedidoDetalleSchema,
  PedidoElegibleSchema,
  PerfilEspecialistaSchema,
  PerfilPublicoSchema,
  PreferenciasSchema,
  PropuestaSchema,
  ResultadoProveedorSchema,
  SesionSchema,
  VerificacionEmailSchema,
  EstadoTokenSchema,
  TrabajoDetalleSchema,
  AdicionalSchema,
  LlamadaPuenteSchema,
  TrabajoSchema,
} from '../../contracts/dto.ts';
import type { EspecialistaApi } from '../api.ts';
import { ClienteHttp, type OpcionesCliente } from './cliente.ts';

const id = (v: string) => encodeURIComponent(v);

// Rutas: docs/api/openapi.yaml (api-especialista). Un cambio acá exige el mismo cambio en el mock y en el OpenAPI.
export function crearApiHttp(o: OpcionesCliente): EspecialistaApi {
  const c = new ClienteHttp(o);
  const Nada = z.undefined();
  return {
    origen: 'http',
    ahora: () => new Date(),

    async sesion() {
      const s = await c.pedir('GET', '/v1/auth/sesion', SesionSchema.nullable(), { nuloSi401: true });
      c.recordarCsrf(s?.csrfToken ?? null);
      return s;
    },
    async ingresar(datos) {
      const s = await c.pedir('POST', '/v1/auth/ingreso', SesionSchema, { cuerpo: datos });
      c.recordarCsrf(s.csrfToken);
      return s;
    },
    async registrar(datos) {
      await c.pedir('POST', '/v1/auth/registro', Nada, { cuerpo: datos });
    },
    async recuperar(email) {
      await c.pedir('POST', '/v1/auth/recuperar', Nada, { cuerpo: { email } });
    },
    async salir() {
      await c.pedir('POST', '/v1/auth/salida', Nada);
      c.recordarCsrf(null);
    },

    estadoVerificacion: () => c.pedir('GET', '/v1/auth/verificacion', VerificacionEmailSchema),
    reenviarCodigo: () => c.pedir('POST', '/v1/auth/verificacion/reenvio', VerificacionEmailSchema),
    async verificarEmail(datos) {
      const s = await c.pedir('POST', '/v1/auth/verificacion', SesionSchema, { cuerpo: datos });
      c.recordarCsrf(s.csrfToken);
      return s;
    },
    async ingresarConProveedor(datos) {
      const r = await c.pedir('POST', '/v1/auth/proveedor', ResultadoProveedorSchema, { cuerpo: datos });
      c.recordarCsrf(r.sesion.csrfToken);
      return r;
    },
    async aceptarTerminos(datos) {
      await c.pedir('POST', '/v1/auth/aceptaciones', Nada, { cuerpo: datos });
    },
    estadoRecuperacion: (token) => c.pedir('POST', '/v1/auth/recuperacion/estado', EstadoTokenSchema, { cuerpo: { token } }),
    async restablecer(datos) {
      await c.pedir('POST', '/v1/auth/recuperacion/nueva', Nada, { cuerpo: datos });
      c.recordarCsrf(null);
    },

    perfil: () => c.pedir('GET', '/v1/especialista/perfil', PerfilEspecialistaSchema),
    perfilPublico: () => c.pedir('GET', '/v1/especialista/perfil/publico', PerfilPublicoSchema),
    datosAlta: () => c.pedir('GET', '/v1/especialista/alta/datos', DatosAltaSchema),
    guardarDatosAlta: (datos) => c.pedir('PUT', '/v1/especialista/alta/datos', DatosAltaSchema, { cuerpo: datos }),
    cargarDocumento(tipo, rubro, archivo, dorso) {
      const f = new FormData();
      if (archivo) f.set('archivo', archivo);
      if (dorso) f.set('dorso', dorso);
      if (rubro) f.set('rubro', rubro);
      return c.pedir('POST', `/v1/especialista/documentos/${id(tipo)}`, PerfilEspecialistaSchema, { formulario: f });
    },
    elegirRubros: (rubros) => c.pedir('PUT', '/v1/especialista/rubros', PerfilEspecialistaSchema, { cuerpo: { rubros } }),
    enviarAlta: () => c.pedir('POST', '/v1/especialista/alta/envio', PerfilEspecialistaSchema),
    turnosAntecedentes: () => c.pedir('GET', '/v1/especialista/antecedentes/turnos', z.array(TurnoAntecedentesSchema)),
    reservarTurno: (turnoId) => c.pedir('PUT', '/v1/especialista/antecedentes/turno', PerfilEspecialistaSchema, { cuerpo: { turnoId } }),

    disponibilidad: () => c.pedir('GET', '/v1/especialista/disponibilidad', DisponibilidadSchema),
    actualizarDisponibilidad: (cambio) => c.pedir('PUT', '/v1/especialista/disponibilidad', DisponibilidadSchema, { cuerpo: cambio }),
    inicio: () => c.pedir('GET', '/v1/especialista/inicio', InicioSchema),
    pedidosElegibles: (cursor) =>
      c.pedir('GET', `/v1/especialista/pedidos${cursor ? `?cursor=${encodeURIComponent(cursor)}` : ''}`, paginado(PedidoElegibleSchema)),
    pedido: (pid) => c.pedir('GET', `/v1/especialista/pedidos/${id(pid)}`, PedidoDetalleSchema),
    avisos: () => c.pedir('GET', '/v1/especialista/avisos', z.array(AvisoSchema)),
    async marcarAvisoLeido(aid) {
      await c.pedir('POST', `/v1/especialista/avisos/${id(aid)}/leido`, Nada);
    },
    async borrarAviso(aid) {
      await c.pedir('DELETE', `/v1/especialista/avisos/${id(aid)}`, Nada);
    },
    async borrarAvisos() {
      await c.pedir('DELETE', '/v1/especialista/avisos', Nada);
    },

    enviarPropuesta: (datos, clave) => c.pedir('POST', '/v1/especialista/propuestas', PropuestaSchema, { cuerpo: datos, idempotencyKey: clave }),
    responderPropuesta: (pid, accion, version, clave) =>
      c.pedir('POST', `/v1/especialista/propuestas/${id(pid)}/respuesta`, AceptacionSchema, { cuerpo: { accion, version }, idempotencyKey: clave }),
    retirarPropuesta: (pid) => c.pedir('POST', `/v1/especialista/propuestas/${id(pid)}/retiro`, PropuestaSchema),

    trabajos: (vista) => c.pedir('GET', `/v1/especialista/trabajos?estado=${vista}`, paginado(TrabajoSchema)),
    trabajo: (tid) => c.pedir('GET', `/v1/especialista/trabajos/${id(tid)}`, TrabajoDetalleSchema),
    avanzarTrabajo: (tid, hacia, version, clave) =>
      c.pedir('POST', `/v1/especialista/trabajos/${id(tid)}/eventos`, TrabajoSchema, { cuerpo: { hacia, version }, idempotencyKey: clave }),
    marcarLlegada: (tid, motivo, version, clave) =>
      c.pedir('POST', `/v1/especialista/trabajos/${id(tid)}/llegada`, TrabajoSchema, { cuerpo: { motivo, version }, idempotencyKey: clave }),
    cancelarTrabajo: (tid, motivo, version, clave) =>
      c.pedir('POST', `/v1/especialista/trabajos/${id(tid)}/cancelacion`, TrabajoSchema, { cuerpo: { motivo, version }, idempotencyKey: clave }),
    crearAdicional: (tid, adicional, clave) =>
      c.pedir('POST', `/v1/especialista/trabajos/${id(tid)}/adicionales`, AdicionalSchema, { cuerpo: adicional, idempotencyKey: clave }),
    retirarAdicional: (tid, aid) => c.pedir('POST', `/v1/especialista/trabajos/${id(tid)}/adicionales/${id(aid)}/retiro`, AdicionalSchema),
    llamada: (tid) => c.pedir('POST', `/v1/especialista/trabajos/${id(tid)}/llamada`, LlamadaPuenteSchema),
    proponerCambio: (tid, cambio, clave) =>
      c.pedir('POST', `/v1/especialista/trabajos/${id(tid)}/cambio`, PropuestaSchema, { cuerpo: cambio, idempotencyKey: clave }),
    agenda: (desde, hasta) =>
      c.pedir('GET', `/v1/especialista/agenda?desde=${encodeURIComponent(desde)}&hasta=${encodeURIComponent(hasta)}`, z.array(AgendaItemSchema)),

    // La posición va siempre en el cuerpo, nunca en la URL (no queda en logs de acceso ni en el historial).
    barrios: () => c.pedir('GET', '/v1/especialista/mapa/barrios', z.array(BarrioSchema)),
    viaje: (tid) => c.pedir('GET', `/v1/especialista/trabajos/${id(tid)}/viaje`, ViajeSchema),
    enviarPosicion: (tid, posicion) => c.pedir('POST', `/v1/especialista/trabajos/${id(tid)}/viaje/posiciones`, ViajeSchema, { cuerpo: posicion }),
    dejarDeCompartir: (tid) => c.pedir('DELETE', `/v1/especialista/trabajos/${id(tid)}/viaje/posiciones`, ViajeSchema),

    conversaciones: () => c.pedir('GET', '/v1/conversaciones', z.array(ConversacionSchema)),
    conversacion: (cid) => c.pedir('GET', `/v1/conversaciones/${id(cid)}`, ConversacionSchema),
    abrirConversacion: (pid) => c.pedir('POST', `/v1/especialista/pedidos/${id(pid)}/conversacion`, ConversacionSchema),
    mensajes: (cid) => c.pedir('GET', `/v1/conversaciones/${id(cid)}/mensajes`, z.array(MensajeSchema)),
    propuestasConversacion: (cid) => c.pedir('GET', `/v1/conversaciones/${id(cid)}/propuestas`, z.array(PropuestaSchema)),
    enviarMensaje(cid, mensaje, clave, archivo) {
      if (!archivo) return c.pedir('POST', `/v1/conversaciones/${id(cid)}/mensajes`, MensajeSchema, { cuerpo: mensaje, idempotencyKey: clave });
      const f = new FormData();
      f.set('archivo', archivo);
      f.set('tipo', mensaje.tipo);
      if (mensaje.texto) f.set('texto', mensaje.texto);
      return c.pedir('POST', `/v1/conversaciones/${id(cid)}/mensajes`, MensajeSchema, { formulario: f, idempotencyKey: clave });
    },

    cajaResumen: () => c.pedir('GET', '/v1/especialista/caja/resumen', CajaResumenSchema),
    pagos: () => c.pedir('GET', '/v1/especialista/caja', paginado(PagoSchema)),
    reportarCobro: (pid, clave) => c.pedir('POST', `/v1/especialista/pagos/${id(pid)}/reporte`, PagoSchema, { idempotencyKey: clave }),
    marcarDiscrepancia: (pid, clave) => c.pedir('POST', `/v1/especialista/pagos/${id(pid)}/discrepancia`, PagoSchema, { idempotencyKey: clave }),

    casos: () => c.pedir('GET', '/v1/soporte/casos', z.array(CasoSoporteSchema)),
    caso: (cid) => c.pedir('GET', `/v1/soporte/casos/${id(cid)}`, CasoSoporteDetalleSchema),
    abrirCaso: (datos, clave) => c.pedir('POST', '/v1/soporte/casos', CasoSoporteSchema, { cuerpo: datos, idempotencyKey: clave }),
    responderCaso: (cid, texto, clave) =>
      c.pedir('POST', `/v1/soporte/casos/${id(cid)}/mensajes`, CasoSoporteDetalleSchema, { cuerpo: { texto }, idempotencyKey: clave }),

    feeVigente: () => c.pedir('GET', '/v1/fee/vigente', FeeVigenteSchema),
    aceptarAvisoFee: (politicaId, version) => c.pedir('POST', '/v1/fee/aviso', FeeVigenteSchema, { cuerpo: { politicaId, version } }),
    preferencias: () => c.pedir('GET', '/v1/cuenta/preferencias', PreferenciasSchema),
    guardarPreferencias: (p) => c.pedir('PUT', '/v1/cuenta/preferencias', PreferenciasSchema, { cuerpo: p }),
    activarPush: () => c.pedir('POST', '/v1/cuenta/push', PreferenciasSchema),
    baja: () => c.pedir('GET', '/v1/cuenta/baja', BajaSchema.nullable()),
    solicitarBaja: () => c.pedir('POST', '/v1/cuenta/baja', BajaSchema),
    async cancelarBaja() {
      await c.pedir('DELETE', '/v1/cuenta/baja', Nada);
    },
  };
}
