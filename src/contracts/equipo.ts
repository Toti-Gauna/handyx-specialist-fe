// Equipo de obra, búsquedas, postulaciones, perfil profesional, contactos profesionales y reparto del pago (contrato
// 0.11.0, fases O.4 y O.5; pantallas F-ObraEquipo, F-Invitar, F-Reparto, F-ObraBuscar, F-InicioConvocatoria,
// F-ConvocatoriaDetalle, F-ObraPostulantes, F-PerfilProfesional y H0-ModoAyuda). Lo implementa el lote 3.5.
// - Se suman profesionales INVITADOS (contactos o un enlace con código que vence en 48 h) o elegidos entre los que se
//   postulan a una búsqueda. Nadie entra solo: el titular elige, después de ver el perfil como lo ve un cliente.
// - Una búsqueda la ven SOLO especialistas verificados de la zona y del oficio (con matrícula verificada si se pide),
//   como «Te buscan para una obra». Ven la obra con zona aproximada, nunca la dirección. Cierra sola (24 h).
// - Cada miembro ve los días, el chat y su parte; los gastos del titular, solo el titular.
// - Reparto: cuánto le toca a cada uno (monto o %) y cómo cobra (cada uno su parte, o el titular y reparte por fuera).
//   Cada miembro lo acepta. Handyx NO recibe ni reparte la plata: registra lo que acuerdan.
// - El perfil de otro profesional se ve solo si hay relación (contacto, miembro de tu obra o postulante a tu búsqueda);
//   si no, 404.
import { z } from 'zod';
import { FechaSchema, PersonaVisibleSchema, ProfesionalRefSchema } from './comun.ts';
import { HorarioSchema, IdSchema, InstanteSchema, MontoSchema } from './dto.ts';
import { transicion as t, type Maquina } from './maquinas.ts';
import { RUBROS } from './rubros.ts';

export const ROLES_OBRA = ['titular', 'miembro'] as const;
export const ESTADOS_MIEMBRO = ['invitado', 'activo', 'rechazo', 'salio', 'quitado'] as const;
export const ESTADOS_INVITACION = ['pendiente', 'aceptada', 'rechazada', 'vencida', 'cancelada'] as const;
export const ESTADOS_BUSQUEDA = ['abierta', 'cubierta', 'cerrada', 'cancelada'] as const;
export type EstadoBusqueda = (typeof ESTADOS_BUSQUEDA)[number];
export const ESTADOS_POSTULACION = ['postulada', 'elegida', 'no_elegida', 'retirada'] as const;
export type EstadoPostulacion = (typeof ESTADOS_POSTULACION)[number];
export const MODOS_COBRO_REPARTO = ['cada_uno', 'titular_reparte'] as const;
export const ESTADOS_PARTE = ['propuesta', 'aceptada', 'rechazada'] as const;
/** Si esa persona lo comparte (opt-in): disponible, ocupada hasta una hora o en una obra. */
export const ESTADOS_CONTACTO_PROFESIONAL = ['disponible', 'ocupado', 'en_obra'] as const;

/** Vigencia de una invitación con enlace (F-Invitar: «Vale 48 horas · solo para esta obra»). */
export const VIGENCIA_INVITACION_MS = 48 * 60 * 60_000;
/** Una búsqueda cierra sola a las 24 h (F-ObraPostulantes: «cierra en 23 h»). */
export const VIGENCIA_BUSQUEDA_MS = 24 * 60 * 60_000;

/** La búsqueda la publica y cancela el titular; se cubre cuando elige; cierra sola al vencer. */
export const MAQUINA_BUSQUEDA: Maquina<EstadoBusqueda> = {
  nombre: 'busqueda_obra',
  estados: ESTADOS_BUSQUEDA,
  inicial: 'abierta',
  transiciones: [
    t('abierta', 'cubierta', 'especialista'),
    t('abierta', 'cerrada', 'sistema'),
    t('abierta', 'cancelada', 'especialista', 'operations'),
  ],
};

