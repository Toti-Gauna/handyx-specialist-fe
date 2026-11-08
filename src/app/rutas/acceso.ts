import type { Ruta } from './tipos.ts';

export const rutasAcceso = {
  bienvenida: { ruta: '/bienvenida/', titulo: 'Bienvenida', lote: '4.2', descripcion: 'Tres láminas: tu precio, la plata directo a vos y sin comisión; crear cuenta o entrar.' },
  acceso: { ruta: '/acceso/', titulo: 'Entrar', lote: '4.2', descripcion: 'Google, Apple (solo en dispositivos Apple) o email y contraseña.' },
  verificar: { ruta: '/verificar/', titulo: 'Verificá tu email', lote: '4.2', descripcion: 'Código de 6 números al email; después, la cuenta creada.' },
  aceptar: { ruta: '/registro/aceptar/', titulo: 'Un paso más', lote: '4.2', descripcion: 'Términos y privacidad para las cuentas nuevas de Google o Apple.' },
  recuperarNueva: { ruta: '/recuperar/nueva/', titulo: 'Contraseña nueva', lote: '4.2', descripcion: 'Elegir una contraseña con el enlace del email, o enlace vencido.' },
  registro: { ruta: '/registro/', titulo: 'Crear cuenta', lote: '4.2', descripcion: 'Cuenta, términos y privacidad versionados.' },
  recuperar: { ruta: '/recuperar/', titulo: 'Recuperar acceso', lote: '4.2', descripcion: 'Recuperación de contraseña.' },
} as const satisfies Record<string, Ruta>;
