import { z } from 'zod';
import { BarrioSchema, ViajeSchema } from '../../contracts/dto.ts';
import type { ApiViajes } from '../api/viajes.ts';
import type { ClienteHttp } from './cliente.ts';
import { id } from './comun.ts';

// La posición va siempre en el cuerpo, nunca en la URL (no queda en logs de acceso ni en el historial).
export const viajesHttp = (c: ClienteHttp): ApiViajes => ({
  barrios: () => c.pedir('GET', '/v1/especialista/mapa/barrios', z.array(BarrioSchema)),
  viaje: (tid) => c.pedir('GET', `/v1/especialista/trabajos/${id(tid)}/viaje`, ViajeSchema),
  enviarPosicion: (tid, posicion) => c.pedir('POST', `/v1/especialista/trabajos/${id(tid)}/viaje/posiciones`, ViajeSchema, { cuerpo: posicion }),
  dejarDeCompartir: (tid) => c.pedir('DELETE', `/v1/especialista/trabajos/${id(tid)}/viaje/posiciones`, ViajeSchema),
});
