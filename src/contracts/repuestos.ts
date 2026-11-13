// Repuestos de un trabajo u obra con su origen y estados (contrato 0.11.0, fase O.2; pantallas F-ObraRepuestos,
// F-RepuestoOrigen y F-ObraRepuesto). Lo implementa el lote 3.5 (y el lado del cliente, aprobar, en handyx-client-be).
// - Primero se elige cómo se consigue: «Lo consigo yo» (precio de tu lista o a mano, foto del ticket al comprarlo) o
//   «En una ferretería adherida» (se comparan precios de cada ferretería y se retira con QR, `ferreterias.ts`).
// - Si se le cobra al cliente, se manda a aprobación por el chat (tarjeta) y el cliente lo aprueba ahí: esperando
//   aprobación → aprobado → comprado. Sin cobrárselo, pasa directo a comprado (un gasto tuyo).
// - Se cargan por jornada para comprar a futuro; si el día anterior falta comprarlo, el servidor avisa (a las 18 del día
//   anterior) al especialista. Ningún aviso se le manda solo al cliente.
import { z } from 'zod';
import { CantidadSchema, FechaSchema } from './comun.ts';
import { IdSchema, InstanteSchema, MontoSchema, UNIDADES_MATERIAL } from './dto.ts';
import { transicion as t, type Maquina } from './maquinas.ts';

export const ORIGENES_REPUESTO = ['lo_consigo_yo', 'ferreteria'] as const;
export type OrigenRepuesto = (typeof ORIGENES_REPUESTO)[number];
export const ESTADOS_REPUESTO = ['sin_mandar', 'esperando_aprobacion', 'aprobado', 'rechazado', 'comprado', 'cancelado'] as const;
export type EstadoRepuesto = (typeof ESTADOS_REPUESTO)[number];
/** Hora (Buenos Aires) del aviso del día anterior si falta comprar. */
export const HORA_AVISO_REPUESTO = '18:00';

export const MAQUINA_REPUESTO: Maquina<EstadoRepuesto> = {
  nombre: 'repuesto',
  estados: ESTADOS_REPUESTO,
  inicial: 'sin_mandar',
  transiciones: [
    t('sin_mandar', 'esperando_aprobacion', 'especialista'),
    t('esperando_aprobacion', 'aprobado', 'usuario'),
    t('esperando_aprobacion', 'rechazado', 'usuario'),
    t('esperando_aprobacion', 'sin_mandar', 'especialista'), // retirarlo para cambiarlo
    t('rechazado', 'sin_mandar', 'especialista'),
    // Sin cobrárselo al cliente no hace falta aprobación. Con ferretería, lo marca el retiro del pedido (QR).
    t('sin_mandar', 'comprado', 'especialista', 'sistema'),
    t('aprobado', 'comprado', 'especialista', 'sistema'),
    t('sin_mandar', 'cancelado', 'especialista'),
    t('aprobado', 'cancelado', 'especialista'),
  ],
};

export const RepuestoSchema = z.strictObject({
  id: IdSchema,
  trabajoId: IdSchema,
  /** En una obra, la jornada para la que hace falta (null = sin fecha). */
  jornadaId: IdSchema.nullable(),
  /** Para cuándo hace falta (la fecha de la jornada). */
  paraEl: FechaSchema.nullable(),
  nombre: z.string().min(1).max(120),
  cantidad: CantidadSchema,
  unidad: z.enum(UNIDADES_MATERIAL),
  origen: z.enum(ORIGENES_REPUESTO),
  precioUnitario: MontoSchema,
  total: MontoSchema,
  /** "Tu lista del 05/11", "Ferretería Simulación Centro". */
  precioDe: z.string().max(80),
  precioId: IdSchema.nullable(),
  pedidoFerreteriaId: IdSchema.nullable(),
  cobrarAlCliente: z.boolean(),
  registrarGasto: z.boolean(),
  avisarDiaAnterior: z.boolean(),
  estado: z.enum(ESTADOS_REPUESTO),
  enviadoEn: InstanteSchema.nullable(),
  respondidoEn: InstanteSchema.nullable(),
  compradoEn: InstanteSchema.nullable(),
  /** El gasto que se registró al comprarlo. */
  gastoId: IdSchema.nullable(),
  version: z.int().nonnegative(),
});
export type Repuesto = z.infer<typeof RepuestoSchema>;

/** «Lo consigo yo». Con ferretería se arma desde el pedido de la ferretería (`ferreterias.ts`). */
export const NuevoRepuestoSchema = z
  .strictObject({
    jornadaId: IdSchema.nullable(),
    precioId: IdSchema.nullable(),
    nombre: z.string().trim().min(1).max(120),
    cantidad: CantidadSchema,
    unidad: z.enum(UNIDADES_MATERIAL),
    precioUnitario: MontoSchema.refine((m) => m.centavos > 0, 'El precio tiene que ser mayor a cero'),
    cobrarAlCliente: z.boolean(),
    registrarGasto: z.boolean(),
    avisarDiaAnterior: z.boolean(),
    /** Mandarlo a aprobación del cliente en el mismo paso (solo si se le cobra). */
    mandarAAprobacion: z.boolean(),
  })
  .refine((r) => !r.mandarAAprobacion || r.cobrarAlCliente, 'Solo se manda a aprobar lo que se le cobra al cliente');
export type NuevoRepuesto = z.infer<typeof NuevoRepuestoSchema>;

export const RepuestosTrabajoSchema = z.strictObject({
  trabajoId: IdSchema,
  /** "Mañana (mié 18) faltan 2: pegamento y pastina". */
  faltanParaManana: z.array(z.string().max(120)),
  repuestos: z.array(RepuestoSchema),
  /** Lo ya comprado: total y tickets cargados. */
  comprados: z.strictObject({ total: MontoSchema, tickets: z.int().nonnegative() }),
});
export type RepuestosTrabajo = z.infer<typeof RepuestosTrabajoSchema>;

/** Marcar comprado («Lo consigo yo»): el precio que pagaste (si cambió) y el ticket opcional en multipart (`ticket`). */
export const CompraRepuestoSchema = z.strictObject({
  precioUnitario: MontoSchema.refine((m) => m.centavos > 0).nullable(),
  version: z.int().nonnegative(),
});
export type CompraRepuesto = z.infer<typeof CompraRepuestoSchema>;
