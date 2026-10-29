import {
  CambioDisponibilidadSchema,
  DisponibilidadSchema,
  FeeVigenteSchema,
  paginado,
  PedidoElegibleSchema,
  PerfilEspecialistaSchema,
  SesionSchema,
} from '../../contracts/dto.ts';
import type { EspecialistaApi } from '../api.ts';
import { ClienteHttp, type OpcionesCliente } from './cliente.ts';

// Rutas: docs/api/openapi.yaml (api-especialista v0.1).
export function crearApiHttp(o: OpcionesCliente): EspecialistaApi {
  const c = new ClienteHttp(o);
  return {
    origen: 'http',
    async sesion() {
      const s = await c.pedir('GET', '/v1/auth/sesion', SesionSchema.nullable(), { nuloSi401: true });
      c.recordarCsrf(s?.csrfToken ?? null);
      return s;
    },
    perfil: () => c.pedir('GET', '/v1/especialista/perfil', PerfilEspecialistaSchema),
    disponibilidad: () => c.pedir('GET', '/v1/especialista/disponibilidad', DisponibilidadSchema),
    actualizarDisponibilidad: (cambio) =>
      c.pedir('PUT', '/v1/especialista/disponibilidad', DisponibilidadSchema, {
        cuerpo: CambioDisponibilidadSchema.parse(cambio),
      }),
    pedidosElegibles: (cursor) =>
      c.pedir(
        'GET',
        `/v1/especialista/pedidos${cursor ? `?cursor=${encodeURIComponent(cursor)}` : ''}`,
        paginado(PedidoElegibleSchema),
      ),
    feeVigente: () => c.pedir('GET', '/v1/fee/vigente', FeeVigenteSchema),
  };
}
