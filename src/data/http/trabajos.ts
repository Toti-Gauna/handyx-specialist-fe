import { z } from 'zod';
import { AdicionalSchema, AgendaItemSchema, LlamadaPuenteSchema, paginado, PropuestaSchema, TrabajoDetalleSchema, TrabajoSchema } from '../../contracts/dto.ts';
import { DiaSchema } from '../../contracts/agenda.ts';
import { MensajeChatSchema } from '../../contracts/chat.ts';
import { CobroSchema } from '../../contracts/ingresos.ts';
import type { ApiTrabajos } from '../api/trabajos.ts';
import type { ClienteHttp } from './cliente.ts';
import { id } from './comun.ts';

export const trabajosHttp = (c: ClienteHttp): ApiTrabajos => ({
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
  // Tu día, demora y cobro (0.11.0). La posición del recorrido va en el cuerpo y no se guarda.
  dia: () => c.pedir('GET', '/v1/especialista/dia', DiaSchema),
  recorridoDia: (r) => c.pedir('POST', '/v1/especialista/dia/recorrido', DiaSchema, { cuerpo: r }),
  ordenarDia: (o) => c.pedir('PUT', '/v1/especialista/dia/orden', DiaSchema, { cuerpo: o }),
  avisarDemora: (tid, aviso, clave) => c.pedir('POST', `/v1/especialista/trabajos/${id(tid)}/demora`, MensajeChatSchema, { cuerpo: aviso, idempotencyKey: clave }),
  cobro: (pid) => c.pedir('GET', `/v1/especialista/pagos/${id(pid)}/cobro`, CobroSchema),
  informarCobro: (pid, informe, clave) => c.pedir('POST', `/v1/especialista/pagos/${id(pid)}/informe`, CobroSchema, { cuerpo: informe, idempotencyKey: clave }),
});
