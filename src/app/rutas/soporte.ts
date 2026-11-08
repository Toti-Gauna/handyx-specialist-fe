import type { Ruta } from './tipos.ts';

export const rutasSoporte = {
  soporte: { ruta: '/soporte/', titulo: 'Centro de ayuda', lote: '4.8', descripcion: 'Asistencia y reclamos con su historial.' },
  casoSoporte: { ruta: '/soporte/detalle/', titulo: 'Caso de ayuda', lote: '2.4', descripcion: 'Respuestas y estado de un caso.' },
} as const satisfies Record<string, Ruta>;
