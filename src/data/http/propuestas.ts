import { AceptacionSchema, PropuestaSchema } from '../../contracts/dto.ts';
import type { ApiPropuestas } from '../api/propuestas.ts';
import type { ClienteHttp } from './cliente.ts';
import { id } from './comun.ts';

export const propuestasHttp = (c: ClienteHttp): ApiPropuestas => ({
  enviarPropuesta: (datos, clave) => c.pedir('POST', '/v1/especialista/propuestas', PropuestaSchema, { cuerpo: datos, idempotencyKey: clave }),
  responderPropuesta: (pid, accion, version, clave) =>
    c.pedir('POST', `/v1/especialista/propuestas/${id(pid)}/respuesta`, AceptacionSchema, { cuerpo: { accion, version }, idempotencyKey: clave }),
  retirarPropuesta: (pid) => c.pedir('POST', `/v1/especialista/propuestas/${id(pid)}/retiro`, PropuestaSchema),
});
