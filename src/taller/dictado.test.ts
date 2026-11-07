import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { PresupuestoSugeridoSchema } from '../contracts/dto.ts';
import { cantidadAntes, presupuestoElectrico } from './dictado.ts';
import { limpiarTexto, medidasReducidas } from './privacidad.ts';

describe('privacidad antes de la IA', () => {
  it('quita emails, teléfonos, documentos y direcciones, y dice qué quitó', () => {
    const r = limpiarTexto('Llamar a cliente@example.test o al 0223 15-555-1234. Vive en calle Falsa 123, DNI 30.111.222. Cambiar el tablero.');
    assert.equal(r.texto, 'Llamar a [email] o al [teléfono]. Vive en [dirección], DNI [documento]. Cambiar el tablero.');
    assert.deepEqual(r.quitados.sort(), ['dirección', 'documento', 'email', 'teléfono']);
  });

  it('no toca cantidades ni calibres', () => {
    const r = limpiarTexto('Agregar 4 tomas de 20 A y un tablero de 12 módulos');
    assert.equal(r.texto, 'Agregar 4 tomas de 20 A y un tablero de 12 módulos');
    assert.deepEqual(r.quitados, []);
  });

  it('achica fotos sin agrandar', () => {
    assert.deepEqual(medidasReducidas(4000, 3000), { ancho: 1280, alto: 960 });
    assert.deepEqual(medidasReducidas(800, 600), { ancho: 800, alto: 600 });
  });
});

describe('presupuesto dictado (electricidad)', () => {
  it('cantidades en números o en palabras', () => {
    assert.equal(cantidadAntes('agregar 4 tomas', /tomas?/), 4);
    assert.equal(cantidadAntes('agregar cuatro tomas en la cocina', /tomas?/), 4);
    assert.equal(cantidadAntes('cambiar el tablero', /tableros?/), 1);
    assert.equal(cantidadAntes('nada que ver', /tableros?/), null);
  });

  it('tablero con circuitos y tomas: tareas y materiales válidos para el contrato, sin precios', () => {
    const r = presupuestoElectrico('Cambio de tablero de 6 circuitos con disyuntor, más 4 tomas en la cocina y dos luminarias');
    assert.ok(PresupuestoSugeridoSchema.safeParse(r).success);
    assert.deepEqual(r.tareas.map((t) => t.descripcion), ['Cambio de tablero con 6 circuitos', 'Agregar 4 tomas', 'Instalar 2 luminarias']);
    assert.ok(r.materiales.some((m) => m.descripcion === 'Interruptor termomagnético 1 polo' && m.cantidad === 6));
    assert.ok(r.materiales.some((m) => m.descripcion === 'Cable unipolar 2,5 mm²' && m.cantidad === 36 && m.unidad === 'metro'));
    assert.equal(r.materiales.filter((m) => m.descripcion.startsWith('Disyuntor')).length, 1);
    assert.ok(!JSON.stringify(r).includes('$'));
  });

  it('sin trabajos reconocibles propone una visita y lo avisa', () => {
    const r = presupuestoElectrico('El cliente dice que algo anda mal');
    assert.deepEqual(r.tareas.map((t) => t.descripcion), ['Visita, diagnóstico y presupuesto']);
    assert.match(r.avisos[0] ?? '', /No reconocimos/);
  });
});
