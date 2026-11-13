import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { horaBA, pasosTrabajo, textoUrgencia, textoZona, tituloCorto, tituloDe } from './vista.ts';

describe('vista del núcleo', () => {
  it('títulos cortos sin perder el sentido', () => {
    assert.equal(tituloDe('Saltó la térmica y no vuelve a subir.'), 'Saltó la térmica y no vuelve a subir');
    assert.equal(tituloDe('Pérdida debajo de la bacha: sale agua'), 'Pérdida debajo de la bacha');
    assert.equal(tituloCorto('Pierde la canilla'), 'La canilla');
    assert.equal(tituloCorto('Baño completo'), 'Baño completo');
    assert.equal(tituloCorto('Retiro en ferretería'), 'Ferretería');
  });
  it('zona aproximada siempre, con la distancia si se midió', () => {
    assert.equal(textoZona({ zona: 'Centro', distanciaM: null }), 'Centro · zona aproximada');
    assert.equal(textoZona({ zona: 'Centro', distanciaM: 2100 }).replace(/\u00a0/g, ' '), 'Centro · zona aproximada · a 2,1 km');
  });
  it('hora de Buenos Aires y urgencia', () => {
    assert.equal(horaBA('2026-11-17T21:00:00.000Z'), '18:00');
    const ahora = new Date('2026-11-17T15:00:00.000Z');
    assert.equal(textoUrgencia({ tipo: 'urgente', ventanaHasta: '2026-11-17T15:18:42.000Z' }, ahora), 'Urgente · quedan 18:42');
    assert.equal(textoUrgencia({ tipo: 'programado', ventanaHasta: null }, ahora), null);
  });
  it('los cuatro pasos del trabajo siguen al estado', () => {
    assert.deepEqual(pasosTrabajo('agendado'), ['hecho', 'actual', 'pendiente', 'pendiente']);
    assert.deepEqual(pasosTrabajo('en_curso'), ['hecho', 'hecho', 'hecho', 'actual']);
    assert.deepEqual(pasosTrabajo('finalizado'), ['hecho', 'hecho', 'hecho', 'hecho']);
  });
});