/** Postula y retira el otro profesional; elige solo el titular; el sistema descarta al resto al cubrirse o cerrar. */
export const MAQUINA_POSTULACION: Maquina<EstadoPostulacion> = {
  nombre: 'postulacion',
  estados: ESTADOS_POSTULACION,
  inicial: 'postulada',
  transiciones: [
    t('postulada', 'elegida', 'especialista'),
    t('postulada', 'no_elegida', 'especialista', 'sistema'),
    t('postulada', 'retirada', 'especialista'),
  ],
};

// ── Miembros e invitaciones ───────────────────────────────────────────────────────────────────────
export const MiembroObraSchema = z.strictObject({
  id: IdSchema,
  profesional: ProfesionalRefSchema,
  esVos: z.boolean(),
  rol: z.enum(ROLES_OBRA),
  rubro: z.enum(RUBROS),
  /** Números de jornada donde trabaja; vacío = toda la obra. */
  jornadas: z.array(z.int().min(1)),
  estado: z.enum(ESTADOS_MIEMBRO),
  /** Su parte del reparto (si ya hay uno). */
  parte: z.strictObject({ monto: MontoSchema, bps: z.int().min(0).max(10_000), estado: z.enum(ESTADOS_PARTE) }).nullable(),
});
export type MiembroObra = z.infer<typeof MiembroObraSchema>;

export const NuevaInvitacionSchema = z.strictObject({
  /** Un contacto profesional (se le avisa en la app) o null para generar solo el enlace con código. */
  contactoId: IdSchema.nullable(),
  rubro: z.enum(RUBROS),
  /** Números de jornada; vacío = toda la obra. */
  jornadas: z.array(z.int().min(1)).max(60),
});
export type NuevaInvitacion = z.infer<typeof NuevaInvitacionSchema>;

export const InvitacionObraSchema = z.strictObject({
  id: IdSchema,
  obraId: IdSchema,
  profesional: ProfesionalRefSchema.nullable(),
  rubro: z.enum(RUBROS),
  jornadas: z.array(z.int().min(1)),
  /** "HX-OB-7Q2K": el código va en el enlace y se escribe a mano; el servidor guarda solo su hash. Solo lo ve el titular. */
  codigo: z.string().regex(/^HX-OB-[A-Z0-9]{4,8}$/).nullable(),
  enlace: z.url().nullable(),
  venceEn: InstanteSchema,
  estado: z.enum(ESTADOS_INVITACION),
});
export type InvitacionObra = z.infer<typeof InvitacionObraSchema>;

/** El código va en el cuerpo, nunca en la ruta (no queda en los registros del servidor). */
export const CodigoInvitacionSchema = z.strictObject({ codigo: z.string().regex(/^HX-OB-[A-Z0-9]{4,8}$/) });

/** Lo que ve el invitado antes de aceptar: sin dirección (zona aproximada) y sin los gastos del titular. */
export const ObraParaSumarseSchema = z.strictObject({
  obraNombre: z.string(),
  titular: ProfesionalRefSchema.extend({ trabajosVerificados: z.int().nonnegative() }),
  rubro: z.enum(RUBROS),
  jornadas: z.array(z.strictObject({ numero: z.int().min(1), horario: HorarioSchema })),
  zonaAproximada: z.string(),
  /** Su parte, si el titular ya la puso (se acuerda en el reparto). */
  parte: MontoSchema.nullable(),
  equipo: z.array(PersonaVisibleSchema.extend({ rubro: z.enum(RUBROS) })),
});
export type ObraParaSumarse = z.infer<typeof ObraParaSumarseSchema>;

// ── Búsquedas y postulaciones ─────────────────────────────────────────────────────────────────────
export const NuevaBusquedaSchema = z.strictObject({
  rubro: z.enum(RUBROS),
  jornadas: z.array(z.int().min(1)).max(60),
  /** Su parte del pago: la cobra directo del cliente. */
  parte: MontoSchema.refine((m) => m.centavos > 0, 'Poné cuánto le toca'),
  requiereMatricula: z.boolean(),
  mensaje: z.string().trim().max(280),
});
export type NuevaBusqueda = z.infer<typeof NuevaBusquedaSchema>;

