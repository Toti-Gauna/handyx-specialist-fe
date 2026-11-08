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
}
