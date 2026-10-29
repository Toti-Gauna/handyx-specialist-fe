// Esquemas Zod de lo que intercambian api-especialista y la PWA (contrato v0.1.0, borrador).
// El servidor valida con los mismos esquemas; el cliente valida cada respuesta y trata un desajuste
// como error de contrato (nunca lo "arregla" con datos de muestra). OpenAPI: docs/api/openapi.yaml.
import { z } from 'zod';
import { MONEDAS } from './dinero.ts';
import {
  ESTADOS_ALTA,
  ESTADOS_BAJA,
  ESTADOS_DOCUMENTO,
  ESTADOS_PAGO,
  ESTADOS_PEDIDO,
  ESTADOS_PRESENCIAL,
  ESTADOS_PROPUESTA,
  ESTADOS_SOPORTE,
  ESTADOS_TRABAJO,
} from './maquinas.ts';
import { RUBROS } from './rubros.ts';

export const IdSchema = z.uuid();
export const InstanteSchema = z.iso.datetime(); // UTC con Z
export const HoraSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);

export const MontoSchema = z.strictObject({
  centavos: z.int().nonnegative(),
  moneda: z.enum(MONEDAS),
});

// ── Errores ──────────────────────────────────────────────────────────────────────────────────────
// Código estable + mensaje seguro (sin internos) + requestId + errores de campo.
export const CODIGOS_ERROR = [
  'validacion',
  'no_autenticado',
  'sin_permiso',
  'no_encontrado', // también para recursos ajenos: no se revela si existen
  'conflicto_version',
  'propuesta_no_disponible', // vencida, reemplazada, retirada o ya respondida
  'transicion_invalida', // el estado actual no permite la acción (alta en revisión, trabajo ya cerrado…)
  'pedido_no_elegible',
  'tipo_archivo_prohibido',
  'limite',
  'servicio_no_disponible',
  'interno',
] as const;

export const ErrorApiSchema = z.strictObject({
  error: z.strictObject({
    codigo: z.enum(CODIGOS_ERROR),
    mensaje: z.string(),
    requestId: z.string(),
    campos: z.array(z.strictObject({ campo: z.string(), codigo: z.string() })).optional(),
  }),
});
export type ErrorApi = z.infer<typeof ErrorApiSchema>['error'];

export const paginado = <T extends z.ZodType>(item: T) =>
  z.strictObject({ items: z.array(item), siguienteCursor: z.string().nullable() });

// ── Sesión ───────────────────────────────────────────────────────────────────────────────────────
// La sesión es una cookie HttpOnly del backend. El csrfToken vive solo en memoria.
export const SesionSchema = z.strictObject({
  cuenta: z.strictObject({
    id: IdSchema,
    roles: z.array(z.enum(['usuario', 'especialista'])),
  }),
  csrfToken: z.string().min(16),
  expiraEn: InstanteSchema,
});
export type Sesion = z.infer<typeof SesionSchema>;

// ── Perfil y alta ────────────────────────────────────────────────────────────────────────────────
/** `elegido`: lo marcó el especialista y todavía no se revisó. Solo `habilitado` recibe pedidos. */
export const EstadoRubroSchema = z.enum(['elegido', 'habilitado', 'requiere_matricula', 'en_revision', 'no_habilitado']);

/** Qué le falta al alta para poder enviarse a revisión (lo calcula el servidor). */
export const FALTANTES_ENVIO = ['datos', 'dni', 'cuitCuil', 'fotoCara', 'rubros', 'matricula'] as const;
export type FaltanteEnvio = (typeof FALTANTES_ENVIO)[number];

