// Modo trabajo y cierre (contrato 0.11.0, fases H0.4 y H0.4b; pantallas H0-Modo, H0-ModoHerramientas, H0-ModoAyuda,
// H0-ModoAgenda, H0-AntesDespues, H0-AntesLado, H0-Informe y H0-InformeEnviado). Lo implementa el lote 2.5 (y el lado
// del cliente, la conformidad, en handyx-client-be).
// - Se abre al pasar el trabajo a `en_curso`. Lista de tareas que empieza por la seguridad, cronómetro con pausa y
//   «Terminé» con el informe que se completa solo. Lo que se guarda necesita conexión (sin cola offline).
// - El cronómetro lo lleva el servidor con tramos (inicio y pausa); la app solo muestra el tiempo.
// - Antes y después con «qué cambiaste»; el dictado se convierte en texto en el teléfono.
// - El informe tiene secciones que se completan solas y no se repiten. Se manda por el chat (tarjeta) y en PDF; el
//   cliente da su conformidad con un toque desde su app. La garantía empieza al mandar el informe. El recordatorio de
//   mantenimiento es para el especialista (nada se le manda solo al cliente).
// - Avisar una demora lo manda el especialista, por el chat del trabajo, cuando toca el botón. Nada se manda solo.
import { z } from 'zod';
import { ArchivoFirmadoSchema, FechaSchema, PersonaVisibleSchema } from './comun.ts';
import { IdSchema, InstanteSchema } from './dto.ts';
import { transicion as t, type Maquina } from './maquinas.ts';

export const ESTADOS_TAREA = ['pendiente', 'en_curso', 'hecha'] as const;
export type EstadoTarea = (typeof ESTADOS_TAREA)[number];
export const ESTADOS_MODO = ['en_curso', 'en_pausa', 'terminado'] as const;
export const MOMENTOS_FOTO = ['antes', 'durante', 'despues'] as const;
export const SECCIONES_INFORME = ['causa', 'antes_despues', 'pruebas', 'materiales_garantia', 'recomendaciones'] as const;
export type SeccionInforme = (typeof SECCIONES_INFORME)[number];
/** `automatica`: se completó sola con lo cargado en el trabajo. */
export const ESTADOS_SECCION = ['falta', 'lista', 'automatica'] as const;
export const ESTADOS_CONFORMIDAD = ['sin_enviar', 'esperando', 'dada', 'con_observaciones'] as const;
export type EstadoConformidad = (typeof ESTADOS_CONFORMIDAD)[number];
/** Minutos de demora que se pueden avisar con un toque. */
export const DEMORAS_MINUTOS = [15, 30] as const;
/** Garantía por defecto en días (la decide el especialista en su propuesta). */
export const GARANTIA_DIAS_DEFECTO = 30;

/** La conformidad la da solo el cliente; con observaciones se abre un caso de soporte. */
export const MAQUINA_CONFORMIDAD: Maquina<EstadoConformidad> = {
  nombre: 'conformidad',
  estados: ESTADOS_CONFORMIDAD,
  inicial: 'sin_enviar',
  transiciones: [
    t('sin_enviar', 'esperando', 'especialista'),
    t('esperando', 'dada', 'usuario'),
    t('esperando', 'con_observaciones', 'usuario'),
    t('con_observaciones', 'dada', 'usuario'),
  ],
};

export const TareaSchema = z.strictObject({
  id: IdSchema,
  orden: z.int().min(1),
  texto: z.string().min(1).max(140),
  /** Las de seguridad van primero y se marcan. */
  seguridad: z.boolean(),
  estado: z.enum(ESTADOS_TAREA),
  /** "Usás: cartucho cerámico 35 mm". */
  material: z.string().max(120).nullable(),
  /** En una obra: la jornada y quién la hace. */
  jornadaId: IdSchema.nullable(),
  asignadaA: PersonaVisibleSchema.extend({ id: IdSchema }).nullable(),
  necesitaMaterial: z.boolean(),
  conFoto: z.boolean(),
  hechaEn: InstanteSchema.nullable(),
  version: z.int().nonnegative(),
});
export type Tarea = z.infer<typeof TareaSchema>;

export const NuevaTareaSchema = z.strictObject({
  texto: z.string().trim().min(1).max(140),
  seguridad: z.boolean(),
  jornadaId: IdSchema.nullable(),
  /** Id de un miembro de la obra (null = vos). */
  asignadaA: IdSchema.nullable(),
  necesitaMaterial: z.boolean(),
  conFoto: z.boolean(),
});
export type NuevaTarea = z.infer<typeof NuevaTareaSchema>;

export const CambioTareaSchema = z.strictObject({
  estado: z.enum(ESTADOS_TAREA).optional(),
  texto: z.string().trim().min(1).max(140).optional(),
  orden: z.int().min(1).optional(),
  asignadaA: IdSchema.nullable().optional(),
  version: z.int().nonnegative(),
});
export type CambioTarea = z.infer<typeof CambioTareaSchema>;

