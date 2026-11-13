// Ingresos, gastos y cobros (contrato 0.11.0, fase H0.3; pantallas F-Ingresos, H0-Gasto y TR-Cobro). Lo implementa el
// lote 2.5.
// - Neto = bruto − gastos. Handyx no le cobra comisión al especialista, nunca: no hay "tarifa de Handyx" en la cuenta.
// - Bruto: lo cobrado en Handyx (verificado e informado por separado) y lo cobrado por fuera de Handyx.
//   Informado ≠ verificado: lo informado sin verificar se muestra aparte hasta que se confirma.
// - Los gastos son del especialista y no se le muestran al cliente. "Cobrárselo al cliente" crea un adicional que el
//   cliente acepta en el chat (`Adicional` de 0.7.0); hasta entonces no suma al precio.
// - La foto del ticket se lee en el teléfono; si se guarda, va privada y sin metadatos.
import { z } from 'zod';
import { FechaSchema, MesSchema } from './comun.ts';
import { IdSchema, InstanteSchema, MontoSchema } from './dto.ts';
import { ESTADOS_PAGO } from './maquinas.ts';

export const CATEGORIAS_GASTO = ['materiales', 'combustible_viaticos', 'herramientas', 'otro'] as const;
export type CategoriaGasto = (typeof CATEGORIAS_GASTO)[number];
/** De dónde salió el gasto: cargado a mano, desde un presupuesto, un pedido de ferretería o el Modo trabajo. */
export const ORIGENES_GASTO = ['a_mano', 'presupuesto', 'ferreteria', 'repuesto', 'modo_trabajo'] as const;
/** Cómo te pagó el cliente (TR-Cobro). La transferencia va al alias o CBU que vos le diste: Handyx no la ve pasar. */
export const METODOS_COBRO = ['efectivo', 'mercado_pago', 'transferencia'] as const;
export type MetodoCobro = (typeof METODOS_COBRO)[number];

export const GastoSchema = z.strictObject({
  id: IdSchema,
  monto: MontoSchema,
  categoria: z.enum(CATEGORIAS_GASTO),
  descripcion: z.string().max(200).nullable(),
  fecha: FechaSchema,
  trabajoId: IdSchema.nullable(),
  obraId: IdSchema.nullable(),
  origen: z.enum(ORIGENES_GASTO),
  /** El ticket guardado (privado, URL firmada corta). */
  ticket: z.strictObject({ id: IdSchema, url: z.url() }).nullable(),
  /** Si se le cobra al cliente: el adicional que lo representa (pendiente hasta que lo acepte). */
  adicionalId: IdSchema.nullable(),
  creadoEn: InstanteSchema,
  version: z.int().nonnegative(),
});
export type Gasto = z.infer<typeof GastoSchema>;

/**
 * Un gasto nuevo: JSON, o multipart con este JSON en la parte `datos` y la foto en `ticket`. Al menos una casilla:
 * registrarlo como gasto o cobrárselo al cliente (este último exige un trabajo).
 */
export const NuevoGastoSchema = z
  .strictObject({
    monto: MontoSchema.refine((m) => m.centavos > 0, 'El importe tiene que ser mayor a cero'),
    categoria: z.enum(CATEGORIAS_GASTO),
    descripcion: z.string().trim().max(200).nullable(),
    fecha: FechaSchema,
    trabajoId: IdSchema.nullable(),
    registrarGasto: z.boolean(),
    cobrarAlCliente: z.boolean(),
  })
  .refine((g) => g.registrarGasto || g.cobrarAlCliente, 'Elegí registrarlo como gasto, cobrárselo al cliente o las dos')
  .refine((g) => !g.cobrarAlCliente || g.trabajoId !== null, 'Para cobrárselo al cliente elegí el trabajo');
export type NuevoGasto = z.infer<typeof NuevoGastoSchema>;

