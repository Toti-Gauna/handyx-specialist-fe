// Estado en memoria del mock (nada en localStorage, cookies ni IndexedDB) y su reloj controlable.
// Todo es SINTÉTICO: nombres de prueba, correos @example.test e ids 00000000-….
import type {
  Aviso,
  CasoSoporteDetalle,
  Conversacion,
  DatosAlta,
  Disponibilidad,
  Mensaje,
  Pago,
  PedidoElegible,
  PerfilEspecialista,
  Preferencias,
  Propuesta,
  Baja,
  Trabajo,
  TrabajoDetalle,
} from '../../contracts/dto.ts';
import { FalloApi, type TipoFallo } from '../errores.ts';
import type { ErrorApi } from '../../contracts/dto.ts';

export const ESCENARIOS = ['nuevo', 'incompleto', 'en_revision', 'correccion', 'rechazado', 'habilitado', 'baja'] as const;
export type Escenario = (typeof ESCENARIOS)[number];

export const ETIQUETA_ESCENARIO: Record<Escenario, string> = {
  nuevo: 'Sin cuenta (registro desde cero)',
  incompleto: 'Alta incompleta (borrador)',
  en_revision: 'Alta en revisión',
  correccion: 'Requiere corrección',
  rechazado: 'Alta rechazada',
  habilitado: 'Habilitado, con pedidos y trabajos',
  baja: 'Baja solicitada',
};

/** El mock vive en un "hoy" fijo (martes 17/11/2026, 12:00 en Buenos Aires), dentro de la demo del fee 0 %. */
export const RELOJ_BASE = Date.parse('2026-11-17T15:00:00.000Z');

export const CREDENCIALES_PRUEBA = { email: 'especialista@example.test', password: 'clave-de-prueba-123' } as const;

export interface PedidoInterno {
  pub: Omit<PedidoElegible, 'miPropuesta'>;
  cliente: string;
  direccion: string;
  metodoPago: 'mercado_pago' | 'efectivo';
  conversacionId: string | null;
}

export interface TrabajoInterno {
  trabajo: Trabajo;
  contraparte: string;
  eventos: TrabajoDetalle['eventos'];
  etapas: TrabajoDetalle['etapas'];
  cambioPendienteId: string | null;
  pagoId: string | null;
  metodoPago: 'mercado_pago' | 'efectivo';
}

export interface DatosAltaCompletos {
  datos: Omit<DatosAlta, 'dniUltimos' | 'cuitCuilUltimos' | 'version'>;
  dni: string | null;
  cuitCuil: string | null;
  version: number;
}

export interface EstadoMock {
  escenario: Escenario;
  inicioReal: number;
  saltosMs: number;
  /** Persistente: todas las llamadas fallan. */
  falla: 'red' | 'servidor' | null;
  /** Solo la próxima llamada. */
  fallaProxima: 'red' | 'servidor' | null;
  /** El próximo mensaje falla (reintento sin duplicar). */
  fallaMensaje: boolean;
  /** La próxima respuesta a una propuesta pierde contra otra aceptación. */
  conflictoProximo: boolean;
  pushRechazado: boolean;
  sesionActiva: boolean;
  sesionExpirada: boolean;
  intentosFallidos: number;
  cuentas: Map<string, string>;
  cuenta: { id: string; email: string };
  perfil: PerfilEspecialista;
  alta: DatosAltaCompletos;
  disponibilidad: Disponibilidad;
  pedidos: PedidoInterno[];
  propuestas: Propuesta[];
  trabajos: TrabajoInterno[];
  conversaciones: Conversacion[];
  mensajes: Record<string, Mensaje[]>;
  pagos: Pago[];
  casos: CasoSoporteDetalle[];
  avisos: Aviso[];
  preferencias: Preferencias;
  baja: Baja | null;
  feeAvisoEn: string | null;
  /** Para devolver el mismo resultado ante una repetición con la misma Idempotency-Key. */
  idempotencia: Map<string, unknown>;
  contador: number;
  /** Mensaje de la última acción de simulación (lo muestra el panel de prueba). */
  nota: string | null;
}

export const ahoraMs = (s: EstadoMock): number => RELOJ_BASE + (Date.now() - s.inicioReal) + s.saltosMs;
export const ahora = (s: EstadoMock): Date => new Date(ahoraMs(s));
export const iso = (ms: number): string => new Date(ms).toISOString();

export const idFijo = (n: number): string => `00000000-0000-4000-8000-${n.toString(16).padStart(12, '0')}`;
export function idNuevo(s: EstadoMock): string {
  s.contador += 1;
  return `00000000-0000-4000-9000-${s.contador.toString(16).padStart(12, '0')}`;
}

export function fallo(tipo: TipoFallo, status: number, codigo: ErrorApi['codigo'], mensaje: string): FalloApi {
  return new FalloApi(tipo, status, { codigo, mensaje, requestId: 'req-prueba-0001' });
}

/** Repite el resultado guardado si llega la misma Idempotency-Key. */
export function idempotente<T>(s: EstadoMock, clave: string, hacer: () => T): T {
  if (s.idempotencia.has(clave)) return structuredClone(s.idempotencia.get(clave)) as T;
  const r = hacer();
  s.idempotencia.set(clave, structuredClone(r));
  return r;
}
