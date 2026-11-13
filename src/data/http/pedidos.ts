import { z } from 'zod';
import { AvisoSchema, DisponibilidadSchema, InicioSchema, paginado, PedidoDetalleSchema, PedidoElegibleSchema } from '../../contracts/dto.ts';
import { DestinoMapaSchema, MapaPedidosSchema, PedidoEntranteSchema } from '../../contracts/mapa.ts';
import type { ApiPedidos } from '../api/pedidos.ts';
import type { ClienteHttp } from './cliente.ts';
import { id, Nada } from './comun.ts';

export const pedidosHttp = (c: ClienteHttp): ApiPedidos => ({
  disponibilidad: () => c.pedir('GET', '/v1/especialista/disponibilidad', DisponibilidadSchema),
  actualizarDisponibilidad: (cambio) => c.pedir('PUT', '/v1/especialista/disponibilidad', DisponibilidadSchema, { cuerpo: cambio }),
  inicio: () => c.pedir('GET', '/v1/especialista/inicio', InicioSchema),
  pedidosElegibles: (cursor) =>
    c.pedir('GET', `/v1/especialista/pedidos${cursor ? `?cursor=${encodeURIComponent(cursor)}` : ''}`, paginado(PedidoElegibleSchema)),
  pedido: (pid) => c.pedir('GET', `/v1/especialista/pedidos/${id(pid)}`, PedidoDetalleSchema),
  avisos: () => c.pedir('GET', '/v1/especialista/avisos', z.array(AvisoSchema)),
  async marcarAvisoLeido(aid) {
    await c.pedir('POST', `/v1/especialista/avisos/${id(aid)}/leido`, Nada);
  },
  async borrarAviso(aid) {
    await c.pedir('DELETE', `/v1/especialista/avisos/${id(aid)}`, Nada);
  },
  async borrarAvisos() {
    await c.pedir('DELETE', '/v1/especialista/avisos', Nada);
  },
  // Mapa de arreglos (0.11.0): la posición va en el cuerpo del POST, nunca en la URL.
  mapaDestinos: () => c.pedir('GET', '/v1/especialista/mapa/destinos', z.array(DestinoMapaSchema)),
  mapaPedidos: (busqueda) => c.pedir('POST', '/v1/especialista/mapa/pedidos', MapaPedidosSchema, { cuerpo: busqueda }),
  mapaPedido: (pid) => c.pedir('GET', `/v1/especialista/mapa/pedidos/${id(pid)}`, PedidoEntranteSchema),
  async descartarPedido(pid) {
    await c.pedir('POST', `/v1/especialista/pedidos/${id(pid)}/descarte`, Nada);
  },
});
