import type { Ruta } from './tipos.ts';

// Agenda, ingresos y gastos de la pestaña Taller (lote 2.1). La Agenda sigue en `/agenda/` (se llega desde Inicio y
// desde Taller); `/agenda/` mismo está en rutas/trabajos.ts (clave `agenda`).
export const rutasAgenda = {
  agendaMes: {
    ruta: '/agenda/mes/',
    titulo: 'Agenda del mes',
    lote: '2.1',
    descripcion: 'F-AgendaMes: el mes completo con una barrita por obra, por trabajos y por lo hecho; elegís un día y ves sus turnos.',
  },
  ingresos: {
    ruta: '/taller/ingresos/',
    titulo: 'Tus ingresos',
    lote: '2.1',
    descripcion: 'F-Ingresos: bruto cobrado (verificado e informado por separado), gastos, neto y ganancia por trabajo. Sin tarifa de Handyx.',
  },
  ingresoGasto: {
    ruta: '/taller/ingresos/gasto/',
    titulo: 'Cargar un gasto',
    lote: '2.1',
    descripcion: 'H0-Gasto: con la foto del ticket o a mano; registrarlo como gasto, cobrárselo al cliente (adicional) o las dos.',
  },
} as const satisfies Record<string, Ruta>;
