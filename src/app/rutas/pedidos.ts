import type { Ruta } from './tipos.ts';

export const rutasPedidos = {
  inicio: { ruta: '/inicio/', titulo: 'Inicio', lote: '2.2', descripcion: 'Estado del alta, disponibilidad, pedidos elegibles y agenda próxima.' },
  disponibilidad: { ruta: '/disponibilidad/', titulo: 'Tu disponibilidad', lote: '2.2', descripcion: 'Urgentes Ahora, programados, franjas y zonas.' },
  pedidos: { ruta: '/pedidos/', titulo: 'Pedidos', lote: '2.2', descripcion: 'Bandeja de pedidos urgentes y programados.' },
  pedido: { ruta: '/pedidos/detalle/', titulo: 'Pedido', lote: '4.5', descripcion: 'Detalle con la zona, esperando al cliente, te eligió o no, y la propuesta del cliente.' },
  tuPrecio: { ruta: '/pedidos/propuesta/', titulo: 'Tu precio', lote: '4.5', descripcion: 'Cuándo podés ir, "Handyx sugiere · Vos decidís", qué incluye y cuánto recibís (también para contraofertar).' },
  notificaciones: { ruta: '/notificaciones/', titulo: 'Avisos', lote: '2.2', descripcion: 'Avisos dentro de la app, urgentes y programados diferenciados.' },
} as const satisfies Record<string, Ruta>;
