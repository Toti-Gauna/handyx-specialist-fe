import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { cantidadCategoria, chipsHerramienta, detalleHerramienta, diasHasta, mesAnio, preguntaBaja, textoCada, textoCompras, textoDias, tonoCategoria } from './vista.ts';

const base = { ubicacion: 'camioneta' as const, prestamo: null, alertas: [], estado: 'funciona' as const, cantidad: null, unidad: null };

describe('vista de tu equipamiento', () => {
  it('chips: lugar y lo que le pasa, o «Funciona bien»', () => {
    assert.deepEqual(chipsHerramienta(base).map((c) => c.texto), ['En la camioneta', 'Funciona bien']);
    const prestada = chipsHerramienta({ ...base, prestamo: { profesionalId: null, aNombre: 'Sofía Ruiz', desde: '2026-11-14', vuelveEl: '2026-11-20' }, alertas: [{ tipo: 'devolucion', texto: 'Vuelve el 20/11', fecha: '2026-11-20' }] });
    assert.deepEqual(prestada.map((c) => c.texto), ['Prestada a Sofía', 'Vuelve el 20/11']);
    const pocos = chipsHerramienta({ ...base, cantidad: 12, unidad: 'unidad', alertas: [{ tipo: 'stock_bajo', texto: 'Quedan pocos', fecha: null }] });
    assert.deepEqual(pocos.map((c) => [c.texto, c.icono]), [['En la camioneta', 'camion'], ['Quedan 12', 'alerta']]);
  });
  it('días, fechas y cada cuánto', () => {
    const hoy = new Date('2026-11-17T15:00:00Z');
    assert.equal(diasHasta('2026-12-12', hoy), 25);
    assert.equal(textoDias(25), 'En 25 días');
    assert.equal(textoDias(-3), 'Hace 3 días');
    assert.equal(textoCada(180), 'Cada 6 meses');
    assert.equal(textoCada(365), 'Cada año');
    assert.equal(mesAnio('2025-03-10'), 'Marzo de 2025');
  });
  it('textos de categoría, detalle y baja', () => {
    assert.deepEqual(cantidadCategoria('medicion', 1), { numero: '1', unidad: 'instrumento' });
    assert.equal(detalleHerramienta({ marcaModelo: null, cantidad: 12, unidad: 'unidad', minimo: 50, compradaEn: null }), 'Hay 12 · mínimo 50');
    assert.equal(preguntaBaja('Amoladora 115 mm'), '¿Qué pasó con la amoladora?');
    assert.equal(tonoCategoria({ categoria: 'consumibles', cantidad: 4, alerta: '3 quedan pocos' }, 'electricas'), 'alerta');
    assert.equal(textoCompras(['Cartuchos de silicona', 'Teflón', 'Tarugos 8 mm']), 'Lista de compras: cartuchos, teflón y tarugos');
    assert.equal(tonoCategoria({ categoria: 'electricas', cantidad: 8, alerta: '1 para mantener' }, 'electricas'), 'azul');
  });
});
