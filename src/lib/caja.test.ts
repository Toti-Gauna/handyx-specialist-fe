import assert from 'node:assert/strict';
import { it } from 'node:test';
import { monto } from '../contracts/dinero.ts';
import type { Pago } from '../contracts/dto.ts';
import { filtrarPagos, resumenMes } from './caja.ts';

const pago = (n: number, estado: Pago['estado'], pesos: number, en: string) => ({ id: String(n), estado, neto: monto(pesos * 100), actualizadoEn: en }) as Pago;

it('lo cobrado del mes separa lo verificado de lo informado, en hora de Buenos Aires', () => {
  const pagos = [
    pago(1, 'verificado', 52000, '2026-11-12T20:00:00.000Z'),
    pago(2, 'reportado', 30000, '2026-11-16T15:00:00.000Z'),
    pago(3, 'pendiente', 45000, '2026-11-16T15:00:00.000Z'),
    pago(4, 'verificado', 10000, '2026-11-01T02:00:00.000Z'), // 31/10 a las 23 en Buenos Aires: mes anterior
  ];
  assert.deepEqual(resumenMes(pagos, new Date('2026-11-17T15:00:00.000Z')), { verificado: 5_200_000, informado: 3_000_000, cobros: 2 });
  assert.deepEqual(filtrarPagos(pagos, 'problemas'), []);
  assert.deepEqual(filtrarPagos(pagos, 'verificados').map((p) => p.id), ['1', '4']);
  assert.equal(filtrarPagos(pagos, 'todos').length, 4);
});
