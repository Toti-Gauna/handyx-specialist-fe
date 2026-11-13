// Adaptador HTTP de ingresos y gastos (lote 2.1). Las rutas y la validación viven en `servidor/ingresos.ts` (lote 2.5,
// probado contra la API real): acá solo se adapta al puerto de la PWA.
import type { ApiIngresos } from '../api/ingresos.ts';
import type { ClienteHttp } from './cliente.ts';
import { ingresosServidor } from './servidor/ingresos.ts';

export const ingresosHttp = (c: ClienteHttp): ApiIngresos => {
  const s = ingresosServidor(c);
  return {
    resumenIngresos: s.ingresos,
    cobrosDelMes: (mes, cursor) => s.cobrosDelMes(mes, cursor ?? undefined),
    gastos: (f = {}) => s.gastos({ mes: f.mes, trabajoId: f.trabajoId, cursor: f.cursor ?? undefined }),
    cargarGasto: (nuevo, ticket, clave) => s.crearGasto(nuevo, clave, ticket ?? undefined),
    corregirGasto: s.cambiarGasto,
    borrarGasto: s.borrarGasto,
    ingresosExternos: s.ingresosExternos,
    cargarIngresoExterno: s.crearIngresoExterno,
    borrarIngresoExterno: s.borrarIngresoExterno,
  };
};
