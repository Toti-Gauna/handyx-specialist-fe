import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { monto } from '../contracts/dinero.ts';
import { agruparRenglones, entendidas, interpretarLista, leerPrecio, limpiarNombre, nombrePropio, unidadDe } from './lectura.ts';
import { antiguedad, cantidadConUnidad, margenBps, origenPrecio, resultadoLectura, resumenOpciones, textoMandar, variacionHistorial } from './vista.ts';

describe('lectura de la lista en el teléfono', () => {
  it('junta los bloques de un mismo renglón y los ordena', () => {
    const r = agruparRenglones([
      { texto: '$ 9.800', x: 200, y: 41, alto: 20 },
      { texto: 'Cartucho 35 mm', x: 10, y: 40, alto: 20 },
      { texto: 'CORRALÓN', x: 10, y: 0, alto: 24 },
      { texto: 'Flexible 40 cm', x: 10, y: 80, alto: 20 },
      { texto: '1.600', x: 210, y: 78, alto: 20 },
    ]);
    assert.deepEqual(r, ['CORRALÓN', 'Cartucho 35 mm $ 9.800', 'Flexible 40 cm 1.600']);
  });

  it('lee precios claros y marca los dudosos', () => {
    assert.equal(leerPrecio('$ 10.600'), 1_060_000);
    assert.equal(leerPrecio('1600'), 160_000);
    assert.equal(leerPrecio('$ 2.300,50'), 230_050);
    assert.equal(leerPrecio('$ 1?0'), null);
    assert.equal(leerPrecio('1O.6OO'), null);
    assert.equal(leerPrecio('$ 0'), null);
  });

  it('nombre limpio y unidad por las palabras', () => {
    assert.equal(limpiarNombre('Flexible 40 cm ........ '), 'Flexible 40 cm');
    assert.equal(limpiarNombre('• Teflón 12 mm --'), 'Teflón 12 mm');
    assert.equal(unidadDe('Cable 2,5 mm x metro'), 'metro');
    assert.equal(unidadDe('Pastina (kg)'), 'kg');
    assert.equal(unidadDe('Cinta aisladora rollo'), 'rollo');
    assert.equal(unidadDe('Codo 20 mm'), 'unidad');
  });

  it('de renglones a filas: el corralón arriba, «Revisá» lo que no se entiende', () => {
    const l = interpretarLista(['CORRALÓN SIMULACIÓN', 'Lista de precios 17/11/2026', 'Cartucho cerámico 35 mm ...... $ 10.600', 'Codo 20 mm $ 1?0', 'Total de la página', 'Teflón 12 mm 2.300']);
    assert.equal(l.proveedor, 'CORRALÓN SIMULACIÓN');
    assert.deepEqual(
      l.filas.map((f) => [f.nombre, f.centavos, f.precioLeido]),
      [
        ['Cartucho cerámico 35 mm', 1_060_000, '$ 10.600'],
        ['Codo 20 mm', null, '$ 1?0'],
        ['Teflón 12 mm', 230_000, '$ 2.300'],
      ],
    );
    assert.equal(entendidas(l), 2);
    assert.equal(nombrePropio('CORRALÓN SIMULACIÓN'), 'Corralón Simulación');
    assert.equal(nombrePropio('Corralón del Puerto'), 'Corralón del Puerto');
    assert.deepEqual(interpretarLista(['sin nada que leer']).filas, []);
  });
});

describe('textos de presupuestos y precios', () => {
  it('de dónde sale el precio y cuánto tiene', () => {
    assert.equal(origenPrecio({ modoPrecio: 'actualiza', precioDel: '2026-11-05' }, '2026-11-17'), 'tu lista del 05/11');
    assert.equal(origenPrecio({ modoPrecio: 'fijo', precioDel: '2026-11-17' }, '2026-11-17'), 'Fijado hoy');
    assert.equal(origenPrecio({ modoPrecio: 'fijo', precioDel: '2026-11-05' }, '2026-11-17'), 'Fijado el 05/11');
    assert.equal(antiguedad('2026-10-02', '2026-11-08', true), 'Hace 37 días');
    assert.equal(antiguedad('2026-11-05', '2026-11-08', false), '05/11');
    assert.equal(cantidadConUnidad(2.5, 'metro'), '2,5 metros');
    assert.equal(cantidadConUnidad(1, 'unidad'), '1 unidad');
  });

  it('lo leído y el historial se dicen con palabras', () => {
    assert.equal(resultadoLectura('sube', 816).texto, 'Sube 8 %');
    assert.equal(resultadoLectura('revisar', null).texto, 'Revisá');
    const h = [
      { fecha: '2026-08-04', costo: monto(840_000) },
      { fecha: '2026-11-05', costo: monto(980_000) },
    ];
    assert.equal(variacionHistorial(h)?.texto, '+17 % en 4 meses');
    assert.equal(variacionHistorial(h.slice(0, 1)), null);
    assert.equal(margenBps(monto(1000), monto(1200)), 2000);
  });

  it('opciones y botón con el nombre del cliente', () => {
    assert.deepEqual(resumenOpciones({ cobrarAlCliente: true, registrarGasto: true, modoPrecio: 'actualiza' }, 'Lucía').slice(0, 2), ['Se lo cobrás a Lucía en el presupuesto', 'Va a tus gastos cuando lo compres']);
    assert.equal(resumenOpciones({ cobrarAlCliente: true, registrarGasto: true, modoPrecio: 'actualiza' }, 'Lucía', true)[1], 'Van a tus gastos con un solo ticket');
    assert.equal(textoMandar('Lucía Ferreyra'), 'Mandar a Lucía por el chat');
    assert.equal(textoMandar(null), 'Mandar por el chat');
  });
});
