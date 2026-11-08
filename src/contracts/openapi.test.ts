// docs/api/openapi.yaml se escribe a mano: esta prueba evita que sus enums se desalineen del contrato.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { it } from 'node:test';
import { AVANCES_TRABAJO, CODIGOS_ERROR, CONFIANZAS_IA, DISPOSITIVOS_TABLERO, UNIDADES_MATERIAL, ESTADOS_TOKEN, ESTADOS_VIAJE, FALTANTES_ENVIO, GENEROS, MODOS_LLEGADA, MOTIVOS_CANCELACION, MOTIVOS_RESPALDO_LLEGADA, PROVEEDORES, TIPOS_ADICIONAL, TIPOS_AVISO, TIPOS_PEDIDO } from './dto.ts';
import {
  ESTADOS_ADICIONAL,
  ESTADOS_ETAPA,
  ESTADOS_JORNADA,
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
import { CONTRATO_VERSION } from './version.ts';
import * as agenda from './agenda.ts';
import * as camino from './camino.ts';
import * as chat from './chat.ts';
import * as cuenta from './cuenta.ts';
import * as equipamiento from './equipamiento.ts';
import * as equipo from './equipo.ts';
import * as ferreterias from './ferreterias.ts';
import * as ingresos from './ingresos.ts';
import * as mapa from './mapa.ts';
import * as modoTrabajo from './modo-trabajo.ts';
import * as obras from './obras.ts';
import * as presupuestos from './presupuestos.ts';
import * as registro from './registro.ts';
import * as repuestos from './repuestos.ts';
import * as seguridad from './seguridad.ts';

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
    FALTANTES_ENVIO,
    GENEROS,
    TIPOS_AVISO,
    PROVEEDORES,
    ESTADOS_TOKEN,
    ESTADOS_VIAJE,
    AVANCES_TRABAJO,
    MODOS_LLEGADA,
    MOTIVOS_RESPALDO_LLEGADA,
    MOTIVOS_CANCELACION,
    TIPOS_ADICIONAL,
    ESTADOS_ADICIONAL,
    ESTADOS_ETAPA,
    ESTADOS_JORNADA,
    DISPOSITIVOS_TABLERO,
    CONFIANZAS_IA,
    UNIDADES_MATERIAL,
  };
  for (const [nombre, valores] of Object.entries(listas)) {
    assert.ok(yaml.includes(`enum: [${valores.join(', ')}]`), `${nombre} no aparece igual en openapi.yaml`);
  }
});

it('la versión del OpenAPI es la del contrato', () => {
  assert.ok(yaml.includes(`version: ${CONTRATO_VERSION} `), `openapi.yaml no está en la versión ${CONTRATO_VERSION}`);
});

// 0.11.0: cada lista de valores exportada por los archivos de dominio (estados, tipos, motivos…) tiene que estar igual
// en el OpenAPI. Una lista nueva que no aparece hace fallar esta prueba.
it('los enums de los dominios del bloque Taller están en el OpenAPI (0.11.0)', () => {
  const dominios = { agenda, camino, chat, cuenta, equipamiento, equipo, ferreterias, ingresos, mapa, modoTrabajo, obras, presupuestos, registro, repuestos, seguridad };
  let revisadas = 0;
  for (const [dominio, exportes] of Object.entries(dominios)) {
    for (const [nombre, valor] of Object.entries(exportes)) {
      if (!Array.isArray(valor) || !valor.every((v) => typeof v === 'string')) continue;
      revisadas++;
      assert.ok(yaml.includes(`enum: [${valor.join(', ')}]`), `${dominio}.${nombre} no aparece igual en openapi.yaml`);
    }
  }
  assert.ok(revisadas >= 70, `solo ${revisadas} listas`);
});

it('el OpenAPI no deja cobrarle comisión al especialista (0.11.0)', () => {
  assert.ok(yaml.includes('bpsEspecialista: { type: integer, minimum: 0, maximum: 0'));
});