export const BusquedaSchema = z.strictObject({
  id: IdSchema,
  obraId: IdSchema,
  rubro: z.enum(RUBROS),
  jornadas: z.array(z.int().min(1)),
  parte: MontoSchema,
  /** «Verificado por Handyx» va siempre: no se puede apagar. */
  soloVerificados: z.literal(true),
  requiereMatricula: z.boolean(),
  mensaje: z.string().max(280),
  estado: z.enum(ESTADOS_BUSQUEDA),
  cierraEn: InstanteSchema,
  postulantes: z.int().nonnegative(),
  creadaEn: InstanteSchema,
});
export type Busqueda = z.infer<typeof BusquedaSchema>;

export const EquipoObraSchema = z.strictObject({
  obraId: IdSchema,
  miembros: z.array(MiembroObraSchema),
  /** El cliente ve los días, las fotos y el chat del grupo. */
  cliente: PersonaVisibleSchema.nullable(),
  invitaciones: z.array(InvitacionObraSchema),
  busquedas: z.array(BusquedaSchema),
});
export type EquipoObra = z.infer<typeof EquipoObraSchema>;

/** «Te buscan para una obra»: lo que ve otro profesional verificado de la zona y del oficio. */
export const BusquedaRecibidaSchema = z.strictObject({
  id: IdSchema,
  obraNombre: z.string(),
  titular: ProfesionalRefSchema.extend({ trabajosVerificados: z.int().nonnegative() }),
  rubro: z.enum(RUBROS),
  jornadas: z.array(z.strictObject({ numero: z.int().min(1), etapa: z.string(), horario: HorarioSchema })),
  parte: MontoSchema,
  requiereMatricula: z.boolean(),
  mensaje: z.string().max(280),
  zonaAproximada: z.string(),
  /** Al centro de la zona aproximada, redondeada a 100 m. */
  distanciaM: z.int().nonnegative().nullable(),
  equipo: z.array(PersonaVisibleSchema.extend({ rubro: z.enum(RUBROS) })),
  cierraEn: InstanteSchema,
  miPostulacion: z.strictObject({ id: IdSchema, estado: z.enum(ESTADOS_POSTULACION) }).nullable(),
});
export type BusquedaRecibida = z.infer<typeof BusquedaRecibidaSchema>;

export const NuevaPostulacionSchema = z.strictObject({ mensaje: z.string().trim().max(280) });
export type NuevaPostulacion = z.infer<typeof NuevaPostulacionSchema>;

export const PostulacionSchema = z.strictObject({
  id: IdSchema,
  busquedaId: IdSchema,
  profesional: ProfesionalRefSchema.extend({
    matriculaVerificada: z.boolean(),
    trabajosVerificados: z.int().nonnegative(),
  }),
  distanciaM: z.int().nonnegative().nullable(),
  mensaje: z.string().max(280),
  estado: z.enum(ESTADOS_POSTULACION),
  creadaEn: InstanteSchema,
});
export type Postulacion = z.infer<typeof PostulacionSchema>;

// ── Perfil profesional (como lo ve un cliente) ────────────────────────────────────────────────────
export const ComentarioClienteSchema = z.strictObject({
  /** El cliente con nombre e iniciales (como en la app), nunca su contacto. */
  autor: PersonaVisibleSchema,
  mes: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/),
  texto: z.string().max(500),
});

