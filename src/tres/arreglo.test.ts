import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { RUBROS } from '../contracts/rubros.ts';
import { ALTURA_ENTRADA, describirArreglo, duracionArmado, encastre, OBJETOS_ARREGLO, PIEZA_ARMADA, piezasArmadas, posePieza, TIEMPOS_ARMADO } from './arreglo.ts';

describe('arreglo que se construye', () => {
  it('hay un objeto para cada rubro, con piezas', () => {
    for (const r of RUBROS) assert.ok(OBJETOS_ARREGLO[r].piezas.length >= 3, r);
  });

  it('cada pieza arriba, invisible, antes de su turno; en su lugar al terminar', () => {
    const p = posePieza(2, 0);
    assert.equal(p.visible, false);
    assert.equal(p.subida, ALTURA_ENTRADA);
    assert.deepEqual(posePieza(2, 2 * TIEMPOS_ARMADO.escalon + TIEMPOS_ARMADO.pieza), PIEZA_ARMADA);
  });

  it('entran en orden, una detrás de otra, y alternan el giro sin azar', () => {
    const t = TIEMPOS_ARMADO.escalon * 1.5;
    assert.ok(posePieza(0, t).avance > posePieza(1, t).avance);
    assert.equal(posePieza(2, t).avance, 0);
    assert.ok(posePieza(0, 0.1).giro > 0);
    assert.ok(posePieza(1, TIEMPOS_ARMADO.escalon + 0.1).giro < 0);
    assert.deepEqual(posePieza(3, 1.234), posePieza(3, 1.234));
  });

  it('cuenta las piezas armadas para «Paso N de M»', () => {
    assert.equal(piezasArmadas(5, 0), 0);
    assert.equal(piezasArmadas(5, TIEMPOS_ARMADO.pieza), 1);
    assert.equal(piezasArmadas(5, duracionArmado(5)), 5);
    assert.equal(duracionArmado(0), 0);
  });

  it('el encastre se pasa apenas y termina en 1', () => {
    assert.ok(Math.abs(encastre(0)) < 1e-9);
    assert.equal(encastre(1), 1);
    assert.ok(encastre(0.85) > 1);
  });

  it('descripción en texto, en palabras simples', () => {
    assert.equal(describirArreglo('plomeria'), 'Dibujo en 3D de una canilla que se arma pieza por pieza: bacha, caño, cuerpo, pico y manija.');
    for (const r of RUBROS) assert.match(describirArreglo(r), /^Dibujo en 3D de .+\.$/);
  });
});
