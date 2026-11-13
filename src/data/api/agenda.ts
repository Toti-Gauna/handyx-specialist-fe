// Dominio agenda del taller (contrato 0.11.0, lote 2.1: F-Herramientas, F-Agenda, F-AgendaPasadas y F-AgendaMes).
// Una oferta no es un turno: se confirma cuando la otra parte acepta. Los cobros de las pasadas siguen la regla
// reportado ≠ verificado.
import type { AgendaMes, ResumenAgenda, TurnoAgenda, VistaAgenda } from '../../contracts/agenda.ts';
import type { Pagina } from './tipos.ts';

export type FiltroMes = 'todo' | 'obras' | 'trabajos';

export interface ApiAgenda {
  /** Pasadas, hoy y futuras, la semana de un vistazo y lo cobrado del mes. */
  resumenAgenda(): Promise<ResumenAgenda>;
  /** Los turnos de una vista, con su cobro en las pasadas (las más recientes primero). */
  turnosAgenda(vista: VistaAgenda, cursor?: string | null): Promise<Pagina<TurnoAgenda>>;
  /** El mes completo con obras y trabajos por día. `mes` es AAAA-MM. */
  agendaMes(mes: string, filtro?: FiltroMes): Promise<AgendaMes>;
  /** Los turnos de un día del mes. `fecha` es AAAA-MM-DD (Buenos Aires). */
  turnosDelDia(fecha: string): Promise<TurnoAgenda[]>;
}
