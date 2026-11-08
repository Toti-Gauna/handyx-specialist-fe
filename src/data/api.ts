// Puerto de datos de la PWA. Lo implementan el adaptador mock (fixtures sintéticos) y el HTTP
// (api-especialista) con el MISMO contrato: las pantallas no saben cuál está activo.
// Cada método existe en los dos adaptadores y en docs/api/openapi.yaml.
//
// Partido por dominio (lote 0.2): cada lote de una ola toca solo su `api/<dominio>.ts`, `mock/<dominio>.ts` y
// `http/<dominio>.ts`; este archivo solo compone el puerto.
import type { ApiAcceso } from './api/acceso.ts';
import type { ApiAlta } from './api/alta.ts';
import type { ApiCaja } from './api/caja.ts';
import type { ApiCuenta } from './api/cuenta.ts';
import type { ApiMensajes } from './api/mensajes.ts';
import type { ApiModoTrabajo } from './api/modo-trabajo.ts';
import type { ApiObras } from './api/obras.ts';
import type { ApiPedidos } from './api/pedidos.ts';
import type { ApiPropuestas } from './api/propuestas.ts';
import type { ApiSoporte } from './api/soporte.ts';
import type { ApiTaller } from './api/taller.ts';
import type { ApiTrabajos } from './api/trabajos.ts';
import type { ApiViajes } from './api/viajes.ts';

export type { Pagina, ClaveIdempotencia } from './api/tipos.ts';
export type { SimulacionPostDemo } from './api/caja.ts';

export interface EspecialistaApi
  extends ApiAcceso,
    ApiAlta,
    ApiPedidos,
    ApiPropuestas,
    ApiTrabajos,
    ApiObras,
    ApiViajes,
    ApiMensajes,
    ApiCaja,
    ApiSoporte,
    ApiCuenta,
    ApiTaller,
    ApiModoTrabajo {
  readonly origen: 'mock' | 'http';
  /** "Ahora" para mostrar cuentas regresivas. Los vencimientos los decide siempre el servidor. */
  ahora(): Date;
}
