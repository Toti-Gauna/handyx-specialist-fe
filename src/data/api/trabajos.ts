// Dominio trabajos y agenda: estados del trabajo, llegada, cancelación, cambios de fecha, adicionales y llamada puente.
import type {
  Adicional,
  AgendaItem,
  AvanceTrabajo,
  LlamadaPuente,
  MotivoCancelacion,
  MotivoRespaldoLlegada,
  NuevoAdicional,
  NuevoCambio,
  Propuesta,
  Trabajo,
  TrabajoDetalle,
} from '../../contracts/dto.ts';
import type { Dia, OrdenParadas, RecorridoDia } from '../../contracts/agenda.ts';
import type { MensajeChat } from '../../contracts/chat.ts';
import type { Cobro, InformeCobro } from '../../contracts/ingresos.ts';
import type { AvisoDemora } from '../../contracts/modo-trabajo.ts';
import type { ClaveIdempotencia, Pagina } from './tipos.ts';

export interface ApiTrabajos {
  trabajos(vista: 'activos' | 'historial'): Promise<Pagina<Trabajo>>;
  trabajo(id: string): Promise<TrabajoDetalle>;
  /** Salir, empezar y terminar. Terminar retira los adicionales pendientes y crea el cobro por el total vigente. */
  avanzarTrabajo(id: string, hacia: AvanceTrabajo, version: number, clave: ClaveIdempotencia): Promise<Trabajo>;
  /** "Ya llegué" (0.7.0): el respaldo de la llegada automática, solo cuando la ubicación anda mal y con el motivo. */
  marcarLlegada(id: string, motivo: MotivoRespaldoLlegada, version: number, clave: ClaveIdempotencia): Promise<Trabajo>;
  /** Cancelar con motivo (0.7.0). Sin penalización automática; el pedido puede volver a ofrecerse. */
  cancelarTrabajo(id: string, motivo: MotivoCancelacion, version: number, clave: ClaveIdempotencia): Promise<Trabajo>;
  proponerCambio(id: string, cambio: NuevoCambio, clave: ClaveIdempotencia): Promise<Propuesta>;
  /** Repuestos o mano de obra con el trabajo en curso (0.7.0): los acepta o rechaza el usuario. */
  crearAdicional(trabajoId: string, adicional: NuevoAdicional, clave: ClaveIdempotencia): Promise<Adicional>;
  retirarAdicional(trabajoId: string, adicionalId: string): Promise<Adicional>;
  /** Número puente para llamar a la otra parte sin ver su teléfono (0.7.0). Dura unos minutos. */
  llamada(trabajoId: string): Promise<LlamadaPuente>;
  agenda(desde: string, hasta: string): Promise<AgendaItem[]>;

  // ── Tu día, demora y cobro (0.11.0, lote 1.3: F-InicioDia, F-InicioRuta, TR-EnCamino y TR-Cobro) ──
  /** Las paradas de hoy en orden con el tramo entre una y otra. */
  dia(): Promise<Dia>;
  /** Tu día con el primer tramo desde donde estás (la posición va en el cuerpo y no se guarda). */
  recorridoDia(r: RecorridoDia): Promise<Dia>;
  /** Reordenar las paradas de hoy: cambia solo tu recorrido, no el horario de ningún cliente. */
  ordenarDia(o: OrdenParadas): Promise<Dia>;
  /** Avisarle al cliente que llegás 15 o 30 minutos tarde: una tarjeta en el chat del trabajo. */
  avisarDemora(trabajoId: string, aviso: AvisoDemora, clave: ClaveIdempotencia): Promise<MensajeChat>;
  /** El cobro de un trabajo (reportado ≠ verificado). */
  cobro(pagoId: string): Promise<Cobro>;
  /** Informar cómo te pagó el cliente: queda «informado por vos» hasta que se confirma o se verifica. */
  informarCobro(pagoId: string, informe: InformeCobro, clave: ClaveIdempotencia): Promise<Cobro>;
}
