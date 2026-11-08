// Dominio cuenta: política de tarifa (la decide el contrato), preferencias, avisos del dispositivo y baja.
import type { Baja, FeeVigente, Preferencias } from '../../contracts/dto.ts';

export interface ApiCuenta {
  feeVigente(): Promise<FeeVigente>;
  aceptarAvisoFee(politicaId: string, version: number): Promise<FeeVigente>;
  preferencias(): Promise<Preferencias>;
  guardarPreferencias(p: Omit<Preferencias, 'push'>): Promise<Preferencias>;
  activarPush(): Promise<Preferencias>;
  baja(): Promise<Baja | null>;
  solicitarBaja(): Promise<Baja>;
  cancelarBaja(): Promise<void>;
}
