import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { z } from 'zod';
import { FalloApi } from '../errores.ts';
import { crearApiHttp } from './adaptador.ts';
import { ClienteHttp } from './cliente.ts';

type Llamada = { url: string; init: RequestInit };

function fetchFalso(respuestas: Array<() => Response>, llamadas: Llamada[] = []): typeof fetch {
  return (async (url: string | URL | Request, init?: RequestInit) => {
    llamadas.push({ url: String(url), init: init ?? {} });
    const r = respuestas.shift();
    if (!r) throw new TypeError('sin red');
    return r();
  }) as typeof fetch;
}

const json = (status: number, cuerpo: unknown) => () =>
  new Response(JSON.stringify(cuerpo), { status, headers: { 'Content-Type': 'application/json' } });

describe('ClienteHttp', () => {
  it('manda cookies, sin cache, y CSRF + Idempotency-Key solo en mutaciones', async () => {
    const llamadas: Llamada[] = [];
    const c = new ClienteHttp({ baseUrl: 'https://api.example.test/', fetch: fetchFalso([json(200, {}), json(200, {})], llamadas) });
    c.recordarCsrf('csrf-de-prueba-123456');
    await c.pedir('GET', '/v1/x', z.object({}));
    await c.pedir('POST', '/v1/x', z.object({}), { cuerpo: { a: 1 }, idempotencyKey: 'k-1' });
    const [get, post] = llamadas;
    assert.equal(get?.url, 'https://api.example.test/v1/x');
    assert.equal(get?.init.credentials, 'include');
    assert.equal(get?.init.cache, 'no-store');
    assert.equal((get?.init.headers as Record<string, string>)['X-CSRF-Token'], undefined);
    assert.equal((post?.init.headers as Record<string, string>)['X-CSRF-Token'], 'csrf-de-prueba-123456');
    assert.equal((post?.init.headers as Record<string, string>)['Idempotency-Key'], 'k-1');
  });

  it('traduce errores con código estable y requestId', async () => {
    const c = new ClienteHttp({
      baseUrl: 'https://api.example.test',
      fetch: fetchFalso([json(409, { error: { codigo: 'conflicto_version', mensaje: 'Cambió mientras tanto', requestId: 'req-1' } })]),
    });
    await assert.rejects(c.pedir('PUT', '/v1/x', z.object({})), (e: unknown) => {
      assert.ok(e instanceof FalloApi);
      assert.equal(e.tipo, 'conflicto');
      assert.equal(e.requestId, 'req-1');
      return true;
    });
  });

  it('una respuesta que no cumple el contrato es error, no se rellena', async () => {
    const c = new ClienteHttp({ baseUrl: 'https://api.example.test', fetch: fetchFalso([json(200, { otra: 'cosa' })]) });
    await assert.rejects(c.pedir('GET', '/v1/x', z.strictObject({ a: z.string() })), { tipo: 'contrato' });
  });

  it('red caída y timeout llegan como fallo (sin fallback a fixtures)', async () => {
    const api = crearApiHttp({ baseUrl: 'https://api.example.test', fetch: fetchFalso([]) });
    assert.equal(api.origen, 'http');
    await assert.rejects(api.perfil(), { tipo: 'red' });

    const lento = (async (_u: unknown, init?: RequestInit) =>
      new Promise((_, rechazar) => init?.signal?.addEventListener('abort', () => rechazar(new DOMException('abort', 'AbortError'))))) as typeof fetch;
    const c = new ClienteHttp({ baseUrl: 'https://api.example.test', fetch: lento, timeoutMs: 10 });
    await assert.rejects(c.pedir('GET', '/v1/x', z.object({})), { tipo: 'timeout' });
  });

  it('sin sesión (401) la consulta de sesión devuelve null y olvida el CSRF', async () => {
    const api = crearApiHttp({ baseUrl: 'https://api.example.test', fetch: fetchFalso([json(401, {})]) });
    assert.equal(await api.sesion(), null);
  });
});
