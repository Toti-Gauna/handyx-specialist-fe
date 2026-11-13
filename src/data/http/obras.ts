import { EntradaDiarioSchema, JornadaSchema, PagoSchema } from '../../contracts/dto.ts';
import type { ApiObras } from '../api/obras.ts';
import type { ClienteHttp } from './cliente.ts';
import { id } from './comun.ts';

export const obrasHttp = (c: ClienteHttp): ApiObras => ({
  terminarEtapa: (tid, eid, clave) => c.pedir('POST', `/v1/especialista/trabajos/${id(tid)}/etapas/${id(eid)}/fin`, PagoSchema, { idempotencyKey: clave }),
  pedirCambioJornada: (tid, jid, cambio, clave) =>
    c.pedir('POST', `/v1/especialista/trabajos/${id(tid)}/jornadas/${id(jid)}/cambio`, JornadaSchema, { cuerpo: cambio, idempotencyKey: clave }),
  agregarAlDiario(tid, entrada, fotos, clave) {
    const f = new FormData();
    f.set('etapaId', entrada.etapaId);
    if (entrada.jornadaId) f.set('jornadaId', entrada.jornadaId);
    f.set('nota', entrada.nota);
    for (const foto of fotos) f.append('fotos', foto);
    return c.pedir('POST', `/v1/especialista/trabajos/${id(tid)}/diario`, EntradaDiarioSchema, { formulario: f, idempotencyKey: clave });
  },
});
