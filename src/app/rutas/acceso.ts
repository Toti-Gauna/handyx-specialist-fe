import type { Ruta } from './tipos.ts';

// Acceso (lote 1.1, fase V.1): bienvenida, entrar (con contraseña, Google, Apple o un código), la segunda
// verificación al entrar y recuperar la contraseña. El registro (crear cuenta, verificar el email y aceptar) es del
// lote 1.2 y sigue acá hasta que lo mueva.
export const rutasAcceso = {
  bienvenida: { ruta: '/bienvenida/', titulo: 'Bienvenida', lote: '1.1', descripcion: 'D6-Bienvenida: la ciudad que se arma; crear cuenta o «Ya tengo cuenta».' },
  acceso: { ruta: '/acceso/', titulo: 'Entrar', lote: '1.1', descripcion: 'D6-Login: email o teléfono y contraseña, Google, Apple o entrar con un código.' },
  accesoVerificacion: { ruta: '/acceso/verificacion/', titulo: 'Segunda verificación', lote: '1.1', descripcion: 'D6-Login2FA: código de la app autenticadora, del SMS, del email o uno de respaldo.' },
  accesoCodigo: { ruta: '/acceso/codigo/', titulo: 'Entrar con un código', lote: '1.1', descripcion: 'D6-Acceso: recibir un código por email o por SMS, sin contraseña.' },
  accesoCodigoVerificar: { ruta: '/acceso/codigo/verificar/', titulo: 'Escribí el código', lote: '1.1', descripcion: 'D6-Codigo: los 6 números que llegaron; pedir otro cuando termina la espera.' },
  verificar: { ruta: '/verificar/', titulo: 'Verificá tu email', lote: '4.2', descripcion: 'Código de 6 números al email; después, la cuenta creada.' },
  aceptar: { ruta: '/registro/aceptar/', titulo: 'Un paso más', lote: '4.2', descripcion: 'Términos y privacidad para las cuentas nuevas de Google o Apple.' },
  recuperarNueva: { ruta: '/recuperar/nueva/', titulo: 'Contraseña nueva', lote: '1.1', descripcion: 'D6-Recuperar (2): elegir la contraseña nueva con el enlace del email, o enlace vencido.' },
  registro: { ruta: '/registro/', titulo: 'Crear cuenta', lote: '4.2', descripcion: 'Cuenta, términos y privacidad versionados.' },
  recuperar: { ruta: '/recuperar/', titulo: 'Recuperar la contraseña', lote: '1.1', descripcion: 'D6-Recuperar (1): pedir el enlace con el email o el teléfono.' },
} as const satisfies Record<string, Ruta>;
