import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { avanceAlta, cuitValido, dniValido, estadoDeDocumentos, normalizarTelefono, numeroPaso, pasoAMostrar, pasoAnterior, pasoSiguiente, registroEditable } from './registro.ts';

describe('registro por pasos', () => {
  it('numera los diez pasos en orden', () => {
    assert.equal(numeroPaso('datos'), 1);
    assert.equal(numeroPaso('revision'), 10);
    assert.equal(pasoAnterior('datos'), null);
    assert.equal(pasoSiguiente('antecedentes'), 'revision');
    assert.equal(pasoSiguiente('revision'), null);
  });
  it('retoma en el paso del servidor y no deja saltear pasos', () => {
    assert.equal(pasoAMostrar({ pasoActual: 'zonas' }, null), 'zonas');
    assert.equal(pasoAMostrar({ pasoActual: 'zonas' }, 'domicilio'), 'domicilio');
    assert.equal(pasoAMostrar({ pasoActual: 'zonas' }, 'antecedentes'), 'zonas');
    assert.equal(pasoAMostrar({ pasoActual: 'zonas' }, 'cualquiera'), 'zonas');
  });
  it('solo se edita en borrador o con una corrección pedida', () => {
    assert.ok(registroEditable('borrador'));
    assert.ok(registroEditable('requiere_correccion'));
    assert.ok(!registroEditable('enviada'));
    assert.ok(!registroEditable('habilitada'));
  });
});

describe('datos de la cuenta', () => {
  it('normaliza el celular como lo escribe la gente', () => {
    assert.equal(normalizarTelefono('223 555-4521'), '+5492235554521');
    assert.equal(normalizarTelefono('0223 15 555-4521'), '+5492235554521');
    assert.equal(normalizarTelefono('+54 9 223 555 4521'), '+5492235554521');
    assert.equal(normalizarTelefono('11 5555 4521'), '+5491155554521');
    assert.equal(normalizarTelefono('555-4521'), null);
  });
  it('valida el dígito verificador del CUIT o CUIL', () => {
    assert.equal(cuitValido('20-12345678-6'), '20123456786');
    assert.equal(cuitValido('20-12345678-9'), null);
    assert.equal(cuitValido('2012345'), null);
  });
  it('acepta DNI de 7 u 8 números', () => {
    assert.equal(dniValido('30.111.222'), '30111222');
    assert.equal(dniValido('123'), null);
  });
});

describe('resumen del alta', () => {
  it('cargado no es verificado: listo solo con todo verificado', () => {
    assert.equal(estadoDeDocumentos(['verificado', 'verificado']), 'listo');
    assert.equal(estadoDeDocumentos(['verificado', 'cargado']), 'revision');
    assert.equal(estadoDeDocumentos(['verificado', 'faltante']), 'falta');
    assert.equal(estadoDeDocumentos(['rechazado', 'faltante']), 'corregir');
  });
  it('los certificados opcionales no cuentan para el avance', () => {
    const g = (id: 'datos' | 'certificados', estado: 'listo' | 'opcional') => ({ id, icono: 'cuenta' as const, titulo: '', detalle: '', estado, paso: 'datos' as const });
    assert.deepEqual(avanceAlta([g('datos', 'listo'), g('certificados', 'opcional')]), { listos: 1, total: 1 });
  });
});
