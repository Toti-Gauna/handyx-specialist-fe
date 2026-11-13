// Dominio taller · IA (0.10.0): sin datos personales y sin precios.
import type { PresupuestoDictado, PresupuestoSugerido, SugerenciaTablero } from '../../contracts/dto.ts';

export interface ApiTaller {
  /** Propuesta a partir de la foto de un tablero (ya achicada y sin metadatos). */
  iaTablero(foto: Blob): Promise<SugerenciaTablero>;
  /** Tareas y materiales a partir de lo dictado (ya sin datos personales). Sin precios. */
  iaPresupuesto(entrada: PresupuestoDictado): Promise<PresupuestoSugerido>;
}
