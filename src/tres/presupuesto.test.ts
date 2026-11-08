import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { detectarWebgl, elegirModoAr, leerEquipo, quickLookDisponible } from './capacidades.ts';
import { densidadPara, dentroDelPresupuesto, nivelDe, PRESUPUESTOS, presupuestoPara, segmentosPara, tocaCuadro } from './presupuesto.ts';

describe('presupuesto de rendimiento 3D', () => {
  it('un Moto E20 (2 GB, densidad 2) es gama baja', () => {
    assert.equal(nivelDe({ densidad: 2, memoriaGb: 2, nucleos: 8 }), 'bajo');
  });

  it('ahorro de datos, pocos núcleos o texturas chicas bajan a gama baja', () => {
    assert.equal(nivelDe({ densidad: 3, memoriaGb: 8, ahorroDatos: true }), 'bajo');
    assert.equal(nivelDe({ densidad: 3, nucleos: 4 }), 'bajo');
    assert.equal(nivelDe({ densidad: 3, memoriaGb: 8, texturaMax: 2048 }), 'bajo');
  });

  it('sin dato de memoria (iPhone) es medio; con 6 GB o más, alto', () => {
    assert.equal(nivelDe({ densidad: 3, nucleos: 6 }), 'medio');
    assert.equal(nivelDe({ densidad: 3, memoriaGb: 4, nucleos: 8 }), 'medio');
    assert.equal(nivelDe({ densidad: 3, memoriaGb: 8, nucleos: 8 }), 'alto');
  });

  it('se puede forzar un nivel', () => {
    assert.equal(presupuestoPara({ densidad: 3, memoriaGb: 8, nucleos: 8 }, 'bajo').nivel, 'bajo');
  });

  it('la densidad no pasa el tope del nivel ni el de píxeles', () => {
    const bajo = PRESUPUESTOS.bajo;
    assert.equal(densidadPara(bajo, 2, 360, 300), 1.25);
    // Un lienzo de 720 × 1600 CSS no puede pasar 600 000 píxeles.
    const d = densidadPara(bajo, 2, 720, 1600);
    assert.ok(720 * 1600 * d * d <= bajo.pixelesMax * 1.02);
    assert.equal(densidadPara(PRESUPUESTOS.alto, 1, 360, 300), 1);
    assert.equal(densidadPara(PRESUPUESTOS.alto, 0, 360, 300), 1);
  });

  it('triángulos, segmentos y cuadros', () => {
    assert.ok(dentroDelPresupuesto(PRESUPUESTOS.bajo, 40_000));
    assert.ok(!dentroDelPresupuesto(PRESUPUESTOS.bajo, 40_001));
    assert.equal(segmentosPara(PRESUPUESTOS.bajo, 0.1), 8);
    assert.equal(segmentosPara(PRESUPUESTOS.alto, 0.5), 24);
    assert.ok(!tocaCuadro(PRESUPUESTOS.bajo, 1016, 1000));
    assert.ok(tocaCuadro(PRESUPUESTOS.bajo, 1033, 1000));
    assert.ok(tocaCuadro(PRESUPUESTOS.alto, 1001, 1000));
  });
});

describe('capacidades del teléfono', () => {
  it('AR: WebXR primero, después Quick Look, si no ninguna', () => {
    assert.equal(elegirModoAr({ webxrAr: true, quickLook: true }), 'webxr');
    assert.equal(elegirModoAr({ webxrAr: false, quickLook: true }), 'quicklook');
    assert.equal(elegirModoAr({ webxrAr: false, quickLook: false }), 'ninguno');
  });

  it('Quick Look se detecta por rel="ar" y una falla cuenta como que no hay', () => {
    assert.ok(quickLookDisponible(() => ({ relList: { supports: (t) => t === 'ar' } })));
    assert.ok(!quickLookDisponible(() => ({ relList: { supports: () => false } })));
    assert.ok(!quickLookDisponible(() => null));
    assert.ok(
      !quickLookDisponible(() => {
        throw new Error('x');
      }),
    );
  });

  it('WebGL: prueba WebGL 2, después 1, lee las texturas y suelta el contexto', () => {
    let soltado = false;
    const gl = { MAX_TEXTURE_SIZE: 3379, getParameter: () => 4096, getExtension: () => ({ loseContext: () => (soltado = true) }) };
    const pedidos: string[] = [];
    const r = detectarWebgl(() => ({ getContext: (t: string) => (pedidos.push(t), t === 'webgl' ? gl : null) }));
    assert.deepEqual(r, { disponible: true, texturaMax: 4096 });
    assert.deepEqual(pedidos, ['webgl2', 'webgl']);
    assert.ok(soltado);
  });

  it('sin WebGL o con error: no disponible (se muestra la alternativa)', () => {
    assert.deepEqual(detectarWebgl(() => ({ getContext: () => null })), { disponible: false });
    assert.deepEqual(detectarWebgl(() => null), { disponible: false });
    assert.deepEqual(
      detectarWebgl(() => {
        throw new Error('x');
      }),
      { disponible: false },
    );
  });

  it('leerEquipo: solo lo que el navegador informa', () => {
    assert.deepEqual(leerEquipo({ deviceMemory: 2, hardwareConcurrency: 8, connection: { saveData: true } }, 2, { disponible: true, texturaMax: 4096 }), {
      densidad: 2,
      memoriaGb: 2,
      nucleos: 8,
      ahorroDatos: true,
      texturaMax: 4096,
    });
    assert.deepEqual(leerEquipo(undefined, undefined), { densidad: 1 });
  });
});
