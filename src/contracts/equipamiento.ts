// Tu equipamiento y la lista de compras (contrato 0.11.0, fase H0.5; pantallas H0-Equipo, H0-EquipoCategoria,
// H0-EquipoAgregar, H0-EquipoDetalle y H0-EquipoBaja). Lo implementa el lote 2.5.
// - Herramientas, instrumentos, seguridad, consumibles y repuestos: dónde está cada cosa, mantenimientos, vencimientos,
//   mínimos y lo que queda poco. Solo lo ve el especialista.
// - Prestar a otro profesional (de tus contactos o por nombre), mover y «Ya no la tengo» con el motivo: sale del
//   equipamiento pero queda en el historial de los trabajos donde se usó; se puede reponer (lista de compras o
//   comparando ferreterías).
// - El código de barras se lee en el teléfono; el servidor solo sugiere un nombre del catálogo (sin precios).
import { z } from 'zod';
import { FechaSchema } from './comun.ts';
import { IdSchema, InstanteSchema, UNIDADES_MATERIAL } from './dto.ts';

export const CATEGORIAS_EQUIPO = ['electricas', 'manuales', 'medicion', 'seguridad', 'consumibles', 'repuestos'] as const;
export type CategoriaEquipo = (typeof CATEGORIAS_EQUIPO)[number];
export const UBICACIONES_EQUIPO = ['camioneta', 'taller', 'obra', 'otro'] as const;
export type UbicacionEquipo = (typeof UBICACIONES_EQUIPO)[number];
export const ESTADOS_EQUIPO = ['funciona', 'con_falla'] as const;
export const MOTIVOS_BAJA_EQUIPO = ['se_rompio', 'la_vendi', 'la_perdi', 'me_la_robaron', 'la_regale', 'otro'] as const;
export type MotivoBajaEquipo = (typeof MOTIVOS_BAJA_EQUIPO)[number];
/** Qué hacer después de «Ya no la tengo». */
export const REPOSICIONES = ['no', 'lista_compras', 'ferreteria'] as const;
export const TIPOS_ALERTA_EQUIPO = ['mantenimiento', 'calibracion', 'vencimiento', 'stock_bajo', 'devolucion'] as const;
export const TIPOS_EVENTO_EQUIPO = ['alta', 'movimiento', 'prestamo', 'devolucion', 'uso', 'mantenimiento', 'baja'] as const;

export const AlertaEquipoSchema = z.strictObject({
  tipo: z.enum(TIPOS_ALERTA_EQUIPO),
  /** "Cambiar escobillas", "Matafuego vence 12/12", "Quedan pocos". */
  texto: z.string().max(80),
  fecha: FechaSchema.nullable(),
});

export const MantenimientoSchema = z.strictObject({
  id: IdSchema,
  descripcion: z.string().min(1).max(80),
  cadaDias: z.int().min(1).max(3650),
  proximoEl: FechaSchema,
  ultimoEl: FechaSchema.nullable(),
});
export type Mantenimiento = z.infer<typeof MantenimientoSchema>;

export const PrestamoSchema = z.strictObject({
  /** Otro profesional de Handyx (si es un contacto) o solo el nombre que escribiste. */
  profesionalId: IdSchema.nullable(),
  aNombre: z.string().min(1).max(80),
  desde: FechaSchema,
  vuelveEl: FechaSchema.nullable(),
});
export type Prestamo = z.infer<typeof PrestamoSchema>;

export const ItemEquipoSchema = z.strictObject({
  id: IdSchema,
  nombre: z.string().min(1).max(80),
  categoria: z.enum(CATEGORIAS_EQUIPO),
  marcaModelo: z.string().max(80).nullable(),
  codigoBarras: z.string().max(32).nullable(),
  /** Foto privada (URL firmada corta). */
  foto: z.strictObject({ id: IdSchema, url: z.url() }).nullable(),
  ubicacion: z.enum(UBICACIONES_EQUIPO),
  prestamo: PrestamoSchema.nullable(),
  estado: z.enum(ESTADOS_EQUIPO),
  compradaEn: FechaSchema.nullable(),
  garantiaHasta: FechaSchema.nullable(),
  /** Matafuego, botiquín, elementos que vencen. */
  venceEn: FechaSchema.nullable(),
  /** Para consumibles y repuestos: cuánto hay y el mínimo para avisar. */
  cantidad: z.int().nonnegative().nullable(),
  unidad: z.enum(UNIDADES_MATERIAL).nullable(),
  minimo: z.int().nonnegative().nullable(),
  mantenimientos: z.array(MantenimientoSchema).max(10),
  alertas: z.array(AlertaEquipoSchema),
  version: z.int().nonnegative(),
});
export type ItemEquipo = z.infer<typeof ItemEquipoSchema>;

export const EventoEquipoSchema = z.strictObject({
  id: IdSchema,
  tipo: z.enum(TIPOS_EVENTO_EQUIPO),
  /** "Prestada a Sofía Ruiz · del 02/11 al 05/11", "Usada en «Baño completo» · Jornada 1". */
  texto: z.string().max(140),
  trabajoId: IdSchema.nullable(),
  en: InstanteSchema,
});
export type EventoEquipo = z.infer<typeof EventoEquipoSchema>;