export const PerfilProfesionalSchema = z.strictObject({
  id: IdSchema,
  nombre: z.string(),
  iniciales: z.string().min(1).max(3),
  foto: z.url().nullable(),
  presentacion: z.string().max(280).nullable(),
  rubros: z.array(z.enum(RUBROS)),
  ciudad: z.string(),
  enHandyxDesde: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/),
  /** Solo lo verificado por Operations: «Verificado por Handyx» y «Matrícula verificada». */
  verificado: z.boolean(),
  matriculasVerificadas: z.array(z.strictObject({ rubro: z.enum(RUBROS), venceEn: FechaSchema.nullable() })),
  certificadosVerificados: z.int().nonnegative(),
  trabajosVerificados: z.int().nonnegative(),
  obrasEnEquipo: z.int().nonnegative(),
  /** Fotos de trabajos que el profesional eligió mostrar (sin datos del cliente ni ubicación). */
  fotosTrabajos: z.array(z.strictObject({ id: IdSchema, url: z.url() })).max(12),
  comentarios: z.array(ComentarioClienteSchema).max(20),
});
export type PerfilProfesional = z.infer<typeof PerfilProfesionalSchema>;

// ── Contactos profesionales (Pedir ayuda, Invitar) ────────────────────────────────────────────────
export const ContactoProfesionalSchema = z.strictObject({
  id: IdSchema,
  profesional: ProfesionalRefSchema,
  /** Null si esa persona no comparte su estado. Nunca su ubicación. */
  estado: z.enum(ESTADOS_CONTACTO_PROFESIONAL).nullable(),
  ocupadoHasta: InstanteSchema.nullable(),
  /** El chat de equipo con esa persona. */
  chatId: IdSchema.nullable(),
});
export type ContactoProfesional = z.infer<typeof ContactoProfesionalSchema>;

/** Sumar un contacto al trabajo de hoy (H0-ModoAyuda): una invitación para ese trabajo; el reparto se acuerda aparte. */
export const SumarAyudaSchema = z.strictObject({ contactoId: IdSchema, rubro: z.enum(RUBROS) });
export type SumarAyuda = z.infer<typeof SumarAyudaSchema>;

// ── Reparto del pago ──────────────────────────────────────────────────────────────────────────────
export const RepartoSchema = z.strictObject({
  obraId: IdSchema,
  /** Lo acordado con el cliente (suma de las etapas). */
  total: MontoSchema,
  partes: z.array(
    z.strictObject({
      miembroId: IdSchema,
      profesional: ProfesionalRefSchema,
      esVos: z.boolean(),
      rubro: z.enum(RUBROS),
      monto: MontoSchema,
      /** Porcentaje del total en puntos básicos (60 % = 6000), calculado por el servidor. */
      bps: z.int().min(0).max(10_000),
      estado: z.enum(ESTADOS_PARTE),
    }),
  ),
  modoCobro: z.enum(MODOS_COBRO_REPARTO),
  estado: z.enum(['borrador', 'enviado', 'aceptado']),
  /** La suma de las partes es igual al total (si no, no se puede mandar). */
  cuadra: z.boolean(),
  version: z.int().nonnegative(),
});
export type Reparto = z.infer<typeof RepartoSchema>;

export const GuardarRepartoSchema = z.strictObject({
  partes: z.array(z.strictObject({ miembroId: IdSchema, monto: MontoSchema })).min(1).max(12),
  modoCobro: z.enum(MODOS_COBRO_REPARTO),
  version: z.int().nonnegative(),
});
export type GuardarReparto = z.infer<typeof GuardarRepartoSchema>;

export const RespuestaRepartoSchema = z.strictObject({ accion: z.enum(['aceptar', 'rechazar']), version: z.int().nonnegative() });
export type RespuestaReparto = z.infer<typeof RespuestaRepartoSchema>;

/** Las partes suman exactamente el total (centavos enteros, sin redondeos escondidos). */
export function repartoCuadra(total: number, partes: readonly number[]): boolean {
  return partes.every((p) => Number.isSafeInteger(p) && p >= 0) && partes.reduce((a, b) => a + b, 0) === total;
}

/** Porcentaje de una parte en puntos básicos, redondeado (mitad hacia arriba). Solo para mostrar. */
export function bpsDeParte(parte: number, total: number): number {
  if (total <= 0) return 0;
  return Number((BigInt(parte) * 10_000n * 2n + BigInt(total)) / (BigInt(total) * 2n));
}
