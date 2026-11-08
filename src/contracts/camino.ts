// Camino Handyx (contrato 0.11.0, fases G.0 a G.4; pantallas G-Inicio, G-Bienvenida, G-Manual, G-Camino, G-MiniCamino,
// F-Regalo, G-Canje, G-Vitrina, G-Insignias y G-Areas). Lo implementa el lote 3.6.
// - El progreso lo calcula el SERVIDOR y solo cuenta lo VERIFICADO: trabajos con conformidad o cobro verificado y montos
//   de cobros verificados. Lo informado sin verificar todavía no cuenta. Nada se resta: sin rachas que se cortan, sin
//   rankings, sin tasas de aceptación, sin cuentas regresivas. Rechazar pedidos no tiene consecuencias.
// - Premios SIN AZAR: cada hito muestra de antemano su premio. La caja de regalo es una celebración, no una lotería.
// - Antifraude (G.1): tope por cliente por mes, monto mínimo y revisión de Operations antes de entregar
//   (`en_revision`). Los valores de la escalera son un borrador: los define Ignacio con Legal.
// - Canje con talle y color; retiro en un punto Handyx o una ferretería aliada, o envío con la dirección CIFRADA (se
//   purga después de entregar; nunca vuelve completa).
// - Las insignias son reconocimiento por usar la app: no dan premios ni cambian los pedidos que recibís.
// - Áreas del camino: concepto para más adelante (no entra en esta versión).
import { z } from 'zod';
import { FechaSchema } from './comun.ts';
import { IdSchema, InstanteSchema, MontoSchema } from './dto.ts';
import { transicion as t, type Maquina } from './maquinas.ts';
import { RUBROS } from './rubros.ts';

export const TIPOS_CAMINO = ['trabajos', 'cobros', 'oficio', 'practicas'] as const;
export type TipoCamino = (typeof TIPOS_CAMINO)[number];
export const ESTADOS_HITO = ['pendiente', 'alcanzado', 'en_revision', 'disponible', 'canjeado', 'entregado'] as const;
export type EstadoHito = (typeof ESTADOS_HITO)[number];
export const ESTADOS_CANJE = ['pedido', 'preparando', 'listo', 'enviado', 'entregado', 'cancelado'] as const;
export type EstadoCanje = (typeof ESTADOS_CANJE)[number];
export const MODOS_ENTREGA = ['punto_handyx', 'ferreteria_aliada', 'envio'] as const;
export type ModoEntrega = (typeof MODOS_ENTREGA)[number];
export const TALLES = ['S', 'M', 'L', 'XL', 'XXL'] as const;
export const FORMATOS_MANUAL = ['app', 'impreso', 'los_dos'] as const;
export const CAPITULOS_MANUAL = 6;

/** Alcanzar lo marca el sistema con lo verificado; Operations revisa antes de que se pueda canjear. */
export const MAQUINA_HITO: Maquina<EstadoHito> = {
  nombre: 'hito_camino',
  estados: ESTADOS_HITO,
  inicial: 'pendiente',
  transiciones: [
    t('pendiente', 'alcanzado', 'sistema'),
    t('alcanzado', 'en_revision', 'sistema'),
    t('en_revision', 'disponible', 'operations'),
    t('disponible', 'canjeado', 'especialista'),
    t('canjeado', 'entregado', 'operations'),
    // Si se cancela el canje, el premio vuelve a estar disponible.
    t('canjeado', 'disponible', 'especialista', 'operations'),
  ],
};

export const MAQUINA_CANJE: Maquina<EstadoCanje> = {
  nombre: 'canje',
  estados: ESTADOS_CANJE,
  inicial: 'pedido',
  transiciones: [
    t('pedido', 'preparando', 'operations'),
    t('preparando', 'listo', 'operations'),
    t('preparando', 'enviado', 'operations'),
    t('listo', 'entregado', 'operations'),
    t('enviado', 'entregado', 'operations'),
    t('pedido', 'cancelado', 'especialista', 'operations'),
  ],
};

