import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { claveDePagina, estrategia } from './politica.ts';

const origen = 'https://especialistas.example.test';
const pedir = (url: string, extra: { metodo?: string; modo?: string; base?: string } = {}) =>
  estrategia({ metodo: extra.metodo ?? 'GET', modo: extra.modo ?? 'cors', url: new URL(url, origen), origen, base: extra.base ?? '' });

describe('política del service worker', () => {
  it('nunca toca la API ni otros sitios', () => {
    assert.equal(pedir('https://api.example.test/v1/especialista/pedidos'), 'ninguna');
    assert.equal(pedir('https://api.example.test/v1/especialista/perfil', { modo: 'navigate' }), 'ninguna');
    assert.equal(pedir('https://fonts.example.test/a.woff2'), 'ninguna');
  });

  it('nunca guarda mutaciones ni JSON del mismo origen', () => {
    assert.equal(pedir('/v1/especialista/propuestas', { metodo: 'POST' }), 'ninguna');
    assert.equal(pedir('/_next/static/chunks/a.js', { metodo: 'POST' }), 'ninguna');
    assert.equal(pedir('/v1/especialista/pedidos'), 'ninguna');
    assert.equal(pedir('/datos.json'), 'ninguna');
    assert.equal(pedir('/sw.js'), 'ninguna');
  });

  it('pantallas: red primero con copia del HTML estático', () => {
    assert.equal(pedir('/pedidos/detalle/?id=1', { modo: 'navigate' }), 'pagina');
    assert.equal(claveDePagina(new URL('/pedidos/detalle/?id=00000000-0000-4000-8000-000000000001', origen)), `${origen}/pedidos/detalle/`);
  });

  it('archivos con hash, fuentes e imágenes: caché primero; el resto de lo estático: red primero', () => {
    assert.equal(pedir('/_next/static/chunks/a1b2.js'), 'cache-primero');
    assert.equal(pedir('/handys/handy-cano-roto.webp'), 'cache-primero');
    assert.equal(pedir('/inicio/index.txt?_rsc=abc'), 'red-primero');
    assert.equal(pedir('/manifest.webmanifest'), 'red-primero');
  });

  it('respeta la base de la vista previa', () => {
    assert.equal(pedir('/otra-app/inicio/', { modo: 'navigate', base: '/handyx-specialist-fe' }), 'ninguna');
    assert.equal(pedir('/handyx-specialist-fe/inicio/', { modo: 'navigate', base: '/handyx-specialist-fe' }), 'pagina');
  });
});