export const PerfilEspecialistaSchema = z.strictObject({
  id: IdSchema,
  email: z.string(),
  nombre: z.string().nullable(),
  apellido: z.string().nullable(),
  estadoAlta: z.enum(ESTADOS_ALTA),
  /** Motivo seguro para mostrar cuando `requiere_correccion` o `rechazada` (sin datos sensibles). */
  motivoRevision: z.string().nullable(),
  documentos: z.strictObject({
    dni: z.enum(ESTADOS_DOCUMENTO),
    cuitCuil: z.enum(ESTADOS_DOCUMENTO),
    fotoCara: z.enum(ESTADOS_DOCUMENTO),
  }),
  antecedentes: z.enum(ESTADOS_PRESENCIAL),
  rubros: z.array(
    z.strictObject({
      rubro: z.enum(RUBROS),
      estado: EstadoRubroSchema,
      matricula: z.enum(ESTADOS_DOCUMENTO).nullable(),
    }),
  ),
  faltantesEnvio: z.array(z.enum(FALTANTES_ENVIO)),
  baja: z.enum(ESTADOS_BAJA).nullable(),
  version: z.int().nonnegative(),
});
export type PerfilEspecialista = z.infer<typeof PerfilEspecialistaSchema>;

// ── Disponibilidad (declarada y revocable) ───────────────────────────────────────────────────────
export const FranjaSchema = z.strictObject({
  dia: z.int().min(0).max(6), // 0 = domingo
  desde: HoraSchema,
  hasta: HoraSchema,
});

export const DisponibilidadSchema = z.strictObject({
  /** Opt-in a pedidos urgentes "Ahora". Revocable al instante; el servidor deja de ofrecer urgencias. */
  urgentesAhora: z.boolean(),
  urgentesCambiadoEn: InstanteSchema.nullable(),
  programados: z.boolean(),
  franjas: z.array(FranjaSchema),
  /** Zonas que el especialista declara cubrir (ids de zona del servidor). */
  zonas: z.array(z.string()),
  version: z.int().nonnegative(),
});
export type Disponibilidad = z.infer<typeof DisponibilidadSchema>;

export const CambioDisponibilidadSchema = DisponibilidadSchema.pick({
  urgentesAhora: true,
  programados: true,
  franjas: true,
  zonas: true,
  version: true,
}).partial({ franjas: true, zonas: true });
export type CambioDisponibilidad = z.infer<typeof CambioDisponibilidadSchema>;

// ── Pedidos elegibles ────────────────────────────────────────────────────────────────────────────
// Antes de contratar solo hay datos mínimos: zona aproximada, nunca la dirección exacta del hogar.
export const TIPOS_PEDIDO = ['urgente', 'programado', 'obra'] as const;

export const PedidoElegibleSchema = z.strictObject({
  id: IdSchema,
  rubro: z.enum(RUBROS),
  tipo: z.enum(TIPOS_PEDIDO),
  descripcion: z.string(),
  zonaAproximada: z.string(),
  fechaSolicitada: InstanteSchema.nullable(),
  creadoEn: InstanteSchema,
  /** Fin de la ventana de búsqueda calculado por el servidor. */
  ventanaHasta: InstanteSchema.nullable(),
  estado: z.enum(ESTADOS_PEDIDO),
  miPropuesta: z.strictObject({ id: IdSchema, estado: z.enum(ESTADOS_PROPUESTA) }).nullable(),
});
export type PedidoElegible = z.infer<typeof PedidoElegibleSchema>;

// ── Propuestas ───────────────────────────────────────────────────────────────────────────────────
export const PropuestaSchema = z.strictObject({
  id: IdSchema,
  pedidoId: IdSchema,
  autorRol: z.enum(['usuario', 'especialista']),
  monto: MontoSchema,
  alcance: z.string().max(2000),
  horario: z.strictObject({ inicio: InstanteSchema, fin: InstanteSchema.nullable() }),
  venceEn: InstanteSchema,
  estado: z.enum(ESTADOS_PROPUESTA),
  reemplazaA: IdSchema.nullable(),
  version: z.int().nonnegative(),
});
export type Propuesta = z.infer<typeof PropuestaSchema>;

