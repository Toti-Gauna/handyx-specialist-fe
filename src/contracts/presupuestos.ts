// Presupuestos con versiones, lista de precios, mano de obra y catálogo de nombres (contrato 0.11.0, fase H0.2;
// pantallas H0-Presupuesto, H0-AgregarMaterial, H0-MaterialOpciones, H0-MaterialNuevo, H0-AgregarLista, H0-Precios,
// H0-PreciosFoto, H0-PreciosRevisar, H0-PrecioItem y H0-ManoObra). Lo implementa el lote 2.5.
// - Los precios los pone el especialista: Handyx solo sugiere en cada pedido y nunca fija un mínimo ni un máximo.
// - Cada material se agrega con precio FIJO (se congela en ese presupuesto) o que SE ACTUALIZA con la lista: si la lista
//   cambia antes de que el cliente acepte, el presupuesto avisa (`actualizacionPendiente`) y se manda una versión nueva.
// - Al agregar, dos casillas: cobrárselo al cliente y anotarlo como gasto (con la foto del ticket al comprarlo).
// - Se manda directo por el chat (sin vista previa): llega como tarjeta y el cliente lo acepta o pide cambios allá.
// - La foto de la lista del corralón se lee EN EL TELÉFONO: la foto no sale del teléfono; al servidor van solo las filas.
// - El catálogo de Handyx tiene nombres de materiales, nunca precios: un material nuevo suma su nombre (revisado por
//   Operations antes de verlo otros) y el precio queda solo para el especialista.
import { z } from 'zod';
import { CantidadSchema, FechaSchema } from './comun.ts';
import { IdSchema, InstanteSchema, MontoSchema, UNIDADES_MATERIAL } from './dto.ts';
import { transicion as t, type Maquina } from './maquinas.ts';
import { RUBROS } from './rubros.ts';

export const MODOS_PRECIO = ['fijo', 'actualiza'] as const;
export type ModoPrecio = (typeof MODOS_PRECIO)[number];
/** Categoría de un precio: un rubro o `otra`. */
export const CATEGORIAS_PRECIO = [...RUBROS, 'otra'] as const;
export type CategoriaPrecio = (typeof CATEGORIAS_PRECIO)[number];
export const FUENTES_PRECIO = ['a_mano', 'foto_lista', 'ferreteria', 'material_nuevo'] as const;
/** Una fila leída de la lista del corralón comparada con la tuya. `revisar`: el teléfono no la entendió. */
export const RESULTADOS_LECTURA = ['sube', 'baja', 'igual', 'nuevo', 'revisar'] as const;
/** Pasados estos días, un precio se marca viejo (se puede cambiar por precio). */
export const DIAS_PRECIO_VIEJO = 30;

// ── Presupuesto ───────────────────────────────────────────────────────────────────────────────────
export const ESTADOS_PRESUPUESTO = ['borrador', 'enviado', 'visto', 'aceptado', 'rechazado', 'reemplazado', 'vencido'] as const;
export type EstadoPresupuesto = (typeof ESTADOS_PRESUPUESTO)[number];

/** Una versión enviada no se edita: se arma otra (borrador) y al mandarla la anterior queda `reemplazado`. */
export const MAQUINA_PRESUPUESTO: Maquina<EstadoPresupuesto> = {
  nombre: 'presupuesto',
  estados: ESTADOS_PRESUPUESTO,
  inicial: 'borrador',
  transiciones: [
    t('borrador', 'enviado', 'especialista'),
    t('enviado', 'visto', 'sistema'),
    t('enviado', 'aceptado', 'usuario'),
    t('visto', 'aceptado', 'usuario'),
    t('enviado', 'rechazado', 'usuario'),
    t('visto', 'rechazado', 'usuario'),
    t('enviado', 'reemplazado', 'sistema'),
    t('visto', 'reemplazado', 'sistema'),
    t('enviado', 'vencido', 'sistema'),
    t('visto', 'vencido', 'sistema'),
  ],
};

export const ItemMaterialSchema = z.strictObject({
  id: IdSchema,
  /** De tu lista de precios (null si se escribió a mano en este presupuesto). */
  precioId: IdSchema.nullable(),
  nombre: z.string().min(1).max(120),
  unidad: z.enum(UNIDADES_MATERIAL),
  cantidad: CantidadSchema,
  precioUnitario: MontoSchema,
  /** `multiplicar(precioUnitario, cantidad)`, calculado por el servidor. */
  subtotal: MontoSchema,
  modoPrecio: z.enum(MODOS_PRECIO),
  /** "Fijado hoy" o "tu lista del 05/11". */
  precioDel: FechaSchema,
  cobrarAlCliente: z.boolean(),
  registrarGasto: z.boolean(),
  /** Con `actualiza`: la lista cambió después de armarlo (lo nuevo entra en la próxima versión). */
  precioNuevo: MontoSchema.nullable(),
});
export type ItemMaterial = z.infer<typeof ItemMaterialSchema>;

