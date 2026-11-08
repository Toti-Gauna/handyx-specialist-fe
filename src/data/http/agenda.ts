import { z } from 'zod';
import { AgendaMesSchema, ResumenAgendaSchema, TurnoAgendaSchema } from '../../contracts/agenda.ts';
import { paginado } from '../../contracts/dto.ts';
import type { ApiAgenda } from '../api/agenda.ts';
import type { ClienteHttp } from './cliente.ts';
import { id } from './comun.ts';

export const agendaHttp = (c: ClienteHttp): ApiAgenda => ({
  resumenAgenda: () => c.pedir('GET', '/v1/especialista/agenda/resumen', ResumenAgendaSchema),
  turnosAgenda: (vista, cursor) => c.pedir('GET', `/v1/especialista/agenda/turnos?vista=${vista}${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ''}`, paginado(TurnoAgendaSchema)),
  agendaMes: (mes, filtro = 'todo') => c.pedir('GET', `/v1/especialista/agenda/mes?mes=${id(mes)}&filtro=${filtro}`, AgendaMesSchema),
  turnosDelDia: (fecha) => c.pedir('GET', `/v1/especialista/agenda/dias/${id(fecha)}`, z.array(TurnoAgendaSchema)),
});