/** Alta de propuesta o contrapropuesta. Va con encabezado Idempotency-Key (UUIDv4). */
export const NuevaPropuestaSchema = z.strictObject({
  pedidoId: IdSchema,
  monto: MontoSchema,
  alcance: z.string().min(1).max(2000),
  horario: z.strictObject({ inicio: InstanteSchema, fin: InstanteSchema.nullable() }),
  reemplazaA: IdSchema.nullable(),
});

export const RespuestaPropuestaSchema = z.strictObject({
  accion: z.enum(['aceptar', 'rechazar']),
  version: z.int().nonnegative(),
});

// ── Trabajos ─────────────────────────────────────────────────────────────────────────────────────
export const TrabajoSchema = z.strictObject({
  id: IdSchema,
  pedidoId: IdSchema,
  propuestaAceptadaId: IdSchema,
  rubro: z.enum(RUBROS),
  tipo: z.enum(TIPOS_PEDIDO),
  /** Snapshot del acuerdo aceptado: no cambia sin una nueva propuesta aceptada. */
  acuerdo: z.strictObject({
    monto: MontoSchema,
    alcance: z.string(),
    horario: z.strictObject({ inicio: InstanteSchema, fin: InstanteSchema.nullable() }),
  }),
  /** Dirección exacta: solo después de contratar y solo para las partes del trabajo. */
  direccion: z.string().nullable(),
  estado: z.enum(ESTADOS_TRABAJO),
  conversacionId: IdSchema,
  version: z.int().nonnegative(),
});
export type Trabajo = z.infer<typeof TrabajoSchema>;

// ── Chat ─────────────────────────────────────────────────────────────────────────────────────────
export const MensajeSchema = z.strictObject({
  id: IdSchema,
  conversacionId: IdSchema,
  autorRol: z.enum(['usuario', 'especialista', 'operations']),
  tipo: z.enum(['texto', 'foto', 'propuesta']),
  texto: z.string().nullable(),
  /** URL firmada de corta duración para fotos privadas. */
  mediaUrl: z.url().nullable(),
  propuestaId: IdSchema.nullable(),
  enviadoEn: InstanteSchema,
});

// ── Caja / pagos directos ────────────────────────────────────────────────────────────────────────
export const PagoSchema = z.strictObject({
  id: IdSchema,
  trabajoId: IdSchema,
  descripcion: z.string(),
  /** Tarifa de Handy sobre este pago (0 durante la demo) y lo que cobra el especialista. */
  feeHandy: MontoSchema,
  neto: MontoSchema,
  metodo: z.enum(['mercado_pago', 'efectivo']),
  monto: MontoSchema,
  estado: z.enum(ESTADOS_PAGO),
  /** Quién confirmó: un reporte manual no es un webhook verificado. */
  fuenteConfirmacion: z.enum(['reporte_usuario', 'reporte_especialista', 'webhook_proveedor', 'operations']).nullable(),
  referenciaProveedor: z.string().nullable(),
  actualizadoEn: InstanteSchema,
});

// ── Soporte ──────────────────────────────────────────────────────────────────────────────────────
export const CasoSoporteSchema = z.strictObject({
  id: IdSchema,
  asunto: z.string(),
  trabajoId: IdSchema.nullable(),
  pedidoId: IdSchema.nullable(),
  categoria: z.enum(['asistencia', 'reclamo', 'pago', 'cuenta']),
  estado: z.enum(ESTADOS_SOPORTE),
  creadoEn: InstanteSchema,
  actualizadoEn: InstanteSchema,
});

// ── Fee ──────────────────────────────────────────────────────────────────────────────────────────
export const PoliticaFeeSchema = z.strictObject({
  id: z.string(),
  version: z.int().positive(),
  alcance: z.enum(['demo_cerrada', 'general']),
  desde: InstanteSchema,
  hastaExclusivo: InstanteSchema,
  ultimoDiaLocal: z.iso.date(),
  bpsUsuario: z.int().min(0).max(10_000),
  bpsEspecialista: z.int().min(0).max(10_000),
  estado: z.enum(['activa', 'borrador']),
});

