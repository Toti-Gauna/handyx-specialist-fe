// Dominio propuestas: enviar, responder la del usuario y retirar la propia.
import type { Aceptacion, NuevaPropuesta, Propuesta } from '../../contracts/dto.ts';
import type { ClaveIdempotencia } from './tipos.ts';

export interface ApiPropuestas {
  enviarPropuesta(datos: NuevaPropuesta, clave: ClaveIdempotencia): Promise<Propuesta>;
  responderPropuesta(id: string, accion: 'aceptar' | 'rechazar', version: number, clave: ClaveIdempotencia): Promise<Aceptacion>;
  retirarPropuesta(id: string): Promise<Propuesta>;
}
