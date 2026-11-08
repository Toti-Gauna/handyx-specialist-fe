// Cobros, ingresos y gastos contra api-especialista (ola 2.5). Informado ≠ verificado. La planilla del mes es un enlace
// de descarga con la cookie de sesión (no pasa por el JSON).
import { z } from 'zod';
import {
  CobroSchema,
  GastoSchema,
  IngresoExternoSchema,
  ResumenIngresosSchema,
  type CambioGasto,
  type InformeCobro,
  type NuevoGasto,
  type NuevoIngresoExterno,
} from '../../../contracts/ingresos.ts';
import type { ClienteHttp } from '../cliente.ts';
import { id, Nada } from '../comun.ts';
import { q } from './agenda.ts';

const E = '/v1/especialista';
const pagina = <S extends z.ZodType>(s: S) => z.strictObject({ items: z.array(s), siguienteCursor: z.string().nullable() });

export const ingresosServidor = (c: ClienteHttp, baseUrl = '') => ({
  cobro: (pagoId: string) => c.pedir('GET', `${E}/pagos/${id(pagoId)}/cobro`, CobroSchema),
  informarCobro: (pagoId: string, i: InformeCobro, clave: string) =>
    c.pedir('POST', `${E}/pagos/${id(pagoId)}/informe`, CobroSchema, { cuerpo: i, idempotencyKey: clave }),
  ingresos: (mes: string) => c.pedir('GET', `${E}/ingresos${q({ mes })}`, ResumenIngresosSchema),
  cobrosDelMes: (mes: string, cursor?: string) => c.pedir('GET', `${E}/ingresos/cobros${q({ mes, cursor })}`, pagina(CobroSchema)),
  /** Para un `<a download>`: la cookie de sesión va sola (mismo sitio de la API). */
  urlExportacion: (mes: string) => `${baseUrl.replace(/\/$/, '')}${E}/ingresos/exportacion${q({ mes })}`,
  gastos: (f: { mes?: string; trabajoId?: string; cursor?: string } = {}) => c.pedir('GET', `${E}/gastos${q(f)}`, pagina(GastoSchema)),
  /** Con ticket: multipart con el JSON en `datos` y la foto (ya achicada y sin metadatos) en `ticket`. */
  crearGasto(g: NuevoGasto, clave: string, ticket?: Blob) {
    if (!ticket) return c.pedir('POST', `${E}/gastos`, GastoSchema, { cuerpo: g, idempotencyKey: clave });
    const f = new FormData();
    f.set('datos', new Blob([JSON.stringify(g)], { type: 'application/json' }));
    f.set('ticket', ticket, 'ticket.jpg');
    return c.pedir('POST', `${E}/gastos`, GastoSchema, { formulario: f, idempotencyKey: clave });
  },
  cambiarGasto: (gastoId: string, cambio: CambioGasto) => c.pedir('PATCH', `${E}/gastos/${id(gastoId)}`, GastoSchema, { cuerpo: cambio }),
  borrarGasto: async (gastoId: string) => void (await c.pedir('DELETE', `${E}/gastos/${id(gastoId)}`, Nada)),
  ingresosExternos: (mes: string) => c.pedir('GET', `${E}/ingresos-externos${q({ mes })}`, z.array(IngresoExternoSchema)),
  crearIngresoExterno: (i: NuevoIngresoExterno, clave: string) =>
    c.pedir('POST', `${E}/ingresos-externos`, IngresoExternoSchema, { cuerpo: i, idempotencyKey: clave }),
  borrarIngresoExterno: async (ingresoId: string) => void (await c.pedir('DELETE', `${E}/ingresos-externos/${id(ingresoId)}`, Nada)),
});
