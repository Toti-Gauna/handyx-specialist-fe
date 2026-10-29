// Cliente HTTP de api-especialista.
// - Cookie de sesión HttpOnly del backend: `credentials: 'include'`; nada se guarda en el navegador.
// - csrfToken solo en memoria; va en X-CSRF-Token en toda mutación.
// - Idempotency-Key (UUIDv4) en las mutaciones que la piden; el que reintenta reusa la misma clave.
// - Cada respuesta se valida con su esquema: un desajuste es error de `contrato`, no se rellena.
// - Sin fallback a fixtures: un fallo de red o del servidor llega a la interfaz como FalloApi.
import type { z } from 'zod';
import { ErrorApiSchema } from '../../contracts/dto.ts';
import { FalloApi, tipoPorStatus } from '../errores.ts';

export interface OpcionesCliente {
  baseUrl: string;
  fetch?: typeof fetch;
  timeoutMs?: number;
}

export interface OpcionesPedido {
  cuerpo?: unknown;
  idempotencyKey?: string;
  /** Para GET de sesión: 401 devuelve null en vez de fallar. */
  nuloSi401?: boolean;
}

export type Metodo = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export class ClienteHttp {
  readonly #baseUrl: string;
  readonly #fetch: typeof fetch;
  readonly #timeoutMs: number;
  #csrf: string | null = null;

  constructor(o: OpcionesCliente) {
    this.#baseUrl = o.baseUrl.replace(/\/$/, '');
    this.#fetch = o.fetch ?? globalThis.fetch.bind(globalThis);
    this.#timeoutMs = o.timeoutMs ?? 15_000;
  }

  recordarCsrf(token: string | null): void {
    this.#csrf = token;
  }

  async pedir<S extends z.ZodType>(metodo: Metodo, ruta: string, esquema: S, o: OpcionesPedido = {}): Promise<z.infer<S>> {
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (o.cuerpo !== undefined) headers['Content-Type'] = 'application/json';
    if (metodo !== 'GET') {
      if (this.#csrf) headers['X-CSRF-Token'] = this.#csrf;
      if (o.idempotencyKey) headers['Idempotency-Key'] = o.idempotencyKey;
    }

    const control = new AbortController();
    const reloj = setTimeout(() => control.abort(), this.#timeoutMs);
    let r: Response;
    try {
      r = await this.#fetch(`${this.#baseUrl}${ruta}`, {
        method: metodo,
        headers,
        body: o.cuerpo === undefined ? undefined : JSON.stringify(o.cuerpo),
        credentials: 'include',
        cache: 'no-store',
        redirect: 'error',
        signal: control.signal,
      });
    } catch {
      throw new FalloApi(control.signal.aborted ? 'timeout' : 'red');
    } finally {
      clearTimeout(reloj);
    }

    if (r.status === 401 && o.nuloSi401) return null as z.infer<S>;
    if (!r.ok) {
      const cuerpo = await r.json().catch(() => null);
      const error = ErrorApiSchema.safeParse(cuerpo);
      throw new FalloApi(tipoPorStatus(r.status), r.status, error.success ? error.data.error : null);
    }
    if (r.status === 204) return undefined as z.infer<S>;

    const datos = await r.json().catch(() => {
      throw new FalloApi('contrato', r.status);
    });
    const ok = esquema.safeParse(datos);
    if (!ok.success) throw new FalloApi('contrato', r.status);
    return ok.data;
  }
}