export const FeeVigenteSchema = z.strictObject({
  /** null = no hay política activa: no se muestra ni se cobra ningún porcentaje. */
  politica: PoliticaFeeSchema.nullable(),
  /** Si el especialista ya vio y aceptó el aviso de esta versión (modal de primer ingreso). */
  avisoAceptadoEn: InstanteSchema.nullable(),
});
export type FeeVigente = z.infer<typeof FeeVigenteSchema>;

// ═══ Contrato 0.2.0: lo que necesitan las pantallas de la fase 2 ═════════════════════════════════

// ── Alta: datos base (se guardan y se retoman; DNI y CUIT/CUIL nunca vuelven completos) ─────────
// PENDIENTE: opciones de género según PROD-15 y base legal del dato (aviso aprobado) antes de producción.
export const GENEROS = ['mujer', 'varon', 'otro', 'prefiero_no_decir'] as const;

export const DatosAltaSchema = z.strictObject({
  nombre: z.string().nullable(),
  apellido: z.string().nullable(),
  fechaNacimiento: z.iso.date().nullable(),
  nacionalidad: z.string().nullable(),
  genero: z.enum(GENEROS).nullable(),
  ciudad: z.string().nullable(),
  barrio: z.string().nullable(),
  /** Últimos dígitos, para reconocer lo cargado sin exponerlo. */
  dniUltimos: z.string().nullable(),
  cuitCuilUltimos: z.string().nullable(),
  version: z.int().nonnegative(),
});
export type DatosAlta = z.infer<typeof DatosAltaSchema>;

export const GuardarDatosAltaSchema = z.strictObject({
  nombre: z.string().trim().min(1).max(60).optional(),
  apellido: z.string().trim().min(1).max(60).optional(),
  fechaNacimiento: z.iso.date().optional(),
  nacionalidad: z.string().trim().min(2).max(60).optional(),
  genero: z.enum(GENEROS).optional(),
  ciudad: z.string().trim().min(2).max(80).optional(),
  barrio: z.string().trim().max(80).optional(),
  dni: z.string().regex(/^\d{7,8}$/).optional(),
  cuitCuil: z.string().regex(/^\d{11}$/).optional(),
  version: z.int().nonnegative(),
});
export type GuardarDatosAlta = z.infer<typeof GuardarDatosAltaSchema>;

export const TIPOS_DOCUMENTO = ['dni', 'cuit_cuil', 'foto_cara', 'matricula'] as const;
export type TipoDocumento = (typeof TIPOS_DOCUMENTO)[number];

/** Cómo te ve el usuario del hogar (nunca documentos ni datos del staff). */
export const PerfilPublicoSchema = z.strictObject({
  nombrePublico: z.string().nullable(),
  rubrosHabilitados: z.array(z.enum(RUBROS)),
  /** Sello de verificación: solo `true` si el backend verificó el alta completa. */
  verificado: z.boolean(),
});
export type PerfilPublico = z.infer<typeof PerfilPublicoSchema>;

// ── Cuenta ───────────────────────────────────────────────────────────────────────────────────────
export const PreferenciasSchema = z.strictObject({
  avisosUrgentes: z.boolean(),
  avisosProgramados: z.boolean(),
  avisosMensajes: z.boolean(),
  avisosPagos: z.boolean(),
  /** Avisos del dispositivo: opt-in contextual, la entrega no está garantizada (sobre todo en iOS web). */
  push: z.enum(['sin_pedir', 'activado', 'rechazado', 'no_disponible']),
});
export type Preferencias = z.infer<typeof PreferenciasSchema>;

export const BajaSchema = z.strictObject({
  estado: z.enum(ESTADOS_BAJA),
  solicitadaEn: InstanteSchema,
  /** Texto honesto del estado real (qué se borró, qué se retiene por obligación legal y hasta cuándo). */
  mensaje: z.string(),
});
export type Baja = z.infer<typeof BajaSchema>;

