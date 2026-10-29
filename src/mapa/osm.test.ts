import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { calcularRuta, prepararGrafo } from './grafo.ts';
import { armarBarrios, armarCapas, armarGrafo, perimetro, puntoDePerimetro, type Bbox, type ElementoOsm, type WayOsm } from './osm.ts';

// Ciudad sintética de prueba (no es Mar del Plata): una cuadrícula de 3 × 3 esquinas a ~100 m, una mano única,
// una entrada privada y una costa recta al este. Ids y nombres inventados.
const LAT0 = -10;
const LNG0 = -20;
const PASO = 0.001;
const esquina = (f: number, c: number) => ({ id: 100 + f * 10 + c, lat: LAT0 + f * PASO, lon: LNG0 + c * PASO });
const calle = (id: number, puntos: Array<[number, number]>, tags: Record<string, string>): WayOsm => ({
  type: 'way',
  id,
  nodes: puntos.map(([f, c]) => esquina(f, c).id),
  geometry: puntos.map(([f, c]) => ({ lat: esquina(f, c).lat, lon: esquina(f, c).lon })),
  tags,
});

const ELEMENTOS: ElementoOsm[] = [
  calle(1, [[0, 0], [0, 1], [0, 2]], { highway: 'residential' }),
  calle(2, [[1, 0], [1, 1], [1, 2]], { highway: 'primary' }),
  // Fila de arriba: mano única de este a oeste
  calle(3, [[2, 2], [2, 1], [2, 0]], { highway: 'residential', oneway: 'yes' }),
  calle(4, [[0, 0], [1, 0], [2, 0]], { highway: 'residential' }),
  calle(5, [[0, 2], [1, 2], [2, 2]], { highway: 'residential' }),
  calle(6, [[1, 1], [2, 1]], { highway: 'service', access: 'private' }),
  calle(7, [[0, 1], [1, 1]], { highway: 'footway' }),
  {
    type: 'way',
    id: 8,
    nodes: [900, 901, 902],
    geometry: [
      { lat: LAT0 - 0.01, lon: LNG0 + 0.004 },
      { lat: LAT0 + 0.001, lon: LNG0 + 0.004 },
      { lat: LAT0 + 0.01, lon: LNG0 + 0.004 },
    ],
    tags: { natural: 'coastline' },
  },
  { type: 'node', id: 950, lat: LAT0 + 0.001, lon: LNG0 + 0.001, tags: { place: 'neighbourhood', name: 'Barrio Sintético' } },
  { type: 'node', id: 951, lat: LAT0 + 0.0015, lon: LNG0 + 0.0015, tags: { place: 'suburb', name: 'Barrio Sintético' } },
  { type: 'node', id: 952, lat: LAT0, lon: LNG0, tags: { place: 'city', name: 'Ciudad de prueba' } },
];
const RECUADRO: Bbox = [LNG0 - 0.002, LAT0 - 0.002, LNG0 + 0.006, LAT0 + 0.004];
const punto = (f: number, c: number) => ({ lat: esquina(f, c).lat, lng: esquina(f, c).lon });

describe('datos de OpenStreetMap → grafo y capas (lote 4.3)', () => {
  const g = prepararGrafo(armarGrafo(ELEMENTOS, RECUADRO, 'prueba'));

  it('el grafo deja afuera veredas y entradas privadas', () => {
    assert.ok(g);
    const d = armarGrafo(ELEMENTOS, RECUADRO, 'prueba');
    assert.equal(d.coords.length / 2, 9);
    // 4 calles de doble mano con 2 tramos (16 aristas) + mano única de 2 tramos (2)
    assert.equal(d.aristas.length / 4, 18);
  });

  it('respeta la mano única', () => {
    assert.ok(g);
    // De la esquina (2,0) a la (2,2): la fila de arriba va en contra, hay que bajar y volver a subir
    const r = calcularRuta(g, punto(2, 0), punto(2, 2));
    assert.ok(r);
    assert.ok(r.distanciaM > 300, `${r.distanciaM} m`);
    // A favor de la mano, directo por la fila de arriba (~2 cuadras)
    const directo = calcularRuta(g, punto(2, 2), punto(2, 0));
    assert.ok(directo);
    assert.ok(directo.distanciaM < 250, `${directo.distanciaM} m`);
    assert.equal(directo.linea.length, 3);
  });

  it('prefiere la avenida por tiempo y no engancha puntos lejos de la red', () => {
    assert.ok(g);
    const r = calcularRuta(g, punto(1, 0), punto(1, 2));
    assert.ok(r);
    assert.equal(r.linea.length, 3);
    assert.ok(r.duracionS > 0);
    assert.equal(calcularRuta(g, punto(1, 0), { lat: LAT0 + 0.5, lng: LNG0 }), null);
  });

  it('un grafo vacío no calcula nada', () => {
    assert.equal(prepararGrafo({ version: 1, fuente: null, coords: [], aristas: [] }), null);
  });

  it('capas: calles con su clase y el mar cerrado del lado del agua', () => {
    const c = armarCapas(ELEMENTOS, RECUADRO);
    assert.equal(c.calles.length, 6, 'las 5 calles + la entrada privada se dibujan; la vereda no es calle');
    assert.equal(c.calles.find((f) => f.geometry.coordinates.length === 3 && f.properties.clase === 'avenida') !== undefined, true);
    assert.equal(c.mar.length, 1);
    const anillo = c.mar[0]!.geometry.coordinates[0]!;
    // La costa va hacia el norte: el agua (a la derecha) es el este, así que el polígono pasa por las esquinas del este.
    const este = RECUADRO[2];
    assert.ok(anillo.some(([lng, lat]) => lng === este && lat === RECUADRO[3]));
    assert.ok(anillo.some(([lng, lat]) => lng === este && lat === RECUADRO[1]));
    assert.ok(!anillo.some(([lng]) => lng === RECUADRO[0]), 'no toca el oeste (la tierra)');
  });

  it('perímetro en sentido horario desde el noroeste', () => {
    assert.equal(perimetro(RECUADRO, [RECUADRO[0], RECUADRO[3]]), 0);
    assert.equal(perimetro(RECUADRO, [RECUADRO[2], RECUADRO[3]]), 1);
    assert.equal(perimetro(RECUADRO, [RECUADRO[2], RECUADRO[1]]), 2);
    assert.deepEqual(puntoDePerimetro(RECUADRO, 3), [RECUADRO[0], RECUADRO[1]]);
  });

  it('barrios con nombre, sin repetir y sin la ciudad', () => {
    const b = armarBarrios(ELEMENTOS, RECUADRO);
    assert.deepEqual(
      b.map((x) => [x.id, x.nombre]),
      [['barrio-sintetico', 'Barrio Sintético']],
    );
  });
});
