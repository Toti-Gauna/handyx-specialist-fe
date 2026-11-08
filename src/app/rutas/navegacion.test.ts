import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { RUTAS } from '../rutas.ts';
import { PESTANAS, pestanaActiva } from './navegacion.ts';

describe('pestañas', () => {
  it('son cinco y Agenda dejó su lugar a Taller', () => {
    assert.deepEqual(
      PESTANAS.map((p) => p.texto),
      ['Inicio', 'Obras', 'Taller', 'Mensajes', 'Cuenta'],
    );
    assert.equal(PESTANAS[2].ruta, '/taller/');
  });
  it('cada pestaña apunta a una ruta existente', () => {
    const rutas = new Set(Object.values(RUTAS).map((r) => r.ruta));
    for (const p of PESTANAS) assert.ok(rutas.has(p.ruta), p.ruta);
  });
  it('la pestaña activa sale del prefijo de la ruta', () => {
    assert.equal(pestanaActiva('/inicio/'), 'inicio');
    assert.equal(pestanaActiva('/pedidos/detalle'), 'inicio');
    assert.equal(pestanaActiva('/trabajos/obra/plan/'), 'obras');
    assert.equal(pestanaActiva('/taller/nivel/'), 'taller');
    assert.equal(pestanaActiva('/agenda/'), 'taller');
    assert.equal(pestanaActiva('/mensajes/hilo/'), 'mensajes');
    assert.equal(pestanaActiva('/cuenta/datos/'), 'cuenta');
    assert.equal(pestanaActiva('/acceso/'), null);
  });
});
