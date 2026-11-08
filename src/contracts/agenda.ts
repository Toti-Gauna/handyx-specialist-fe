// Agenda y tu día (contrato 0.11.0; pantallas F-Agenda, F-AgendaPasadas, F-AgendaMes, F-InicioDia, F-InicioRuta y
// H0-ModoAgenda). Lo implementa el lote 2.5. Reemplaza a `GET /v1/especialista/agenda` (0.2.0), que queda hasta 1.0.0.
// - Pasadas, hoy y futuras, y el mes completo con obras y trabajos por día. Una oferta pendiente no es un turno.
// - Tu día: las paradas de hoy en orden con el tramo entre una y otra (motor de trayectos propio). Reordenar las
//   paradas cambia solo tu recorrido: no le cambia el horario a ningún cliente.
// - Los kilómetros del mes salen de los trayectos de los trabajos, nunca de seguirte en segundo plano.
import { z } from 'zod';
import { FechaSchema, InicialesSchema, MesSchema, PersonaVisibleSchema, ResumenCortoSchema } from './comun.ts';
import { IdSchema, InstanteSchema, MontoSchema, PuntoSchema } from './dto.ts';
import { ESTADOS_PAGO } from './maquinas.ts';
import { RUBROS } from './rubros.ts';

export const VISTAS_AGENDA = ['pasadas', 'hoy', 'futuras'] as const;
export type VistaAgenda = (typeof VISTAS_AGENDA)[number];
export const TIPOS_TURNO = ['trabajo', 'jornada', 'oferta', 'retiro_ferreteria'] as const;
export type TipoTurno = (typeof TIPOS_TURNO)[number];
export const ESTADOS_TURNO = ['agendado', 'cambio_pendiente', 'oferta_pendiente', 'hecho', 'cancelado'] as const;
export const FILTROS_MES = ['todo', 'obras', 'trabajos'] as const;
export const ESTADOS_PARADA = ['hecha', 'proxima', 'pendiente'] as const;

export const TurnoAgendaSchema = z.strictObject({
  id: IdSchema,
  tipo: z.enum(TIPOS_TURNO),
  trabajoId: IdSchema.nullable(),
  obraId: IdSchema.nullable(),
  jornadaId: IdSchema.nullable(),
  pedidoId: IdSchema.nullable(),
  pedidoFerreteriaId: IdSchema.nullable(),
  /** "Baño completo", "Pierde la canilla", "Retiro en ferretería". */
  titulo: z.string().max(80),
  /** "Obra · jornada 3 de 6 · Los Troncos", "Plomería · Centro". */
  detalle: ResumenCortoSchema,
  rubro: z.enum(RUBROS).nullable(),
  barrio: z.string().nullable(),
  cliente: PersonaVisibleSchema.nullable(),
  /** Quiénes van (obras en equipo). */
  equipo: z.array(InicialesSchema).max(8),
  inicio: InstanteSchema,
  fin: InstanteSchema.nullable(),
  estado: z.enum(ESTADOS_TURNO),
  /** Lo acordado (o la oferta). Null en los retiros. */
  monto: MontoSchema.nullable(),
  /** En las pasadas: cómo va el cobro (reportado ≠ verificado). */
  cobro: z.strictObject({ estado: z.enum(ESTADOS_PAGO), monto: MontoSchema }).nullable(),
  /** Una oferta que se superpone con un turno agendado. */
  superpuesto: z.boolean(),
});
export type TurnoAgenda = z.infer<typeof TurnoAgendaSchema>;

export const ResumenAgendaSchema = z.strictObject({
  hoy: FechaSchema,
  pasadas: z.int().nonnegative(),
  deHoy: z.int().nonnegative(),
  futuras: z.int().nonnegative(),
  /** La semana de un vistazo (lunes a domingo). */
  semana: z.array(z.strictObject({ fecha: FechaSchema, turnos: z.int().nonnegative() })).length(7),
  /** Del mes en curso: lo cobrado y verificado de las pasadas. */
  cobradoMes: MontoSchema,
  proximo: TurnoAgendaSchema.nullable(),
});
export type ResumenAgenda = z.infer<typeof ResumenAgendaSchema>;

export const AgendaMesSchema = z.strictObject({
  mes: MesSchema,
  dias: z.array(
    z.strictObject({
      fecha: FechaSchema,
      trabajos: z.int().nonnegative(),
      /** Obras con jornada ese día (para pintar la tira). */
      obras: z.array(z.strictObject({ obraId: IdSchema, nombre: z.string().max(80) })),
      hechos: z.int().nonnegative(),
    }),
  ),
  totales: z.strictObject({ trabajos: z.int().nonnegative(), obras: z.int().nonnegative() }),
});
export type AgendaMes = z.infer<typeof AgendaMesSchema>;

export const ParadaSchema = z.strictObject({
  orden: z.int().min(1),
  turno: TurnoAgendaSchema,
  estado: z.enum(ESTADOS_PARADA),
  /** Puede saltearse (un retiro en la ferretería). */
  opcional: z.boolean(),
  /** El tramo desde la parada anterior (o desde donde estás, si la app lo mandó). */
  tramo: z
    .strictObject({
      distanciaM: z.int().nonnegative(),
      duracionS: z.int().nonnegative(),
      /** Lo que agrega pasar por acá respecto de ir directo (retiros). */
      desvioS: z.int().nonnegative().nullable(),
    })
    .nullable(),
  /** Cuándo conviene salir para llegar en horario (orientativo; no es una promesa al cliente). */
  salirA: InstanteSchema.nullable(),
});
export type Parada = z.infer<typeof ParadaSchema>;

export const DiaSchema = z.strictObject({
  fecha: FechaSchema,
  paradas: z.array(ParadaSchema),
  terminaA: InstanteSchema.nullable(),
  distanciaDiaM: z.int().nonnegative(),
  distanciaMesM: z.int().nonnegative(),
  version: z.int().nonnegative(),
});
export type Dia = z.infer<typeof DiaSchema>;

/** Pedir el recorrido desde donde estás: la posición va en el cuerpo, se usa para esa respuesta y no se guarda. */
export const RecorridoDiaSchema = z.strictObject({
  desde: z.strictObject({ punto: PuntoSchema, precisionM: z.number().min(0).max(10_000) }).nullable(),
});
export type RecorridoDia = z.infer<typeof RecorridoDiaSchema>;

export const OrdenParadasSchema = z.strictObject({
  /** Ids de turno en el orden nuevo (las hechas quedan primero). */
  turnos: z.array(IdSchema).min(1).max(30),
  version: z.int().nonnegative(),
});
export type OrdenParadas = z.infer<typeof OrdenParadasSchema>;
