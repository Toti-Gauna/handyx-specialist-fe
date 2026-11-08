// Dominio mapa y viaje (contrato 0.4.0).
import type { Barrio, Posicion, Viaje } from '../../contracts/dto.ts';

export interface ApiViajes {
  /** Barrios de cobertura con un punto para la etiqueta del mapa. */
  barrios(): Promise<Barrio[]>;
  /** Destino, trayecto y última posición del viaje de un trabajo (solo con dirección, es decir, con acuerdo). */
  viaje(trabajoId: string): Promise<Viaje>;
  /**
   * Manda la posición actual mientras el trabajo está en camino: el cliente la ve en vivo. La primera calcula el
   * trayecto; si te desviás, el servidor lo recalcula y sube su versión.
   */
  enviarPosicion(trabajoId: string, posicion: Posicion): Promise<Viaje>;
  /** Deja de compartir: el cliente deja de verte. */
  dejarDeCompartir(trabajoId: string): Promise<Viaje>;
}
