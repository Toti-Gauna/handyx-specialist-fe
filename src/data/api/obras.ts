// Dominio obras de varios días (contrato 0.8.0): etapas, jornadas y diario.
import type { CambioJornada, EntradaDiario, Jornada, NuevaEntradaDiario, Pago } from '../../contracts/dto.ts';
import type { ClaveIdempotencia } from './tipos.ts';

export interface ApiObras {
  /** Terminar la etapa en curso: crea su cobro (directo del cliente) y arranca la siguiente. Devuelve el cobro. */
  terminarEtapa(trabajoId: string, etapaId: string, clave: ClaveIdempotencia): Promise<Pago>;
  /** Pedir otro día para una jornada: queda pendiente hasta que el cliente acepta y no mueve el resto. */
  pedirCambioJornada(trabajoId: string, jornadaId: string, cambio: CambioJornada, clave: ClaveIdempotencia): Promise<Jornada>;
  /** Avance del día en el diario (lo ve el cliente). `fotos`: hasta 4; el mock nunca las lee ni las guarda. */
  agregarAlDiario(trabajoId: string, entrada: NuevaEntradaDiario, fotos: readonly Blob[], clave: ClaveIdempotencia): Promise<EntradaDiario>;
}
