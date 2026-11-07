import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { canalizar, tableroEn, tramoPorTecho, ubicarBocas, type Ambiente } from './canalizacion.ts';

const cocina: Ambiente = { largo: 4, ancho: 3, alto: 2.6, luces: 2, tomas: 4, llaves: 1 };

describe('recorrido de caños y cables', () => {
  it('ubica las bocas dentro del ambiente: luces en el techo, tomas bajas, llaves junto a la puerta', () => {
    const b = ubicarBocas(cocina);
    assert.equal(b.length, 7);
    for (const x of b) {
      assert.ok(x.punto.x >= 0 && x.punto.x <= 4 && x.punto.z >= 0 && x.punto.z <= 3, x.id);
    }
    assert.ok(b.filter((x) => x.tipo === 'luz').every((x) => x.punto.y === 2.6));
    assert.ok(b.filter((x) => x.tipo === 'toma').every((x) => x.punto.y === 0.3));
    assert.deepEqual(b.find((x) => x.tipo === 'llave')?.punto, { x: 0.3, y: 1.1, z: 0 });
  });

  it('un tramo sube al techo, recorre en L y baja', () => {
    const t = tramoPorTecho({ x: 0, y: 1, z: 0 }, { x: 2, y: 0.3, z: 1 }, 2.6);
    assert.equal(t.length, 5);
    assert.deepEqual(t[1], { x: 0, y: 2.6, z: 0 });
    assert.deepEqual(t.at(-1), { x: 2, y: 0.3, z: 1 });
  });

  it('dos circuitos con su sección; cable = caño × 3 conductores + dejas; materiales sin precios', () => {
    const c = canalizar(cocina);
    assert.deepEqual(c.circuitos.map((x) => [x.id, x.seccion, x.bocas.length]), [['iug', 1.5, 3], ['tug', 2.5, 4]]);
    assert.deepEqual(c.circuitos[0]?.recorrido[0], tableroEn(cocina));
    const tug = c.circuitos[1];
    const cable25 = c.materiales.find((m) => m.descripcion.startsWith('Cable unipolar 2,5'));
    assert.equal(cable25?.cantidad, Math.ceil((tug?.metrosCano ?? 0) * 3 + 4 * 0.3 * 3));
    assert.equal(c.materiales.find((m) => m.descripcion.startsWith('Caja octogonal'))?.cantidad, 2);
    assert.equal(c.materiales.find((m) => m.descripcion.startsWith('Caja rectangular'))?.cantidad, 5);
    const tiras = c.materiales.find((m) => m.descripcion.startsWith('Caño'))?.cantidad ?? 0;
    assert.equal(tiras, Math.ceil(c.circuitos.reduce((s, x) => s + x.metrosCano, 0) / 3));
  });

  it('sin bocas no hay circuitos ni materiales', () => {
    const c = canalizar({ ...cocina, luces: 0, tomas: 0, llaves: 0 });
    assert.deepEqual(c.circuitos, []);
    assert.deepEqual(c.materiales, []);
  });
});
