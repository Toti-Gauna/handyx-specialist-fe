import type { Ruta } from './tipos.ts';

export const rutasBase = {
  puerta: { ruta: '/', titulo: 'Entrada', lote: '1.1', descripcion: 'Decide a dónde ir según la sesión y el estado del alta.' },
  sinConexion: { ruta: '/sin-conexion/', titulo: 'Sin conexión', lote: '3.3', descripcion: 'Pantalla del service worker cuando no hay red (sin datos).' },
} as const satisfies Record<string, Ruta>;
