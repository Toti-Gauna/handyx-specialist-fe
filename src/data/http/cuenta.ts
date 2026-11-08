import { BajaSchema, FeeVigenteSchema, PreferenciasSchema } from '../../contracts/dto.ts';
import type { ApiCuenta } from '../api/cuenta.ts';
import type { ClienteHttp } from './cliente.ts';
import { Nada } from './comun.ts';

export const cuentaHttp = (c: ClienteHttp): ApiCuenta => ({
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
});
