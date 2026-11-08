// Obras de varios días (contrato 0.11.0, fases O.1, O.1b, O.2 y O.3; pantallas F-Obras, F-ObraNueva, F-Obra, F-ObraDia,
// F-ObraDiaHorario, F-ObraDiaTarea, F-ObraDiaAvance, F-ObraFecha y F-PropuestaObra). Lo implementa el lote 3.5 (y el lado
// del cliente, aceptar la propuesta y los cambios de fecha, en handyx-client-be).
// - Una obra nace de un pedido de obra o la propone el especialista desde Obras a un cliente suyo o a uno nuevo con un
//   enlace. La propuesta (etapas, jornadas, montos y equipo) llega como tarjeta al chat; al aceptarla, la obra queda
//   con su trabajo (`trabajoId`) y sigue con las etapas, jornadas y cobros de 0.8.0.
// - Cada jornada tiene quién viene, tareas, avance (lo ve el cliente) y materiales. Cambiar el horario (franja u hora
//   exacta) o mover jornadas (solo esta, o esta y las que siguen) es un PEDIDO al cliente: hasta que acepta, siguen las
//   fechas de ahora; se avisa al equipo.
// - La plata de la obra va directo del cliente; los gastos del titular los ve solo el titular.
import { z } from 'zod';
import { FechaSchema, PersonaVisibleSchema, ProfesionalRefSchema, ResumenCortoSchema } from './comun.ts';
import { HorarioSchema, IdSchema, InstanteSchema, MontoSchema, MOTIVOS_CAMBIO, UNIDADES_MATERIAL } from './dto.ts';
import { ESTADOS_ETAPA, ESTADOS_JORNADA, transicion as t, type Maquina } from './maquinas.ts';
import { TareaSchema } from './modo-trabajo.ts';
import { RUBROS } from './rubros.ts';

export const ESTADOS_OBRA = ['borrador', 'propuesta_enviada', 'aceptada', 'en_curso', 'terminada', 'rechazada', 'cancelada'] as const;
export type EstadoObra = (typeof ESTADOS_OBRA)[number];
/** Pestañas de Tus obras. `proximas` = aceptadas que todavía no empezaron (y propuestas enviadas). */
export const GRUPOS_OBRA = ['en_curso', 'proximas', 'terminadas'] as const;
export const ALCANCES_CAMBIO_JORNADA = ['solo_esta', 'esta_y_siguientes'] as const;
export type AlcanceCambioJornada = (typeof ALCANCES_CAMBIO_JORNADA)[number];
export const ORIGENES_MATERIAL_JORNADA = ['comprado', 'stock', 'falta_comprar'] as const;
/** Vigencia del enlace para un cliente nuevo. */
export const VIGENCIA_ENLACE_CLIENTE_MS = 7 * 24 * 60 * 60_000;

/** La propone y la manda el especialista; la acepta o rechaza el cliente; la arranca el sistema con la primera jornada. */
export const MAQUINA_OBRA: Maquina<EstadoObra> = {
  nombre: 'obra',
  estados: ESTADOS_OBRA,
  inicial: 'borrador',
  transiciones: [
    t('borrador', 'propuesta_enviada', 'especialista'),
    t('propuesta_enviada', 'borrador', 'especialista'), // retirarla para cambiarla
    t('propuesta_enviada', 'aceptada', 'usuario'),
    t('propuesta_enviada', 'rechazada', 'usuario'),
    t('rechazada', 'borrador', 'especialista'),
    t('aceptada', 'en_curso', 'sistema'),
    t('en_curso', 'terminada', 'especialista'), // con todas las etapas terminadas
    t('borrador', 'cancelada', 'especialista'),
    t('aceptada', 'cancelada', 'especialista', 'usuario', 'operations'),
    t('en_curso', 'cancelada', 'operations'),
  ],
};

export const AlertaObraSchema = z.strictObject({
  tipo: z.enum(['faltan_repuestos', 'repuesto_sin_aprobar', 'cambio_pendiente', 'reparto_pendiente', 'jornada_hoy']),
  /** "Mañana faltan 2 repuestos · 1 espera aprobación". */
  texto: ResumenCortoSchema,
});

