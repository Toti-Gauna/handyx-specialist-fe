// Puerto de datos de la PWA. Lo implementan el adaptador mock (fixtures sintéticos) y el HTTP
// (api-especialista) con el MISMO contrato: las pantallas no saben cuál está activo.
// Crece por lote: cada método nuevo entra a la vez en los dos adaptadores y en docs/api/openapi.yaml.
import type {
  CambioDisponibilidad,
  Disponibilidad,
  FeeVigente,
  PedidoElegible,
  PerfilEspecialista,
  Sesion,
} from '../contracts/dto.ts';

export interface Pagina<T> {
  items: T[];
  siguienteCursor: string | null;
}

export interface EspecialistaApi {
  readonly origen: 'mock' | 'http';
  /** Sesión actual o null si no hay (401 no es un error para esta consulta). */
  sesion(): Promise<Sesion | null>;
  perfil(): Promise<PerfilEspecialista>;
  disponibilidad(): Promise<Disponibilidad>;
  actualizarDisponibilidad(cambio: CambioDisponibilidad): Promise<Disponibilidad>;
  /** Filtrados en el servidor por alta, rubro habilitado, cobertura y opt-in de urgencias. */
  pedidosElegibles(cursor?: string): Promise<Pagina<PedidoElegible>>;
  feeVigente(): Promise<FeeVigente>;
}
