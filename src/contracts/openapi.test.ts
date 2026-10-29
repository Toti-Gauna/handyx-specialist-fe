// docs/api/openapi.yaml se escribe a mano: esta prueba evita que sus enums se desalineen del contrato.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { it } from 'node:test';
import { CODIGOS_ERROR, TIPOS_PEDIDO } from './dto.ts';
import {
  ESTADOS_ALTA,
  ESTADOS_DOCUMENTO,
  ESTADOS_PAGO,
  ESTADOS_PEDIDO,
  ESTADOS_PRESENCIAL,
  ESTADOS_PROPUESTA,
  ESTADOS_SOPORTE,
  ESTADOS_TRABAJO,
} from './maquinas.ts';
import { RUBROS } from './rubros.ts';

const yaml = readFileSync(new URL('../../docs/api/openapi.yaml', import.meta.url), 'utf8').replace(/\s+/g, ' ');

it('los enums del OpenAPI coinciden con el contrato', () => {
  const listas = {
    ESTADOS_ALTA,
    ESTADOS_DOCUMENTO,
    ESTADOS_PAGO,
    ESTADOS_PEDIDO,
    ESTADOS_PRESENCIAL,
    ESTADOS_PROPUESTA,
    ESTADOS_SOPORTE,
    ESTADOS_TRABAJO,
    RUBROS,
    TIPOS_PEDIDO,
    CODIGOS_ERROR,
  };
  for (const [nombre, valores] of Object.entries(listas)) {
    assert.ok(yaml.includes(`enum: [${valores.join(', ')}]`), `${nombre} no aparece igual en openapi.yaml`);
  }
});
