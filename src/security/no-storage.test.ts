// La PWA no guarda datos de la app en el navegador: ni tokens, ni CSRF, ni datos personales.
// La sesión es una cookie HttpOnly del backend; el estado de la pestaña vive en memoria.
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { it } from 'node:test';

const raiz = new URL('..', import.meta.url).pathname;
const prohibidos = /\b(localStorage|sessionStorage|indexedDB|document\.cookie)\b/;

function archivos(dir: string): string[] {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? archivos(p) : /\.(ts|tsx)$/.test(n) && !n.endsWith('.test.ts') ? [p] : [];
  });
}

it('ningún archivo de src usa almacenamiento del navegador ni document.cookie', () => {
  const sinComentarios = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
  const culpables = archivos(raiz).filter((p) => prohibidos.test(sinComentarios(readFileSync(p, 'utf8'))));
  assert.deepEqual(culpables, []);
});
