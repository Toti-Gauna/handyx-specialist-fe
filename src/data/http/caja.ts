import { CajaResumenSchema, MediosCobroSchema, paginado, PagoSchema } from '../../contracts/dto.ts';
import type { ApiCaja } from '../api/caja.ts';
import type { ClienteHttp } from './cliente.ts';
import { id } from './comun.ts';

// `simulacionPostDemo` no existe en la API real: solo el mock la ofrece.
export const cajaHttp = (c: ClienteHttp): ApiCaja => ({
  cajaResumen: () => c.pedir('GET', '/v1/especialista/caja/resumen', CajaResumenSchema),
  pagos: () => c.pedir('GET', '/v1/especialista/caja', paginado(PagoSchema)),
  reportarCobro: (pid, clave) => c.pedir('POST', `/v1/especialista/pagos/${id(pid)}/reporte`, PagoSchema, { idempotencyKey: clave }),
  marcarDiscrepancia: (pid, clave) => c.pedir('POST', `/v1/especialista/pagos/${id(pid)}/discrepancia`, PagoSchema, { idempotencyKey: clave }),
  mediosCobro: () => c.pedir('GET', '/v1/especialista/cobros', MediosCobroSchema),
  guardarMediosCobro: (m) => c.pedir('PUT', '/v1/especialista/cobros', MediosCobroSchema, { cuerpo: m }),
});
