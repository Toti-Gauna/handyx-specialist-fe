// Puerto de datos de la PWA. Lo implementan el adaptador mock (fixtures sintéticos) y el HTTP
// (api-especialista) con el MISMO contrato: las pantallas no saben cuál está activo.
// Cada método existe en los dos adaptadores y en docs/api/openapi.yaml.
import type {
  Aceptacion,
  AgendaItem,
  Aviso,
  Baja,
  CajaResumen,
  CambioDisponibilidad,
  CasoSoporte,
  CasoSoporteDetalle,
  Conversacion,
  DatosAlta,
  Disponibilidad,
  FeeVigente,
  GuardarDatosAlta,
  Ingreso,
  Inicio,
  Mensaje,
  EnviarMensaje,
  NuevaPropuesta,
  NuevoCambio,
  NuevoCaso,
  Pago,
  PedidoDetalle,
  PedidoElegible,
  PerfilEspecialista,
  PerfilPublico,
  Preferencias,
  Propuesta,
  Registro,
  Sesion,
  TipoDocumento,
  Trabajo,
  TrabajoDetalle,
} from '../contracts/dto.ts';
import type { Rubro } from '../contracts/rubros.ts';
import type { EstadoTrabajo } from '../contracts/maquinas.ts';

export interface Pagina<T> {
  items: T[];
  siguienteCursor: string | null;
}

/** Idempotency-Key: la genera la pantalla una vez por intención y la reusa al reintentar. */
export type ClaveIdempotencia = string;

export interface EspecialistaApi {
  readonly origen: 'mock' | 'http';
  /** "Ahora" para mostrar cuentas regresivas. Los vencimientos los decide siempre el servidor. */
  ahora(): Date;

  // Acceso
  /** Sesión actual o null si no hay (401 no es un error para esta consulta). */
  sesion(): Promise<Sesion | null>;
  ingresar(datos: Ingreso): Promise<Sesion>;
  /** Respuesta neutra: es igual exista o no la cuenta. */
  registrar(datos: Registro): Promise<void>;
  /** Respuesta neutra: es igual exista o no la cuenta. */
  recuperar(email: string): Promise<void>;
  salir(): Promise<void>;

  // Alta y perfil
  perfil(): Promise<PerfilEspecialista>;
  perfilPublico(): Promise<PerfilPublico>;
  datosAlta(): Promise<DatosAlta>;
  guardarDatosAlta(datos: GuardarDatosAlta): Promise<DatosAlta>;
  /** Queda `cargado`: solo Operations verifica. Antecedentes no existen como documento. */
  cargarDocumento(tipo: TipoDocumento, rubro?: Rubro, archivo?: Blob): Promise<PerfilEspecialista>;
  elegirRubros(rubros: Rubro[]): Promise<PerfilEspecialista>;
  enviarAlta(): Promise<PerfilEspecialista>;

  // Disponibilidad y bandeja
  disponibilidad(): Promise<Disponibilidad>;
  actualizarDisponibilidad(cambio: CambioDisponibilidad): Promise<Disponibilidad>;
  inicio(): Promise<Inicio>;
  /** Filtrados en el servidor por alta, rubro habilitado, cobertura y opt-in de urgencias. */
  pedidosElegibles(cursor?: string): Promise<Pagina<PedidoElegible>>;
  pedido(id: string): Promise<PedidoDetalle>;
  avisos(): Promise<Aviso[]>;
  marcarAvisoLeido(id: string): Promise<void>;

  // Propuestas
  enviarPropuesta(datos: NuevaPropuesta, clave: ClaveIdempotencia): Promise<Propuesta>;
  responderPropuesta(id: string, accion: 'aceptar' | 'rechazar', version: number, clave: ClaveIdempotencia): Promise<Aceptacion>;
  retirarPropuesta(id: string): Promise<Propuesta>;

  // Trabajos y agenda
  trabajos(vista: 'activos' | 'historial'): Promise<Pagina<Trabajo>>;
  trabajo(id: string): Promise<TrabajoDetalle>;
  avanzarTrabajo(id: string, hacia: Exclude<EstadoTrabajo, 'agendado'>, version: number, clave: ClaveIdempotencia): Promise<Trabajo>;
  proponerCambio(id: string, cambio: NuevoCambio, clave: ClaveIdempotencia): Promise<Propuesta>;
  agenda(desde: string, hasta: string): Promise<AgendaItem[]>;

  // Mensajes
  conversaciones(): Promise<Conversacion[]>;
  conversacion(id: string): Promise<Conversacion>;
  mensajes(conversacionId: string): Promise<Mensaje[]>;
  enviarMensaje(conversacionId: string, mensaje: EnviarMensaje, clave: ClaveIdempotencia): Promise<Mensaje>;

  // Caja
  cajaResumen(): Promise<CajaResumen>;
  pagos(): Promise<Pagina<Pago>>;
  reportarCobro(pagoId: string, clave: ClaveIdempotencia): Promise<Pago>;
  marcarDiscrepancia(pagoId: string, clave: ClaveIdempotencia): Promise<Pago>;

  // Soporte
  casos(): Promise<CasoSoporte[]>;
  caso(id: string): Promise<CasoSoporteDetalle>;
  abrirCaso(datos: NuevoCaso, clave: ClaveIdempotencia): Promise<CasoSoporte>;
  responderCaso(id: string, texto: string, clave: ClaveIdempotencia): Promise<CasoSoporteDetalle>;

  // Fee y cuenta
  feeVigente(): Promise<FeeVigente>;
  aceptarAvisoFee(politicaId: string, version: number): Promise<FeeVigente>;
  preferencias(): Promise<Preferencias>;
  guardarPreferencias(p: Omit<Preferencias, 'push'>): Promise<Preferencias>;
  activarPush(): Promise<Preferencias>;
  baja(): Promise<Baja | null>;
  solicitarBaja(): Promise<Baja>;
  cancelarBaja(): Promise<void>;

  /**
   * Solo en el mock: simulación rotulada de la comisión por efectivo FUERA del fee 0 % (política futura,
   * no vigente, sin cobros). No existe en la API real.
   */
  simulacionPostDemo?(): Promise<SimulacionPostDemo>;
}

export interface SimulacionPostDemo {
  rotulo: string;
  entradas: Array<{
    pagoId: string;
    descripcion: string;
    cobrado: { centavos: number; moneda: 'ARS' };
    comision: { centavos: number; moneda: 'ARS' };
    estado: 'adeudada' | 'saldada';
  }>;
}
