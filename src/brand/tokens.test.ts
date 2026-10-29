// tokens.ts es copia byte a byte de Handy-landing-page-fe/src/brand/tokens.ts (fuente de la marca).
// HANDY_LANDING_TOKENS=<ruta a ese archivo> npm test verifica la sincronía.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { it } from 'node:test';
import { colores } from './tokens.ts';

it('mantiene el azul de marca de la landing', () => {
  assert.equal(colores.azul, '#1F57A8');
});

const ruta = process.env.HANDY_LANDING_TOKENS;
it('es copia idéntica de la landing', { skip: !ruta && 'HANDY_LANDING_TOKENS no definido' }, () => {
  assert.equal(readFileSync(new URL('tokens.ts', import.meta.url), 'utf8'), readFileSync(ruta as string, 'utf8'));
});
