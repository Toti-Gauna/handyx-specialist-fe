import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { cotaAlto, cotaAncho, cotaDiametro, describirMedidas, distancia, formatearDiametro, formatearMedida, medidasDeCaja, trazarCota } from './cotas.ts';
import { avanceEscaneo, posicionesTomas, TOMAS_ESCANEO } from './escaneo.ts';

describe('cotas y medidas', () => {
  it('formato con coma decimal: centímetros por debajo del metro, metros desde el metro', () => {
    assert.equal(formatearMedida(0.85), '85 cm');
    assert.equal(formatearMedida(0.045), '4,5 cm');
    assert.equal(formatearMedida(0.05), '5 cm');
    assert.equal(formatearMedida(1.2), '1,20 m');
    assert.equal(formatearMedida(-1), '—');
    assert.equal(formatearMedida(Number.NaN), '—');
    assert.equal(formatearDiametro(0.45), 'Ø 45 cm');
  });

  it('describe las medidas como aproximadas (como en T-Modelo3D)', () => {
    assert.equal(describirMedidas({ alto: 0.85, diametro: 0.45 }), 'Alto 85 cm · diámetro 45 cm · aprox.');
    assert.equal(describirMedidas({ ancho: 0.6 }, false), 'Ancho 60 cm');
    assert.equal(describirMedidas({}), '');
  });

  it('medidas de una caja', () => {
    assert.deepEqual(medidasDeCaja({ min: [0, 0, 0], max: [0.3, 0.5, 0.1] }), { ancho: 0.3, alto: 0.5, fondo: 0.1 });
  });

  it('una cota mide la distancia real aunque la línea esté corrida', () => {
    const t = trazarCota([0, 0, 0], [0, 1, 0], [0.1, 0, 0], 0.02);
    assert.equal(t.largo, 1);
    assert.deepEqual(t.linea, [
      [0.1, 0, 0],
      [0.1, 1, 0],
    ]);
    assert.deepEqual(t.medio, [0.1, 0.5, 0]);
    assert.ok(Math.abs(distancia(...t.marcas[0]) - 0.02) < 1e-12);
  });

  it('cotas de alto, ancho y diámetro', () => {
    const c = { min: [-0.2, 0, -0.2], max: [0.2, 0.85, 0.2] } as const;
    assert.ok(Math.abs(cotaAlto(c).largo - 0.85) < 1e-12);
    assert.ok(Math.abs(cotaAncho(c).largo - 0.4) < 1e-12);
    const d = cotaDiametro([0, 0, 0], 0.225, 0.85);
    assert.ok(Math.abs(d.largo - 0.45) < 1e-12);
    assert.ok(d.linea[0][1] > 0.85);
  });
});

describe('escaneo 3D', () => {
  it('30 tomas en un anillo, la primera de frente y en sentido horario visto desde arriba', () => {
    const p = posicionesTomas();
    assert.equal(p.length, TOMAS_ESCANEO);
    assert.deepEqual(p[0], [0, 0, 1]);
    assert.ok(p[1]![0] < 0);
    p.forEach(([x, , z]) => assert.ok(Math.abs(Math.hypot(x, z) - 1) < 1e-9));
  });

  it('avance con tope y texto', () => {
    assert.deepEqual(avanceEscaneo(18), { tomadas: 18, total: 30, fraccion: 0.6, listo: false, texto: '18 de 30 fotos' });
    assert.equal(avanceEscaneo(40).listo, true);
    assert.equal(avanceEscaneo(-3).tomadas, 0);
  });
});
