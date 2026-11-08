import type { Ruta } from './tipos.ts';

export const rutasCuenta = {
  cuenta: { ruta: '/cuenta/', titulo: 'Cuenta', lote: '1.4', descripcion: 'Tu perfil, tu trabajo, tu cuenta, cómo ves la app y ayuda (F-Cuenta).' },
  cuentaPerfil: { ruta: '/cuenta/perfil/', titulo: 'Tu perfil', lote: '1.4', descripcion: 'Cómo te ven los clientes: foto, presentación, matrículas verificadas (CU-Perfil).' },
  cuentaSeguridad: { ruta: '/cuenta/seguridad/', titulo: 'Seguridad', lote: '1.4', descripcion: 'Segunda verificación, dispositivos y códigos de respaldo (D6-Seguridad).' },
  cuentaSeguridadApp: { ruta: '/cuenta/seguridad/app/', titulo: 'App autenticadora', lote: '1.4', descripcion: 'Escanear la clave, confirmar con un código y guardar los códigos de respaldo (D6-TOTP).' },
  cuentaDatos: { ruta: '/cuenta/datos/', titulo: 'Datos y verificación', lote: '1.4', descripcion: 'Tus datos y el estado de cada verificación, con los últimos números (CU-Datos).' },
  cuentaCobros: { ruta: '/cuenta/cobros/', titulo: 'Medios de cobro', lote: '1.4', descripcion: 'Mercado Pago, efectivo o transferencia; el pago va directo a vos (CU-Cobros).' },
  cuentaNotificaciones: { ruta: '/cuenta/notificaciones/', titulo: 'Avisos que te llegan', lote: '1.4', descripcion: 'Qué avisos recibís, el silencio nocturno y los avisos del teléfono (CU-Notificaciones).' },
  cuentaPrivacidad: { ruta: '/cuenta/privacidad/', titulo: 'Privacidad y baja', lote: '1.4', descripcion: 'Descargar tus datos, el aviso de privacidad, tu sesión y la baja (CU-Privacidad).' },
  baja: { ruta: '/baja/', titulo: 'Baja de tu cuenta', lote: '2.1', descripcion: 'Estado real de la solicitud de baja.' },
} as const satisfies Record<string, Ruta>;
