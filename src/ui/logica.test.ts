import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  agruparMensajes,
  aplicarTecla,
  buscarDestinos,
  DESTINOS,
  disposicionAcciones,
  enCaja,
  esEscritorio,
  indiceCercano,
  normalizarCodigo,
  opcionesHora,
  pasoStepper,
  pedidosHacia,
  porcentaje,
  sinCortes,
  textoCifra,
  textoDistancia,
  textoHora,
  textoPaso,
} from './logica.ts';

const destino = (id: string) => {
  const d = DESTINOS.find((x) => x.id === id);
  assert.ok(d, id);
  return d.centro;
};

describe('cifras', () => {
  it('un monto en centavos sale en pesos y sin espacios que se corten', () => {
    const t = textoCifra(4_500_000);
    assert.equal(t.includes(' '), false);
    assert.match(t, /^\$ 45\.000$/);
  });
  it('un texto se muestra tal cual, con espacios no separables', () => {
    assert.equal(textoCifra(undefined, '12 km'), '12 km');
    assert.equal(sinCortes('a b c'), 'a b c');
  });
});

describe('progreso y pasos', () => {
  it('porcentaje acotado y sin NaN', () => {
    assert.equal(porcentaje(8, 10), 80);
    assert.equal(porcentaje(3, 0), 0);
    assert.equal(porcentaje(12, 10), 100);
    assert.equal(porcentaje(-1, 10), 0);
  });
  it('"Paso N de M" nunca se sale del rango', () => {
    assert.equal(textoPaso(2, 5), 'Paso 2 de 5');
    assert.equal(textoPaso(9, 5), 'Paso 5 de 5');
    assert.equal(textoPaso(0, 3), 'Paso 1 de 3');
  });
});

describe('acciones fijas', () => {
  it('dos textos cortos van en fila; uno largo pasa todo a columna', () => {
    assert.equal(disposicionAcciones(['Rechazar', 'Aceptar']), 'fila');
    assert.equal(disposicionAcciones(['Hablar con soporte', 'Reintentar']), 'columna');
    assert.equal(disposicionAcciones(['Uno']), 'columna');
    assert.equal(disposicionAcciones(['A', 'B', 'C']), 'columna');
  });
});

describe('stepper y teclado de precio', () => {
  it('el stepper respeta mínimo y máximo', () => {
    assert.equal(pasoStepper(1, -1, 1, 10), 1);
    assert.equal(pasoStepper(9, 5, 1, 10), 10);
    assert.equal(pasoStepper(3, 1, 1, 10), 4);
  });
  it('el teclado arma pesos, borra y no pasa del máximo de dígitos', () => {
    let v = 0;
    for (const t of ['4', '5', '000'] as const) v = aplicarTecla(v, t);
    assert.equal(v, 45_000);
    assert.equal(aplicarTecla(v, 'borrar'), 4_500);
    assert.equal(aplicarTecla(0, '0'), 0);
    assert.equal(aplicarTecla(0, 'borrar'), 0);
    assert.equal(aplicarTecla(99_999_999, '9'), 99_999_999);
  });
});

describe('rueda de hora', () => {
  it('opciones cada media hora y la más cercana', () => {
    const o = opcionesHora(8 * 60, 10 * 60, 30);
    assert.deepEqual(o.map(textoHora), ['08:00', '08:30', '09:00', '09:30', '10:00']);
    assert.equal(indiceCercano(o, 9 * 60 + 10), 2);
    assert.equal(indiceCercano(o, 23 * 60), 4);
  });
});

describe('código', () => {
  it('solo números y hasta el largo', () => {
    assert.equal(normalizarCodigo('48 29-13x9'), '482913');
  });
});

describe('chat', () => {
  it('agrupa mensajes seguidos del mismo autor', () => {
    const g = agruparMensajes([
      { autor: 'otro', nombre: 'Lucía Ferreyra' },
      { autor: 'otro', nombre: 'Lucía Ferreyra' },
      { autor: 'yo', nombre: 'Vos' },
    ] as const);
    assert.deepEqual(
      g.map((m) => [m.primero, m.ultimo]),
      [
        [true, false],
        [false, true],
        [true, true],
      ],
    );
  });
});

describe('escritorio', () => {
  it('solo con pantalla ancha y mouse', () => {
    assert.equal(esEscritorio(1280, true), true);
    assert.equal(esEscritorio(1280, false), false, 'una tablet grande con el dedo sigue siendo la app');
    assert.equal(esEscritorio(820, true), false);
  });
});

describe('mapa de arreglos', () => {
  it('busca destinos sin tildes ni mayúsculas', () => {
    assert.deepEqual(
      buscarDestinos('batan').map((d) => d.nombre),
      ['Batán'],
    );
    assert.equal(buscarDestinos('').length, DESTINOS.length);
  });
  it('"me voy hasta Batán" muestra los pedidos de ese lado, no los de la costa sur', () => {
    const centro = destino('centro');
    const pedidos = [
      { id: 'camino', zona: { lat: -38.0, lng: -57.63 } }, // entre el centro y Batán
      { id: 'batan', zona: destino('batan') },
      { id: 'mogotes', zona: destino('punta-mogotes') }, // al sur, otra dirección
      { id: 'camet', zona: destino('camet') }, // al norte
    ];
    const r = pedidosHacia(centro, destino('batan'), pedidos);
    assert.deepEqual(
      r.map((p) => p.id),
      ['camino', 'batan'],
    );
  });
  it('distancia legible y sin corte', () => {
    assert.equal(textoDistancia(830), '800 m');
    assert.equal(textoDistancia(40), '100 m');
    assert.equal(textoDistancia(3420), '3,4 km');
  });
  it('un punto dentro de la caja de la ciudad queda entre 0 y 100', () => {
    const { x, y } = enCaja(destino('centro'));
    assert.ok(x > 0 && x <= 100 && y > 0 && y < 100);
    assert.deepEqual(enCaja({ lat: 0, lng: 0 }), { x: 100, y: 0 });
  });
});