export const ModoTrabajoSchema = z.strictObject({
  trabajoId: IdSchema,
  estado: z.enum(ESTADOS_MODO),
  /** Tramos del cronómetro: el tiempo es la suma (la app la calcula con el reloj del servidor). */
  tramos: z.array(z.strictObject({ desde: InstanteSchema, hasta: InstanteSchema.nullable() })),
  tareaActualId: IdSchema.nullable(),
  tareas: z.array(TareaSchema),
  fotos: z.array(ArchivoFirmadoSchema.extend({ momento: z.enum(MOMENTOS_FOTO), tareaId: IdSchema.nullable(), en: InstanteSchema })),
  /** Notas cortas (dictadas o escritas). Las ve solo el especialista salvo que las sume al informe. */
  notas: z.array(z.strictObject({ id: IdSchema, texto: z.string().max(500), en: InstanteSchema })),
  version: z.int().nonnegative(),
});
export type ModoTrabajo = z.infer<typeof ModoTrabajoSchema>;

export const NuevaNotaSchema = z.strictObject({ texto: z.string().trim().min(1).max(500) });
/** Campos del multipart de una foto del trabajo (la foto va en `foto`, achicada y sin ubicación). */
export const CamposFotoTrabajoSchema = z.strictObject({ momento: z.enum(MOMENTOS_FOTO), tareaId: IdSchema.optional() });

// ── Antes y después ───────────────────────────────────────────────────────────────────────────────
export const CambioHechoSchema = z.strictObject({
  titulo: z.string().trim().min(1).max(80),
  detalle: z.string().trim().max(280).nullable(),
});

export const AntesDespuesSchema = z.strictObject({
  antes: ArchivoFirmadoSchema.extend({ en: InstanteSchema }).nullable(),
  despues: ArchivoFirmadoSchema.extend({ en: InstanteSchema }).nullable(),
  cambios: z.array(CambioHechoSchema).max(10),
  version: z.int().nonnegative(),
});
export type AntesDespues = z.infer<typeof AntesDespuesSchema>;

export const GuardarAntesDespuesSchema = z.strictObject({
  /** Ids de fotos del trabajo (momento `antes` y `despues`). */
  antesFotoId: IdSchema.nullable(),
  despuesFotoId: IdSchema.nullable(),
  cambios: z.array(CambioHechoSchema).max(10),
  version: z.int().nonnegative(),
});
export type GuardarAntesDespues = z.infer<typeof GuardarAntesDespuesSchema>;

// ── Informe, conformidad y garantía ───────────────────────────────────────────────────────────────
export const GarantiaSchema = z.strictObject({
  dias: z.int().min(1).max(365),
  desde: FechaSchema,
  hasta: FechaSchema,
  estado: z.enum(['activa', 'vencida']),
});
export type Garantia = z.infer<typeof GarantiaSchema>;

export const InformeTrabajoSchema = z.strictObject({
  trabajoId: IdSchema,
  secciones: z.array(
    z.strictObject({
      seccion: z.enum(SECCIONES_INFORME),
      estado: z.enum(ESTADOS_SECCION),
      /** "La causa: disco del cartucho gastado", "Sin pérdidas a los 10 minutos". Sin datos del cliente. */
      texto: z.string().max(1000).nullable(),
    }),
  ),
  /** Listas sobre el total ("4 de 5"). */
  completas: z.int().nonnegative(),
  garantia: GarantiaSchema.nullable(),
  recordatorioMantenimiento: FechaSchema.nullable(),
  enviadoEn: InstanteSchema.nullable(),
  conformidad: z.strictObject({ estado: z.enum(ESTADOS_CONFORMIDAD), en: InstanteSchema.nullable() }),
  /** PDF del informe (URL firmada corta), después de mandarlo. */
  pdf: z.strictObject({ url: z.url(), venceEn: InstanteSchema }).nullable(),
  version: z.int().nonnegative(),
});
export type InformeTrabajo = z.infer<typeof InformeTrabajoSchema>;

export const GuardarSeccionInformeSchema = z.strictObject({
  texto: z.string().trim().min(1).max(1000),
  version: z.int().nonnegative(),
});
export type GuardarSeccionInforme = z.infer<typeof GuardarSeccionInformeSchema>;

export const EnvioInformeSchema = z.strictObject({
  garantiaDias: z.int().min(1).max(365).nullable(),
  /** Para vos: cuándo conviene volver (te avisamos a vos, nunca al cliente solo). */
  recordatorioMantenimiento: FechaSchema.nullable(),
  version: z.int().nonnegative(),
});
export type EnvioInforme = z.infer<typeof EnvioInformeSchema>;

/** Avisarle al cliente que llegás tarde (H0-ModoAgenda, F-InicioDia): una tarjeta en el chat de su trabajo. */
export const AvisoDemoraSchema = z.strictObject({
  minutos: z.union([z.literal(DEMORAS_MINUTOS[0]), z.literal(DEMORAS_MINUTOS[1])]),
});
export type AvisoDemora = z.infer<typeof AvisoDemoraSchema>;