export const CambioGastoSchema = z.strictObject({
  monto: MontoSchema.refine((m) => m.centavos > 0).optional(),
  categoria: z.enum(CATEGORIAS_GASTO).optional(),
  descripcion: z.string().trim().max(200).nullable().optional(),
  fecha: FechaSchema.optional(),
  version: z.int().nonnegative(),
});
export type CambioGasto = z.infer<typeof CambioGastoSchema>;

/** Un cobro por fuera de Handyx (lo carga el especialista para ver su bruto completo). */
export const IngresoExternoSchema = z.strictObject({
  id: IdSchema,
  monto: MontoSchema,
  descripcion: z.string().max(200).nullable(),
  fecha: FechaSchema,
  creadoEn: InstanteSchema,
});
export type IngresoExterno = z.infer<typeof IngresoExternoSchema>;

export const NuevoIngresoExternoSchema = z.strictObject({
  monto: MontoSchema.refine((m) => m.centavos > 0, 'El importe tiene que ser mayor a cero'),
  descripcion: z.string().trim().max(200).nullable(),
  fecha: FechaSchema,
});
export type NuevoIngresoExterno = z.infer<typeof NuevoIngresoExternoSchema>;

/**
 * Un cobro de un trabajo o de una etapa (0.11.0): reemplaza a `Pago` en las pantallas nuevas, sin tarifa de Handyx y
 * con la transferencia y el cobro parcial. El estado es el de la máquina de pago (reportado ≠ verificado).
 */
export const CobroSchema = z.strictObject({
  id: IdSchema,
  trabajoId: IdSchema,
  etapaId: IdSchema.nullable(),
  descripcion: z.string(),
  /** Lo acordado para este cobro. */
  monto: MontoSchema,
  /** Lo que informaste que cobraste (puede ser una parte); null hasta informarlo. */
  informado: MontoSchema.nullable(),
  metodo: z.enum(METODOS_COBRO).nullable(),
  estado: z.enum(ESTADOS_PAGO),
  fuenteConfirmacion: z.enum(['reporte_usuario', 'reporte_especialista', 'webhook_proveedor', 'operations']).nullable(),
  actualizadoEn: InstanteSchema,
  version: z.int().nonnegative(),
});
export type Cobro = z.infer<typeof CobroSchema>;

/** Informar el cobro (TR-Cobro): queda "informado por vos" hasta que el cliente lo confirma o se verifica el pago. */
export const InformeCobroSchema = z.strictObject({
  metodo: z.enum(METODOS_COBRO),
  /** Todo o una parte; nunca más que lo acordado (el servidor lo valida). */
  monto: MontoSchema.refine((m) => m.centavos > 0, 'El importe tiene que ser mayor a cero'),
  version: z.int().nonnegative(),
});
export type InformeCobro = z.infer<typeof InformeCobroSchema>;

/** Tus ingresos del mes (F-Ingresos). Todo calculado por el servidor. */
export const ResumenIngresosSchema = z.strictObject({
  mes: MesSchema,
  bruto: z.strictObject({
    total: MontoSchema,
    enHandyxVerificado: MontoSchema,
    /** Informado por vos o por el cliente, todavía sin verificar. */
    enHandyxInformado: MontoSchema,
    porFuera: MontoSchema,
  }),
  gastos: z.strictObject({
    total: MontoSchema,
    porCategoria: z.array(z.strictObject({ categoria: z.enum(CATEGORIAS_GASTO), total: MontoSchema })),
  }),
  /** bruto.total − gastos.total; null si los gastos superan al bruto (la app muestra la pérdida con `perdida`). */
  neto: MontoSchema.nullable(),
  perdida: MontoSchema.nullable(),
  /** Ganancia por trabajo o por etapa de obra, del más reciente al más viejo. */
  porTrabajo: z.array(
    z.strictObject({
      trabajoId: IdSchema,
      etapaId: IdSchema.nullable(),
      titulo: z.string(),
      cobrado: MontoSchema,
      gastos: MontoSchema,
      /** cobrado − gastos, o null con `perdida`. */
      ganancia: MontoSchema.nullable(),
      perdida: MontoSchema.nullable(),
    }),
  ),
});
export type ResumenIngresos = z.infer<typeof ResumenIngresosSchema>;
