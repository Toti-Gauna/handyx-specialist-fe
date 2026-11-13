// Adaptador HTTP (api-especialista): compone los dominios de esta carpeta sobre un mismo cliente (cookie de sesión y
// CSRF en memoria). Rutas: docs/api/openapi.yaml. Un cambio en un dominio exige el mismo cambio en el mock y en el OpenAPI.
import type { EspecialistaApi } from '../api.ts';
import { accesoHttp } from './acceso.ts';
import { agendaHttp } from './agenda.ts';
import { altaHttp } from './alta.ts';
import { cajaHttp } from './caja.ts';
import { ClienteHttp, type OpcionesCliente } from './cliente.ts';
import { cuentaHttp } from './cuenta.ts';
import { ingresosHttp } from './ingresos.ts';
import { equipamientoHttp } from './equipamiento.ts';
import { mensajesHttp } from './mensajes.ts';
import { modoTrabajoHttp } from './modo-trabajo.ts';
import { obrasHttp } from './obras.ts';
import { pedidosHttp } from './pedidos.ts';
import { presupuestosHttp } from './presupuestos.ts';
import { propuestasHttp } from './propuestas.ts';
import { soporteHttp } from './soporte.ts';
import { tallerHttp } from './taller.ts';
import { trabajosHttp } from './trabajos.ts';
import { viajesHttp } from './viajes.ts';

export function crearApiHttp(o: OpcionesCliente): EspecialistaApi {
  const c = new ClienteHttp(o);
  return {
    origen: 'http',
    ahora: () => new Date(),
    ...accesoHttp(c),
    ...altaHttp(c),
    ...pedidosHttp(c),
    ...propuestasHttp(c),
    ...trabajosHttp(c),
    ...obrasHttp(c),
    ...viajesHttp(c),
    ...mensajesHttp(c),
    ...cajaHttp(c),
    ...soporteHttp(c),
    ...cuentaHttp(c),
    ...tallerHttp(c),
    ...agendaHttp(c),
    ...ingresosHttp(c),
    ...presupuestosHttp(c),
    ...modoTrabajoHttp(c),
    ...equipamientoHttp(c),
  };
}
