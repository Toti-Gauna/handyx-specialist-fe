// Cliente de servidor de los dominios de la ola 2 (lote 2.5): agenda y tu día, cobros e ingresos, presupuestos y
// precios, equipamiento y Modo trabajo. Cada método es una ruta de docs/api/openapi.yaml, validada con el contrato.
// Los lotes 2.1 a 2.4 arman sus puertos (`api/<dominio>.ts`) y su adaptador HTTP delegan acá; el cierre de la ola 2
// los compone en `http/adaptador.ts`. La prueba de punta a punta está en handyx-specialist-be
// (tests/pwa-ola2.integration.test.ts con HANDYX_SPECIALIST_FE=<este repo>).
import { ClienteHttp, type OpcionesCliente } from '../cliente.ts';
import { agendaServidor } from './agenda.ts';
import { equipamientoServidor } from './equipamiento.ts';
import { ingresosServidor } from './ingresos.ts';
import { modoTrabajoServidor } from './modo-trabajo.ts';
import { presupuestosServidor } from './presupuestos.ts';

export const servidorOla2 = (c: ClienteHttp, baseUrl = '') => ({
  ...agendaServidor(c),
  ...ingresosServidor(c, baseUrl),
  ...presupuestosServidor(c),
  ...equipamientoServidor(c),
  ...modoTrabajoServidor(c),
});

/** Con un cliente propio (pruebas de integración): el CSRF se recuerda con `cliente.recordarCsrf`. */
export function crearServidorOla2(o: OpcionesCliente) {
  const cliente = new ClienteHttp(o);
  return { cliente, ...servidorOla2(cliente, o.baseUrl) };
}

export type ServidorOla2 = ReturnType<typeof servidorOla2>;
