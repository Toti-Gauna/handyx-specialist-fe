// Mapa de rutas de la PWA (exportación estática: cada ruta es una carpeta con index.html).
// Los ids de recursos van por query (?id=…), no por segmento, porque no se conocen en build.
// `lote`: dónde se construye la pantalla (docs/plan.md). Mapa completo de pantallas: docs/screens.md.
import type { NombreIcono } from '../components/Icono.tsx';

export interface Ruta {
  ruta: string;
  titulo: string;
  lote: string;
  descripcion: string;
  nav?: { icono: NombreIcono; texto: string };
}

export const RUTAS = {
  acceso: { ruta: '/acceso/', titulo: 'Entrar', lote: '2.1', descripcion: 'Ingreso con tu cuenta de especialista.' },
  registro: { ruta: '/registro/', titulo: 'Crear cuenta', lote: '2.1', descripcion: 'Cuenta, términos y privacidad versionados.' },
  recuperar: { ruta: '/recuperar/', titulo: 'Recuperar acceso', lote: '2.1', descripcion: 'Recuperación de contraseña.' },
  alta: { ruta: '/alta/', titulo: 'Tu alta', lote: '2.1', descripcion: 'Datos, identidad, rubros, foto y envío a revisión.' },
  inicio: {
    ruta: '/inicio/',
    titulo: 'Inicio',
    lote: '2.2',
    descripcion: 'Estado del alta, disponibilidad, pedidos elegibles y agenda próxima.',
    nav: { icono: 'casa', texto: 'Inicio' },
  },
  pedidos: { ruta: '/pedidos/', titulo: 'Pedidos', lote: '2.2', descripcion: 'Bandeja de pedidos urgentes y programados.' },
  pedido: { ruta: '/pedidos/detalle/', titulo: 'Pedido', lote: '2.3', descripcion: 'Detalle, propuesta, contrapropuesta y vencimiento.' },
  trabajos: {
    ruta: '/trabajos/',
    titulo: 'Mis trabajos',
    lote: '2.4',
    descripcion: 'Trabajos activos e historial.',
    nav: { icono: 'maletin', texto: 'Trabajos' },
  },
  trabajo: { ruta: '/trabajos/detalle/', titulo: 'Trabajo', lote: '2.4', descripcion: 'Acuerdo, en camino, Llegué, avance, fin y cancelación.' },
  agenda: {
    ruta: '/agenda/',
    titulo: 'Agenda',
    lote: '2.4',
    descripcion: 'Calendario propio y fechas alternativas.',
    nav: { icono: 'calendario', texto: 'Agenda' },
  },
  mensajes: {
    ruta: '/mensajes/',
    titulo: 'Mensajes',
    lote: '2.3',
    descripcion: 'Conversaciones por pedido y trabajo.',
    nav: { icono: 'chat', texto: 'Mensajes' },
  },
  hilo: { ruta: '/mensajes/hilo/', titulo: 'Conversación', lote: '2.3', descripcion: 'Chat con texto, fotos y presupuesto estructurado.' },
  caja: { ruta: '/caja/', titulo: 'Caja', lote: '2.5', descripcion: 'Pagos directos: pendientes, reportados y verificados.' },
  cuenta: {
    ruta: '/cuenta/',
    titulo: 'Cuenta',
    lote: '2.1',
    descripcion: 'Documentos y estado, fee 0 % con contador, preferencias, soporte y baja.',
    nav: { icono: 'usuario', texto: 'Cuenta' },
  },
  soporte: { ruta: '/soporte/', titulo: 'Ayuda y reclamos', lote: '2.4', descripcion: 'Asistencia y reclamos con su historial.' },
  notificaciones: { ruta: '/notificaciones/', titulo: 'Avisos', lote: '2.2', descripcion: 'Avisos dentro de la app, urgentes y programados diferenciados.' },
} as const satisfies Record<string, Ruta>;

export type ClaveRuta = keyof typeof RUTAS;

type ClaveNav = { [K in ClaveRuta]: (typeof RUTAS)[K] extends { nav: unknown } ? K : never }[ClaveRuta];

export const NAV: ClaveNav[] = ['inicio', 'trabajos', 'agenda', 'mensajes', 'cuenta'];
