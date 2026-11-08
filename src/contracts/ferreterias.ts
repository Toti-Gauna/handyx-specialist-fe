// Ferretería desde la app del especialista (contrato 0.11.0, fases R.0, R.0b y R.1; pantallas R-Catalogo, R-Categoria,
// R-Pedir, R-Comparar, R-Ferreterias, R-Estado, R-Retiro y R-Mostrador). Lo implementa el lote 4.3; mientras tanto, el
// mock con ferreterías «Simulación» (el Panel de prueba hace de ferretería). El panel y la app del ferretero tienen su
// propia API (`handyx-ferreterias-be`, propuesta) sobre el mismo esquema.
// - Cada ferretería pone sus precios y su stock; pueden cambiar hasta que confirma el pedido. Handyx no pone precios ni
//   se queda con nada de la venta: el profesional paga en el mostrador.
// - Un pedido único, agrupado por trabajo, con las casillas de gasto y cobro al cliente (lo que corresponde va por el
//   chat de cada trabajo como repuesto para aprobar).
// - Estados: enviado → confirmado con precios (y reemplazos sugeridos) → preparando → listo para retirar → retirado.
// - Retiro con un QR FIRMADO y de UN SOLO USO: el servidor guarda solo su hash; al escanearlo la ferretería, queda
//   usado y el pedido pasa a retirado (el gasto se registra con el ticket). Vence al vencer el retiro.
import { z } from 'zod';
import { CantidadSchema, ResumenCortoSchema } from './comun.ts';
import { HoraSchema, IdSchema, InstanteSchema, MontoSchema, PuntoSchema, UNIDADES_MATERIAL } from './dto.ts';
import { transicion as t, type Maquina } from './maquinas.ts';

export const CATEGORIAS_FERRETERIA = [
  'fijaciones',
  'plomeria',
  'electricidad',
  'gas',
  'pintura',
  'albanileria',
  'herramientas',
  'seguridad',
  'limpieza_adhesivos',
] as const;
export type CategoriaFerreteria = (typeof CATEGORIAS_FERRETERIA)[number];
export const ESTADOS_PEDIDO_FERRETERIA = ['borrador', 'enviado', 'confirmado', 'preparando', 'listo', 'retirado', 'cancelado', 'vencido'] as const;
export type EstadoPedidoFerreteria = (typeof ESTADOS_PEDIDO_FERRETERIA)[number];
export const STOCKS = ['hay', 'pocos', 'sin_stock'] as const;
export const ORDENES_COMPARACION = ['precio', 'distancia', 'abierta'] as const;
export const ESTADOS_REEMPLAZO = ['sugerido', 'aceptado', 'rechazado'] as const;
/** Cuánto vale el QR después de quedar listo, si no se retira (provisorio; lo define cada ferretería en 4.3). */
export const VIGENCIA_RETIRO_MS = 48 * 60 * 60_000;

/** Lo arma y lo manda el especialista; lo confirma, prepara y entrega la ferretería; vence si no se retira. */
export const MAQUINA_PEDIDO_FERRETERIA: Maquina<EstadoPedidoFerreteria> = {
  nombre: 'pedido_ferreteria',
  estados: ESTADOS_PEDIDO_FERRETERIA,
  inicial: 'borrador',
  transiciones: [
    t('borrador', 'enviado', 'especialista'),
    t('enviado', 'confirmado', 'ferreteria'),
    t('confirmado', 'preparando', 'ferreteria'),
    t('preparando', 'listo', 'ferreteria'),
    // Solo con el QR de un uso escaneado por la ferretería (o su código escrito a mano en el panel).
    t('listo', 'retirado', 'ferreteria'),
    t('enviado', 'cancelado', 'especialista', 'ferreteria'),
    t('confirmado', 'cancelado', 'especialista', 'ferreteria'),
    t('preparando', 'cancelado', 'especialista', 'ferreteria'),
    t('listo', 'cancelado', 'especialista', 'ferreteria'),
    t('listo', 'vencido', 'sistema'),
  ],
};