export const ItemEquipoDetalleSchema = ItemEquipoSchema.extend({
  historial: z.array(EventoEquipoSchema),
});
export type ItemEquipoDetalle = z.infer<typeof ItemEquipoDetalleSchema>;

export const ResumenEquipamientoSchema = z.strictObject({
  categorias: z.array(
    z.strictObject({
      categoria: z.enum(CATEGORIAS_EQUIPO),
      cantidad: z.int().nonnegative(),
      /** La alerta más importante de la categoría ("1 por calibrar") o null si está todo en orden. */
      alerta: z.string().max(80).nullable(),
    }),
  ),
  porUbicacion: z.array(z.strictObject({ ubicacion: z.enum(UBICACIONES_EQUIPO), cantidad: z.int().nonnegative() })),
  prestados: z.int().nonnegative(),
  listaCompras: z.int().nonnegative(),
});
export type ResumenEquipamiento = z.infer<typeof ResumenEquipamientoSchema>;

/** Alta (JSON, o multipart con este JSON en `datos` y la foto en `foto`). */
export const NuevoItemEquipoSchema = z.strictObject({
  nombre: z.string().trim().min(1).max(80),
  categoria: z.enum(CATEGORIAS_EQUIPO),
  marcaModelo: z.string().trim().max(80).nullable(),
  codigoBarras: z.string().trim().max(32).nullable(),
  ubicacion: z.enum(UBICACIONES_EQUIPO),
  compradaEn: FechaSchema.nullable(),
  garantiaHasta: FechaSchema.nullable(),
  venceEn: FechaSchema.nullable(),
  cantidad: z.int().nonnegative().nullable(),
  unidad: z.enum(UNIDADES_MATERIAL).nullable(),
  minimo: z.int().nonnegative().nullable(),
  /** "Recordarme el mantenimiento": "Escobillas cada 6 meses". */
  mantenimiento: z.strictObject({ descripcion: z.string().trim().min(1).max(80), cadaDias: z.int().min(1).max(3650) }).nullable(),
});
export type NuevoItemEquipo = z.infer<typeof NuevoItemEquipoSchema>;

export const CambioItemEquipoSchema = z.strictObject({
  nombre: z.string().trim().min(1).max(80).optional(),
  marcaModelo: z.string().trim().max(80).nullable().optional(),
  estado: z.enum(ESTADOS_EQUIPO).optional(),
  venceEn: FechaSchema.nullable().optional(),
  cantidad: z.int().nonnegative().nullable().optional(),
  minimo: z.int().nonnegative().nullable().optional(),
  version: z.int().nonnegative(),
});
export type CambioItemEquipo = z.infer<typeof CambioItemEquipoSchema>;

export const PrestarEquipoSchema = z.strictObject({
  profesionalId: IdSchema.nullable(),
  aNombre: z.string().trim().min(1).max(80),
  vuelveEl: FechaSchema.nullable(),
  version: z.int().nonnegative(),
});
export type PrestarEquipo = z.infer<typeof PrestarEquipoSchema>;

export const MoverEquipoSchema = z.strictObject({ ubicacion: z.enum(UBICACIONES_EQUIPO), version: z.int().nonnegative() });
export type MoverEquipo = z.infer<typeof MoverEquipoSchema>;

/** «Ya no la tengo»: sale del equipamiento y queda en el historial. Pide confirmación en la app. */
export const BajaEquipoSchema = z.strictObject({
  motivo: z.enum(MOTIVOS_BAJA_EQUIPO),
  detalle: z.string().trim().max(200).nullable(),
  reponer: z.enum(REPOSICIONES),
  version: z.int().nonnegative(),
});
export type BajaEquipo = z.infer<typeof BajaEquipoSchema>;

/** Respuesta de la baja: si eligió la ferretería, el pedido borrador donde quedó para comparar precios. */
export const ResultadoBajaEquipoSchema = z.strictObject({
  item: ItemEquipoDetalleSchema,
  listaComprasId: IdSchema.nullable(),
  pedidoFerreteriaId: IdSchema.nullable(),
});
export type ResultadoBajaEquipo = z.infer<typeof ResultadoBajaEquipoSchema>;

// ── Lista de compras ──────────────────────────────────────────────────────────────────────────────
export const ItemCompraSchema = z.strictObject({
  id: IdSchema,
  nombre: z.string().min(1).max(120),
  cantidad: z.int().positive(),
  unidad: z.enum(UNIDADES_MATERIAL),
  /** De qué salió: un equipo que se dio de baja o un consumible bajo el mínimo (null si se cargó a mano). */
  equipoId: IdSchema.nullable(),
  creadoEn: InstanteSchema,
});
export type ItemCompra = z.infer<typeof ItemCompraSchema>;

export const NuevoItemCompraSchema = z.strictObject({
  nombre: z.string().trim().min(1).max(120),
  cantidad: z.int().positive().max(1000),
  unidad: z.enum(UNIDADES_MATERIAL),
});
export type NuevoItemCompra = z.infer<typeof NuevoItemCompraSchema>;

/** Sugerencia de nombre para un código de barras (catálogo de Handyx, sin precios). */
export const SugerenciaCodigoSchema = z.strictObject({
  codigoBarras: z.string().max(32),
  nombre: z.string().nullable(),
  categoria: z.enum(CATEGORIAS_EQUIPO).nullable(),
});
export type SugerenciaCodigo = z.infer<typeof SugerenciaCodigoSchema>;
