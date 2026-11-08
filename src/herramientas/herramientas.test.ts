// Medir con la cámara y conversor (lote 2.4).
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { convertir, leerNumero, mostrarNumero } from './conversor.ts';
import { describirNivel, leerNivel } from './nivel.ts';
import { anguloEntre, escalaTarjeta, moverPunto, resumirMedidas, textoParaCompartir, tramosEnAr, tramosEnFoto, TARJETA_LARGO_MM } from './medir.ts';

const cerca = (a: number, b: number, t = 1e-6) => assert.ok(Math.abs(a - b) <= t, `${a} ≉ ${b}`);

describe('medir con la cámara', () => {
  it('la tarjeta da la escala y una tarjeta muy chica no sirve', () => {
    const e = escalaTarjeta([100, 200], [185.6, 200]);
    assert.ok(e.ok);
    cerca(e.metrosPorPx, 0.001);
    assert.deepEqual(escalaTarjeta([0, 0], [10, 0]), { ok: false, motivo: 'chica' });
    assert.equal(TARJETA_LARGO_MM, 85.6);
  });

  it('mide tramos en la foto y en la AR', () => {
    cerca(tramosEnFoto([[0, 0], [1420, 0], [1420, 1680]], 0.001)[1]!, 1.68);
    const ar = tramosEnAr([[0, 0, 0], [1.42, 0, 0], [1.42, 1.68, 0]]);
    cerca(ar[0]!, 1.42);
    cerca(anguloEntre([0, 0, 0], [1.42, 0, 0], [1.42, 1.68, 0]), 90);
  });

  it('dos tramos en escuadra son un hueco con su superficie', () => {
    const r = resumirMedidas([1.42, 1.68], 90);
    assert.equal(r.texto, '1,42 × 1,68 m · 2,39 m²');
    assert.equal(r.cantidad, '2 medidas');
    assert.equal(resumirMedidas([0.85], null).texto, '85 cm');
    assert.equal(resumirMedidas([1, 1, 2.2], 45).texto, '4,20 m en total');
    assert.match(textoParaCompartir('Hueco de la ventana', [1.42, 1.68], r), /Superficie: 2,39 m²\nMedidas aproximadas/);
  });

  it('los botones mueven el punto sin salir de la foto', () => {
    assert.deepEqual(moverPunto([5, 5], -10, 0, 100, 100), [0, 5]);
    assert.deepEqual(moverPunto([95, 50], 10, 10, 100, 100), [100, 60]);
  });
});

describe('conversor', () => {
  it('pulgadas, frigorías, presión y potencia', () => {
    cerca(convertir('largo', 0.75, 'pulgada', 'mm'), 19.05);
    cerca(convertir('potencia', 3000, 'frigoria', 'btu'), 11905, 1);
    cerca(convertir('presion', 1, 'bar', 'psi'), 14.5038, 1e-3);
    cerca(convertir('potencia', 1, 'hp', 'w'), 745.69987);
    cerca(convertir('volumen', 1, 'm3', 'l'), 1000);
  });
  it('lee números de la obra', () => {
    assert.equal(leerNumero('3/4'), 0.75);
    assert.equal(leerNumero('1 1/2'), 1.5);
    assert.equal(leerNumero('2,5'), 2.5);
    assert.equal(leerNumero('1.250,5'), 1250.5);
    assert.equal(leerNumero('abc'), null);
    assert.equal(leerNumero('1/0'), null);
    assert.equal(mostrarNumero(19.05), '19,05');
    assert.equal(mostrarNumero(1250), '1.250');
    assert.equal(mostrarNumero(11904.898), '11.905');
    assert.equal(mostrarNumero(145.2378), '145,2');
  });
});

describe('nivel, pared y plomada', () => {
  it('dice hacia dónde está inclinado', () => {
    assert.deepEqual(describirNivel({ beta: 0.1, gamma: -0.4 }, 'superficie'), { estado: 'casi', grados: '0,4°', texto: 'Casi a nivel · inclinado hacia la izquierda' });
    assert.equal(describirNivel({ beta: 0, gamma: 0.1 }, 'superficie').texto, 'A nivel');
    assert.equal(describirNivel({ beta: 87, gamma: 0 }, 'plomada').texto, 'Fuera de plomo · inclinado hacia atrás');
    assert.equal(describirNivel({ beta: 5, gamma: 0.6 }, 'pared').texto, 'Casi a nivel · inclinado hacia la derecha');
  });
  it('la burbuja se va al lado alto y se calibra', () => {
    const l = leerNivel({ beta: 0, gamma: 5 }, 'superficie');
    assert.equal(l.x, -0.5);
    assert.equal(leerNivel({ beta: 1, gamma: 1 }, 'superficie', { beta: 1, gamma: 1 }).angulo, 0);
  });
});
