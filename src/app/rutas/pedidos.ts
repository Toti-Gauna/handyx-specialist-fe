import type { Ruta } from './tipos.ts';

export const rutasPedidos = {
  inicio: { ruta: '/inicio/', titulo: 'Inicio', lote: '1.3', descripcion: 'F-Inicio y F-InicioDia: el mapa de arreglos con Disponible en la cabecera, pedidos que llegan flotando, pedidos cercanos y, si tenés trabajos hoy, tu día.' },
  recorrido: { ruta: '/inicio/recorrido/', titulo: 'Tu recorrido', lote: '1.3', descripcion: 'F-InicioRuta: las paradas de hoy en orden con el tramo entre una y otra; podés reordenarlas.' },
  disponibilidad: { ruta: '/disponibilidad/', titulo: 'Tu disponibilidad', lote: '2.2', descripcion: 'Urgentes Ahora, programados, franjas y zonas.' },
  pedidos: { ruta: '/pedidos/', titulo: 'Pedidos', lote: '2.2', descripcion: 'Bandeja de pedidos urgentes y programados.' },
  pedido: { ruta: '/pedidos/detalle/', titulo: 'Pedido', lote: '1.3', descripcion: 'F-Pedido: qué necesita el cliente, zona aproximada, franja, fotos y lo que sugiere Handyx; cotizar, otra fecha o «Ahora no». Con las propuestas del pedido.' },
  tuPrecio: { ruta: '/pedidos/propuesta/', titulo: 'Tu precio', lote: '1.3', descripcion: 'F-Precio a F-Enviada: tu precio con la cinta o el teclado, día y franja (u horario a medida), revisar y enviar (también para contraofertar).' },
  notificaciones: { ruta: '/notificaciones/', titulo: 'Avisos', lote: '2.2', descripcion: 'Avisos dentro de la app, urgentes y programados diferenciados.' },
} as const satisfies Record<string, Ruta>;