/** Cómo vuelve la entrega elegida: sin la dirección completa. */
export const EntregaElegidaSchema = z.strictObject({
  modo: z.enum(MODOS_ENTREGA),
  /** "Centro · de lunes a viernes" o "Envío a La Perla · cifrado". */
  detalle: z.string().max(120),
});

export const PremioSchema = z.strictObject({
  id: IdSchema,
  nombre: z.string().max(80),
  descripcion: z.string().max(200),
  rubro: z.enum(RUBROS).nullable(),
  /** Si hay que elegir talle o color al canjearlo. */
  talles: z.array(z.enum(TALLES)),
  colores: z.array(z.string().max(30)),
  /** Imagen o modelo 3D nativo del premio (público). */
  imagen: z.url().nullable(),
});
export type Premio = z.infer<typeof PremioSchema>;

export const HitoSchema = z.strictObject({
  id: IdSchema,
  orden: z.int().min(0),
  /** Lo que hace falta: N trabajos verificados o un monto de cobros verificados (o los dos). */
  requisito: z.strictObject({ trabajos: z.int().positive().nullable(), monto: MontoSchema.nullable() }),
  /** Se muestra de antemano: nunca hay sorpresa ni sorteo. */
  premio: PremioSchema,
  estado: z.enum(ESTADOS_HITO),
  alcanzadoEn: InstanteSchema.nullable(),
});
export type Hito = z.infer<typeof HitoSchema>;

export const MiniCaminoSchema = z.strictObject({
  id: IdSchema,
  tipo: z.enum(TIPOS_CAMINO),
  nombre: z.string().max(80),
  rubro: z.enum(RUBROS).nullable(),
  /** Lo verificado hasta hoy (calculado por el servidor). */
  progreso: z.strictObject({ trabajos: z.int().nonnegative(), monto: MontoSchema }),
  hitos: z.array(HitoSchema),
  proximoHitoId: IdSchema.nullable(),
});
export type MiniCamino = z.infer<typeof MiniCaminoSchema>;

export const KitBienvenidaSchema = z.strictObject({
  estado: z.enum(['sin_elegir', 'elegido', 'preparando', 'listo', 'enviado', 'entregado']),
  talle: z.enum(TALLES).nullable(),
  manual: z.enum(FORMATOS_MANUAL).nullable(),
  entrega: EntregaElegidaSchema.nullable(),
  entregadoEn: InstanteSchema.nullable(),
  version: z.int().nonnegative(),
});
export type KitBienvenida = z.infer<typeof KitBienvenidaSchema>;

export const CaminoSchema = z.strictObject({
  trabajosVerificados: z.int().nonnegative(),
  cobrosVerificados: MontoSchema,
  /** El próximo premio del camino principal: "Te faltan 2 para la Gorra Handyx". */
  proximo: z.strictObject({ caminoId: IdSchema, hito: HitoSchema, faltanTrabajos: z.int().nonnegative(), faltaMonto: MontoSchema }).nullable(),
  kit: KitBienvenidaSchema,
  caminos: z.array(MiniCaminoSchema),
  premiosGanados: z.int().nonnegative(),
  /** Hitos alcanzados que todavía no se celebraron (F-Regalo aparece solo una vez por hito). */
  porCelebrar: z.array(IdSchema),
});
export type Camino = z.infer<typeof CaminoSchema>;

export const InsigniaSchema = z.strictObject({
  id: z.string().min(1).max(40),
  nombre: z.string().max(60),
  descripcion: z.string().max(140),
  obtenida: z.boolean(),
  obtenidaEn: InstanteSchema.nullable(),
});
export type Insignia = z.infer<typeof InsigniaSchema>;

export const CapituloManualSchema = z.strictObject({
  numero: z.int().min(1).max(CAPITULOS_MANUAL),
  titulo: z.string().max(60),
  resumen: z.string().max(140),
  minutos: z.int().min(1).max(30),
  leido: z.boolean(),
});
export type CapituloManual = z.infer<typeof CapituloManualSchema>;

