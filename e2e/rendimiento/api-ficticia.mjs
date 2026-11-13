// API ficticia SOLO para medir el rendimiento del build de producción (modo http) en localhost (lote 4.9).
// Sirve los datos sintéticos del mock detrás de HTTP, con CORS y credenciales como la API real. No hay sesión real:
// una sola cuenta de prueba en memoria y solo las consultas (GET) de las pantallas medidas. Nunca se publica.
// Uso: node e2e/rendimiento/api-ficticia.mjs <puerto> <origen de la app>
import { createServer } from 'node:http';
import { crearApiMockConEstado } from '../../src/data/mock/adaptador.ts';

const puerto = Number(process.argv[2] ?? 4503);
const origen = process.argv[3] ?? 'http://localhost:4504';
const { api } = crearApiMockConEstado({ escenario: 'habilitado', latenciaMs: 0 });

const GET = [
  [/^\/v1\/auth\/sesion$/, () => api.sesion()],
  [/^\/v1\/especialista\/perfil$/, () => api.perfil()],
  [/^\/v1\/especialista\/perfil\/publico$/, () => api.perfilPublico()],
  [/^\/v1\/especialista\/alta\/datos$/, () => api.datosAlta()],
  [/^\/v1\/especialista\/disponibilidad$/, () => api.disponibilidad()],
  [/^\/v1\/especialista\/inicio$/, () => api.inicio()],
  [/^\/v1\/especialista\/pedidos$/, (_m, q) => api.pedidosElegibles(q.get('cursor') ?? undefined)],
  [/^\/v1\/especialista\/pedidos\/([^/]+)$/, (m) => api.pedido(m[1])],
  [/^\/v1\/especialista\/avisos$/, () => api.avisos()],
  [/^\/v1\/especialista\/trabajos$/, (_m, q) => api.trabajos(q.get('estado'))],
  [/^\/v1\/especialista\/trabajos\/([^/]+)$/, (m) => api.trabajo(m[1])],
  [/^\/v1\/especialista\/trabajos\/([^/]+)\/viaje$/, (m) => api.viaje(m[1])],
  [/^\/v1\/especialista\/agenda$/, (_m, q) => api.agenda(q.get('desde'), q.get('hasta'))],
  [/^\/v1\/especialista\/mapa\/barrios$/, () => api.barrios()],
  [/^\/v1\/conversaciones$/, () => api.conversaciones()],
  [/^\/v1\/conversaciones\/([^/]+)$/, (m) => api.conversacion(m[1])],
  [/^\/v1\/conversaciones\/([^/]+)\/mensajes$/, (m) => api.mensajes(m[1])],
  [/^\/v1\/conversaciones\/([^/]+)\/propuestas$/, (m) => api.propuestasConversacion(m[1])],
  [/^\/v1\/especialista\/caja\/resumen$/, () => api.cajaResumen()],
  [/^\/v1\/especialista\/caja$/, () => api.pagos()],
  [/^\/v1\/soporte\/casos$/, () => api.casos()],
  [/^\/v1\/soporte\/casos\/([^/]+)$/, (m) => api.caso(m[1])],
  [/^\/v1\/fee\/vigente$/, () => api.feeVigente()],
  [/^\/v1\/especialista\/contactos$/, () => api.contactos()],
  [/^\/v1\/especialista\/cobros$/, () => api.mediosCobro()],
  [/^\/v1\/cuenta\/preferencias$/, () => api.preferencias()],
  [/^\/v1\/cuenta\/baja$/, () => api.baja()],
];

createServer(async (req, res) => {
  const h = {
    'Access-Control-Allow-Origin': origen,
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Headers': 'Accept, Content-Type, X-CSRF-Token, Idempotency-Key',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE',
    'Content-Type': 'application/json',
    Vary: 'Origin',
  };
  if (req.method === 'OPTIONS') {
    res.writeHead(204, h);
    return res.end();
  }
  const u = new URL(req.url ?? '/', 'http://x');
  const ruta = req.method === 'GET' ? GET.find(([r]) => r.test(u.pathname)) : undefined;
  if (!ruta) {
    console.error(`api-ficticia: sin ruta para ${req.method} ${u.pathname}`);
    res.writeHead(404, h);
    return res.end('{"error":{"codigo":"no_encontrado","mensaje":"No encontrado"}}');
  }
  try {
    const datos = await ruta[1](u.pathname.match(ruta[0]), u.searchParams);
    res.writeHead(200, h);
    res.end(datos === undefined ? '' : JSON.stringify(datos));
  } catch (e) {
    console.error(`api-ficticia: ${u.pathname} falló (${e.message})`);
    res.writeHead(500, h);
    res.end('{}');
  }
}).listen(puerto, () => console.log(`api-ficticia: lista en ${puerto}`));
