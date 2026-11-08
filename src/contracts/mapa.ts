// Mapa de arreglos (contrato 0.11.0; pantallas F-Inicio y F-Pedido, pedido de Ignacio del 08/11/2026: «como Uber pero
// de arreglos»). Lo implementa el lote 1.5 sobre la base del lote 4.3 (zona aproximada) y del 5.4.
// - Los pedidos se ven como marcadores en el mapa y en una hoja de "cercanos" (rubro, zona, precio sugerido y
//   distancia). Tocar uno abre el detalle antes de cotizar; nada se acepta desde el mapa.
// - ZONA APROXIMADA SIEMPRE: centro ya desplazado por el servidor y radio. Nunca la dirección ni el punto exacto antes
//   de que el cliente acepte. La distancia es al centro de la zona y se redondea a 100 m.
// - Sin tiempos de llegada prometidos: ni ETA ni "llegás en N minutos" en los pedidos del mapa.
// - «Me voy hasta…» (por ejemplo, Batán): pedidos en ese destino y, si la app manda desde dónde sale, también los que
//   quedan en el camino. La posición va en el CUERPO (nunca en la URL), se usa para esa respuesta y no se guarda.
// - Llegan solos: con Disponible prendido y la app abierta, `GET /mapa/eventos` (SSE) avisa cada pedido nuevo de sus
//   rubros y zonas; la app lo muestra como pedido flotante. Avisar nunca acepta.
// - "Ahora no" (`/pedidos/{id}/descarte`) no tiene ninguna consecuencia: solo lo saca de tu mapa.
// - Zonas con actividad: un nivel por barrio (bajo, medio, alto), sin cantidades exactas ni personas.
import { z } from 'zod';
import { ArchivoFirmadoSchema, ResumenCortoSchema } from './comun.ts';
import { HorarioSchema, IdSchema, InstanteSchema, MontoSchema, PuntoSchema, TIPOS_PEDIDO, ZonaMapaSchema } from './dto.ts';
import { ESTADOS_PROPUESTA } from './maquinas.ts';
import { RUBROS } from './rubros.ts';

export const TIPOS_DESTINO = ['barrio', 'localidad'] as const;
export const NIVELES_ACTIVIDAD = ['baja', 'media', 'alta'] as const;
export type NivelActividad = (typeof NIVELES_ACTIVIDAD)[number];
/** Dónde queda el pedido respecto de la referencia elegida. */
export const UBICACIONES_PEDIDO = ['en_tus_zonas', 'en_destino', 'en_el_camino'] as const;
export type UbicacionPedido = (typeof UBICACIONES_PEDIDO)[number];
/** Redondeo de las distancias que muestra el mapa. */
export const REDONDEO_DISTANCIA_M = 100;
/** Ancho del corredor «en el camino» hacia un destino, a cada lado. Provisorio. */
export const CORREDOR_DESTINO_M = 1_500;

/** Destino para «Me voy hasta…»: un barrio de cobertura o una localidad cercana (Batán, Sierra de los Padres…). */
export const DestinoMapaSchema = z.strictObject({
  id: z.string().min(1),
  nombre: z.string().min(1),
  tipo: z.enum(TIPOS_DESTINO),
  centro: PuntoSchema,
  radioM: z.int().min(200).max(20_000),
});
export type DestinoMapa = z.infer<typeof DestinoMapaSchema>;

export const ZonaActividadSchema = z.strictObject({
  barrioId: z.string().min(1),
  nombre: z.string(),
  centro: PuntoSchema,
  nivel: z.enum(NIVELES_ACTIVIDAD),
});
export type ZonaActividad = z.infer<typeof ZonaActividadSchema>;

