// Lógica pura del trabajo de punta a punta (lote 4.6): cuándo corresponde el respaldo "Ya llegué", el cronómetro del
// trabajo en curso, las opciones de adicionales por rubro, las franjas para cambiar la fecha y los textos de los motivos.
import type { MotivoCambio, MotivoCancelacion, MotivoRespaldoLlegada, TipoAdicional, TrabajoDetalle } from '../contracts/dto.ts';
import type { Rubro } from '../contracts/rubros.ts';
import { deInputLocal } from './formato.ts';
import type { Senal } from './geo.ts';

/**
 * El respaldo "Ya llegué" aparece solo cuando la ubicación anda mal (decisión del 29/10/2026): sin permiso, imprecisa,
 * sin señal o sin ubicación (no la compartís o el teléfono no la da). Con buena señal, la llegada se marca sola.
 */
export function motivoRespaldo(senal: Senal, compartiendo: boolean): MotivoRespaldoLlegada | null {
  if (senal === 'sin_permiso') return 'sin_permiso';
  if (senal === 'no_disponible') return 'sin_ubicacion';
  if (!compartiendo) return 'sin_ubicacion';
  if (senal === 'imprecisa') return 'imprecisa';
  if (senal === 'sin_senal') return 'sin_senal';
  return null;
}

export const MOTIVO_LLEGADA: Record<MotivoRespaldoLlegada, string> = {
  sin_permiso: 'sin permiso de ubicación',
  imprecisa: 'ubicación imprecisa',
  sin_senal: 'sin señal de ubicación',
  sin_ubicacion: 'sin compartir la ubicación',
};

/** Texto de cómo se marcó la llegada, para el detalle y el historial. */
export function textoLlegada(l: NonNullable<TrabajoDetalle['trabajo']['llegada']>): string {
  return l.modo === 'automatica' ? 'Llegada marcada sola al entrar en la cuadra' : `Avisaste con «Ya llegué» (${l.motivo ? MOTIVO_LLEGADA[l.motivo] : 'sin motivo'})`;
}

/** Cronómetro del trabajo en curso: "12:05" (min:seg) o "1:02:05" (h:min:seg). Nunca negativo. */
export function cronometro(desdeIso: string, ahora: Date): string {
  const s = Math.max(0, Math.floor((ahora.getTime() - Date.parse(desdeIso)) / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const dd = (n: number) => String(n).padStart(2, '0');
  return h > 0 ? `${h}:${dd(m)}:${dd(s % 60)}` : `${dd(m)}:${dd(s % 60)}`;
}

/** Desde cuándo corre el trabajo: el último evento "en curso" del historial. */
export function inicioEnCurso(eventos: TrabajoDetalle['eventos']): string | null {
  return [...eventos].reverse().find((e) => e.estado === 'en_curso')?.en ?? null;
}

export interface OpcionAdicional {
  id: string;
  tipo: TipoAdicional | null;
  texto: string;
}

/** "Opción personalizada" primero (decisión del rediseño); después lo habitual de cada rubro, sin precios: los pone el especialista. */
const COMUNES: OpcionAdicional[] = [{ id: 'hora', tipo: 'mano_de_obra', texto: 'Una hora más de trabajo' }];
const POR_RUBRO: Record<Rubro, OpcionAdicional[]> = {
  plomeria: [
    { id: 'flexible', tipo: 'repuesto', texto: 'Flexible' },
    { id: 'canilla', tipo: 'repuesto', texto: 'Canilla o cartucho' },
    { id: 'sifon', tipo: 'repuesto', texto: 'Sifón' },
  ],
  electricidad: [
    { id: 'termica', tipo: 'repuesto', texto: 'Térmica' },
    { id: 'disyuntor', tipo: 'repuesto', texto: 'Disyuntor' },
    { id: 'tomas', tipo: 'repuesto', texto: 'Toma o llave' },
  ],
  gas: [
    { id: 'llave_gas', tipo: 'repuesto', texto: 'Llave de paso' },
    { id: 'flexible_gas', tipo: 'repuesto', texto: 'Flexible de gas aprobado' },
  ],
  cerrajeria: [
    { id: 'cilindro', tipo: 'repuesto', texto: 'Cilindro o combinación' },
    { id: 'cerradura', tipo: 'repuesto', texto: 'Cerradura' },
  ],
  albanileria: [
    { id: 'materiales', tipo: 'repuesto', texto: 'Materiales extra' },
    { id: 'reparacion', tipo: 'mano_de_obra', texto: 'Reparación que apareció al abrir' },
  ],
  aire_acondicionado: [
    { id: 'gas_refrigerante', tipo: 'repuesto', texto: 'Carga de gas refrigerante' },
    { id: 'cano', tipo: 'repuesto', texto: 'Caño o aislación' },
  ],
};
export const PERSONALIZADA: OpcionAdicional = { id: 'personalizada', tipo: null, texto: 'Opción personalizada' };

export function opcionesAdicional(rubro: Rubro): OpcionAdicional[] {
  return [PERSONALIZADA, ...POR_RUBRO[rubro], ...COMUNES];
}

export const TIPO_ADICIONAL: Record<TipoAdicional, string> = { repuesto: 'Repuesto', mano_de_obra: 'Mano de obra' };

/** Franjas para pedir otra fecha (hora de Buenos Aires). */
export const FRANJAS = [
  { id: 'manana', texto: 'Mañana · 8 a 12', desde: '08:00', hasta: '12:00' },
  { id: 'mediodia', texto: 'Mediodía · 12 a 16', desde: '12:00', hasta: '16:00' },
  { id: 'tarde', texto: 'Tarde · 16 a 20', desde: '16:00', hasta: '20:00' },
  // Para las jornadas de una obra (4.7), que suelen ser de día completo.
  { id: 'dia', texto: 'Día completo · 9 a 17', desde: '09:00', hasta: '17:00' },
] as const;
export type Franja = (typeof FRANJAS)[number]['id'];

/** Horario de una franja en un día "AAAA-MM-DD" (Buenos Aires), en UTC. */
export function horarioFranja(dia: string, franja: Franja): { inicio: string; fin: string } | null {
  const f = FRANJAS.find((x) => x.id === franja);
  const inicio = f ? deInputLocal(`${dia}T${f.desde}`) : null;
  const fin = f ? deInputLocal(`${dia}T${f.hasta}`) : null;
  return inicio && fin ? { inicio, fin } : null;
}

export const MOTIVO_CAMBIO: Record<MotivoCambio, string> = {
  otro_trabajo: 'Se me superpone con otro trabajo',
  imprevisto: 'Tuve un imprevisto',
  falta_repuesto: 'Me falta un repuesto',
  pedido_del_cliente: 'Me lo pidió el cliente',
  clima: 'Por el clima',
  otro: 'Otro motivo',
};

export const MOTIVO_CANCELACION: Record<MotivoCancelacion, string> = {
  no_puedo_ir: 'No puedo ir',
  problema_personal: 'Tuve un problema personal',
  cliente_no_responde: 'El cliente no responde',
  trabajo_distinto: 'El trabajo es distinto a lo acordado',
  riesgo_en_el_lugar: 'No me siento a salvo en el lugar',
  otro: 'Otro motivo',
};