export const ObraResumenSchema = z.strictObject({
  id: IdSchema,
  /** El trabajo, desde que el cliente acepta la propuesta. */
  trabajoId: IdSchema.nullable(),
  nombre: z.string().min(1).max(80),
  rubros: z.array(z.enum(RUBROS)).min(1),
  /** El cliente (nombre visible); null si todavía no se sumó con el enlace. */
  cliente: PersonaVisibleSchema.nullable(),
  barrio: z.string().nullable(),
  estado: z.enum(ESTADOS_OBRA),
  /** Vos sos titular o miembro del equipo. */
  rol: z.enum(['titular', 'miembro']),
  avance: z.strictObject({
    etapasTerminadas: z.int().nonnegative(),
    etapas: z.int().nonnegative(),
    /** "Día 3 de 6". */
    jornadaActual: z.int().nonnegative().nullable(),
    jornadas: z.int().nonnegative(),
  }),
  inicio: FechaSchema.nullable(),
  equipo: z.array(PersonaVisibleSchema).max(12),
  /** Solo para el titular: lo gastado en materiales y lo que falta cobrar. Null para los miembros. */
  plata: z.strictObject({ total: MontoSchema, gastado: MontoSchema, faltaCobrar: MontoSchema }).nullable(),
  alertas: z.array(AlertaObraSchema).max(5),
  /** El chat del grupo de la obra (0.11.0, `chat.ts`). */
  chatId: IdSchema.nullable(),
});
export type ObraResumen = z.infer<typeof ObraResumenSchema>;

export const MaterialJornadaSchema = z.strictObject({
  nombre: z.string().max(120),
  cantidad: z.number().positive(),
  unidad: z.enum(UNIDADES_MATERIAL),
  origen: z.enum(ORIGENES_MATERIAL_JORNADA),
  /** El repuesto que lo representa, si se pidió como repuesto. */
  repuestoId: IdSchema.nullable(),
  compradoEl: FechaSchema.nullable(),
});

export const JornadaObraSchema = z.strictObject({
  id: IdSchema,
  etapaId: IdSchema,
  etapaNombre: z.string(),
  numero: z.int().min(1),
  /** Franja (`fin`) u hora exacta (`fin: null`). */
  horario: HorarioSchema,
  estado: z.enum(ESTADOS_JORNADA),
  quienes: z.array(PersonaVisibleSchema.extend({ id: IdSchema })),
  tareas: z.array(TareaSchema),
  /** El último avance cargado (lo ve el cliente). */
  avance: z.strictObject({ nota: z.string().max(280), fotos: z.int().nonnegative(), en: InstanteSchema }).nullable(),
  materiales: z.array(MaterialJornadaSchema),
  /** Pedido de cambio pendiente: hasta que el cliente acepta, rige `horario`. */
  cambioPendiente: z
    .strictObject({ horario: HorarioSchema, alcance: z.enum(ALCANCES_CAMBIO_JORNADA), pedidoEn: InstanteSchema })
    .nullable(),
  alertas: z.array(AlertaObraSchema).max(5),
});
export type JornadaObra = z.infer<typeof JornadaObraSchema>;

export const ObraSchema = ObraResumenSchema.extend({
  descripcion: z.string().max(2000).nullable(),
  etapas: z.array(
    z.strictObject({
      id: IdSchema,
      orden: z.int().min(1),
      nombre: z.string(),
      incluye: z.string(),
      monto: MontoSchema,
      estado: z.enum(ESTADOS_ETAPA),
      jornadas: z.int().nonnegative(),
    }),
  ),
  jornadas: z.array(JornadaObraSchema),
  /** Enlace para que se sume un cliente nuevo (solo el titular, mientras no se sumó). */
  enlaceCliente: z.strictObject({ enlace: z.url(), codigo: z.string().min(6).max(20), venceEn: InstanteSchema }).nullable(),
  version: z.int().nonnegative(),
});
export type Obra = z.infer<typeof ObraSchema>;

// ── Obra nueva y propuesta de obra ────────────────────────────────────────────────────────────────
/** Para quién: un cliente tuyo (por la conversación que ya tienen) o uno nuevo con un enlace. */
export const ClienteObraSchema = z.discriminatedUnion('tipo', [
  z.strictObject({ tipo: z.literal('conocido'), conversacionId: IdSchema }),
  z.strictObject({ tipo: z.literal('nuevo') }),
]);

