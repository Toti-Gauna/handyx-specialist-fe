// Dominio ingresos y gastos (contrato 0.11.0, lote 2.1: F-Ingresos y H0-Gasto).
// Neto = bruto − gastos. Handyx no le cobra comisión al especialista, nunca. Lo informado no es lo verificado.
// Los gastos son del especialista: el cliente no los ve. «Cobrárselo al cliente» crea un adicional que el cliente acepta.
import type { Cobro, CambioGasto, Gasto, IngresoExterno, NuevoGasto, NuevoIngresoExterno, ResumenIngresos } from '../../contracts/ingresos.ts';
import type { ClaveIdempotencia, Pagina } from './tipos.ts';

export interface ApiIngresos {
  /** Tus ingresos del mes (AAAA-MM): bruto, gastos, neto y ganancia por trabajo. Lo calcula el servidor. */
  resumenIngresos(mes: string): Promise<ResumenIngresos>;
  /** Los cobros del mes con su estado (informado ≠ verificado). */
  cobrosDelMes(mes: string, cursor?: string | null): Promise<Pagina<Cobro>>;
  gastos(filtro?: { mes?: string; trabajoId?: string; cursor?: string | null }): Promise<Pagina<Gasto>>;
  /** Cargar un gasto a mano o con la foto del ticket (ya achicada y sin metadatos). Con `cobrarAlCliente` va como adicional. */
  cargarGasto(nuevo: NuevoGasto, ticket: Blob | null, clave: ClaveIdempotencia): Promise<Gasto>;
  corregirGasto(id: string, cambio: CambioGasto): Promise<Gasto>;
  borrarGasto(id: string): Promise<void>;
  /** Cobros por fuera de Handyx que cargaste. */
  ingresosExternos(mes: string): Promise<IngresoExterno[]>;
  cargarIngresoExterno(nuevo: NuevoIngresoExterno, clave: ClaveIdempotencia): Promise<IngresoExterno>;
  borrarIngresoExterno(id: string): Promise<void>;
}
