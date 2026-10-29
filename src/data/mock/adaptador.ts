// Adaptador mock: estado en memoria de la pestaña (nada en localStorage, cookies ni IndexedDB).
// Reglas de servidor emuladas (elegibilidad, transiciones, vencimientos, idempotencia) en los dominios;
// escenarios y simulaciones para recorrer todos los estados sin backend en ./controles.ts.
import type { EspecialistaApi } from '../api.ts';
import { FalloApi } from '../errores.ts';
import { acceso, cuentaLista } from './acceso.ts';
import { alta } from './alta.ts';
import { caja } from './caja.ts';
import { cuenta } from './cuenta.ts';
import { ahora, type Escenario, type EstadoMock } from './estado.ts';
import { crearEstado } from './fixtures.ts';
import { mensajes } from './mensajes.ts';
import { pedidos } from './pedidos.ts';
import { propuestas } from './propuestas.ts';
import { soporte } from './soporte.ts';
import { trabajos } from './trabajos.ts';
import { cargarGrafo } from './mapa.ts';
import { viajes } from './viajes.ts';
import { fallo } from './estado.ts';

export interface OpcionesMock {
  escenario?: Escenario;
  /** Latencia simulada por llamada (las pruebas usan 0). */
  latenciaMs?: number;
}

type Metodos = Omit<EspecialistaApi, 'origen' | 'ahora' | 'simulacionPostDemo'>;
/** Versión síncrona de cada método del puerto: el adaptador la envuelve con latencia, fallas y sesión. */
type Sincrono = { [K in keyof Metodos]: Metodos[K] extends (...a: infer A) => Promise<infer R> ? (...a: A) => R : never };

// No exigen sesión: acceso, consulta de sesión y recuperación con el enlace del email.
const PUBLICOS = new Set<keyof Metodos>(['sesion', 'ingresar', 'registrar', 'recuperar', 'salir', 'ingresarConProveedor', 'estadoRecuperacion', 'restablecer']);
// Con sesión pero sin terminar la cuenta (email sin verificar o términos sin aceptar) solo se puede esto.
const CUENTA_A_MEDIAS = new Set<keyof Metodos>(['estadoVerificacion', 'reenviarCodigo', 'verificarEmail', 'aceptarTerminos']);

export interface ApiMock {
  api: EspecialistaApi;
  estado: EstadoMock;
}

export function crearApiMockConEstado(o: OpcionesMock = {}): ApiMock {
  const s = crearEstado(o.escenario ?? 'habilitado');
  const latencia = o.latenciaMs ?? 250;

  const todos = {
    ...acceso(s),
    ...alta(s),
    ...pedidos(s),
    ...propuestas(s),
    ...trabajos(s),
    ...viajes(s),
    ...mensajes(s),
    ...caja(s),
    ...soporte(s),
    ...cuenta(s),
  } as unknown as Sincrono;

  const api = { origen: 'mock' as const, ahora: () => ahora(s) } as Record<string, unknown>;
  for (const nombre of Object.keys(todos) as Array<keyof Metodos>) {
    const hacer = todos[nombre] as (...a: unknown[]) => unknown;
    api[nombre] = async (...args: unknown[]) => {
      if (latencia > 0) await new Promise((r) => setTimeout(r, latencia));
      const falla = s.falla ?? s.fallaProxima;
      s.fallaProxima = null;
      if (falla === 'red') throw new FalloApi('red');
      if (falla === 'servidor') throw fallo('servidor', 503, 'servicio_no_disponible', 'El servicio no está disponible por ahora.');
      if (!PUBLICOS.has(nombre) && (!s.sesionActiva || s.sesionExpirada)) {
        s.sesionActiva = false;
        throw fallo('sesion', 401, 'no_autenticado', 'Tu sesión expiró. Volvé a entrar.');
      }
      if (!PUBLICOS.has(nombre) && !CUENTA_A_MEDIAS.has(nombre) && !cuentaLista(s)) {
        throw fallo('permiso', 403, 'sin_permiso', 'Primero terminá de crear tu cuenta.');
      }
      // El grafo de calles se carga recién cuando hace falta un trayecto (pesa: no va en el arranque de la vista previa).
      if (nombre === 'enviarPosicion') await cargarGrafo();
      return structuredClone(hacer(...args));
    };
  }
  api.simulacionPostDemo = async () => structuredClone(caja(s).simulacionPostDemo());
  return { api: api as unknown as EspecialistaApi, estado: s };
}

export const crearApiMock = (o: OpcionesMock = {}): EspecialistaApi => crearApiMockConEstado(o).api;
