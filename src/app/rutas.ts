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
  puerta: { ruta: '/', titulo: 'Entrada', lote: '1.1', descripcion: 'Decide a dónde ir según la sesión y el estado del alta.' },
  sinConexion: { ruta: '/sin-conexion/', titulo: 'Sin conexión', lote: '3.3', descripcion: 'Pantalla del service worker cuando no hay red (sin datos).' },
  baja: { ruta: '/baja/', titulo: 'Baja de tu cuenta', lote: '2.1', descripcion: 'Estado real de la solicitud de baja.' },
  disponibilidad: { ruta: '/disponibilidad/', titulo: 'Tu disponibilidad', lote: '2.2', descripcion: 'Urgentes Ahora, programados, franjas y zonas.' },
  casoSoporte: { ruta: '/soporte/detalle/', titulo: 'Caso de ayuda', lote: '2.4', descripcion: 'Respuestas y estado de un caso.' },
  bienvenida: { ruta: '/bienvenida/', titulo: 'Bienvenida', lote: '4.2', descripcion: 'Tres láminas: tu precio, la plata directo a vos y el fee 0 %; crear cuenta o entrar.' },
  acceso: { ruta: '/acceso/', titulo: 'Entrar', lote: '4.2', descripcion: 'Google, Apple (solo en dispositivos Apple) o email y contraseña.' },
  verificar: { ruta: '/verificar/', titulo: 'Verificá tu email', lote: '4.2', descripcion: 'Código de 6 números al email; después, la cuenta creada.' },
  aceptar: { ruta: '/registro/aceptar/', titulo: 'Un paso más', lote: '4.2', descripcion: 'Términos y privacidad para las cuentas nuevas de Google o Apple.' },
  recuperarNueva: { ruta: '/recuperar/nueva/', titulo: 'Contraseña nueva', lote: '4.2', descripcion: 'Elegir una contraseña con el enlace del email, o enlace vencido.' },
  registro: { ruta: '/registro/', titulo: 'Crear cuenta', lote: '4.2', descripcion: 'Cuenta, términos y privacidad versionados.' },
  recuperar: { ruta: '/recuperar/', titulo: 'Recuperar acceso', lote: '4.2', descripcion: 'Recuperación de contraseña.' },
  alta: { ruta: '/alta/', titulo: 'Tu alta', lote: '4.4', descripcion: 'Alta guiada: datos, DNI y CUIT, selfie, rubros, zonas y horarios, turno de antecedentes, resumen y estados.' },
  inicio: {
    ruta: '/inicio/',
    titulo: 'Inicio',
    lote: '2.2',
    descripcion: 'Estado del alta, disponibilidad, pedidos elegibles y agenda próxima.',
    nav: { icono: 'casa', texto: 'Inicio' },
  },
  pedidos: { ruta: '/pedidos/', titulo: 'Pedidos', lote: '2.2', descripcion: 'Bandeja de pedidos urgentes y programados.' },
  pedido: { ruta: '/pedidos/detalle/', titulo: 'Pedido', lote: '4.5', descripcion: 'Detalle con la zona, esperando al cliente, te eligió o no, y la propuesta del cliente.' },
  tuPrecio: { ruta: '/pedidos/propuesta/', titulo: 'Tu precio', lote: '4.5', descripcion: 'Cuándo podés ir, "Handyx sugiere · Vos decidís", qué incluye y cuánto recibís (también para contraofertar).' },
  trabajos: {
    ruta: '/trabajos/',
    titulo: 'Mis trabajos',
    lote: '2.4',
    descripcion: 'Trabajos activos e historial.',
    nav: { icono: 'maletin', texto: 'Trabajos' },
  },
  trabajo: { ruta: '/trabajos/detalle/', titulo: 'Trabajo', lote: '4.6', descripcion: 'Trabajo acordado: cliente, dirección y mapa, chat y llamada por la app, en curso con cronómetro y adicionales.' },
  enCamino: { ruta: '/en-camino/', titulo: 'En camino', lote: '4.6', descripcion: 'Mapa con tu posición en vivo, el trayecto y la llegada automática (con "Ya llegué" de respaldo).' },
  trabajoAdicional: { ruta: '/trabajos/adicional/', titulo: 'Agregar al trabajo', lote: '4.6', descripcion: 'Repuestos o mano de obra que el cliente acepta o rechaza.' },
  trabajoCambio: { ruta: '/trabajos/cambio/', titulo: 'Cambiar la fecha', lote: '4.6', descripcion: 'Motivo, día y franja: queda como pedido hasta que el cliente acepte.' },
  trabajoCancelar: { ruta: '/trabajos/cancelar/', titulo: 'Cancelar el trabajo', lote: '4.6', descripcion: 'Primero otras opciones; después el motivo y la confirmación.' },
  trabajoTerminado: { ruta: '/trabajos/terminado/', titulo: '¡Terminaste!', lote: '4.7', descripcion: 'Monto, desglose e informar el cobro; en una obra, el cierre etapa por etapa.' },
  obraPlan: { ruta: '/trabajos/obra/plan/', titulo: 'Plan de obra', lote: '4.7', descripcion: 'Etapas en una línea de tiempo con fechas, importe, lo que incluyen, adicionales y el cobro de cada una.' },
  obraJornadas: { ruta: '/trabajos/obra/jornadas/', titulo: 'Jornadas', lote: '4.7', descripcion: 'Días de trabajo en el calendario; pedir otro día para una jornada sin mover el resto.' },
  obraDiario: { ruta: '/trabajos/obra/diario/', titulo: 'Diario de obra', lote: '4.7', descripcion: 'Avance del día con una nota y fotos, que ve el cliente.' },
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
