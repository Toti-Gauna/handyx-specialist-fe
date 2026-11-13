import type { Ruta } from './tipos.ts';

export const rutasMensajes = {
  mensajes: { ruta: '/mensajes/', titulo: 'Mensajes', lote: '2.3', descripcion: 'Conversaciones por pedido y trabajo.' },
  contactos: { ruta: '/mensajes/contactos/', titulo: 'Contactos', lote: '4.8', descripcion: 'Solo los agregados desde un chat, sin teléfonos.' },
  hilo: { ruta: '/mensajes/hilo/', titulo: 'Conversación', lote: '2.3', descripcion: 'Chat con texto, fotos y presupuesto estructurado.' },
} as const satisfies Record<string, Ruta>;
