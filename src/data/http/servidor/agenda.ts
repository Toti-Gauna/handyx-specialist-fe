// Agenda y tu día contra api-especialista (ola 2.5). Ruta por ruta como docs/api/openapi.yaml; cada respuesta se valida
// con el contrato. La posición del recorrido va en el cuerpo y no se guarda.
import { z } from 'zod';
import { AgendaMesSchema, DiaSchema, ResumenAgendaSchema, TurnoAgendaSchema, type OrdenParadas, type RecorridoDia, type VistaAgenda } from '../../../contracts/agenda.ts';
import { MensajeChatSchema } from '../../../contracts/chat.ts';
import type { AvisoDemora } from '../../../contracts/modo-trabajo.ts';
import type { ClienteHttp } from '../cliente.ts';
import { id } from '../comun.ts';

const E = '/v1/especialista';
const Pagina = z.strictObject({ items: z.array(TurnoAgendaSchema), siguienteCursor: z.string().nullable() });
const q = (p: Record<string, string | undefined>) => {
  const s = new URLSearchParams(Object.entries(p).filter((x): x is [string, string] => x[1] !== undefined)).toString();
  return s ? `?${s}` : '';
};

export const agendaServidor = (c: ClienteHttp) => ({
  agendaResumen: () => c.pedir('GET', `${E}/agenda/resumen`, ResumenAgendaSchema),
  agendaTurnos: (vista: VistaAgenda, cursor?: string) => c.pedir('GET', `${E}/agenda/turnos${q({ vista, cursor })}`, Pagina),
  agendaMes: (mes: string, filtro?: 'todo' | 'obras' | 'trabajos') => c.pedir('GET', `${E}/agenda/mes${q({ mes, filtro })}`, AgendaMesSchema),
  agendaDia: (fecha: string) => c.pedir('GET', `${E}/agenda/dias/${id(fecha)}`, z.array(TurnoAgendaSchema)),
  dia: () => c.pedir('GET', `${E}/dia`, DiaSchema),
  recorridoDia: (r: RecorridoDia) => c.pedir('POST', `${E}/dia/recorrido`, DiaSchema, { cuerpo: r }),
  ordenarDia: (o: OrdenParadas) => c.pedir('PUT', `${E}/dia/orden`, DiaSchema, { cuerpo: o }),
  avisarDemora: (trabajoId: string, a: AvisoDemora, clave: string) =>
    c.pedir('POST', `${E}/trabajos/${id(trabajoId)}/demora`, MensajeChatSchema, { cuerpo: a, idempotencyKey: clave }),
});
export { q };
