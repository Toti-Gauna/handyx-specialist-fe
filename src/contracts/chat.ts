// Mensajes y chat (contrato 0.11.0, fase O.6; pantallas F-Mensajes, F-Chat, F-ChatGrupo, F-ChatAcciones, F-ChatEditar,
// F-ChatBorrar, F-ChatSeleccion, F-ChatMedia, F-ChatAdjuntar y F-ChatGrupoInfo). Lo implementa el lote 3.5.
// Reemplaza a `/v1/conversaciones` (0.2.0), que queda hasta 1.0.0 por compatibilidad.
// - Cada chat va atado a un pedido o trabajo (con el cliente), a una obra (grupo: cliente y equipo), al equipo (entre
//   profesionales) o a soporte. Las personas se muestran con iniciales y nombre; nunca teléfonos ni emails.
// - Reacciones (lista cerrada de emojis), responder, copiar, editar (todos ven «editado»; las tarjetas no se editan: se
//   manda una nueva), fijar y silenciar.
// - BORRAR PARA TODOS ES UN BORRADO LÓGICO: se ve «Mensaje eliminado» y el contenido queda oculto y guardado por si hay
//   un reclamo, con la retención que defina Legal. La API nunca devuelve el contenido de un mensaje borrado (ni a su
//   autor); solo Operations lo puede leer, auditado, dentro de un reclamo. Lo mismo con el texto anterior a una edición.
// - Fotos y videos (de hasta 1 minuto): se achican y pierden la ubicación en el teléfono antes de mandarse; se guardan
//   privados y se ven con URL firmada corta. El tipo se decide por los bytes.
// - Las tarjetas (presupuesto, propuesta de obra, repuestos, cambio de fecha, informe, reparto, demora) las crea el
//   servidor cuando se manda cada cosa desde su pantalla; el cliente las responde en el chat.
import { z } from 'zod';
import { InicialesSchema, LIMITES_ARCHIVO, ResumenCortoSchema } from './comun.ts';
import { IdSchema, InstanteSchema, MontoSchema } from './dto.ts';
import { RUBROS } from './rubros.ts';

export const TIPOS_CHAT = ['pedido', 'obra', 'equipo', 'soporte'] as const;
export type TipoChat = (typeof TIPOS_CHAT)[number];
/** Filtros de la lista (F-Mensajes). */
export const FILTROS_CHAT = ['todos', 'pedidos', 'obras', 'equipo', 'soporte'] as const;
/** `sistema`: los avisos de Handyx dentro del chat ("Diego se sumó a la obra"). */
export const ROLES_CHAT = ['cliente', 'titular', 'profesional', 'soporte', 'sistema'] as const;
export const TIPOS_MENSAJE_CHAT = ['texto', 'media', 'tarjeta', 'sistema'] as const;
export const TIPOS_MEDIA = ['foto', 'video', 'archivo'] as const;
export const TIPOS_TARJETA = ['propuesta', 'presupuesto', 'propuesta_obra', 'repuestos', 'cambio_fecha', 'informe', 'reparto', 'demora'] as const;
export type TipoTarjeta = (typeof TIPOS_TARJETA)[number];
/** Lo que el cliente puede hacer con la tarjeta (o ya hizo). */
export const ESTADOS_TARJETA = ['enviada', 'vista', 'aceptada', 'rechazada', 'cambios_pedidos', 'reemplazada', 'vencida'] as const;
/** Lista cerrada de reacciones (F-ChatAcciones). */
export const REACCIONES = ['👍', '❤️', '😂', '😮', '🙏'] as const;
export type Reaccion = (typeof REACCIONES)[number];
/** Hasta cuándo se puede editar un mensaje propio. PENDIENTE de confirmar con Product (provisorio: 15 minutos). */
export const EDICION_MAX_MS = 15 * 60_000;
export const MAX_MEDIA_POR_MENSAJE = 10;
export const MAX_SELECCION = 50;
export const VIDEO_MAX_S = LIMITES_ARCHIVO.videoSegundos;

export const AutorMensajeSchema = z.strictObject({
  /** Id del miembro del chat (no de la cuenta). Null en los mensajes del sistema. */
  miembroId: IdSchema.nullable(),
  nombre: z.string().max(80),
  iniciales: InicialesSchema,
  rol: z.enum(ROLES_CHAT),
  esVos: z.boolean(),
});

export const MediaChatSchema = z.strictObject({
  id: IdSchema,
  tipo: z.enum(TIPOS_MEDIA),
  /** URL firmada de corta duración. */
  url: z.url(),
  miniaturaUrl: z.url().nullable(),
  /** Solo videos: hasta 60 s. */
  duracionS: z.int().min(1).max(VIDEO_MAX_S).nullable(),
  /** Solo archivos (PDF del informe, por ejemplo). */
  nombre: z.string().max(120).nullable(),
  bytes: z.int().positive(),
});
export type MediaChat = z.infer<typeof MediaChatSchema>;

export const TarjetaChatSchema = z.strictObject({
  tipo: z.enum(TIPOS_TARJETA),
  /** Id de lo que representa (presupuesto, obra, repuesto, pedido de cambio, informe, reparto o trabajo). */
  refId: IdSchema,
  titulo: ResumenCortoSchema,
  /** "3 ítems · $ 47.000", "Llego 15 min tarde". */
  detalle: ResumenCortoSchema,
  monto: MontoSchema.nullable(),
  estado: z.enum(ESTADOS_TARJETA),
});
export type TarjetaChat = z.infer<typeof TarjetaChatSchema>;

