import type { Ruta } from './tipos.ts';

export const rutasCaja = {
  caja: { ruta: '/caja/', titulo: 'Caja', lote: '2.5', descripcion: 'Pagos directos: pendientes, reportados y verificados.' },
} as const satisfies Record<string, Ruta>;