// ── Avisos dentro de la app (consultables aunque el push no llegue) ──────────────────────────────
export const TIPOS_AVISO = [
  'pedido_urgente',
  'pedido_programado',
  'propuesta',
  'mensaje',
  'trabajo',
  'pago',
  'soporte',
  'cuenta',
] as const;

export const AvisoSchema = z.strictObject({
  id: IdSchema,
  tipo: z.enum(TIPOS_AVISO),
  titulo: z.string(),
  /** Sin datos personales: el detalle se abre dentro de la app. */
  cuerpo: z.string(),
  creadoEn: InstanteSchema,
  leido: z.boolean(),
  destino: z.strictObject({
    ruta: z.enum(['pedido', 'trabajo', 'hilo', 'caja', 'soporte', 'cuenta', 'alta']),
    id: IdSchema.nullable(),
  }),
});
export type Aviso = z.infer<typeof AvisoSchema>;

// ── Inicio ───────────────────────────────────────────────────────────────────────────────────────
// Nunca tasa de aceptación, tiempos de respuesta ni puntualidad (PROD-06 §3).
export const InicioSchema = z.strictObject({
  estadoAlta: z.enum(ESTADOS_ALTA),
  urgentesAhora: z.boolean(),
  pedidosAbiertos: z.int().nonnegative(),
  urgentesAbiertos: z.int().nonnegative(),
  propuestasPendientes: z.int().nonnegative(),
  avisosSinLeer: z.int().nonnegative(),
  proximoTrabajo: TrabajoSchema.nullable(),
  cobradoMes: MontoSchema,
  trabajosCobrados: z.int().nonnegative(),
});
export type Inicio = z.infer<typeof InicioSchema>;

// ── Detalle de pedido (con el hilo de propuestas) ────────────────────────────────────────────────
export const PedidoDetalleSchema = PedidoElegibleSchema.extend({
  /** Chat disponible desde la primera cotización, antes de contratar. */
  conversacionId: IdSchema.nullable(),
  propuestas: z.array(PropuestaSchema),
});
export type PedidoDetalle = z.infer<typeof PedidoDetalleSchema>;

// ── Trabajo: detalle, historial y obra por etapas ────────────────────────────────────────────────
export const EtapaObraSchema = z.strictObject({
  nombre: z.string(),
  monto: MontoSchema,
  estado: z.enum(['pendiente', 'en_curso', 'terminada']),
});

export const TrabajoDetalleSchema = z.strictObject({
  trabajo: TrabajoSchema,
  contraparte: z.string(),
  eventos: z.array(
    z.strictObject({
      estado: z.enum(ESTADOS_TRABAJO),
      en: InstanteSchema,
      actor: z.enum(['especialista', 'usuario', 'operations', 'sistema']),
    }),
  ),
  etapas: z.array(EtapaObraSchema),
  /** Propuesta de cambio (fecha/monto/alcance) pendiente: el acuerdo vigente no cambia hasta que se acepte. */
  cambioPendiente: PropuestaSchema.nullable(),
  pagoId: IdSchema.nullable(),
});
export type TrabajoDetalle = z.infer<typeof TrabajoDetalleSchema>;

export const NuevoCambioSchema = z.strictObject({
  horario: z.strictObject({ inicio: InstanteSchema, fin: InstanteSchema.nullable() }),
  alcance: z.string().trim().min(1).max(2000),
  monto: MontoSchema.nullable(),
});
export type NuevoCambio = z.infer<typeof NuevoCambioSchema>;

// ── Agenda ───────────────────────────────────────────────────────────────────────────────────────
export const AgendaItemSchema = z.strictObject({
  id: IdSchema,
  trabajoId: IdSchema.nullable(),
  /** Para abrir la oferta pendiente de la agenda. */
  pedidoId: IdSchema.nullable(),
  titulo: z.string(),
  inicio: InstanteSchema,
  fin: InstanteSchema.nullable(),
  estado: z.enum(['confirmado', 'cambio_pendiente', 'oferta_pendiente']),
  /** Una oferta (propuesta enviada o recibida) que se superpone con un trabajo confirmado. */
  superpuesto: z.boolean(),
});
export type AgendaItem = z.infer<typeof AgendaItemSchema>;

