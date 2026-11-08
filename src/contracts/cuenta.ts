// Cuenta, perfil propio, bandeja de avisos y descarga de datos (contrato 0.11.0; pantallas F-Cuenta, CU-Perfil,
// CU-Datos, CU-Disponibilidad, CU-Cobros, CU-Notificaciones, CU-Privacidad y D6-Avisos). Lo implementa el lote 1.5.
// - CU-Datos sale de `GET /v1/especialista/registro` (estados de cada verificación, con los últimos dígitos).
// - CU-Cobros suma la transferencia a `MediosCobro` (dto.ts, campo opcional) y CU-Notificaciones suma recordatorios,
//   camino, novedades y el silencio a `Preferencias` (dto.ts, campos opcionales).
// - La bandeja de avisos reemplaza a `GET /v1/especialista/avisos` (0.2.0, que queda hasta 1.0.0) con los avisos del
//   bloque Taller. Un aviso abre su detalle: NUNCA acepta nada. Sin datos personales en el cuerpo.
// - Descargar mis datos: se pide, se arma en el servidor (hasta 48 h) y se baja con una URL firmada corta.
import { z } from 'zod';
import { FechaSchema, InicialesSchema } from './comun.ts';
import { IdSchema, InstanteSchema } from './dto.ts';
import { RUBROS } from './rubros.ts';

// ── Perfil propio (CU-Perfil) ─────────────────────────────────────────────────────────────────────
export const PerfilPropioSchema = z.strictObject({
  nombrePublico: z.string().nullable(),
  iniciales: InicialesSchema,
  /** Foto de perfil (pública para los clientes): no es la selfie de verificación. */
  foto: z.url().nullable(),
  presentacion: z.string().max(280).nullable(),
  rubros: z.array(z.strictObject({ rubro: z.enum(RUBROS), habilitado: z.boolean() })),
  /** «Verificado por Handyx»: solo con el alta completa verificada. */
  verificado: z.boolean(),
  /** Lo que ven los clientes: solo lo verificado. Lo cargado aparece aparte, "en revisión", solo para vos. */
  matriculas: z.array(z.strictObject({ rubro: z.enum(RUBROS), estado: z.enum(['verificada', 'en_revision']), venceEn: FechaSchema.nullable() })),
  certificadosVerificados: z.int().nonnegative(),
  certificadosEnRevision: z.int().nonnegative(),
  trabajosVerificados: z.int().nonnegative(),
  enHandyxDesde: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/),
  version: z.int().nonnegative(),
});
export type PerfilPropio = z.infer<typeof PerfilPropioSchema>;

export const GuardarPresentacionSchema = z.strictObject({
  presentacion: z.string().trim().max(280).nullable(),
  version: z.int().nonnegative(),
});
export type GuardarPresentacion = z.infer<typeof GuardarPresentacionSchema>;

// ── Bandeja de avisos (D6-Avisos) ─────────────────────────────────────────────────────────────────
export const TIPOS_AVISO_BANDEJA = [
  'pedido_urgente',
  'pedido_programado',
  'propuesta',
  'te_eligieron',
  'mensaje',
  'trabajo',
  'pago',
  'soporte',
  'cuenta',
  'alta_habilitada',
  'presupuesto',
  'obra',
  'repuesto',
  'reparto',
  'equipo',
  'busqueda',
  'ferreteria',
  'camino',
  'recordatorio',
] as const;
export type TipoAvisoBandeja = (typeof TIPOS_AVISO_BANDEJA)[number];

export const DESTINOS_AVISO = [
  'pedido',
  'trabajo',
  'chat',
  'soporte',
  'cobros',
  'cuenta',
  'registro',
  'presupuesto',
  'obra',
  'repuestos',
  'reparto',
  'busqueda',
  'pedido_ferreteria',
  'camino',
  'premio',
] as const;

export const AvisoBandejaSchema = z.strictObject({
  id: IdSchema,
  tipo: z.enum(TIPOS_AVISO_BANDEJA),
  /** "Faltan 2 repuestos para mañana". */
  titulo: z.string().max(80),
  /** Sin datos personales más allá del nombre visible ("Martín aprobó la pastina"). */
  cuerpo: z.string().max(140),
  /** Para el avatar, si el aviso viene de una persona. */
  iniciales: InicialesSchema.nullable(),
  creadoEn: InstanteSchema,
  leido: z.boolean(),
  destino: z.strictObject({ ruta: z.enum(DESTINOS_AVISO), id: IdSchema.nullable() }),
});
export type AvisoBandeja = z.infer<typeof AvisoBandejaSchema>;

// ── Descargar mis datos (CU-Privacidad) ───────────────────────────────────────────────────────────
export const ESTADOS_EXPORTACION = ['pedida', 'lista', 'vencida'] as const;

export const ExportacionDatosSchema = z.strictObject({
  estado: z.enum(ESTADOS_EXPORTACION),
  pedidaEn: InstanteSchema,
  /** Cuándo va a estar (como mucho 48 h). */
  listaAntesDe: InstanteSchema,
  /** URL firmada corta, solo con `lista`. */
  descarga: z.strictObject({ url: z.url(), venceEn: InstanteSchema }).nullable(),
});
export type ExportacionDatos = z.infer<typeof ExportacionDatosSchema>;
