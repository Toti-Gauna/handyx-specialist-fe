import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  ajustarPrecio,
  alturaAlSoltar,
  grillaMes,
  iniciales,
  leerPesos,
  moverMes,
  PRECIO_MAXIMO,
  sinCorte,
  siguienteAltura,
  tiraDias,
  tonoAvatar,
  TONOS_AVATAR,
  valorContador,
} from './logica.ts';

describe('kit · calendario y días', () => {
  it('noviembre de 2026 empieza el domingo y tiene 30 días', () => {
    const g = grillaMes(2026, 11);
    assert.equal(g[0]?.fecha, '2026-11-01');
    assert.equal(g.filter((c) => c.fecha).length, 30);
  });

  it('diciembre de 2026 empieza el martes: dos huecos antes del 1', () => {
    const g = grillaMes(2026, 12);
    assert.deepEqual(g.slice(0, 3).map((c) => c.dia), [null, null, 1]);
  });

  it('febrero bisiesto y cambio de año', () => {
    assert.equal(grillaMes(2028, 2).filter((c) => c.fecha).length, 29);
    assert.deepEqual(moverMes(2026, 12, 1), { anio: 2027, mes: 1 });
    assert.deepEqual(moverMes(2026, 1, -1), { anio: 2025, mes: 12 });
  });

  it('la tira de días cruza el fin de mes y marca hoy', () => {
    const t = tiraDias('2026-11-29', 4, '2026-11-30');
    assert.deepEqual(t.map((d) => `${d.corto} ${d.dia}`), ['Dom 29', 'Lun 30', 'Mar 1', 'Mié 2']);
    assert.deepEqual(t.map((d) => d.esHoy), [false, true, false, false]);
  });
});

describe('kit · precio', () => {
  it('sube y baja de a $ 500, nunca debajo de 0 ni arriba del tope', () => {
    assert.equal(ajustarPrecio(4_400_000, 50_000), 4_450_000);
    assert.equal(ajustarPrecio(30_000, -50_000), 0);
    assert.equal(ajustarPrecio(PRECIO_MAXIMO, 50_000), PRECIO_MAXIMO);
  });

  it('redondea al paso un monto tipeado con centavos', () => {
    assert.equal(ajustarPrecio(4_412_345, 0), 4_400_000);
  });

  it('lee montos como los tipea una persona', () => {
    assert.equal(leerPesos('45.000'), 4_500_000);
    assert.equal(leerPesos('$ 45000'), 4_500_000);
    assert.equal(leerPesos('45000,50'), 4_500_050);
    assert.equal(leerPesos('cuarenta'), null);
    assert.equal(leerPesos(''), null);
    assert.equal(leerPesos('999999999'), null);
  });
});

describe('kit · avatar', () => {
  it('iniciales de la primera y la última palabra', () => {
    assert.equal(iniciales('Cliente De Prueba'), 'CP');
    assert.equal(iniciales('La Perla'), 'LP');
    assert.equal(iniciales('Especialista'), 'ES');
    assert.equal(iniciales('  Cliente   San Carlos '), 'CC');
    assert.equal(iniciales('Cliente De Prueba 2'), 'CP');
    assert.equal(iniciales('42'), '42');
  });

  it('el mismo nombre siempre da el mismo tono, dentro de los disponibles', () => {
    assert.equal(tonoAvatar('Cliente De Prueba 2'), tonoAvatar('Cliente De Prueba 2'));
    const t = tonoAvatar('Otro nombre');
    assert.ok(Number.isInteger(t) && t >= 0 && t < TONOS_AVATAR);
  });
});

describe('kit · hoja arrastrable', () => {
  it('se acomoda a la altura más cercana al soltar despacio', () => {
    assert.equal(alturaAlSoltar(0.3, 0), 0);
    assert.equal(alturaAlSoltar(0.55, 0), 1);
    assert.equal(alturaAlSoltar(0.9, 0), 2);
  });

  it('con impulso pasa a la siguiente, sin salirse de los extremos', () => {
    assert.equal(alturaAlSoltar(0.36, 2), 1);
    assert.equal(alturaAlSoltar(0.64, -2), 0);
    assert.equal(alturaAlSoltar(0.94, 3), 2);
    assert.equal(siguienteAltura(0, -1), 0);
  });
});

describe('kit · montos sin corte', () => {
  it('el signo queda pegado al número', () => {
    assert.equal(sinCorte('$ 44.000'), '$\u00a044.000');
  });
});

describe('kit · contador de montos', () => {
  it('arranca en el valor inicial, termina exacto y siempre da centavos enteros', () => {
    assert.equal(valorContador(0, 3_194_800, 0, 900), 0);
    assert.equal(valorContador(0, 3_194_800, 900, 900), 3_194_800);
    const medio = valorContador(0, 3_194_800, 300, 900);
    assert.ok(medio > 0 && medio < 3_194_800);
    assert.equal(medio % 100, 0, 'mientras sube muestra pesos enteros');
    assert.equal(valorContador(0, 3_194_850, 900, 900), 3_194_850, 'al final, el valor exacto aunque tenga centavos');
  });
});
