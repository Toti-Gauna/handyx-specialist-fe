import type { Ruta } from './tipos.ts';

export const rutasTrabajos = {
  trabajos: { ruta: '/trabajos/', titulo: 'Mis trabajos', lote: '2.4', descripcion: 'Trabajos y obras activos e historial (pestaña Obras).' },
  trabajo: { ruta: '/trabajos/detalle/', titulo: 'Trabajo', lote: '1.3', descripcion: 'F-Trabajo: los pasos (acordado, salir, llegué, terminé), dirección, cliente, chat, cambiar fecha, adicionales y salir para allá.' },
  enCamino: { ruta: '/en-camino/', titulo: 'En camino', lote: '1.3', descripcion: 'TR-EnCamino: mapa con tu posición en vivo y el trayecto; el cliente te ve solo durante el viaje; avisar demora, dejar de compartir y «Ya llegué» de respaldo.' },
  trabajoCobro: { ruta: '/trabajos/cobro/', titulo: '¿Cómo te pagó?', lote: '1.3', descripcion: 'TR-Cobro: informás cómo te pagó el cliente (efectivo, Mercado Pago o transferencia; todo o una parte). Queda informado hasta que se verifica.' },
  trabajoAdicional: { ruta: '/trabajos/adicional/', titulo: 'Agregar al trabajo', lote: '4.6', descripcion: 'Repuestos o mano de obra que el cliente acepta o rechaza.' },
  trabajoCambio: { ruta: '/trabajos/cambio/', titulo: 'Cambiar la fecha', lote: '4.6', descripcion: 'Motivo, día y franja: queda como pedido hasta que el cliente acepte.' },
  trabajoCancelar: { ruta: '/trabajos/cancelar/', titulo: 'Cancelar el trabajo', lote: '4.6', descripcion: 'Primero otras opciones; después el motivo y la confirmación.' },
  trabajoTerminado: { ruta: '/trabajos/terminado/', titulo: '¡Terminaste!', lote: '4.7', descripcion: 'Monto, desglose e informar el cobro; en una obra, el cierre etapa por etapa.' },
  agenda: { ruta: '/agenda/', titulo: 'Agenda', lote: '2.4', descripcion: 'F-Agenda: pasadas, hoy y futuras con la semana entera; se llega desde Inicio y desde la pestaña Taller.' },
} as const satisfies Record<string, Ruta>;
