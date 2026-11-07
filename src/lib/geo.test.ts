import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  circulo,
  debeEnviar,
  desplazar,
  distanciaM,
  encuadre,
  enlacesNavegacion,
  fueraDelTrayecto,
  largoM,
  loQueFalta,
  proyectar,
  puntoEn,
  rumbo,
  senalDe,
  SIN_SENAL_MS,
  textoDistancia,
  textoDuracion,
} from './geo.ts';

// Puntos sintéticos: una "L" de dos tramos de ~1 km armada con desplazar(), sin relación con calles reales.
const A = { lat: -38, lng: -57.55 };
const B = desplazar(A, 1000, 90);
const C = desplazar(B, 1000, 0);
const L = [A, B, C];
const cerca = (a: number, b: number, tol: number) => assert.ok(Math.abs(a - b) <= tol, `${a} ≉ ${b} (± ${tol})`);

describe('geo (lote 4.3)', () => {
  it('distancias, rumbo y desplazamiento son consistentes', () => {
    cerca(distanciaM(A, B), 1000, 0.5);
    cerca(rumbo(A, B), 90, 0.5);
    cerca(rumbo(B, C), 0, 0.5);
    cerca(largoM(L), 2000, 1);
    // Un grado de latitud ≈ 111,2 km
    cerca(distanciaM({ lat: -38, lng: -57.5 }, { lat: -37, lng: -57.5 }), 111_195, 50);
  });

  it('proyecta sobre el tramo más cercano y mide lo recorrido', () => {
    const p = desplazar(desplazar(A, 400, 90), 30, 180); // 30 m al sur del primer tramo
    const pr = proyectar(L, p);
    assert.equal(pr.tramo, 0);
    cerca(pr.distanciaM, 30, 0.5);
    cerca(pr.recorridoM, 400, 1);
    const q = desplazar(B, 700, 0);
    cerca(proyectar(L, q).recorridoM, 1700, 1);
  });

  it('puntoEn recorre el trayecto y no se pasa del final', () => {
    cerca(distanciaM(puntoEn(L, 1500), desplazar(B, 500, 0)), 0, 0.5);
    assert.deepEqual(puntoEn(L, 99_999), C);
    assert.deepEqual(puntoEn(L, -10), A);
  });

  it('lo que falta empieza en la proyección y sigue por el resto del trayecto', () => {
    const resto = loQueFalta(L, desplazar(A, 500, 90));
    assert.equal(resto.length, 3);
    cerca(largoM(resto), 1500, 1);
  });

  it('desvío: solo lejos del trayecto y con buena precisión', () => {
    const lejos = desplazar(desplazar(A, 500, 90), 150, 180);
    assert.equal(fueraDelTrayecto(L, lejos, 10), true);
    assert.equal(fueraDelTrayecto(L, lejos, 300), false, 'con una precisión mala no se recalcula');
    assert.equal(fueraDelTrayecto(L, desplazar(desplazar(A, 500, 90), 40, 180), 10), false);
  });

  it('círculo cerrado al radio pedido y encuadre', () => {
    const c = circulo(A, 800, 12);
    assert.equal(c.length, 13);
    assert.deepEqual(c[0], c[12]);
    for (const p of c) cerca(distanciaM(A, p), 800, 0.5);
    const [[o, s], [e, n]] = encuadre(L);
    assert.ok(o <= A.lng && e >= B.lng && s <= A.lat && n >= C.lat);
  });

  it('señal: el permiso manda, después la antigüedad y la precisión', () => {
    const fix = { punto: A, precisionM: 12, enMs: 1000 };
    assert.equal(senalDe(null, 0), 'buscando');
    assert.equal(senalDe(fix, 2000), 'normal');
    assert.equal(senalDe({ ...fix, precisionM: 250 }, 2000), 'imprecisa');
    assert.equal(senalDe(fix, 1000 + SIN_SENAL_MS + 1), 'sin_senal');
    assert.equal(senalDe(fix, 2000, 'permiso'), 'sin_permiso');
    assert.equal(senalDe(null, 0, 'no_disponible'), 'no_disponible');
  });

  it('envíos: cada 5 s si te moviste 25 m, y cada 10 s aunque no', () => {
    const f = (ms: number, m = 0) => ({ punto: desplazar(A, m, 90), precisionM: 10, enMs: ms });
    assert.equal(debeEnviar(null, f(0)), true);
    assert.equal(debeEnviar(f(0), f(3000, 100)), false);
    assert.equal(debeEnviar(f(0), f(6000, 30)), true);
    assert.equal(debeEnviar(f(0), f(6000, 5)), false);
    assert.equal(debeEnviar(f(0), f(10_000, 0)), true);
  });

  it('textos de distancia y tiempo en castellano, sin prometer "0 min"', () => {
    assert.equal(textoDistancia(343), '350 m');
    assert.equal(textoDistancia(2), '10 m');
    assert.equal(textoDistancia(1234), '1,2 km');
    assert.equal(textoDistancia(12_600), '13 km');
    assert.equal(textoDuracion(5), '1 min');
    assert.equal(textoDuracion(479), '8 min');
    assert.equal(textoDuracion(3900), '1 h 5 min');
    assert.equal(textoDuracion(7200), '2 h');
  });

  it('atajos de navegación solo con el destino', () => {
    const { google, waze } = enlacesNavegacion({ lat: -38.0001234567, lng: -57.55 });
    assert.equal(google, 'https://www.google.com/maps/dir/?api=1&destination=-38.000123,-57.550000&travelmode=driving');
    assert.equal(waze, 'https://waze.com/ul?ll=-38.000123,-57.550000&navigate=yes');
  });
});