export const PuntoRetiroSchema = z.strictObject({
  id: IdSchema,
  tipo: z.enum(['punto_handyx', 'ferreteria_aliada']),
  nombre: z.string().max(80),
  barrio: z.string().max(80),
  /** "De lunes a viernes". */
  horario: z.string().max(80),
});
export type PuntoRetiro = z.infer<typeof PuntoRetiroSchema>;

/** Dirección de envío: se manda una vez, se guarda cifrada y nunca vuelve completa. */
export const DireccionEnvioSchema = z.strictObject({
  calle: z.string().trim().min(2).max(80),
  numero: z.string().trim().min(1).max(10),
  pisoDepto: z.string().trim().max(20).nullable(),
  barrio: z.string().trim().min(2).max(80),
  ciudad: z.string().trim().min(2).max(80),
  codigoPostal: z.string().regex(/^[A-Z]?\d{4}[A-Z]{0,3}$/),
  /** Quién lo recibe si no estás (opcional). */
  recibe: z.string().trim().max(80).nullable(),
});
export type DireccionEnvio = z.infer<typeof DireccionEnvioSchema>;

export const EntregaSchema = z.discriminatedUnion('modo', [
  z.strictObject({ modo: z.literal('punto_handyx'), puntoId: IdSchema }),
  z.strictObject({ modo: z.literal('ferreteria_aliada'), puntoId: IdSchema }),
  /** Sin `direccion` se usa la última que guardaste (cifrada). */
  z.strictObject({ modo: z.literal('envio'), direccion: DireccionEnvioSchema.nullable() }),
]);
export type Entrega = z.infer<typeof EntregaSchema>;

export const ElegirKitSchema = z.strictObject({
  talle: z.enum(TALLES),
  manual: z.enum(FORMATOS_MANUAL),
  /** Dónde retirás la remera (y el manual impreso), o el envío. */
  entrega: EntregaSchema,
  version: z.int().nonnegative(),
});
export type ElegirKit = z.infer<typeof ElegirKitSchema>;

export const CanjeSchema = z.strictObject({
  id: IdSchema,
  hitoId: IdSchema,
  premio: PremioSchema,
  talle: z.enum(TALLES).nullable(),
  color: z.string().max(30).nullable(),
  entrega: EntregaElegidaSchema,
  estado: z.enum(ESTADOS_CANJE),
  /** Fecha estimada, si Operations la cargó. */
  listoEl: FechaSchema.nullable(),
  creadoEn: InstanteSchema,
  version: z.int().nonnegative(),
});
export type Canje = z.infer<typeof CanjeSchema>;

export const PremioGanadoSchema = z.strictObject({
  hitoId: IdSchema,
  caminoId: IdSchema,
  premio: PremioSchema,
  estado: z.enum(ESTADOS_HITO),
  canje: CanjeSchema.nullable(),
  ganadoEn: InstanteSchema,
});
export type PremioGanado = z.infer<typeof PremioGanadoSchema>;

export const NuevoCanjeSchema = z.strictObject({
  talle: z.enum(TALLES).nullable(),
  color: z.string().max(30).nullable(),
  entrega: EntregaSchema,
});
export type NuevoCanje = z.infer<typeof NuevoCanjeSchema>;

/** Falta para un hito con lo verificado (pura; el servidor es la autoridad). Nada resta: nunca da negativo. */
export function faltaParaHito(
  progreso: { trabajos: number; montoCentavos: number },
  requisito: { trabajos: number | null; montoCentavos: number | null },
): { trabajos: number; montoCentavos: number; alcanzado: boolean } {
  const trabajos = Math.max(0, (requisito.trabajos ?? 0) - progreso.trabajos);
  const montoCentavos = Math.max(0, (requisito.montoCentavos ?? 0) - progreso.montoCentavos);
  return { trabajos, montoCentavos, alcanzado: trabajos === 0 && montoCentavos === 0 };
}
