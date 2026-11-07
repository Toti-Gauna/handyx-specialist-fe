import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  ahorroCambio,
  caidaDeTension,
  calibreParaCorriente,
  consumoMensual,
  corrienteAdmisible,
  corrienteDesdePotencia,
  elegirConductor,
  gradoPorSuperficie,
  iluminacion,
  leyDeOhm,
  planificarVivienda,
} from './electricidad.ts';

describe('sección de conductores', () => {
  it('corriente desde la potencia: 2200 W a 220 V con cos φ 1 son 10 A; trifásico divide por √3', () => {
    assert.equal(corrienteDesdePotencia(2200, 'monofasico', 1), 10);
    assert.ok(Math.abs(corrienteDesdePotencia(6582, 'trifasico', 1) - 10) < 0.01);
    assert.equal(corrienteDesdePotencia(0, 'monofasico'), 0);
  });

  it('caída de tensión monofásica: 2·L·I·ρ·cosφ / S', () => {
    // 2 × 30 m × 10 A × 0,0225 × 1 / 2,5 mm² = 5,4 V → 2,45 %
    assert.deepEqual(caidaDeTension({ corriente: 10, longitud: 30, seccion: 2.5, sistema: 'monofasico', cosPhi: 1 }), { voltios: 5.4, porcentaje: 2.45 });
  });

  it('factores de temperatura y agrupamiento reducen la admisible', () => {
    assert.equal(corrienteAdmisible(2.5, 'monofasico'), 23);
    assert.equal(corrienteAdmisible(2.5, 'monofasico', 40), 20);
    assert.equal(corrienteAdmisible(2.5, 'monofasico', 30, 3), 16.1);
  });

  it('un circuito de tomas corto: manda el mínimo de 2,5 mm² y la protección de 16 A', () => {
    const r = elegirConductor({ corriente: 12, longitud: 10, sistema: 'monofasico', tipo: 'tomas' });
    assert.equal(r.seccion, 2.5);
    assert.equal(r.calibre, 16);
    assert.equal(r.manda, 'minimo');
    assert.ok(r.caida!.porcentaje <= 5);
  });

  it('un recorrido largo: manda la caída de tensión y sube la sección', () => {
    const r = elegirConductor({ corriente: 16, longitud: 60, sistema: 'monofasico', tipo: 'especial' });
    assert.equal(r.manda, 'caida');
    assert.ok(r.seccion! > 2.5);
    assert.ok(r.caida!.porcentaje <= 5);
  });

  it('mucha corriente: manda la corriente admisible y la protección no supera al cable', () => {
    const r = elegirConductor({ corriente: 38, longitud: 5, sistema: 'monofasico', tipo: 'especial' });
    assert.equal(r.calibre, 40);
    assert.ok(r.admisible! >= r.calibre!);
    assert.equal(r.manda, 'corriente');
  });

  it('avisa cuando un circuito de iluminación pide más de 16 A y cuando nada alcanza', () => {
    assert.match(elegirConductor({ corriente: 18, longitud: 10, sistema: 'monofasico', tipo: 'iluminacion' }).avisos.join(' '), /no debería superar 16 A/);
    const nada = elegirConductor({ corriente: 90, longitud: 200, sistema: 'monofasico', tipo: 'especial' });
    assert.equal(nada.seccion, null);
    assert.match(nada.avisos.join(' '), /Ninguna sección/);
  });

  it('calibres comerciales', () => {
    assert.equal(calibreParaCorriente(9.1), 10);
    assert.equal(calibreParaCorriente(16), 16);
    assert.equal(calibreParaCorriente(120), null);
  });
});

describe('planificador de vivienda', () => {
  it('grado de electrificación por superficie', () => {
    assert.equal(gradoPorSuperficie(45), 'minima');
    assert.equal(gradoPorSuperficie(60), 'minima');
    assert.equal(gradoPorSuperficie(61), 'media');
    assert.equal(gradoPorSuperficie(150), 'elevada');
    assert.equal(gradoPorSuperficie(201), 'superior');
  });

  it('suma bocas por ambiente y aplica el grado', () => {
    const p = planificarVivienda([
      { tipo: 'estar', m2: 24 },
      { tipo: 'dormitorio', m2: 12 },
      { tipo: 'dormitorio', m2: 10 },
      { tipo: 'cocina', m2: 9 },
      { tipo: 'bano', m2: 4 },
      { tipo: 'pasillo', m2: 6 },
    ]);
    assert.equal(p.superficie, 65);
    assert.equal(p.grado, 'media');
    assert.deepEqual(p.circuitos, { iug: 1, tug: 1, libres: 1, total: 3 });
    // estar 24 m²: 2 IUG (cada 18) y 4 TUG (cada 6)
    assert.deepEqual(p.porAmbiente[0], { tipo: 'estar', m2: 24, iug: 2, tug: 4 });
    assert.equal(p.bocas.total, p.bocas.iug + p.bocas.tug);
  });
});

describe('iluminación, consumo y ohm', () => {
  it('lúmenes y luminarias de una cocina de 9 m² con paneles de 1200 lm', () => {
    const r = iluminacion({ uso: 'cocina', m2: 9, lumenesPorLuminaria: 1200 });
    assert.equal(r.lumenes, 5625);
    assert.equal(r.luminarias, 5);
    assert.ok(r.luxLogrados >= 300);
  });

  it('consumo del mes con la tarifa cargada', () => {
    const r = consumoMensual([{ nombre: 'Heladera', watts: 150, cantidad: 1, horasPorDia: 24 }], 15_000);
    assert.equal(r.kwh, 108);
    assert.equal(r.centavos, 1_620_000);
    assert.deepEqual(ahorroCambio({ wattsAntes: 60, wattsDespues: 9, cantidad: 10, horasPorDia: 5, tarifaCentavosPorKwh: 15_000 }), { kwh: 76.5, centavos: 1_147_500 });
  });

  it('ley de Ohm con dos magnitudes cualesquiera', () => {
    assert.deepEqual(leyDeOhm({ tension: 220, corriente: 10 }), { tension: 220, corriente: 10, resistencia: 22, potencia: 2200 });
    assert.deepEqual(leyDeOhm({ potencia: 2200, resistencia: 22 }), { tension: 220, corriente: 10, resistencia: 22, potencia: 2200 });
    assert.equal(leyDeOhm({ tension: 220 }), null);
    assert.equal(leyDeOhm({ tension: 220, corriente: 0 }), null);
  });
});