export const ItemManoObraSchema = z.strictObject({
  id: IdSchema,
  /** De tus tarifas (null si se escribió a mano). */
  tarifaId: IdSchema.nullable(),
  descripcion: z.string().min(1).max(200),
  cantidad: CantidadSchema,
  precioUnitario: MontoSchema,
  subtotal: MontoSchema,
});
export type ItemManoObra = z.infer<typeof ItemManoObraSchema>;

export const PresupuestoSchema = z.strictObject({
  id: IdSchema,
  /** A qué va atado: un pedido (antes de contratar), un trabajo o una obra. Uno solo. */
  pedidoId: IdSchema.nullable(),
  trabajoId: IdSchema.nullable(),
  obraId: IdSchema.nullable(),
  titulo: z.string().min(1).max(120),
  /** "Versión 2": sube al mandar una versión nueva. No confundir con `version` (concurrencia). */
  numeroVersion: z.int().min(1),
  /** La versión anterior, si esta la reemplaza. */
  reemplazaA: IdSchema.nullable(),
  estado: z.enum(ESTADOS_PRESUPUESTO),
  manoDeObra: z.array(ItemManoObraSchema).max(60),
  materiales: z.array(ItemMaterialSchema).max(120),
  /** Lo que ve el cliente: solo lo que se le cobra. */
  totales: z.strictObject({ manoDeObra: MontoSchema, materiales: MontoSchema, total: MontoSchema }),
  /** Algún precio que se actualiza cambió: conviene mandar una versión nueva (el servidor avisa). */
  actualizacionPendiente: z.boolean(),
  vigenteHasta: FechaSchema.nullable(),
  enviadoEn: InstanteSchema.nullable(),
  vistoEn: InstanteSchema.nullable(),
  respondidoEn: InstanteSchema.nullable(),
  /** El mensaje del chat con la tarjeta (al mandarlo). */
  mensajeId: IdSchema.nullable(),
  version: z.int().nonnegative(),
});
export type Presupuesto = z.infer<typeof PresupuestoSchema>;

export const NuevoPresupuestoSchema = z
  .strictObject({
    pedidoId: IdSchema.nullable(),
    trabajoId: IdSchema.nullable(),
    obraId: IdSchema.nullable(),
    titulo: z.string().trim().min(1).max(120),
    /** Empezar desde una plantilla tuya (opcional). */
    plantillaId: IdSchema.nullable(),
  })
  .refine((p) => [p.pedidoId, p.trabajoId, p.obraId].filter((x) => x !== null).length === 1, 'Atalo a un pedido, un trabajo o una obra');
export type NuevoPresupuesto = z.infer<typeof NuevoPresupuestoSchema>;

/** Un material para agregar: de la lista (`precioId`) o escrito a mano (nombre, unidad y precio). */
export const AgregarMaterialSchema = z
  .strictObject({
    precioId: IdSchema.nullable(),
    nombre: z.string().trim().min(1).max(120).nullable(),
    unidad: z.enum(UNIDADES_MATERIAL).nullable(),
    precioUnitario: MontoSchema.nullable(),
    cantidad: CantidadSchema,
    modoPrecio: z.enum(MODOS_PRECIO),
    cobrarAlCliente: z.boolean(),
    registrarGasto: z.boolean(),
  })
  .refine(
    (m) => m.precioId !== null || (m.nombre !== null && m.unidad !== null && m.precioUnitario !== null),
    'Elegí un precio de tu lista o completá nombre, unidad y precio',
  );
export type AgregarMaterial = z.infer<typeof AgregarMaterialSchema>;

/** De a uno o varios a la vez (un kit o varios de tu lista). */
export const AgregarMaterialesSchema = z.strictObject({
  materiales: z.array(AgregarMaterialSchema).min(1).max(40),
  version: z.int().nonnegative(),
});
export type AgregarMateriales = z.infer<typeof AgregarMaterialesSchema>;

export const CambioItemMaterialSchema = z.strictObject({
  cantidad: CantidadSchema.optional(),
  modoPrecio: z.enum(MODOS_PRECIO).optional(),
  cobrarAlCliente: z.boolean().optional(),
  registrarGasto: z.boolean().optional(),
  version: z.int().nonnegative(),
});
export type CambioItemMaterial = z.infer<typeof CambioItemMaterialSchema>;