// ── Catálogo ──────────────────────────────────────────────────────────────────────────────────────
export const CategoriaCatalogoSchema = z.strictObject({
  id: z.enum(CATEGORIAS_FERRETERIA),
  nombre: z.string(),
  productos: z.int().nonnegative(),
  subcategorias: z.array(z.strictObject({ id: z.string().min(1), nombre: z.string() })),
});
export type CategoriaCatalogo = z.infer<typeof CategoriaCatalogoSchema>;

export const VarianteSchema = z.strictObject({
  id: IdSchema,
  /** "8 mm", "6 × 40", "Chico". */
  nombre: z.string().min(1).max(40),
  /** "Caja de 50", "Tira de 4 m". */
  presentacion: z.string().max(60).nullable(),
  unidad: z.enum(UNIDADES_MATERIAL),
});

export const ProductoCatalogoSchema = z.strictObject({
  id: IdSchema,
  nombre: z.string().min(1).max(120),
  descripcion: z.string().max(200).nullable(),
  categoria: z.enum(CATEGORIAS_FERRETERIA),
  subcategoria: z.string().nullable(),
  variantes: z.array(VarianteSchema).min(1),
  /** El precio más bajo entre las ferreterías adheridas cercanas (orientativo; cada una confirma el suyo). */
  precioDesde: MontoSchema.nullable(),
  /** Datos de ejemplo mientras no haya ferreterías reales. */
  simulacion: z.boolean(),
});
export type ProductoCatalogo = z.infer<typeof ProductoCatalogoSchema>;

// ── Ferreterías y comparación ─────────────────────────────────────────────────────────────────────
export const FerreteriaSchema = z.strictObject({
  id: IdSchema,
  /** "Ferretería Simulación Centro". Las de prueba dicen «Simulación». */
  nombre: z.string(),
  simulacion: z.boolean(),
  /** Dirección y punto del LOCAL (dato público del comercio). */
  direccion: z.string(),
  punto: PuntoSchema,
  barrio: z.string(),
  abiertaAhora: z.boolean(),
  /** Hoy abre hasta (null si hoy no abre). */
  abiertaHasta: HoraSchema.nullable(),
  /** Al local desde el punto que mandó la app (redondeada a 100 m); null si no mandó. */
  distanciaM: z.int().nonnegative().nullable(),
});
export type Ferreteria = z.infer<typeof FerreteriaSchema>;

/** Va en el cuerpo de un POST (la posición nunca en la URL; no se guarda). */
export const ComparacionSchema = z
  .strictObject({
    /** Comparar un pedido entero o una variante suelta (un repuesto). */
    pedidoId: IdSchema.nullable(),
    varianteId: IdSchema.nullable(),
    cantidad: CantidadSchema.nullable(),
    desde: PuntoSchema.nullable(),
    orden: z.enum(ORDENES_COMPARACION),
  })
  .refine((c) => (c.pedidoId !== null) !== (c.varianteId !== null && c.cantidad !== null), 'Compará un pedido o una variante con su cantidad');
export type Comparacion = z.infer<typeof ComparacionSchema>;

export const OfertaFerreteriaSchema = z.strictObject({
  ferreteria: FerreteriaSchema,
  /** Null si no tiene nada de lo pedido. */
  total: MontoSchema.nullable(),
  precioUnitario: MontoSchema.nullable(),
  stock: z.enum(STOCKS),
  /** Ítems del pedido que no tiene. */
  faltan: z.array(z.string().max(120)),
  /** Precios con más de 30 días: se marcan. */
  preciosViejos: z.boolean(),
  /** "El más barato", "La más cerca". */
  destacado: z.enum(['mas_barata', 'mas_cerca']).nullable(),
});
export type OfertaFerreteria = z.infer<typeof OfertaFerreteriaSchema>;

