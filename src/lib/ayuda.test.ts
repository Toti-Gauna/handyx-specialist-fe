import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { buscarPreguntas, MAS_CONSULTADAS, normalizar, TEMAS_AYUDA } from './ayuda.ts';

describe('centro de ayuda', () => {
  it('son los seis temas del diseño', () => {
    assert.deepEqual(TEMAS_AYUDA.map((t) => t.texto), ['Cobros', 'Pedidos', 'Obras y equipo', 'Verificación', 'Cuenta', 'Seguridad']);
  });
  it('lo más consultado trae las destacadas', () => {
    assert.ok(MAS_CONSULTADAS.length >= 3);
    assert.ok(MAS_CONSULTADAS.some((q) => q.pregunta === '¿Cuánto me cobra Handyx?'));
  });
  it('busca sin mayúsculas ni tildes', () => {
    assert.equal(normalizar('Matrícula'), 'matricula');
    assert.ok(buscarPreguntas('matricula').length >= 1);
    assert.ok(buscarPreguntas('COBRO').length >= 1);
  });
  it('pide todas las palabras y no devuelve nada si no hay texto', () => {
    assert.deepEqual(buscarPreguntas('   '), []);
    assert.deepEqual(buscarPreguntas('matricula zzzzz'), []);
  });
  it('ninguna respuesta promete rapidez ni nombra comisión al especialista', () => {
    const todo = TEMAS_AYUDA.flatMap((t) => t.preguntas.map((q) => q.respuesta)).join(' ');
    assert.ok(!/inmediat|al instante|en minutos|despach|matriculad/i.test(todo));
    assert.ok(!/% de comisi|tarifa del/i.test(todo));
  });
});