export const NuevaObraSchema = z.strictObject({
  cliente: ClienteObraSchema,
  nombre: z.string().trim().min(1).max(80),
  rubros: z.array(z.enum(RUBROS)).min(1).max(RUBROS.length),
  descripcion: z.string().trim().max(2000).nullable(),
});
export type NuevaObra = z.infer<typeof NuevaObraSchema>;

export const EtapaPropuestaSchema = z.strictObject({
  orden: z.int().min(1),
  nombre: z.string().trim().min(1).max(80),
  incluye: z.string().trim().max(500),
  monto: MontoSchema,
  jornadas: z.array(z.strictObject({ horario: HorarioSchema })).min(1).max(60),
});

export const PropuestaObraSchema = z.strictObject({
  obraId: IdSchema,
  /** "Versión 2" si se cambió después de mandarla. */
  numeroVersion: z.int().min(1),
  etapas: z.array(EtapaPropuestaSchema).min(1).max(20),
  /** Profesionales que querés sumar (se invitan aparte, `equipo.ts`) y oficios que buscás. */
  equipo: z.array(z.strictObject({ profesional: ProfesionalRefSchema.nullable(), rubro: z.enum(RUBROS) })),
  total: MontoSchema,
  /** Siempre por etapa: el cliente paga al terminar cada etapa, directo al especialista. */
  cobroPorEtapa: z.literal(true),
  /** Materiales aparte: se aprueban en el chat a medida que hacen falta. */
  materialesAparte: z.boolean(),
  estado: z.enum(['borrador', 'enviada', 'aceptada', 'rechazada', 'reemplazada']),
  enviadaEn: InstanteSchema.nullable(),
  version: z.int().nonnegative(),
});
export type PropuestaObra = z.infer<typeof PropuestaObraSchema>;

export const GuardarPropuestaObraSchema = z.strictObject({
  etapas: z.array(EtapaPropuestaSchema).min(1).max(20),
  /** Oficios que vas a buscar para el equipo (las invitaciones van aparte). */
  rubrosEquipo: z.array(z.enum(RUBROS)).max(RUBROS.length),
  materialesAparte: z.boolean(),
  version: z.int().nonnegative(),
});
export type GuardarPropuestaObra = z.infer<typeof GuardarPropuestaObraSchema>;

// ── Jornadas ──────────────────────────────────────────────────────────────────────────────────────
export const PersonasJornadaSchema = z.strictObject({
  /** Ids de miembros de la obra que vienen ese día. */
  miembros: z.array(IdSchema).max(12),
});

/** Cambiar el horario o el día de una jornada (o de esta y las que siguen). Lo acepta el cliente. */
export const CambioJornadasSchema = z.strictObject({
  horario: HorarioSchema,
  alcance: z.enum(ALCANCES_CAMBIO_JORNADA),
  motivo: z.enum(MOTIVOS_CAMBIO),
});
export type CambioJornadas = z.infer<typeof CambioJornadasSchema>;

/** Respuesta: cómo quedaría ("así queda") mientras el cliente decide. */
export const CambioJornadasPedidoSchema = z.strictObject({
  id: IdSchema,
  alcance: z.enum(ALCANCES_CAMBIO_JORNADA),
  jornadas: z.array(z.strictObject({ jornadaId: IdSchema, numero: z.int().min(1), de: HorarioSchema, a: HorarioSchema })),
  estado: z.enum(['pendiente', 'aceptado', 'rechazado', 'retirado']),
  pedidoEn: InstanteSchema,
});
export type CambioJornadasPedido = z.infer<typeof CambioJornadasPedidoSchema>;

/** Avance del día (multipart: este JSON en la parte `datos` y hasta 4 `fotos`, achicadas y sin ubicación). Lo ve el cliente. */
export const NuevoAvanceJornadaSchema = z.strictObject({
  nota: z.string().trim().min(1).max(280),
  /** Tareas que terminaste hoy (quedan `hecha`). */
  tareasHechas: z.array(IdSchema).max(30),
});
export type NuevoAvanceJornada = z.infer<typeof NuevoAvanceJornadaSchema>;
