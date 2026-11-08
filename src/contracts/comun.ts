// Piezas comunes a los dominios del bloque Taller (contrato 0.11.0). Mismas reglas que dto.ts: ids UUID, instantes UTC
// con Z, fechas AAAA-MM-DD de Buenos Aires, importes en centavos enteros con moneda y objetos estrictos (un campo de más
// es un 400). Ninguna respuesta lleva un dato personal completo: lo sensible vuelve enmascarado o con los últimos dígitos.
import { z } from 'zod';
import { DECIMALES_CANTIDAD } from './dinero.ts';
import { IdSchema } from './dto.ts';
import { RUBROS } from './rubros.ts';

/** Fecha calendario de Buenos Aires (AAAA-MM-DD). */
export const FechaSchema = z.iso.date();
/** Un mes calendario (AAAA-MM), para la agenda y los ingresos. */
export const MesSchema = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/);

/** Cantidad de un material o una tarea: positiva y con hasta 3 decimales (2,5 metros). La plata se calcula con `multiplicar`. */
export const CantidadSchema = z
  .number()
  .positive()
  .max(10_000)
  .refine((v) => Math.abs(v * 10 ** DECIMALES_CANTIDAD - Math.round(v * 10 ** DECIMALES_CANTIDAD)) < 1e-6, 'Hasta 3 decimales');

/** Código de 6 dígitos (email, SMS, app autenticadora). Nunca viaja del servidor al cliente. */
export const CodigoSeisSchema = z.string().regex(/^\d{6}$/);

/** Iniciales para el avatar (las personas se muestran con iniciales y nombre, nunca con personajes). */
export const InicialesSchema = z.string().min(1).max(3);

/** Una persona tal como se ve en pantalla: nombre e iniciales. Sin teléfono, email ni documento. */
export const PersonaVisibleSchema = z.strictObject({
  nombre: z.string().min(1).max(80),
  iniciales: InicialesSchema,
});
export type PersonaVisible = z.infer<typeof PersonaVisibleSchema>;

/** Otro profesional de Handyx (equipo, contactos, postulantes). `verificado` lo pone solo el servidor. */
export const ProfesionalRefSchema = z.strictObject({
  id: IdSchema,
  nombre: z.string().min(1).max(80),
  iniciales: InicialesSchema,
  rubros: z.array(z.enum(RUBROS)),
  verificado: z.boolean(),
});
export type ProfesionalRef = z.infer<typeof ProfesionalRefSchema>;

/** Foto o archivo privado: URL firmada de corta duración (como las fotos del chat y del diario). */
export const ArchivoFirmadoSchema = z.strictObject({
  id: IdSchema,
  url: z.url(),
});
export type ArchivoFirmado = z.infer<typeof ArchivoFirmadoSchema>;

/**
 * Límites de los archivos que se suben (0.11.0). El tipo se decide por los bytes, nunca por el nombre ni el encabezado.
 * PENDIENTE de confirmar con Operations y Legal; los valores son provisorios.
 */
export const LIMITES_ARCHIVO = {
  /** Fotos: JPEG, PNG o WebP, achicadas y sin metadatos (sin ubicación) en el teléfono. */
  imagenBytes: 5 * 1024 * 1024,
  /** Certificados y antecedentes en PDF. */
  pdfBytes: 10 * 1024 * 1024,
  /** Videos del chat: MP4 o WebM, hasta 1 minuto. */
  videoBytes: 25 * 1024 * 1024,
  videoSegundos: 60,
} as const;

// Errores de 0.11.0 sin sumar códigos (`CODIGOS_ERROR` no cambia; las dos API tienen tablas exhaustivas por código):
// - código de 6 dígitos o de respaldo incorrecto → 400 `validacion` con `campos: [{ campo: 'codigo', codigo: 'incorrecto' }]`;
// - demasiados intentos → 429 `limite`;
// - QR de retiro ya usado o vencido, búsqueda cerrada, invitación vencida → 409 `transicion_invalida`;
// - SMS, lectura de listas, escaneo 3D o almacenamiento sin proveedor autorizado → 503 `servicio_no_disponible`;
// - algo de otro especialista o de una obra donde no estás → 404 `no_encontrado` (no se revela si existe).

/** Subtítulo corto de una tarjeta o un aviso: sin datos personales del cliente más allá del nombre visible. */
export const ResumenCortoSchema = z.string().max(140);

/** Cuerpo de las acciones que solo necesitan la versión (pausar, reanudar, mandar, aceptar…). */
export const ConVersionSchema = z.strictObject({ version: z.int().nonnegative() });
export type ConVersion = z.infer<typeof ConVersionSchema>;
