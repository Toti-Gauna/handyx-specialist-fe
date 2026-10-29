import assert from 'node:assert/strict';
import { it } from 'node:test';
import { fuerzaClave } from './clave.ts';

it('medidor de contraseña: el mínimo manda y una frase larga es la más fuerte', () => {
  assert.equal(fuerzaClave('corta').nivel, 0);
  assert.match(fuerzaClave('once-letras').consejo ?? '', /Te falta 1 carácter/);
  assert.equal(fuerzaClave('doce letrass').nivel, 1);
  assert.equal(fuerzaClave('Doce-Letras1').nivel, 2);
  assert.equal(fuerzaClave('una frase bastante larga').nivel, 3);
  assert.equal(fuerzaClave('mariano-clave-2026', 'mariano@example.test').nivel, 1);
});
