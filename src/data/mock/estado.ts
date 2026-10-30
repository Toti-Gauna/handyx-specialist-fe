// Estado en memoria del mock (nada en localStorage, cookies ni IndexedDB) y su reloj controlable.
// Todo es SINTÉTICO: nombres de prueba, correos @example.test e ids 00000000-….
import type {
  Adicional,
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
  EstadoViaje,
  Posicion,
  Punto,
  Trayecto,
  TurnoAntecedentes,
} from '../../contracts/dto.ts';
import { FalloApi, type TipoFallo } from '../errores.ts';
import type { ErrorApi } from '../../contracts/dto.ts';

export const ESCENARIOS = ['nuevo', 'sin_verificar', 'sin_aceptar', 'incompleto', 'en_revision', 'correccion', 'rechazado', 'habilitado', 'baja'] as const;
export type Escenario = (typeof ESCENARIOS)[number];

export const ETIQUETA_ESCENARIO: Record<Escenario, string> = {
  nuevo: 'Sin cuenta (registro desde cero)',
  sin_verificar: 'Cuenta nueva sin verificar el email',
  sin_aceptar: 'Entró con Google por primera vez (falta aceptar)',
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

// Cuenta (lote 4.2). Todo esto es del mock: en producción el código llega por email y los tokens los firman Google, Apple
// o el servidor. scripts/verificar-bundle.mjs comprueba que nada de esto llegue al build de producción.
export const CODIGO_PRUEBA = '482913';
export const TOKEN_RECUPERACION_PRUEBA = 'tok-prueba-recuperacion-0001';
export const TOKEN_VENCIDO_PRUEBA = 'tok-prueba-recuperacion-vencido';
export const CUENTAS_PROVEEDOR_PRUEBA = {
  google: [
    { email: 'especialista.google@example.test', idToken: 'id-token-de-prueba-google-nueva-0001', nueva: true },
    { email: CREDENCIALES_PRUEBA.email, idToken: 'id-token-de-prueba-google-existente-0002', nueva: false },
  ],
  apple: [{ email: 'especialista.apple@example.test', idToken: 'id-token-de-prueba-apple-nueva-0001', nueva: true }],
} as const;
export const MINUTO = 60_000;

export interface PedidoInterno {
  pub: Omit<PedidoElegible, 'miPropuesta'>;
  cliente: string;
  direccion: string;
  /** Punto exacto (sintético) del destino: la app recién lo ve cuando hay trabajo. */
  destino: Punto;
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
  /** Adicionales del trabajo (0.7.0), en el orden en que se crearon. */
  adicionales: Adicional[];
  /** Obra (0.8.0): jornadas en orden y diario en el orden en que se cargó. */
  jornadas: TrabajoDetalle['jornadas'];
  diario: TrabajoDetalle['diario'];
}

/** Viaje de un trabajo (lote 4.3). `desvios`: posiciones seguidas lejos del trayecto (con 2 se recalcula). */
export interface ViajeInterno {
  estado: EstadoViaje;
  trayecto: Trayecto | null;
  ultimaPosicion: Posicion | null;
  desvios: number;
}

/** GPS simulado del Panel de prueba: qué señal da, a qué velocidad avanza y si el próximo paso se desvía. */
export const SENALES_PRUEBA = ['normal', 'imprecisa', 'sin_senal', 'sin_permiso'] as const;
export type SenalPrueba = (typeof SENALES_PRUEBA)[number];
export interface GpsSimulado {
  senal: SenalPrueba;
  rapido: boolean;
  posicion: Punto;
  desviar: boolean;
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
  /** Emails confirmados con el código (o que vienen verificados de Google o Apple). */
  verificados: Set<string>;
  /** Cuentas que aceptaron términos y privacidad. */
  aceptaron: Set<string>;
  /** Código de 6 dígitos de la cuenta nueva actual (el servidor nunca lo devuelve). */
  codigoEmail: { codigo: string; venceMs: number; reenviarDesdeMs: number; intentos: number } | null;
  /** Enlaces de recuperación: token → cuenta, vencimiento y si ya se usó. */
  recuperacion: Map<string, { email: string; venceMs: number; usado: boolean }>;
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
  viajes: Map<string, ViajeInterno>;
  /** Turnos de antecedentes de la oficina de prueba (lote 4.4). */
  turnos: TurnoAntecedentes[];
  gps: GpsSimulado;
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
