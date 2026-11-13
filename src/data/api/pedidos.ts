// Dominio pedidos: disponibilidad, inicio, bandeja de pedidos elegibles y avisos.
import type { Aviso, CambioDisponibilidad, Disponibilidad, Inicio, PedidoDetalle, PedidoElegible } from '../../contracts/dto.ts';
import type { BusquedaMapa, DestinoMapa, MapaPedidos, PedidoEntrante } from '../../contracts/mapa.ts';
import type { Pagina } from './tipos.ts';

export interface ApiPedidos {
  disponibilidad(): Promise<Disponibilidad>;
  actualizarDisponibilidad(cambio: CambioDisponibilidad): Promise<Disponibilidad>;
  inicio(): Promise<Inicio>;
  /** Filtrados en el servidor por alta, rubro habilitado, cobertura y opt-in de urgencias. */
  pedidosElegibles(cursor?: string): Promise<Pagina<PedidoElegible>>;
  pedido(id: string): Promise<PedidoDetalle>;
  avisos(): Promise<Aviso[]>;
  marcarAvisoLeido(id: string): Promise<void>;
  /** Borrar un aviso o todos (0.6.0). Lo importante no se pierde: sigue en su pantalla (pedido, trabajo, caja…). */
  borrarAviso(id: string): Promise<void>;
  borrarAvisos(): Promise<void>;

  // ── Mapa de arreglos (0.11.0, lote 1.3: F-Inicio y F-Pedido) ──
  /** Destinos para «Me voy hasta…» (barrios y localidades cercanas). */
  mapaDestinos(): Promise<DestinoMapa[]>;
  /** Pedidos cercanos y zonas con actividad. La posición va en el cuerpo y no se guarda. Zona aproximada siempre. */
  mapaPedidos(busqueda: BusquedaMapa): Promise<MapaPedidos>;
  /** El detalle para la hoja del mapa: lo que contó el cliente y sus fotos, sin dirección ni teléfono. */
  mapaPedido(id: string): Promise<PedidoEntrante>;
  /** «Ahora no»: lo saca de tu mapa. No tiene ninguna consecuencia. */
  descartarPedido(id: string): Promise<void>;
}