export const AgregarManoObraSchema = z
  .strictObject({
    tarifaId: IdSchema.nullable(),
    descripcion: z.string().trim().min(1).max(200).nullable(),
    precioUnitario: MontoSchema.nullable(),
    cantidad: CantidadSchema,
    version: z.int().nonnegative(),
  })
  .refine((m) => m.tarifaId !== null || (m.descripcion !== null && m.precioUnitario !== null), 'Elegí una tarifa o escribí la tarea y su precio');
export type AgregarManoObra = z.infer<typeof AgregarManoObraSchema>;

export const EnvioPresupuestoSchema = z.strictObject({
  /** Hasta cuándo vale (opcional). */
  vigenteHasta: FechaSchema.nullable(),
  version: z.int().nonnegative(),
});
export type EnvioPresupuesto = z.infer<typeof EnvioPresupuestoSchema>;

/** Cómo agregás materiales por defecto (H0-MaterialOpciones): se cambia cuando quieras. */
export const PreferenciasMaterialSchema = z.strictObject({
  cobrarAlCliente: z.boolean(),
  registrarGasto: z.boolean(),
  modoPrecio: z.enum(MODOS_PRECIO),
  version: z.int().nonnegative(),
});
export type PreferenciasMaterial = z.infer<typeof PreferenciasMaterialSchema>;

export const PlantillaPresupuestoSchema = z.strictObject({
  id: IdSchema,
  nombre: z.string().min(1).max(80),
  rubro: z.enum(RUBROS).nullable(),
  materiales: z.int().nonnegative(),
  tareas: z.int().nonnegative(),
  creadaEn: InstanteSchema,
});
export type PlantillaPresupuesto = z.infer<typeof PlantillaPresupuestoSchema>;

/** Un kit para agregar varios de una vez ("Cambio de grifería"). Los de Handyx traen nombres, nunca precios. */
export const KitMaterialesSchema = z.strictObject({
  id: IdSchema,
  nombre: z.string().min(1).max(80),
  rubro: z.enum(RUBROS).nullable(),
  origen: z.enum(['handyx', 'propio']),
  items: z.array(
    z.strictObject({
      catalogoId: IdSchema.nullable(),
      nombre: z.string().min(1).max(120),
      unidad: z.enum(UNIDADES_MATERIAL),
      cantidad: CantidadSchema,
      /** Tu precio para ese material, si está en tu lista. */
      precioId: IdSchema.nullable(),
    }),
  ),
});
export type KitMateriales = z.infer<typeof KitMaterialesSchema>;

// ── Lista de precios ──────────────────────────────────────────────────────────────────────────────
export const PrecioMaterialSchema = z.strictObject({
  id: IdSchema,
  /** El nombre del catálogo de Handyx, si salió de ahí. */
  catalogoId: IdSchema.nullable(),
  nombre: z.string().min(1).max(120),
  categoria: z.enum(CATEGORIAS_PRECIO),
  unidad: z.enum(UNIDADES_MATERIAL),
  /** Lo que te cuesta. */
  costo: MontoSchema,
  /** Lo que le cobrás al cliente (el margen lo decidís vos; igual al costo si no ponés margen). */
  precioCliente: MontoSchema,
  /** "Corralón Simulación": de dónde sacaste el precio (texto libre, sin datos personales). */
  proveedor: z.string().max(80).nullable(),
  fuente: z.enum(FUENTES_PRECIO),
  modoPrecio: z.enum(MODOS_PRECIO),
  actualizadoEn: FechaSchema,
  /** Avisarte si tiene más de N días (null = no avisar). */
  avisarSiViejoDias: z.int().min(7).max(365).nullable(),
  viejo: z.boolean(),
  version: z.int().nonnegative(),
});
export type PrecioMaterial = z.infer<typeof PrecioMaterialSchema>;

export const PrecioDetalleSchema = PrecioMaterialSchema.extend({
  /** Cómo varió el costo (del más viejo al más nuevo), hasta 24 puntos. */
  historial: z.array(z.strictObject({ fecha: FechaSchema, costo: MontoSchema })).max(24),
});
export type PrecioDetalle = z.infer<typeof PrecioDetalleSchema>;

export const NuevoPrecioSchema = z.strictObject({
  catalogoId: IdSchema.nullable(),
  nombre: z.string().trim().min(1).max(120),
  categoria: z.enum(CATEGORIAS_PRECIO),
  unidad: z.enum(UNIDADES_MATERIAL),
  costo: MontoSchema,
  precioCliente: MontoSchema.nullable(),
  proveedor: z.string().trim().max(80).nullable(),
  modoPrecio: z.enum(MODOS_PRECIO),
  /** "Material nuevo" (H0-MaterialNuevo): el NOMBRE se propone al catálogo de Handyx; el precio nunca. */
  sumarAlCatalogo: z.boolean(),
});
export type NuevoPrecio = z.infer<typeof NuevoPrecioSchema>;

