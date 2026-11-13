import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { armarTablero, etiquetas, materialesTablero, reservaPara, tableroInicial, type Dispositivo } from './tablero.ts';

describe('armador de tablero', () => {
  it('el tablero inicial: 7 módulos + reserva → gabinete de 12, en una fila', () => {
    const a = armarTablero(tableroInicial());
    assert.equal(a.modulosUsados, 7);
    assert.equal(a.reserva, 2);
    assert.equal(a.gabinete, 12);
    assert.equal(a.filas, 1);
    assert.deepEqual(a.posiciones.map((p) => p.inicio), [0, 2, 4, 5, 6]);
    assert.deepEqual(a.avisos, []);
  });

  it('pasa a otra fila cuando no entra y avisa sin diferencial y sin circuito', () => {
    const muchos: Dispositivo[] = Array.from({ length: 14 }, (_, i) => ({ id: `t${i}`, tipo: 'termica_1p', calibre: 16, circuito: i === 0 ? '' : `Circuito ${i}` }));
    const a = armarTablero(muchos);
    assert.equal(a.gabinete, 18);
    assert.equal(a.porFila, 18);
    const b = armarTablero([...muchos, ...muchos]);
    assert.equal(b.gabinete, 36);
    assert.equal(b.porFila, 12);
    assert.equal(b.posiciones[12]!.fila, 1);
    assert.match(a.avisos.join(' '), /disyuntor diferencial/);
    assert.match(a.avisos.join(' '), /1 protección sin el circuito/);
    assert.equal(reservaPara(20), 4);
  });

  it('materiales agrupados y etiquetas en orden', () => {
    const m = materialesTablero(tableroInicial());
    assert.ok(m.some((i) => i.descripcion === 'Interruptor termomagnético 1 polo 10 A' && i.cantidad === 1));
    assert.ok(m.some((i) => i.descripcion.startsWith('Gabinete modular de 12')));
    assert.deepEqual(etiquetas(tableroInicial()).slice(0, 2), ['General · 40 A', 'Diferencial 30 mA · 40 A']);
  });
});
