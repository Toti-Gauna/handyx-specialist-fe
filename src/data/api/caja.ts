// Dominio caja: pagos directos (reportado ≠ verificado) y cómo te paga el cliente.
import type { CajaResumen, GuardarMediosCobro, MediosCobro, Pago } from '../../contracts/dto.ts';
import type { ClaveIdempotencia, Pagina } from './tipos.ts';

export interface ApiCaja {
  cajaResumen(): Promise<CajaResumen>;
  pagos(): Promise<Pagina<Pago>>;
  reportarCobro(pagoId: string, clave: ClaveIdempotencia): Promise<Pago>;
  marcarDiscrepancia(pagoId: string, clave: ClaveIdempotencia): Promise<Pago>;
  /** Cómo te paga el cliente (0.9.0): Mercado Pago, efectivo o los dos. */
  mediosCobro(): Promise<MediosCobro>;
  guardarMediosCobro(m: GuardarMediosCobro): Promise<MediosCobro>;

  /**
   * Solo en el mock: simulación rotulada de la comisión por efectivo FUERA del fee 0 % (política futura,
   * no vigente, sin cobros). No existe en la API real.
   */
  simulacionPostDemo?(): Promise<SimulacionPostDemo>;
}

export interface SimulacionPostDemo {
  rotulo: string;
  entradas: Array<{
    pagoId: string;
    descripcion: string;
    cobrado: { centavos: number; moneda: 'ARS' };
    comision: { centavos: number; moneda: 'ARS' };
    estado: 'adeudada' | 'saldada';
  }>;
}