// ── Pedido ────────────────────────────────────────────────────────────────────────────────────────
export const ItemPedidoFerreteriaSchema = z.strictObject({
  id: IdSchema,
  varianteId: IdSchema,
  nombre: z.string().max(120),
  variante: z.string().max(40),
  presentacion: z.string().max(60).nullable(),
  cantidad: CantidadSchema,
  /** Para qué trabajo es (null = para tu equipamiento o la lista de compras). */
  trabajoId: IdSchema.nullable(),
  trabajoTitulo: z.string().nullable(),
  /** El repuesto de la obra que representa, si salió de ahí (ya aprobado por el cliente o sin cobrarle). */
  repuestoId: IdSchema.nullable(),
  /** De dónde salió: presupuesto, repuesto de la obra, lista de compras o el catálogo. */
  origen: z.enum(['presupuesto', 'repuesto', 'lista_compras', 'catalogo']),
  registrarGasto: z.boolean(),
  cobrarAlCliente: z.boolean(),
  /** Precio orientativo antes de confirmar; el de la ferretería después. */
  precioUnitario: MontoSchema.nullable(),
  subtotal: MontoSchema.nullable(),
  stock: z.enum(STOCKS).nullable(),
  reemplazo: z
    .strictObject({
      id: IdSchema,
      /** "Teflón: no hay de 12 mm · Ofrecen 19 mm". */
      texto: ResumenCortoSchema,
      variante: z.string().max(40),
      precioUnitario: MontoSchema,
      estado: z.enum(ESTADOS_REEMPLAZO),
    })
    .nullable(),
});
export type ItemPedidoFerreteria = z.infer<typeof ItemPedidoFerreteriaSchema>;

export const PedidoFerreteriaSchema = z.strictObject({
  id: IdSchema,
  /** "HX-4815": se dicta o se escribe en el mostrador. */
  codigo: z.string().regex(/^HX-\d{4,8}$/).nullable(),
  ferreteria: FerreteriaSchema.nullable(),
  estado: z.enum(ESTADOS_PEDIDO_FERRETERIA),
  items: z.array(ItemPedidoFerreteriaSchema).max(100),
  /** Total con los precios de la ferretería (null hasta confirmar). Se paga en el mostrador. */
  total: MontoSchema.nullable(),
  /** El total orientativo antes de confirmar. */
  totalEstimado: MontoSchema.nullable(),
  eventos: z.array(z.strictObject({ estado: z.enum(ESTADOS_PEDIDO_FERRETERIA), en: InstanteSchema })),
  retirarHasta: InstanteSchema.nullable(),
  simulacion: z.boolean(),
  version: z.int().nonnegative(),
});
export type PedidoFerreteria = z.infer<typeof PedidoFerreteriaSchema>;

export const AgregarItemPedidoSchema = z.strictObject({
  varianteId: IdSchema,
  cantidad: CantidadSchema,
  trabajoId: IdSchema.nullable(),
  repuestoId: IdSchema.nullable(),
  registrarGasto: z.boolean(),
  cobrarAlCliente: z.boolean(),
});
export type AgregarItemPedido = z.infer<typeof AgregarItemPedidoSchema>;

export const CambioItemPedidoSchema = z.strictObject({
  cantidad: CantidadSchema.optional(),
  registrarGasto: z.boolean().optional(),
  cobrarAlCliente: z.boolean().optional(),
  version: z.int().nonnegative(),
});
export type CambioItemPedido = z.infer<typeof CambioItemPedidoSchema>;

export const EnvioPedidoFerreteriaSchema = z.strictObject({ ferreteriaId: IdSchema, version: z.int().nonnegative() });
export type EnvioPedidoFerreteria = z.infer<typeof EnvioPedidoFerreteriaSchema>;

export const RespuestaReemplazoSchema = z.strictObject({ accion: z.enum(['aceptar', 'rechazar']), version: z.int().nonnegative() });
export type RespuestaReemplazo = z.infer<typeof RespuestaReemplazoSchema>;

/** El retiro (R-Retiro y R-Mostrador): el QR firmado de un solo uso y la lista con letra grande. */
export const RetiroSchema = z.strictObject({
  pedidoId: IdSchema,
  codigo: z.string().regex(/^HX-\d{4,8}$/),
  /** Token firmado por el servidor (opaco) para dibujar el QR en el teléfono. Sirve una vez. */
  qr: z.string().min(32).max(512),
  venceEn: InstanteSchema,
  ferreteria: FerreteriaSchema,
  total: MontoSchema,
  /** La lista para el mostrador, en el orden en que se pide. */
  items: z.array(
    z.strictObject({
      cantidad: CantidadSchema,
      nombre: z.string().max(120),
      /** "35 mm", "12 mm (o 19 mm)", "8 mm · caja de 50". */
      detalle: z.string().max(80),
    }),
  ),
});
export type Retiro = z.infer<typeof RetiroSchema>;