// ── Mensajes ─────────────────────────────────────────────────────────────────────────────────────
export const ConversacionSchema = z.strictObject({
  id: IdSchema,
  pedidoId: IdSchema,
  trabajoId: IdSchema.nullable(),
  contraparte: z.string(),
  etapa: z.enum(['cotizando', 'trabajo', 'cerrada']),
  ultimoMensaje: z.string().nullable(),
  noLeidos: z.int().nonnegative(),
  actualizadoEn: InstanteSchema,
});
export type Conversacion = z.infer<typeof ConversacionSchema>;

export const EnviarMensajeSchema = z.strictObject({
  tipo: z.enum(['texto', 'foto']),
  texto: z.string().trim().max(2000).nullable(),
});
export type EnviarMensaje = z.infer<typeof EnviarMensajeSchema>;

// ── Caja ─────────────────────────────────────────────────────────────────────────────────────────
// Los pagos van directo del usuario al especialista. No hay saldo "de Handy" ni retiros.
export const CajaResumenSchema = z.strictObject({
  pendiente: MontoSchema,
  reportado: MontoSchema,
  verificado: MontoSchema,
  feeHandyPeriodo: MontoSchema,
});
export type CajaResumen = z.infer<typeof CajaResumenSchema>;

// ── Soporte ──────────────────────────────────────────────────────────────────────────────────────
export const CasoSoporteDetalleSchema = CasoSoporteSchema.extend({
  detalle: z.string(),
  eventos: z.array(
    z.strictObject({
      id: IdSchema,
      autor: z.enum(['vos', 'handy']),
      texto: z.string(),
      adjuntos: z.int().nonnegative(),
      creadoEn: InstanteSchema,
    }),
  ),
});
export type CasoSoporteDetalle = z.infer<typeof CasoSoporteDetalleSchema>;

export const NuevoCasoSchema = z.strictObject({
  categoria: z.enum(['asistencia', 'reclamo', 'pago', 'cuenta']),
  trabajoId: IdSchema.nullable(),
  pedidoId: IdSchema.nullable(),
  asunto: z.string().trim().min(3).max(120),
  detalle: z.string().trim().min(1).max(4000),
  adjuntos: z.int().min(0).max(3),
});
export type NuevoCaso = z.infer<typeof NuevoCasoSchema>;

export const AceptacionSchema = z.strictObject({
  propuesta: PropuestaSchema,
  trabajo: TrabajoSchema.nullable(),
});
export type Aceptacion = z.infer<typeof AceptacionSchema>;

// ── Acceso ───────────────────────────────────────────────────────────────────────────────────────
export const REGLAS_CLAVE = { minimo: 12, maximo: 128 } as const;

export const RegistroSchema = z.strictObject({
  email: z.email().max(254),
  password: z.string().min(REGLAS_CLAVE.minimo).max(REGLAS_CLAVE.maximo),
  /** Ids de las versiones aceptadas (explícitas, sin tildar por defecto). */
  terminos: z.string(),
  privacidad: z.string(),
});
export type Registro = z.infer<typeof RegistroSchema>;

export const IngresoSchema = z.strictObject({ email: z.email(), password: z.string().min(1) });
export type Ingreso = z.infer<typeof IngresoSchema>;

// Tipos de los esquemas que antes no los exportaban
export type Mensaje = z.infer<typeof MensajeSchema>;
export type Pago = z.infer<typeof PagoSchema>;
export type CasoSoporte = z.infer<typeof CasoSoporteSchema>;
export type NuevaPropuesta = z.infer<typeof NuevaPropuestaSchema>;
export type RespuestaPropuesta = z.infer<typeof RespuestaPropuestaSchema>;
