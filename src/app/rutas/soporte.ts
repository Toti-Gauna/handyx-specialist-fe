import type { Ruta } from './tipos.ts';

export const rutasSoporte = {
  soporte: { ruta: '/soporte/', titulo: 'Centro de ayuda', lote: '1.4', descripcion: 'Preguntas frecuentes por tema, buscador y acceso a soporte (D6-Ayuda).' },
  casosSoporte: { ruta: '/soporte/casos/', titulo: 'Tus casos de ayuda', lote: '1.4', descripcion: 'Tus casos con soporte, y abrir uno nuevo (asistencia, reclamo, pago o cuenta).' },
  casoSoporte: { ruta: '/soporte/detalle/', titulo: 'Caso de ayuda', lote: '2.4', descripcion: 'Respuestas y estado de un caso.' },
} as const satisfies Record<string, Ruta>;
