// Lógica pura de la Caja (lote 4.8): lo cobrado en el mes (hora de Buenos Aires) y los filtros por estado.
// Cobrado = verificado + informado sin verificar; se muestran por separado porque reportado ≠ verificado.
import type { Pago } from '../contracts/dto.ts';
import type { EstadoPago } from '../contracts/maquinas.ts';
import { diaLocal } from './formato.ts';

export function resumenMes(pagos: readonly Pago[], ahora: Date): { verificado: number; informado: number; cobros: number } {
  const mes = diaLocal(ahora.toISOString()).slice(0, 7);
  const delMes = pagos.filter((p) => diaLocal(p.actualizadoEn).slice(0, 7) === mes);
  const suma = (e: EstadoPago) => delMes.filter((p) => p.estado === e).reduce((n, p) => n + p.neto.centavos, 0);
  return { verificado: suma('verificado'), informado: suma('reportado'), cobros: delMes.filter((p) => p.estado === 'verificado' || p.estado === 'reportado').length };
}

export const FILTROS_CAJA = [
  { id: 'todos', texto: 'Todos', estados: null },
  { id: 'pendientes', texto: 'Pendientes', estados: ['pendiente'] },
  { id: 'informados', texto: 'Informados', estados: ['reportado'] },
  { id: 'verificados', texto: 'Verificados', estados: ['verificado'] },
  { id: 'problemas', texto: 'Con problemas', estados: ['fallido', 'en_discrepancia'] },
] as const satisfies readonly { id: string; texto: string; estados: readonly EstadoPago[] | null }[];
export type FiltroCaja = (typeof FILTROS_CAJA)[number]['id'];

export function filtrarPagos(pagos: readonly Pago[], filtro: FiltroCaja): Pago[] {
  const f = FILTROS_CAJA.find((x) => x.id === filtro);
  const estados: readonly EstadoPago[] | null = f?.estados ?? null;
  return estados ? pagos.filter((p) => estados.includes(p.estado)) : [...pagos];
}
