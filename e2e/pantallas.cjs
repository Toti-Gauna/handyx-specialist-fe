// Pantallas y escenarios que recorren las capturas y la auditoría de accesibilidad.
const id = (n) => `00000000-0000-4000-8000-${n.toString(16).padStart(12, '0')}`;

// [nombre, ruta, texto que indica que terminó de cargar, escenario]
const PANTALLAS = [
  ['acceso', '/acceso/', 'Entrá a tu cuenta', 'nuevo'],
  ['registro', '/registro/', 'Crear tu cuenta', 'nuevo'],
  ['recuperar', '/recuperar/', 'Recuperar el acceso', 'nuevo'],
  ['alta-borrador', '/alta/', 'Tus datos', 'incompleto'],
  ['alta-en-revision', '/alta/', 'Próximos pasos', 'en_revision'],
  ['alta-correccion', '/alta/', 'Hay que corregir algo', 'correccion'],
  ['alta-rechazada', '/alta/', 'Alta rechazada', 'rechazado'],
  ['alta-habilitada', '/alta/', 'Alta habilitada', 'habilitado'],
  ['inicio-sin-habilitar', '/inicio/', 'Todavía no recibís pedidos', 'en_revision'],
  ['inicio', '/inicio/', 'Tu disponibilidad', 'habilitado'],
  ['disponibilidad', '/disponibilidad/', 'Zonas que cubrís', 'habilitado'],
  ['pedidos', '/pedidos/', 'Por orden de llegada', 'habilitado'],
  ['pedido-programado', `/pedidos/detalle/?id=${id(0xb2)}`, 'Propuesta del usuario', 'habilitado'],
  ['pedido-obra', `/pedidos/detalle/?id=${id(0xb4)}`, 'visita de presupuesto', 'habilitado'],
  ['avisos', '/notificaciones/', 'Abrir un aviso solo te muestra', 'habilitado'],
  ['mensajes', '/mensajes/', 'Cliente de prueba 2', 'habilitado'],
  ['hilo-cotizando', `/mensajes/hilo/?id=${id(0xd2)}`, 'Propuesta del usuario', 'habilitado'],
  ['hilo-trabajo', `/mensajes/hilo/?id=${id(0xd1)}`, 'Perfecto, te espero', 'habilitado'],
  ['trabajos', '/trabajos/', 'Cliente de prueba 5', 'habilitado'],
  ['trabajo-agendado', `/trabajos/detalle/?id=${id(0xc1)}`, 'Salgo hacia el lugar', 'habilitado'],
  ['trabajo-obra', `/trabajos/detalle/?id=${id(0xc4)}`, 'Etapas de la obra', 'habilitado'],
  ['trabajo-finalizado', `/trabajos/detalle/?id=${id(0xc2)}`, 'Trabajo terminado', 'habilitado'],
  ['agenda', '/agenda/', 'número subrayado', 'habilitado'],
  ['caja', '/caja/', 'El pago va directo a vos', 'habilitado'],
  ['soporte', '/soporte/', 'Abrir un caso', 'habilitado'],
  ['caso', `/soporte/detalle/?id=${id(0x52)}`, 'El usuario no estaba en el lugar', 'habilitado'],
  ['cuenta', '/cuenta/', 'Quién ve qué', 'habilitado'],
  ['baja', '/baja/', 'Baja de tu cuenta', 'baja'],
  ['error-red', '/pedidos/?falla=red', 'No pudimos conectarnos', 'habilitado'],
  ['error-servidor', '/caja/?falla=servidor', 'El servicio no está disponible por ahora', 'habilitado'],
  ['sin-conexion', '/sin-conexion/', 'Se nos cortó el caño', 'habilitado'],
  ['no-encontrada', '/no-existe/', 'No encontramos esta pantalla', 'habilitado'],
];

module.exports = { PANTALLAS, id };
