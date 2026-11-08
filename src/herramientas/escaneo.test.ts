// Escaneo 3D en el teléfono (lote 2.4): silueta, casco visual, medidas y malla con fotos sintéticas.
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { anguloToma, armarModelo, ErrorEscaneo, medirSiluetas, puedeArmar, silueta, umbralOtsu, ANCHO_PROCESO } from './escaneo.ts';
import { fotoPrueba, puntasTarjeta, TERMOTANQUE_PRUEBA, vueltaPrueba } from './escaneoPrueba.ts';
import { escalaTarjeta } from './medir.ts';

// Foto grande (la que se marca) y fotos achicadas para procesar.
const FOTO = { ancho: 720, alto: 540, metrosPorPx: 0.85 / 420 };
const PROCESO = { ancho: ANCHO_PROCESO, alto: 120, metrosPorPx: FOTO.metrosPorPx * (FOTO.ancho / ANCHO_PROCESO) };
const cerca = (real: number, esperado: number, tolerancia: number) => assert.ok(Math.abs(real - esperado) <= tolerancia, `${real} ≉ ${esperado} (± ${tolerancia})`);

describe('escaneo 3D en el teléfono', () => {
  it('Otsu separa dos grupos', () => {
    const h = new Array(100).fill(0);
    h[10] = 50;
    h[80] = 50;
    const t = umbralOtsu(h);
    assert.ok(t >= 10 && t < 80, String(t));
  });

  it('separa el termotanque de la pared y el piso', () => {
    const f = fotoPrueba(TERMOTANQUE_PRUEBA, 3, 30, PROCESO);
    const s = silueta(f);
    assert.ok(s);
    cerca(s.y1 - s.y0 + 1, 0.85 / PROCESO.metrosPorPx, 2);
    cerca(s.x1 - s.x0 + 1, 0.45 / PROCESO.metrosPorPx, 2);
  });

  it('sin objeto en el centro no inventa una silueta', () => {
    const vacia = fotoPrueba({ forma: 'redondo', altoM: 0.001, anchoM: 0.001 }, 0, 30, PROCESO);
    assert.equal(silueta(vacia), null);
  });

  it('la tarjeta de la primera foto da la escala', () => {
    const [a, b] = puntasTarjeta({ ...FOTO, corrimiento: -2 });
    const e = escalaTarjeta(a, b);
    assert.ok(e.ok);
    cerca(e.metrosPorPx, FOTO.metrosPorPx, 1e-9);
  });

  it('arma el termotanque con sus medidas aproximadas (± 3 cm) y lo ve redondo', async () => {
    const fotos = vueltaPrueba(TERMOTANQUE_PRUEBA, 30, PROCESO);
    const avances: number[] = [];
    const m = await armarModelo(fotos, PROCESO.metrosPorPx, { alAvanzar: (p) => avances.push(p.fraccion) });
    assert.equal(m.medidas.forma, 'redondo');
    cerca(m.medidas.altoM, 0.85, 0.03);
    cerca(m.medidas.diametroM ?? 0, 0.45, 0.03);
    assert.equal(m.fotosUsadas, 30);
    assert.equal(avances.at(-1), 1);
    // Liviana para gama baja: menos de un cuarto del presupuesto bajo (40.000 triángulos).
    assert.ok(m.malla.triangulos < 10_000, String(m.malla.triangulos));
    assert.ok(m.malla.posiciones.every((v) => Number.isFinite(v)));
  });

  it('una caja (aire acondicionado) sale con ancho y fondo', async () => {
    const aire = { forma: 'caja' as const, altoM: 0.3, anchoM: 0.8, fondoM: 0.3 };
    const fotos = Array.from({ length: 30 }, (_, i) => fotoPrueba(aire, i, 30, { ...PROCESO, metrosPorPx: 1 / 120 }));
    const sil = fotos.map(silueta);
    assert.ok(sil.every(Boolean));
    const med = medirSiluetas(sil.map((s) => s!), fotos.map((_, i) => anguloToma(i, 30)), 1 / 120);
    assert.equal(med.forma, 'caja');
    cerca(med.anchoM ?? 0, 0.8, 0.05);
    cerca(med.fondoM ?? 0, 0.3, 0.05);
  });

  it('si muchas fotos no se separan del fondo, avisa y no arma nada', async () => {
    const fotos = vueltaPrueba(TERMOTANQUE_PRUEBA, 30, PROCESO).map((f, i) => (i % 3 === 1 ? { ...f, datos: new Uint8ClampedArray(f.datos.length).fill(200) } : f));
    await assert.rejects(armarModelo(fotos, PROCESO.metrosPorPx), (e: unknown) => e instanceof ErrorEscaneo && e.motivo === 'fondo');
    await assert.rejects(armarModelo(fotos, 0), (e: unknown) => e instanceof ErrorEscaneo && e.motivo === 'escala');
  });

  it('corta si tarda demasiado (gama muy baja)', async () => {
    let t = 0;
    const fotos = vueltaPrueba(TERMOTANQUE_PRUEBA, 30, PROCESO);
    await assert.rejects(armarModelo(fotos, PROCESO.metrosPorPx, { limiteMs: 5, reloj: () => (t += 10) }), (e: unknown) => e instanceof ErrorEscaneo && e.motivo === 'tiempo');
  });

  it('decide si el teléfono puede armar el modelo', () => {
    assert.equal(puedeArmar({ lienzo: true, memoriaGb: 2 }), null);
    assert.equal(puedeArmar({ lienzo: true }), null);
    assert.equal(puedeArmar({ lienzo: true, memoriaGb: 0.5 }), 'poca_memoria');
    assert.equal(puedeArmar({ lienzo: false, memoriaGb: 8 }), 'sin_lienzo');
  });
});
