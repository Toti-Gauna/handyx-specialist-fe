import type { Ruta } from './tipos.ts';

export const rutasCuenta = {
  cuenta: { ruta: '/cuenta/', titulo: 'Cuenta', lote: '2.1', descripcion: 'Documentos y estado, preferencias, soporte y baja.' },
  cuentaDatos: { ruta: '/cuenta/datos/', titulo: 'Datos personales', lote: '4.8', descripcion: 'Lo que cargaste en el alta, de solo lectura (DNI y CUIT con sus últimos números).' },
  cuentaCobros: { ruta: '/cuenta/cobros/', titulo: 'Cómo te paga el cliente', lote: '4.8', descripcion: 'Mercado Pago, efectivo o los dos; el pago va directo a vos.' },
  cuentaNotificaciones: { ruta: '/cuenta/notificaciones/', titulo: 'Notificaciones', lote: '4.8', descripcion: 'Qué avisos recibís y los avisos del dispositivo.' },
  cuentaPrivacidad: { ruta: '/cuenta/privacidad/', titulo: 'Privacidad y baja', lote: '4.8', descripcion: 'Quién ve qué, documentos, políticas y eliminar tu cuenta.' },
  baja: { ruta: '/baja/', titulo: 'Baja de tu cuenta', lote: '2.1', descripcion: 'Estado real de la solicitud de baja.' },
} as const satisfies Record<string, Ruta>;
