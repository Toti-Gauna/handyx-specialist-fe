import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { ErrorConfiguracion, resolverEntorno } from './entorno.ts';

describe('resolverEntorno', () => {
  it('sin variables usa mock (con banner visible)', () => {
    assert.deepEqual(resolverEntorno({}), { origen: 'mock' });
  });
  it('http exige una URL https (http solo en localhost) y nunca cae a mock', () => {
    assert.throws(() => resolverEntorno({ NEXT_PUBLIC_DATA_SOURCE: 'http' }), ErrorConfiguracion);
    assert.throws(() => resolverEntorno({ NEXT_PUBLIC_DATA_SOURCE: 'http', NEXT_PUBLIC_API_BASE_URL: 'http://api.example.test' }), ErrorConfiguracion);
    assert.throws(() => resolverEntorno({ NEXT_PUBLIC_DATA_SOURCE: 'http', NEXT_PUBLIC_API_BASE_URL: 'https://u:p@api.example.test' }), ErrorConfiguracion);
    assert.deepEqual(resolverEntorno({ NEXT_PUBLIC_DATA_SOURCE: 'http', NEXT_PUBLIC_API_BASE_URL: 'https://api.example.test/' }), {
      origen: 'http',
      apiBaseUrl: 'https://api.example.test',
    });
    assert.equal(resolverEntorno({ NEXT_PUBLIC_DATA_SOURCE: 'http', NEXT_PUBLIC_API_BASE_URL: 'http://localhost:4000' }).origen, 'http');
  });
  it('un valor desconocido falla en vez de adivinar', () => {
    assert.throws(() => resolverEntorno({ NEXT_PUBLIC_DATA_SOURCE: 'fixtures' }), ErrorConfiguracion);
  });
});
