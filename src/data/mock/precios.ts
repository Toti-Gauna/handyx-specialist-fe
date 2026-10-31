// "Handyx sugiere" del mock (lote 4.5, contrato 0.6.0). Valores de PRUEBA por rubro y tipo de pedido: la tabla real la
// define Product (PENDIENTE). Es una ayuda: el especialista pone su precio y el servidor nunca lo rechaza por la sugerencia.
import type { PrecioSugerido, TIPOS_PEDIDO } from '../../contracts/dto.ts';
import { monto } from '../../contracts/dinero.ts';
import type { Rubro } from '../../contracts/rubros.ts';

type Tipo = (typeof TIPOS_PEDIDO)[number];

/** En pesos. En obras, la referencia es la visita de presupuesto. */
const TABLA: Record<Rubro, Record<Tipo, number>> = {
  electricidad: { urgente: 42_000, programado: 36_000, obra: 25_000 },
  plomeria: { urgente: 45_000, programado: 38_000, obra: 25_000 },
  gas: { urgente: 52_000, programado: 45_000, obra: 30_000 },
  cerrajeria: { urgente: 38_000, programado: 32_000, obra: 20_000 },
  albanileria: { urgente: 40_000, programado: 35_000, obra: 25_000 },
  aire_acondicionado: { urgente: 55_000, programado: 48_000, obra: 30_000 },
};

export const FUENTE_PRUEBA = 'Tabla de referencia de prueba (la real la define Product)';
export const VERSION_PRUEBA = 'prueba-2026-11';

export function precioSugerido(rubro: Rubro, tipo: Tipo): PrecioSugerido {
  return { monto: monto(TABLA[rubro][tipo] * 100), fuente: FUENTE_PRUEBA, version: VERSION_PRUEBA };
}
