import { z } from 'zod';
import { CasoSoporteDetalleSchema, CasoSoporteSchema } from '../../contracts/dto.ts';
import type { ApiSoporte } from '../api/soporte.ts';
import type { ClienteHttp } from './cliente.ts';
import { id } from './comun.ts';

export const soporteHttp = (c: ClienteHttp): ApiSoporte => ({
  casos: () => c.pedir('GET', '/v1/soporte/casos', z.array(CasoSoporteSchema)),
  caso: (cid) => c.pedir('GET', `/v1/soporte/casos/${id(cid)}`, CasoSoporteDetalleSchema),
  abrirCaso: (datos, clave) => c.pedir('POST', '/v1/soporte/casos', CasoSoporteSchema, { cuerpo: datos, idempotencyKey: clave }),
  responderCaso: (cid, texto, clave) =>
    c.pedir('POST', `/v1/soporte/casos/${id(cid)}/mensajes`, CasoSoporteDetalleSchema, { cuerpo: { texto }, idempotencyKey: clave }),
});