export const MensajeChatSchema = z.strictObject({
  id: IdSchema,
  chatId: IdSchema,
  autor: AutorMensajeSchema,
  tipo: z.enum(TIPOS_MENSAJE_CHAT),
  /** Null si es solo media o tarjeta, o si se borró. */
  texto: z.string().max(2000).nullable(),
  media: z.array(MediaChatSchema).max(MAX_MEDIA_POR_MENSAJE),
  tarjeta: TarjetaChatSchema.nullable(),
  /** A qué responde: un extracto corto (o «Mensaje eliminado» si ese se borró). */
  respondeA: z.strictObject({ id: IdSchema, autorNombre: z.string(), extracto: z.string().max(140), borrado: z.boolean() }).nullable(),
  reacciones: z.array(z.strictObject({ emoji: z.enum(REACCIONES), cantidad: z.int().positive(), mia: z.boolean() })),
  editadoEn: InstanteSchema.nullable(),
  /** Borrado para todos: sin texto, media ni tarjeta en la respuesta (queda oculto en el servidor). */
  borrado: z.boolean(),
  fijado: z.boolean(),
  enviadoEn: InstanteSchema,
  /** Para mensajes propios: lo vieron todos los demás. */
  vistoPorTodos: z.boolean(),
}).refine((m) => !m.borrado || (m.texto === null && m.media.length === 0 && m.tarjeta === null), {
  message: 'Un mensaje borrado nunca trae su contenido',
});
export type MensajeChat = z.infer<typeof MensajeChatSchema>;

export const MiembroChatSchema = z.strictObject({
  id: IdSchema,
  nombre: z.string().max(80),
  iniciales: InicialesSchema,
  rol: z.enum(ROLES_CHAT),
  /** El oficio, para los profesionales. */
  rubro: z.enum(RUBROS).nullable(),
  esVos: z.boolean(),
  /** Puede agregar personas (el titular). */
  administra: z.boolean(),
  estado: z.enum(['activo', 'invitado', 'salio']),
  desde: InstanteSchema,
});
export type MiembroChat = z.infer<typeof MiembroChatSchema>;

export const ChatResumenSchema = z.strictObject({
  id: IdSchema,
  tipo: z.enum(TIPOS_CHAT),
  /** "Baño completo" o el nombre de la otra persona. */
  titulo: z.string().max(80),
  /** "Obra · grupo de 4", "Pedido · Pierde la canilla". */
  subtitulo: ResumenCortoSchema,
  /** Hasta 4 avatares (iniciales) para el mosaico del grupo. */
  avatares: z.array(InicialesSchema).max(4),
  miembros: z.int().min(1),
  ultimoMensaje: z.strictObject({ autorNombre: z.string().nullable(), extracto: z.string().max(140), en: InstanteSchema }).nullable(),
  noLeidos: z.int().nonnegative(),
  silenciadoHasta: InstanteSchema.nullable(),
  pedidoId: IdSchema.nullable(),
  trabajoId: IdSchema.nullable(),
  obraId: IdSchema.nullable(),
  /** La conversación de 0.2.0 que corresponde (para pasar de una a otra mientras convivan). */
  conversacionId: IdSchema.nullable(),
  actualizadoEn: InstanteSchema,
});
export type ChatResumen = z.infer<typeof ChatResumenSchema>;

export const ChatSchema = ChatResumenSchema.extend({
  miembrosDetalle: z.array(MiembroChatSchema),
  fijado: MensajeChatSchema.nullable(),
  /** Cantidad de fotos, videos y archivos (F-ChatGrupoInfo). */
  archivos: z.int().nonnegative(),
  /** Qué podés hacer: agregar personas (titular de una obra) y salir (solo si ya no trabajás en la obra). */
  puedes: z.strictObject({ agregarPersonas: z.boolean(), salir: z.boolean() }),
});
export type Chat = z.infer<typeof ChatSchema>;

// ── Lo que se manda ───────────────────────────────────────────────────────────────────────────────
/** Texto (JSON). Fotos y videos: multipart con este JSON en `datos` y los archivos en `media` (hasta 10). */
export const EnviarMensajeChatSchema = z.strictObject({
  texto: z.string().trim().max(2000).nullable(),
  respondeA: IdSchema.nullable(),
});
export type EnviarMensajeChat = z.infer<typeof EnviarMensajeChatSchema>;

export const EditarMensajeSchema = z.strictObject({ texto: z.string().trim().min(1).max(2000) });
export type EditarMensaje = z.infer<typeof EditarMensajeSchema>;

export const ReaccionSchema = z.strictObject({ emoji: z.enum(REACCIONES) });

export const SeleccionMensajesSchema = z.strictObject({ ids: z.array(IdSchema).min(1).max(MAX_SELECCION) });
export type SeleccionMensajes = z.infer<typeof SeleccionMensajesSchema>;

/** Reenviar a otro chat tuyo (copia texto y media; las tarjetas no se reenvían). */
export const ReenvioMensajesSchema = SeleccionMensajesSchema.extend({ destinoChatId: IdSchema });
export type ReenvioMensajes = z.infer<typeof ReenvioMensajesSchema>;

export const FijarSchema = z.strictObject({ mensajeId: IdSchema.nullable() });
export const SilencioSchema = z.strictObject({ hasta: InstanteSchema.nullable() });
export const LeidoSchema = z.strictObject({ hasta: IdSchema });
/** Agregar a un contacto profesional al grupo de la obra (queda invitado hasta que acepta, `equipo.ts`). */
export const AgregarPersonaSchema = z.strictObject({ contactoId: IdSchema, rubro: z.enum(RUBROS) });
export type AgregarPersona = z.infer<typeof AgregarPersonaSchema>;
