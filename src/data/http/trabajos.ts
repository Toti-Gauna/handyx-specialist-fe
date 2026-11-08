import { z } from 'zod';
import { AdicionalSchema, AgendaItemSchema, LlamadaPuenteSchema, paginado, PropuestaSchema, TrabajoDetalleSchema, TrabajoSchema } from '../../contracts/dto.ts';
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
});
