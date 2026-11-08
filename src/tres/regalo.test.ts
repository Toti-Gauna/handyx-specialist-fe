import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { DURACION_REGALO, POSE_ABIERTA, poseRegalo, rebote, resorte, TIEMPOS_REGALO } from './regalo.ts';
import { describirSendero, estadosEstaciones, puntosCurva, recorrido, trazarSendero, type Estacion } from './sendero.ts';

describe('caja de regalo', () => {
  it('baja, tiembla, abre y queda abierta, en ese orden', () => {
    const { baja, tiembla } = TIEMPOS_REGALO;
    assert.equal(poseRegalo(0).fase, 'baja');
    assert.equal(poseRegalo(baja + 0.1).fase, 'tiembla');
    assert.equal(poseRegalo(baja + tiembla + 0.1).fase, 'abre');
    assert.deepEqual(poseRegalo(DURACION_REGALO), POSE_ABIERTA);
    assert.deepEqual(poseRegalo(100), POSE_ABIERTA);
  });

  it('sin azar: el mismo instante da siempre la misma pose', () => {
    for (let t = 0; t <= DURACION_REGALO; t += 0.137) assert.deepEqual(poseRegalo(t), poseRegalo(t));
  });

  it('arranca arriba y llega al piso; tiembla sin saltar al empezar ni al terminar', () => {
    assert.ok(poseRegalo(0).altura > 2);
    assert.ok(poseRegalo(TIEMPOS_REGALO.baja - 1e-6).altura < 0.01);
    assert.ok(Math.abs(poseRegalo(TIEMPOS_REGALO.baja).inclinacion) < 1e-9);
    const max = Math.max(...Array.from({ length: 100 }, (_, i) => Math.abs(poseRegalo(TIEMPOS_REGALO.baja + (i / 100) * TIEMPOS_REGALO.tiembla).inclinacion)));
    assert.ok(max > 0.05 && max <= 0.11);
  });

  it('la luz crece al abrir y termina entera', () => {
    const { baja, tiembla, abre } = TIEMPOS_REGALO;
    assert.ok(poseRegalo(baja + tiembla + abre * 0.2).brillo < poseRegalo(baja + tiembla + abre * 0.6).brillo);
    assert.equal(POSE_ABIERTA.brillo, 1);
  });

  it('curvas: rebote y resorte van de 0 a 1', () => {
    assert.equal(rebote(0), 0);
    assert.ok(Math.abs(rebote(1) - 1) < 1e-9);
    assert.ok(Math.abs(resorte(0)) < 1e-9);
    assert.equal(resorte(1), 1);
    assert.ok(resorte(0.8) > 1, 'la tapa se pasa un poco y vuelve');
  });
});

describe('sendero con estaciones', () => {
  it('estados a partir de la estación en curso', () => {
    assert.deepEqual(estadosEstaciones(5, 3), ['lograda', 'lograda', 'lograda', 'actual', 'proxima']);
    assert.deepEqual(estadosEstaciones(2, 5), ['lograda', 'lograda']);
    assert.deepEqual(estadosEstaciones(-1, 0), []);
  });

  it('el trazado es siempre el mismo y va hacia el fondo', () => {
    const a = trazarSendero(5);
    assert.deepEqual(a, trazarSendero(5));
    assert.equal(a[0]![2], 0);
    for (let i = 1; i < a.length; i++) assert.ok(a[i]![2] < a[i - 1]![2]);
  });

  it('la curva entra y sale de la vista', () => {
    const e = trazarSendero(3);
    const c = puntosCurva(e);
    assert.equal(c.length, 5);
    assert.ok(c[0]![2] > 0);
    assert.ok(c[4]![2] < e[2]![2]);
    assert.deepEqual(puntosCurva([]), []);
  });

  it('recorrido: estación actual más el avance hacia la siguiente', () => {
    assert.equal(recorrido(5, 0), 0);
    assert.equal(recorrido(5, 3, 0.8), 0.95);
    assert.equal(recorrido(5, 9), 1);
    assert.equal(recorrido(1, 0), 1);
  });

  it('describe el camino en texto (como G-Camino)', () => {
    const titulos = ['Bienvenida', 'Kit chico', 'Consumibles', 'Gorra Handyx', 'Herramienta'];
    const requisitos = ['Remera y manual', '1 trabajo', '5 trabajos', '10 trabajos', '25 trabajos'];
    const estados = estadosEstaciones(5, 3);
    const e: Estacion[] = titulos.map((titulo, i) => ({ titulo, requisito: requisitos[i]!, estado: estados[i]! }));
    assert.equal(describirSendero(e), 'Camino de 5 estaciones, 3 logradas. Vas por «Gorra Handyx» (10 trabajos).');
    assert.equal(describirSendero(e.map((x) => ({ ...x, estado: 'lograda' }))), 'Camino de 5 estaciones, 5 logradas. Llegaste al final del camino.');
    assert.equal(describirSendero([]), 'Todavía no hay estaciones en tu camino.');
  });
});
