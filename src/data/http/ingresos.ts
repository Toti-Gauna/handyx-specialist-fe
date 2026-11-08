import { z } from 'zod';
import { paginado } from '../../contracts/dto.ts';
import { CobroSchema, GastoSchema, IngresoExternoSchema, ResumenIngresosSchema } from '../../contracts/ingresos.ts';
import type { ApiIngresos } from '../api/ingresos.ts';
import type { ClienteHttp } from './cliente.ts';
import { id, Nada } from './comun.ts';

export const ingresosHttp = (c: ClienteHttp): ApiIngresos => ({
  resumenIngresos: (mes) => c.pedir('GET', `/v1/especialista/ingresos?mes=${id(mes)}`, ResumenIngresosSchema),
  cobrosDelMes: (mes, cursor) => c.pedir('GET', `/v1/especialista/ingresos/cobros?mes=${id(mes)}${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ''}`, paginado(CobroSchema)),
  gastos: (f = {}) => {
    const q = new URLSearchParams();
    if (f.mes) q.set('mes', f.mes);
    if (f.trabajoId) q.set('trabajoId', f.trabajoId);
    if (f.cursor) q.set('cursor', f.cursor);
    const texto = q.toString();
    return c.pedir('GET', `/v1/especialista/gastos${texto ? `?${texto}` : ''}`, paginado(GastoSchema));
  },
  cargarGasto: (nuevo, ticket, clave) => {
    if (!ticket) return c.pedir('POST', '/v1/especialista/gastos', GastoSchema, { cuerpo: nuevo, idempotencyKey: clave });
    // Con la foto del ticket: multipart con el JSON en la parte `datos` y la foto en `ticket`.
    const f = new FormData();
    f.set('datos', new Blob([JSON.stringify(nuevo)], { type: 'application/json' }));
    f.set('ticket', ticket, 'ticket.jpg');
    return c.pedir('POST', '/v1/especialista/gastos', GastoSchema, { formulario: f, idempotencyKey: clave });
  },
  corregirGasto: (gid, cambio) => c.pedir('PATCH', `/v1/especialista/gastos/${id(gid)}`, GastoSchema, { cuerpo: cambio }),
  borrarGasto: (gid) => c.pedir('DELETE', `/v1/especialista/gastos/${id(gid)}`, Nada),
  ingresosExternos: (mes) => c.pedir('GET', `/v1/especialista/ingresos-externos?mes=${id(mes)}`, z.array(IngresoExternoSchema)),
  cargarIngresoExterno: (nuevo, clave) => c.pedir('POST', '/v1/especialista/ingresos-externos', IngresoExternoSchema, { cuerpo: nuevo, idempotencyKey: clave }),
  borrarIngresoExterno: (iid) => c.pedir('DELETE', `/v1/especialista/ingresos-externos/${id(iid)}`, Nada),
});
