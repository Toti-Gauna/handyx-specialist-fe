// Importes en centavos enteros con moneda. Nunca floats para calcular plata.
export const MONEDAS = ['ARS'] as const;
export type Moneda = (typeof MONEDAS)[number];

export interface Monto {
  centavos: number;
  moneda: Moneda;
}

export function monto(centavos: number, moneda: Moneda = 'ARS'): Monto {
  if (!Number.isSafeInteger(centavos) || centavos < 0) {
    throw new RangeError('El importe tiene que ser un entero de centavos no negativo');
  }
  return { centavos, moneda };
}

export function sumar(a: Monto, b: Monto): Monto {
  if (a.moneda !== b.moneda) throw new TypeError('No se suman importes de monedas distintas');
  return monto(a.centavos + b.centavos, a.moneda);
}

/**
 * Porción de un importe en puntos básicos (1 % = 100 bps), redondeo al centavo (mitad hacia arriba).
 * Con 0 bps (fee de la demo) el resultado es exactamente 0.
 */
export function porcion(m: Monto, bps: number): Monto {
  if (!Number.isInteger(bps) || bps < 0 || bps > 10_000) throw new RangeError('bps fuera de rango');
  const centavos = (BigInt(m.centavos) * BigInt(bps) + 5_000n) / 10_000n;
  return monto(Number(centavos), m.moneda);
}

/** "$ 45.000" o "$ 45.000,50" (pesos argentinos, formato de la landing). */
export function formatearPesos(m: Monto): string {
  const entero = Math.floor(m.centavos / 100);
  const resto = m.centavos % 100;
  const miles = entero.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return resto === 0 ? `$ ${miles}` : `$ ${miles},${resto.toString().padStart(2, '0')}`;
}
