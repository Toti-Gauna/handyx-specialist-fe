// Dominio soporte: casos del Centro de ayuda con su historial.
import type { CasoSoporte, CasoSoporteDetalle, NuevoCaso } from '../../contracts/dto.ts';
import type { ClaveIdempotencia } from './tipos.ts';

export interface ApiSoporte {
  casos(): Promise<CasoSoporte[]>;
  caso(id: string): Promise<CasoSoporteDetalle>;
  abrirCaso(datos: NuevoCaso, clave: ClaveIdempotencia): Promise<CasoSoporte>;
  responderCaso(id: string, texto: string, clave: ClaveIdempotencia): Promise<CasoSoporteDetalle>;
}
