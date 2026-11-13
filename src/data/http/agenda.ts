// Adaptador HTTP de la agenda (lote 2.1). Las rutas y la validación viven en `servidor/agenda.ts` (lote 2.5, probado
// contra la API real): acá solo se adapta al puerto de la PWA.
import type { ApiAgenda } from '../api/agenda.ts';
import type { ClienteHttp } from './cliente.ts';
import { agendaServidor } from './servidor/agenda.ts';

export const agendaHttp = (c: ClienteHttp): ApiAgenda => {
  const s = agendaServidor(c);
  return {
    resumenAgenda: s.agendaResumen,
    turnosAgenda: (vista, cursor) => s.agendaTurnos(vista, cursor ?? undefined),
    agendaMes: (mes, filtro = 'todo') => s.agendaMes(mes, filtro),
    turnosDelDia: s.agendaDia,
  };
};