export const CambioPrecioSchema = z.strictObject({
  costo: MontoSchema.optional(),
  precioCliente: MontoSchema.optional(),
  proveedor: z.string().trim().max(80).nullable().optional(),
  modoPrecio: z.enum(MODOS_PRECIO).optional(),
  avisarSiViejoDias: z.int().min(7).max(365).nullable().optional(),
  version: z.int().nonnegative(),
});
export type CambioPrecio = z.infer<typeof CambioPrecioSchema>;

/** Filas leídas en el teléfono de la foto de una lista (la foto nunca se manda). */
export const LecturaListaSchema = z.strictObject({
  proveedor: z.string().trim().min(1).max(80),
  fecha: FechaSchema,
  filas: z
    .array(
      z.strictObject({
        nombre: z.string().trim().min(1).max(120),
        unidad: z.enum(UNIDADES_MATERIAL),
        costo: MontoSchema,
        /** Con cuál de tu lista la emparejaste (o null para que la empareje el servidor por nombre). */
        precioId: IdSchema.nullable(),
      }),
    )
    .min(1)
    .max(300),
});
export type LecturaLista = z.infer<typeof LecturaListaSchema>;

/** Vista previa de lo leído: qué sube, baja, queda igual o es nuevo. No guarda nada. */
export const RevisionLecturaSchema = z.strictObject({
  filas: z.array(
    z.strictObject({
      nombre: z.string(),
      resultado: z.enum(RESULTADOS_LECTURA),
      precioId: IdSchema.nullable(),
      anterior: MontoSchema.nullable(),
      nuevo: MontoSchema,
      /** Variación en puntos básicos (+8 % = 800); null si es nuevo. */
      variacionBps: z.int().nullable(),
    }),
  ),
  /** Presupuestos abiertos con precio que se actualiza que van a avisar. */
  presupuestosAfectados: z.int().nonnegative(),
});
export type RevisionLectura = z.infer<typeof RevisionLecturaSchema>;

export const ResultadoLecturaSchema = z.strictObject({
  creados: z.int().nonnegative(),
  actualizados: z.int().nonnegative(),
  sinCambios: z.int().nonnegative(),
});
export type ResultadoLectura = z.infer<typeof ResultadoLecturaSchema>;

// ── Mano de obra (H0-ManoObra) ────────────────────────────────────────────────────────────────────
export const TarifaTareaSchema = z.strictObject({
  id: IdSchema,
  rubro: z.enum(RUBROS),
  nombre: z.string().min(1).max(80),
  /** "Incluye prueba", "Por unidad", "Sin máquina". */
  detalle: z.string().max(80).nullable(),
  monto: MontoSchema,
  version: z.int().nonnegative(),
});
export type TarifaTarea = z.infer<typeof TarifaTareaSchema>;

export const ManoDeObraSchema = z.strictObject({
  hora: MontoSchema.nullable(),
  visita: MontoSchema.nullable(),
  /** Recargo de urgencia en puntos básicos (+30 % = 3000); lo pone el especialista, nunca Handyx. */
  urgenciaBps: z.int().min(0).max(10_000).nullable(),
  tareas: z.array(TarifaTareaSchema),
  version: z.int().nonnegative(),
});
export type ManoDeObra = z.infer<typeof ManoDeObraSchema>;

export const GuardarTarifasBaseSchema = ManoDeObraSchema.pick({ hora: true, visita: true, urgenciaBps: true, version: true });
export type GuardarTarifasBase = z.infer<typeof GuardarTarifasBaseSchema>;

export const NuevaTarifaTareaSchema = z.strictObject({
  rubro: z.enum(RUBROS),
  nombre: z.string().trim().min(1).max(80),
  detalle: z.string().trim().max(80).nullable(),
  monto: MontoSchema,
});
export type NuevaTarifaTarea = z.infer<typeof NuevaTarifaTareaSchema>;

// ── Catálogo de nombres de Handyx (sin precios) ───────────────────────────────────────────────────
export const MaterialCatalogoSchema = z.strictObject({
  id: IdSchema,
  nombre: z.string().min(1).max(120),
  categoria: z.enum(CATEGORIAS_PRECIO),
  unidad: z.enum(UNIDADES_MATERIAL),
});
export type MaterialCatalogo = z.infer<typeof MaterialCatalogoSchema>;
