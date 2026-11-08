import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { Tarea } from '../contracts/modo-trabajo.ts';
import {
  estadoContacto,
  loQueSigue,
  minutosDePasado,
  progresoTareas,
  segmentosAvance,
  sumarDias,
  sumarMeses,
  tareaActual,
  textoAvanceInforme,
  textoComparador,
  textoDuracion,
  textoFecha,
  textoReloj,
  textoTareas,
  tiempoTramos,
  tituloTrabajo,
} from './logicaModo.ts';

const tarea = (id: string, orden: number, estado: Tarea['estado']): Tarea => ({
  id,
  orden,
  texto: `Tarea ${orden}`,
  seguridad: orden === 1,
  estado,
  material: null,
  jornadaId: null,
  asignadaA: null,
  necesitaMaterial: false,
  conFoto: false,
  hechaEn: null,
  version: 0,
});

describe('cronómetro del Modo trabajo', () => {
  it('suma los tramos y el abierto corre hasta ahora', () => {
    const t0 = Date.parse('2026-11-17T21:00:00Z');
    const tramos = [
      { desde: '2026-11-17T21:00:00Z', hasta: '2026-11-17T21:10:00Z' },
      { desde: '2026-11-17T21:20:00Z', hasta: null },
    ];
    assert.equal(tiempoTramos(tramos, t0 + 30 * 60_000), 20 * 60_000);
    assert.equal(tiempoTramos([], t0), 0);
  });
  it('muestra minutos y segundos, y horas cuando pasa la hora', () => {
    assert.equal(textoReloj(24 * 60_000 + 18_000), '24:18');
    assert.equal(textoReloj(3_909_000), '1:05:09');
    assert.equal(textoReloj(-5), '00:00');
  });
  it('el lector de pantalla escucha horas y minutos, sin segundos', () => {
    assert.equal(textoDuracion(60_000), '1 minuto');
    assert.equal(textoDuracion(24 * 60_000 + 59_000), '24 minutos');
    assert.equal(textoDuracion(60 * 60_000), '1 hora');
    assert.equal(textoDuracion(125 * 60_000), '2 horas y 5 minutos');
  });
});

describe('tareas', () => {
  const lista = [tarea('c', 3, 'pendiente'), tarea('a', 1, 'hecha'), tarea('b', 2, 'en_curso'), tarea('d', 4, 'pendiente')];
  it('cuenta las hechas y arma el rótulo', () => {
    assert.deepEqual(progresoTareas(lista), { hechas: 1, total: 4 });
    assert.equal(textoTareas(2, 4), 'Tus tareas · 2 de 4');
    assert.equal(textoTareas(0, 0), 'Tus tareas');
  });
  it('la actual es la marcada por el servidor o la primera sin hacer en orden', () => {
    assert.equal(tareaActual(lista, 'c')?.id, 'c');
    assert.equal(tareaActual(lista, null)?.id, 'b');
    assert.equal(tareaActual(lista, 'a')?.id, 'b');
    assert.equal(tareaActual([tarea('a', 1, 'hecha')], null), null);
  });
  it('la barra de avance tiene un tramo por tarea (hasta 12)', () => {
    assert.deepEqual(segmentosAvance(2, 4), [true, true, false, false]);
    assert.equal(segmentosAvance(10, 20).length, 12);
    assert.equal(segmentosAvance(10, 20).filter(Boolean).length, 6);
    assert.deepEqual(segmentosAvance(0, 0), []);
  });
});

describe('informe y fechas', () => {
  it('avance del informe en palabras', () => {
    assert.equal(textoAvanceInforme(4, 5), 'Casi listo · 4 de 5');
    assert.equal(textoAvanceInforme(5, 5), 'Listo · 5 de 5');
  });
  it('suma días y meses sin pasarse de fin de mes', () => {
    assert.equal(sumarDias('2026-11-17', 30), '2026-12-17');
    assert.equal(sumarMeses('2026-11-17', 6), '2027-05-17');
    assert.equal(sumarMeses('2026-08-31', 6), '2027-02-28');
  });
  it('fecha corta con el año solo si es otro', () => {
    assert.equal(textoFecha('2026-12-17', '2026-11-17'), '17/12');
    assert.equal(textoFecha('2027-05-17', '2026-11-17'), '17/05/2027');
  });
});

describe('contactos y agenda', () => {
  it('el estado de un contacto siempre va escrito', () => {
    assert.equal(estadoContacto({ estado: 'disponible', ocupadoHasta: null }).texto, 'Disponible');
    assert.equal(estadoContacto({ estado: 'ocupado', ocupadoHasta: '2026-11-17T22:00:00Z' }).texto, 'Ocupado hasta las 19');
    assert.equal(estadoContacto({ estado: 'en_obra', ocupadoHasta: null }).texto, 'En obra');
    assert.equal(estadoContacto({ estado: null, ocupadoHasta: null }).tono, 'gris');
  });
  it('lo que sigue: otros trabajos futuros, sin ofertas, en orden', () => {
    const base = { pedidoId: null, fin: null, superpuesto: false, titulo: 'x' } as const;
    const ahora = Date.parse('2026-11-17T22:00:00Z');
    const items = [
      { ...base, id: '1', trabajoId: 'yo', inicio: '2026-11-18T10:00:00Z', estado: 'confirmado' as const },
      { ...base, id: '2', trabajoId: 'b', inicio: '2026-11-18T14:00:00Z', estado: 'confirmado' as const },
      { ...base, id: '3', trabajoId: 'c', inicio: '2026-11-18T11:00:00Z', estado: 'cambio_pendiente' as const },
      { ...base, id: '4', trabajoId: null, inicio: '2026-11-18T09:00:00Z', estado: 'oferta_pendiente' as const },
      { ...base, id: '5', trabajoId: 'd', inicio: '2026-11-17T12:00:00Z', estado: 'confirmado' as const },
    ];
    assert.deepEqual(
      loQueSigue(items, 'yo', ahora).map((i) => i.id),
      ['3', '2'],
    );
  });
  it('minutos pasados del horario', () => {
    const fin = '2026-11-17T23:00:00Z';
    assert.equal(minutosDePasado(fin, Date.parse(fin) + 20 * 60_000), 20);
    assert.equal(minutosDePasado(fin, Date.parse(fin) - 60_000), 0);
    assert.equal(minutosDePasado(null, 0), 0);
  });
});

describe('comparador', () => {
  it('dice cuánto se ve de cada foto', () => {
    assert.equal(textoComparador(30), 'Se ve 30 % del antes y 70 % del después');
  });
});

describe('textos del trabajo', () => {
  it('título corto: la primera frase, cortada en una palabra', () => {
    assert.equal(tituloTrabajo('Cambio del cartucho. Incluye materiales.'), 'Cambio del cartucho');
    assert.equal(tituloTrabajo('Cambio del cartucho de la canilla monocomando de la cocina. Incluye materiales.'), 'Cambio del cartucho de la canilla…');
  });
});
