// Dominio pedidos: disponibilidad, inicio, bandeja de pedidos elegibles y avisos.
import type { Aviso, CambioDisponibilidad, Disponibilidad, Inicio, PedidoDetalle, PedidoElegible } from '../../contracts/dto.ts';
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
}
