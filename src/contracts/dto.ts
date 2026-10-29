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
export const EstadoRubroSchema = z.enum(['habilitado', 'requiere_matricula', 'en_revision', 'no_habilitado']);

export const PerfilEspecialistaSchema = z.strictObject({
  id: IdSchema,
  nombre: z.string(),
  apellido: z.string(),
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