/** Un pedido en el mapa y en la hoja de cercanos. */
export const PedidoEnMapaSchema = z.strictObject({
  id: IdSchema,
  rubro: z.enum(RUBROS),
  tipo: z.enum(TIPOS_PEDIDO),
  /** "Pierde la canilla de la cocina": lo que escribió el cliente, recortado y sin datos de contacto. */
  titulo: ResumenCortoSchema,
  barrio: z.string(),
  zona: ZonaMapaSchema,
  /** Al centro de la zona aproximada, redondeada; null si la app no mandó desde dónde mide (la calcula el teléfono). */
  distanciaM: z.int().nonnegative().nullable(),
  ubicacion: z.enum(UBICACIONES_PEDIDO),
  /** "Handyx sugiere · vos decidís": una referencia, nunca un mínimo ni un máximo. */
  precioSugerido: MontoSchema.nullable(),
  /** Lo que pidió el cliente (franja u hora); null en un urgente. */
  horarioPedido: HorarioSchema.nullable(),
  /** Fin de la ventana de un urgente, calculado por el servidor. */
  ventanaHasta: InstanteSchema.nullable(),
  creadoEn: InstanteSchema,
  /** Si el trabajo se verifica, suma al camino (el camino nunca resta). */
  sumaAlCamino: z.boolean(),
  miPropuesta: z.strictObject({ id: IdSchema, estado: z.enum(ESTADOS_PROPUESTA) }).nullable(),
});
export type PedidoEnMapa = z.infer<typeof PedidoEnMapaSchema>;

/** Desde dónde se buscan pedidos: tus zonas, un destino («me voy hasta…») o un barrio que tocaste en el mapa. */
export const ReferenciaMapaSchema = z.discriminatedUnion('tipo', [
  z.strictObject({ tipo: z.literal('mis_zonas') }),
  z.strictObject({ tipo: z.literal('destino'), destinoId: z.string().min(1) }),
  z.strictObject({ tipo: z.literal('barrio'), barrioId: z.string().min(1) }),
]);
export type ReferenciaMapa = z.infer<typeof ReferenciaMapaSchema>;

/** Va en el cuerpo de un POST: la posición nunca viaja en la URL y no se guarda. */
export const BusquedaMapaSchema = z.strictObject({
  referencia: ReferenciaMapaSchema,
  /** Desde dónde salís (opcional): ordena por distancia y, con un destino, suma los pedidos «en el camino». */
  desde: z.strictObject({ punto: PuntoSchema, precisionM: z.number().min(0).max(10_000) }).nullable(),
  rubros: z.array(z.enum(RUBROS)).max(RUBROS.length).optional(),
  tipos: z.array(z.enum(TIPOS_PEDIDO)).max(TIPOS_PEDIDO.length).optional(),
});
export type BusquedaMapa = z.infer<typeof BusquedaMapaSchema>;

export const MapaPedidosSchema = z.strictObject({
  referencia: z.strictObject({ nombre: z.string(), centro: PuntoSchema, radioM: z.int().min(200).max(20_000) }),
  /** Ordenados por distancia (o por llegada si no hay `desde`). Como mucho 50. */
  pedidos: z.array(PedidoEnMapaSchema).max(50),
  zonas: z.array(ZonaActividadSchema),
  actualizadoEn: InstanteSchema,
});
export type MapaPedidos = z.infer<typeof MapaPedidosSchema>;

/** El detalle en la hoja (F-Pedido): lo del mapa más lo que contó el cliente y sus fotos. Sin dirección ni teléfono. */
export const PedidoEntranteSchema = PedidoEnMapaSchema.extend({
  descripcion: z.string().max(2000),
  fotos: z.array(ArchivoFirmadoSchema).max(5),
  /** El chat del pedido, si ya existe (se abre desde la primera cotización). */
  conversacionId: IdSchema.nullable(),
});
export type PedidoEntrante = z.infer<typeof PedidoEntranteSchema>;

/** Eventos del SSE `GET /v1/especialista/mapa/eventos` (campo `data`, un JSON por evento). */
export const EventoMapaSchema = z.discriminatedUnion('tipo', [
  z.strictObject({ tipo: z.literal('pedido_nuevo'), pedido: PedidoEnMapaSchema }),
  /** Ya no está disponible (lo tomó otro, venció o se canceló): se saca del mapa. */
  z.strictObject({ tipo: z.literal('pedido_retirado'), pedidoId: IdSchema }),
  /** «Te buscan para una obra» (lote 3.2): solo verificados de la zona y el oficio. */
  z.strictObject({ tipo: z.literal('busqueda_nueva'), busquedaId: IdSchema }),
  /** Cada 25 s, para mantener la conexión. */
  z.strictObject({ tipo: z.literal('latido'), en: InstanteSchema }),
]);
export type EventoMapa = z.infer<typeof EventoMapaSchema>;
