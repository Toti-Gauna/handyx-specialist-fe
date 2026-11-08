import type { Ruta } from './tipos.ts';

export const rutasObras = {
  obraPlan: { ruta: '/trabajos/obra/plan/', titulo: 'Plan de obra', lote: '4.7', descripcion: 'Etapas en una línea de tiempo con fechas, importe, lo que incluyen, adicionales y el cobro de cada una.' },
  obraJornadas: { ruta: '/trabajos/obra/jornadas/', titulo: 'Jornadas', lote: '4.7', descripcion: 'Días de trabajo en el calendario; pedir otro día para una jornada sin mover el resto.' },
  obraDiario: { ruta: '/trabajos/obra/diario/', titulo: 'Diario de obra', lote: '4.7', descripcion: 'Avance del día con una nota y fotos, que ve el cliente.' },
} as const satisfies Record<string, Ruta>;
