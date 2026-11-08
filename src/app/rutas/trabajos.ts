import type { Ruta } from './tipos.ts';

export const rutasTrabajos = {
  trabajos: { ruta: '/trabajos/', titulo: 'Mis trabajos', lote: '2.4', descripcion: 'Trabajos y obras activos e historial (pestaña Obras).' },
  trabajo: { ruta: '/trabajos/detalle/', titulo: 'Trabajo', lote: '4.6', descripcion: 'Trabajo acordado: cliente, dirección y mapa, chat y llamada por la app, en curso con cronómetro y adicionales.' },
  enCamino: { ruta: '/en-camino/', titulo: 'En camino', lote: '4.6', descripcion: 'Mapa con tu posición en vivo, el trayecto y la llegada automática (con "Ya llegué" de respaldo).' },
  trabajoAdicional: { ruta: '/trabajos/adicional/', titulo: 'Agregar al trabajo', lote: '4.6', descripcion: 'Repuestos o mano de obra que el cliente acepta o rechaza.' },
  trabajoCambio: { ruta: '/trabajos/cambio/', titulo: 'Cambiar la fecha', lote: '4.6', descripcion: 'Motivo, día y franja: queda como pedido hasta que el cliente acepte.' },
  trabajoCancelar: { ruta: '/trabajos/cancelar/', titulo: 'Cancelar el trabajo', lote: '4.6', descripcion: 'Primero otras opciones; después el motivo y la confirmación.' },
  trabajoTerminado: { ruta: '/trabajos/terminado/', titulo: '¡Terminaste!', lote: '4.7', descripcion: 'Monto, desglose e informar el cobro; en una obra, el cierre etapa por etapa.' },
  agenda: { ruta: '/agenda/', titulo: 'Agenda', lote: '2.4', descripcion: 'Calendario propio y fechas alternativas (se llega desde Inicio y, en la ola 2, desde la pestaña Taller).' },
} as const satisfies Record<string, Ruta>;
