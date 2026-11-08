import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  arrastreCinta,
  atajosPrecio,
  franjaNoDisponible,
  horaCorta,
  instanteBA,
  marcasCinta,
  minutosBA,
  moverCinta,
  moverEnLista,
  nombreDia,
  posicionSugerido,
  redondearMil,
  textoDiferencia,
  textoFranja,
  textoHorario,
  textoMinutos,
  textoSalida,
} from './logicaNucleo.ts';

const nb = (t: string) => t.replace(/ /g, ' ');

describe('cinta de precio', () => {
  it('se mueve de a $ 500 y nunca baja de cero', () => {
    assert.equal(moverCinta(4_700_000, 1), 4_750_000);
    assert.equal(moverCinta(4_712_300, 0), 4_700_000);
    assert.equal(moverCinta(50_000, -5), 0);
    // Arrastrar a la izquierda sube el precio: 28 px = 2 marcas.
    assert.equal(arrastreCinta(4_700_000, -28), 4_800_000);
    assert.equal(arrastreCinta(4_700_000, 14), 4_650_000);
  });
  it('marcas con número cada $ 2.000 y la del precio en la aguja', () => {
    const m = marcasCinta(4_700_000, 4);
    assert.equal(m.find((x) => x.x === 0)?.centavos, 4_700_000);
    assert.deepEqual(m.filter((x) => x.rotulo).map((x) => x.rotulo), ['46', '48']);
    assert.ok(m.filter((x) => x.larga).every((x) => x.centavos % 100_000 === 0));
    // Un precio que no cae en una marca corre la cinta.
    assert.ok(marcasCinta(4_725_000, 1).every((x) => x.x !== 0));
  });
  it('el cartel del sugerido sigue a la cinta y desaparece lejos', () => {
    assert.equal(posicionSugerido(4_700_000, 4_500_000), -56);
    assert.equal(posicionSugerido(9_000_000, 4_500_000), null);
    assert.equal(posicionSugerido(4_700_000, null), null);
  });
  it('atajos y diferencia con lo sugerido', () => {
    assert.deepEqual(atajosPrecio(4_500_000, 4_700_000).map((a) => [nb(a.texto), a.centavos]), [
      ['Sugerido', 4_500_000],
      ['+ $ 2.000', 4_700_000],
      ['+ $ 5.000', 5_000_000],
    ]);
    assert.equal(atajosPrecio(null, 1_000_000).length, 2);
    assert.equal(nb(textoDiferencia(4_850_000, 4_500_000) ?? ''), '$ 3.500 más que lo sugerido');
    assert.equal(nb(textoDiferencia(4_400_000, 4_500_000) ?? ''), '$ 1.000 menos que lo sugerido');
    assert.equal(textoDiferencia(4_500_000, 4_500_000), 'Igual a lo sugerido');
    assert.equal(redondearMil(4_850_000), 4_900_000);
  });
});

describe('horarios en Buenos Aires', () => {
  it('ida y vuelta entre día y minutos', () => {
    const i = instanteBA('2026-11-17', 18 * 60);
    assert.equal(i, '2026-11-17T21:00:00.000Z');
    assert.equal(minutosBA(i), 18 * 60);
    assert.equal(minutosBA('2026-11-18T02:30:00.000Z'), 23 * 60 + 30);
  });
  it('textos de franjas y días', () => {
    assert.equal(horaCorta(18 * 60), '18');
    assert.equal(horaCorta(6 * 60 + 30), '6:30');
    assert.equal(textoFranja(18 * 60, 20 * 60), 'de 18 a 20 h');
    assert.equal(textoFranja(6 * 60 + 30, null), 'a las 6:30');
    assert.equal(nombreDia('2026-11-17', '2026-11-17'), 'hoy');
    assert.equal(nombreDia('2026-11-18', '2026-11-17'), 'mañana');
    assert.equal(nombreDia('2026-11-19', '2026-11-17'), 'jueves 19');
    assert.equal(textoHorario({ inicio: '2026-11-17T21:00:00.000Z', fin: '2026-11-17T23:00:00.000Z' }, '2026-11-17'), 'Hoy, de 18 a 20 h');
  });
  it('una franja pasada u ocupada no se puede elegir', () => {
    const f = { desde: 9 * 60, hasta: 13 * 60 };
    assert.equal(franjaNoDisponible(f, '2026-11-17', '2026-11-17', 12 * 60, []), 'pasada');
    assert.equal(franjaNoDisponible(f, '2026-11-18', '2026-11-17', 12 * 60, [{ desde: 12 * 60, hasta: 14 * 60 }]), 'ocupada');
    assert.equal(franjaNoDisponible(f, '2026-11-18', '2026-11-17', 12 * 60, [{ desde: 13 * 60, hasta: 14 * 60 }]), null);
  });
});

describe('tu día', () => {
  it('minutos orientativos y hora de salida', () => {
    assert.equal(textoMinutos(720), '12 min');
    assert.equal(textoMinutos(3900), '1 h 05 min');
    const ahora = new Date('2026-11-17T20:00:00Z');
    assert.equal(textoSalida('2026-11-17T20:10:00Z', ahora), 'Sale en 10 min');
    assert.equal(textoSalida('2026-11-17T19:00:00Z', ahora), 'Salí ahora');
    assert.equal(textoSalida(null, ahora), null);
  });
  it('reordenar con botones respeta las paradas fijas', () => {
    assert.deepEqual(moverEnLista(['a', 'b', 'c'], 1, 1), ['a', 'c', 'b']);
    assert.deepEqual(moverEnLista(['a', 'b', 'c'], 1, -1, (x) => x === 'a'), ['a', 'b', 'c']);
    assert.deepEqual(moverEnLista(['a', 'b'], 1, 1), ['a', 'b']);
  });
});
