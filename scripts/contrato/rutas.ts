// Tabla de rutas nuevas de 0.11.0. Cada fila: método, ruta, etiqueta, resumen, cuerpo, respuesta y errores.
export type Cuerpo = string | { multipart: Record<string, string>; requeridos?: string[]; datos?: string; json?: string };
export interface Op {
  m: 'get' | 'post' | 'put' | 'patch' | 'delete';
  p: string;
  tag: string;
  s: string;
  d?: string;
  body?: Cuerpo;
  q?: [string, Record<string, unknown>, boolean?][];
  /** [código, esquema | null, descripción, forma] — forma: 'lista' | 'pagina' | 'nulo' | 'sse' | 'csv'. */
  ok: [number, string | null, string, ('lista' | 'pagina' | 'nulo' | 'sse' | 'csv')?];
  err?: number[];
  idem?: boolean;
  pub?: boolean;
}

const E = '/v1/especialista';
const archivo = (d: string) => `binary:${d}`;
const cursor: [string, Record<string, unknown>] = ['cursor', { type: 'string' }];
const mes: [string, Record<string, unknown>, boolean] = ['mes', { $ref: '#/components/schemas/Mes' }, true];

export const RUTAS: Op[] = [
  // ── Acceso (seguridad.ts, registro.ts) ──
  { m: 'post', p: '/v1/auth/cuenta', tag: 'auth', pub: true, s: 'Crear la cuenta de especialista con nombre, teléfono, email y contraseña (RG-1). Respuesta neutra', body: 'RegistroCuenta', ok: [202, null, 'Recibido (igual exista o no la cuenta); sigue con el código al email'], err: [400, 429] },
  { m: 'post', p: '/v1/auth/ingreso/clave', tag: 'auth', pub: true, s: 'Entrar con email o teléfono y contraseña. Con la segunda verificación activa, devuelve el paso 2', body: 'IngresoClave', ok: [200, 'ResultadoIngreso', 'Sesión o desafío de la segunda verificación'], err: [400, 401, 429] },
  { m: 'post', p: '/v1/auth/ingreso/codigo', tag: 'auth', pub: true, s: 'Entrar sin contraseña: mandar un código por email o SMS. Respuesta neutra', d: 'Sin proveedor de SMS autorizado, el canal sms responde 503.', body: 'PedidoCodigoIngreso', ok: [202, 'CodigoEnviado', 'Código enviado (si la cuenta existe)'], err: [400, 429, 503] },
  { m: 'post', p: '/v1/auth/ingreso/codigo/verificacion', tag: 'auth', pub: true, s: 'Entrar con el código de 6 dígitos (5 intentos; vence a los 10 minutos)', body: 'CodigoIngreso', ok: [200, 'ResultadoIngreso', 'Sesión o desafío de la segunda verificación'], err: [400, 429] },
  { m: 'post', p: '/v1/auth/segunda-verificacion', tag: 'auth', pub: true, s: 'Paso 2 de 2: el código de la app autenticadora, del SMS, del email o uno de respaldo (de un solo uso)', body: 'ResolverDesafio', ok: [200, 'Sesion', 'Sesión iniciada'], err: [400, 401, 429] },
  { m: 'post', p: '/v1/auth/segunda-verificacion/envio', tag: 'auth', pub: true, s: 'Mandar el código de la segunda verificación por SMS o email', body: 'EnvioDesafio', ok: [200, 'CodigoEnviado', 'Código enviado'], err: [400, 429, 503] },
  { m: 'post', p: '/v1/auth/recuperacion', tag: 'auth', pub: true, s: 'Recuperar la contraseña con email o teléfono: el enlace va al email (30 minutos, un solo uso). Respuesta neutra', body: 'Recuperacion', ok: [202, null, 'Recibido (igual exista o no la cuenta)'], err: [429] },

  // ── Seguridad de la cuenta ──
  { m: 'get', p: `${E}/seguridad`, tag: 'seguridad', s: 'Segunda verificación, códigos de respaldo, teléfono y dispositivos con la sesión abierta (D6-Seguridad)', ok: [200, 'Seguridad', 'Seguridad de la cuenta'] },
  { m: 'post', p: `${E}/seguridad/totp`, tag: 'seguridad', s: 'Empezar a activar la app autenticadora: la clave se muestra una vez y nunca se guarda en el navegador', body: 'Reautenticacion', ok: [200, 'AltaTotp', 'Clave para escanear (vence en 10 minutos)'], err: [400, 401, 429] },
  { m: 'post', p: `${E}/seguridad/totp/confirmacion`, tag: 'seguridad', s: 'Confirmar la app autenticadora con un código: queda activa y devuelve los 10 códigos de respaldo (se muestran una vez)', body: 'ConfirmarTotp', ok: [200, 'CodigosRespaldo', 'Códigos de respaldo'], err: [400, 409, 429] },
  { m: 'put', p: `${E}/seguridad/segunda-verificacion`, tag: 'seguridad', s: 'Activar o apagar un método de la segunda verificación (con la contraseña o un código)', body: 'CambioSegundaVerificacion', ok: [200, 'Seguridad', 'Seguridad actualizada'], err: [400, 401, 409, 503] },
  { m: 'post', p: `${E}/seguridad/codigos-respaldo`, tag: 'seguridad', s: 'Generar otros códigos de respaldo (los anteriores dejan de valer)', body: 'Reautenticacion', ok: [200, 'CodigosRespaldo', 'Códigos nuevos'], err: [400, 401, 409] },
  { m: 'delete', p: `${E}/seguridad/dispositivos/{id}`, tag: 'seguridad', s: 'Cerrar la sesión de un teléfono y olvidarlo. Uno ajeno o inexistente responde igual', ok: [204, null, 'Cerrada'] },
  { m: 'put', p: `${E}/seguridad/clave`, tag: 'seguridad', s: 'Cambiar la contraseña (cierra las sesiones de los otros teléfonos)', body: 'CambioClave', ok: [204, null, 'Cambiada'], err: [400, 401, 429] },
  { m: 'put', p: `${E}/seguridad/telefono`, tag: 'seguridad', s: 'Cambiar el teléfono: manda un código por SMS al nuevo (503 sin proveedor autorizado)', body: 'CambioTelefono', ok: [200, 'CodigoEnviado', 'Código enviado'], err: [400, 429, 503] },
  { m: 'post', p: `${E}/seguridad/telefono/verificacion`, tag: 'seguridad', s: 'Verificar el teléfono nuevo con el código del SMS', body: 'CodigoTelefono', ok: [200, 'Seguridad', 'Teléfono verificado'], err: [400, 429] },

  // ── Registro por pasos y onboarding ──
  { m: 'get', p: `${E}/registro`, tag: 'registro', s: 'Estado del registro por pasos y del alta (RG-1 a RG-10, D6-Alta, CU-Datos). Nunca el domicilio, los números completos ni archivos', ok: [200, 'RegistroEspecialista', 'Registro'] },
  { m: 'put', p: `${E}/registro/datos`, tag: 'registro', s: 'Paso 1: nombre y apellido', body: 'GuardarDatosRegistro', ok: [200, 'RegistroEspecialista', 'Guardado'], err: [400, 409] },
  { m: 'put', p: `${E}/registro/domicilio`, tag: 'registro', s: 'Paso 2: domicilio, cifrado; nunca se le muestra a nadie', body: 'GuardarDomicilio', ok: [200, 'RegistroEspecialista', 'Guardado'], err: [400, 409] },
  { m: 'put', p: `${E}/registro/rubros`, tag: 'registro', s: 'Paso 3: rubros. Gas y Aire acondicionado piden matrícula para habilitarse', body: 'GuardarRubrosRegistro', ok: [200, 'RegistroEspecialista', 'Guardado'], err: [400, 409] },
  { m: 'put', p: `${E}/registro/zonas`, tag: 'registro', s: 'Paso 4: barrios donde querés trabajar', body: 'GuardarZonas', ok: [200, 'RegistroEspecialista', 'Guardado'], err: [400, 409] },
  { m: 'post', p: `${E}/registro/selfie`, tag: 'registro', s: 'Paso 5: la selfie (cifrada; solo la ve Operations para compararla con el DNI)', body: { multipart: { foto: archivo('JPEG, PNG o WebP de hasta 5 MB, por sus bytes'), version: 'integer' }, requeridos: ['foto', 'version'] }, ok: [200, 'RegistroEspecialista', 'Cargada (no verificada)'], err: [400, 409, 413, 415] },
  { m: 'post', p: `${E}/registro/dni`, tag: 'registro', s: 'Paso 6: DNI de frente y dorso y su número (cifrado + HMAC; se borra a los 90 días de verificar)', body: { multipart: { frente: archivo('JPEG, PNG o WebP de hasta 5 MB'), dorso: archivo('JPEG, PNG o WebP de hasta 5 MB'), numero: 'string:^\\d{7,8}$', version: 'integer' }, requeridos: ['frente', 'dorso', 'numero', 'version'] }, ok: [200, 'RegistroEspecialista', 'Cargado (no verificado)'], err: [400, 409, 413, 415] },
  { m: 'put', p: `${E}/registro/cuit`, tag: 'registro', s: 'Paso 7: CUIT o CUIL y cómo facturás', body: 'GuardarCuit', ok: [200, 'RegistroEspecialista', 'Guardado'], err: [400, 409] },
  { m: 'post', p: `${E}/registro/certificados`, tag: 'registro', s: 'Paso 8: una matrícula o un certificado en foto o PDF. Solo Operations verifica', body: { multipart: { archivo: archivo('JPEG, PNG, WebP (5 MB) o PDF (10 MB), por sus bytes'), datos: 'CamposCertificado' }, requeridos: ['archivo', 'datos'] }, ok: [201, 'Certificado', 'Cargado (no verificado)'], err: [400, 409, 413, 415] },
  { m: 'delete', p: `${E}/registro/certificados/{id}`, tag: 'registro', s: 'Quitar un certificado cargado (uno verificado no se borra desde la app)', ok: [204, null, 'Quitado'], err: [404, 409] },
  { m: 'post', p: `${E}/registro/antecedentes`, tag: 'registro', s: 'Paso 9: certificado de antecedentes penales en foto o PDF', d: 'Dato sensible: cifrado, URL firmada corta, lo ve solo Operations, nunca a IA y se borra al verificarlo (queda la constancia). Requiere revisión legal antes de producción.', body: { multipart: { archivo: archivo('JPEG, PNG, WebP (5 MB) o PDF (10 MB), por sus bytes') }, requeridos: ['archivo'] }, ok: [200, 'RegistroEspecialista', 'Cargado (no verificado)'], err: [400, 409, 413, 415] },
  { m: 'post', p: `${E}/registro/envio`, tag: 'registro', s: 'Paso 10: aceptar los textos para especialistas y mandar el alta a revisión', body: 'EnvioRegistro', ok: [200, 'RegistroEspecialista', 'Enviada'], err: [400, 409] },
  { m: 'get', p: `${E}/onboarding`, tag: 'registro', s: 'Bienvenida al quedar habilitado y primeros pasos (ninguno es obligatorio)', ok: [200, 'Onboarding', 'Onboarding'] },
  { m: 'put', p: `${E}/onboarding`, tag: 'registro', s: 'Marcar la bienvenida como vista o un primer paso como hecho', body: 'MarcarOnboarding', ok: [200, 'Onboarding', 'Guardado'], err: [400, 409] },

  // ── Mapa de arreglos ──
  { m: 'get', p: `${E}/mapa/destinos`, tag: 'mapa', s: 'Destinos para «Me voy hasta…»: barrios y localidades cercanas (Batán, Sierra de los Padres…)', ok: [200, 'DestinoMapa', 'Destinos', 'lista'] },
  { m: 'post', p: `${E}/mapa/pedidos`, tag: 'mapa', s: 'Pedidos cercanos y zonas con actividad desde tus zonas, un destino o un barrio. Solo lee', d: 'Es un POST para que la posición vaya en el cuerpo (nunca en la URL); no se guarda. Zona aproximada siempre, sin tiempos de llegada.', body: 'BusquedaMapa', ok: [200, 'MapaPedidos', 'Pedidos y zonas'], err: [400, 403] },
  { m: 'get', p: `${E}/mapa/pedidos/{id}`, tag: 'mapa', s: 'Detalle del pedido para la hoja del mapa (F-Pedido): lo que contó el cliente, fotos y zona aproximada', ok: [200, 'PedidoEntrante', 'Pedido'], err: [404] },
  { m: 'get', p: `${E}/mapa/eventos`, tag: 'mapa', s: 'Pedidos que llegan solos (SSE) con Disponible prendido y la app abierta. Avisar nunca acepta', ok: [200, 'EventoMapa', 'Flujo text/event-stream: un EventoMapa en JSON por evento', 'sse'], err: [403] },
  { m: 'post', p: `${E}/pedidos/{id}/descarte`, tag: 'mapa', s: '«Ahora no»: sacar un pedido de tu mapa. No tiene ninguna consecuencia', ok: [204, null, 'Descartado'] },

  // ── Presupuestos, lista de precios y mano de obra ──
  { m: 'get', p: `${E}/presupuestos`, tag: 'presupuestos', s: 'Tus presupuestos', q: [['estado', { type: 'string', enum: ['abiertos', 'todos'] }], cursor], ok: [200, 'Presupuesto', 'Página', 'pagina'] },
  { m: 'post', p: `${E}/presupuestos`, tag: 'presupuestos', s: 'Empezar un presupuesto para un pedido, un trabajo o una obra (desde cero o una plantilla)', body: 'NuevoPresupuesto', idem: true, ok: [201, 'Presupuesto', 'Borrador'], err: [400, 404] },
  { m: 'get', p: `${E}/presupuestos/{id}`, tag: 'presupuestos', s: 'Un presupuesto (avisa si un precio que se actualiza cambió)', ok: [200, 'Presupuesto', 'Presupuesto'], err: [404] },
  { m: 'get', p: `${E}/presupuestos/{id}/versiones`, tag: 'presupuestos', s: 'Historial de versiones, la más nueva primero', ok: [200, 'Presupuesto', 'Versiones', 'lista'], err: [404] },
  { m: 'post', p: `${E}/presupuestos/{id}/materiales`, tag: 'presupuestos', s: 'Agregar uno o varios materiales (de tu lista, de un kit o a mano). Solo en borrador', body: 'AgregarMateriales', ok: [200, 'Presupuesto', 'Presupuesto actualizado'], err: [400, 409] },
  { m: 'patch', p: `${E}/presupuestos/{id}/materiales/{itemId}`, tag: 'presupuestos', s: 'Cambiar la cantidad o las opciones de un material (cobrar, gasto, precio fijo o que se actualiza)', body: 'CambioItemMaterial', ok: [200, 'Presupuesto', 'Presupuesto actualizado'], err: [400, 409] },
  { m: 'delete', p: `${E}/presupuestos/{id}/materiales/{itemId}`, tag: 'presupuestos', s: 'Quitar un material (solo en borrador)', ok: [200, 'Presupuesto', 'Presupuesto actualizado'], err: [409] },
  { m: 'post', p: `${E}/presupuestos/{id}/mano-de-obra`, tag: 'presupuestos', s: 'Agregar mano de obra (de tus tarifas o a mano)', body: 'AgregarManoObra', ok: [200, 'Presupuesto', 'Presupuesto actualizado'], err: [400, 409] },
  { m: 'delete', p: `${E}/presupuestos/{id}/mano-de-obra/{itemId}`, tag: 'presupuestos', s: 'Quitar mano de obra (solo en borrador)', ok: [200, 'Presupuesto', 'Presupuesto actualizado'], err: [409] },
  { m: 'post', p: `${E}/presupuestos/{id}/envio`, tag: 'presupuestos', s: 'Mandarlo directo por el chat (llega como tarjeta). La versión anterior, si había, queda reemplazada', body: 'EnvioPresupuesto', idem: true, ok: [200, 'Presupuesto', 'Enviado'], err: [400, 409] },
  { m: 'post', p: `${E}/presupuestos/{id}/version-nueva`, tag: 'presupuestos', s: 'Armar otra versión de uno enviado (borrador con los precios de hoy)', body: 'ConVersion', idem: true, ok: [201, 'Presupuesto', 'Borrador de la versión nueva'], err: [409] },
  { m: 'post', p: `${E}/presupuestos/{id}/plantilla`, tag: 'presupuestos', s: 'Guardar como plantilla (sin el cliente ni el trabajo)', body: 'NuevaPlantilla', ok: [201, 'PlantillaPresupuesto', 'Plantilla'], err: [400] },
  { m: 'get', p: `${E}/presupuestos/plantillas`, tag: 'presupuestos', s: 'Tus plantillas', ok: [200, 'PlantillaPresupuesto', 'Plantillas', 'lista'] },
  { m: 'delete', p: `${E}/presupuestos/plantillas/{id}`, tag: 'presupuestos', s: 'Borrar una plantilla', ok: [204, null, 'Borrada'] },
  { m: 'get', p: `${E}/presupuestos/kits`, tag: 'presupuestos', s: 'Kits para agregar varios materiales de una vez (los de Handyx sin precios)', q: [['rubro', { $ref: '#/components/schemas/Rubro' }]], ok: [200, 'KitMateriales', 'Kits', 'lista'] },
  { m: 'get', p: `${E}/presupuestos/preferencias`, tag: 'presupuestos', s: 'Cómo agregás materiales por defecto', ok: [200, 'PreferenciasMaterial', 'Preferencias'] },
  { m: 'put', p: `${E}/presupuestos/preferencias`, tag: 'presupuestos', s: 'Cambiar cómo agregás materiales por defecto', body: 'PreferenciasMaterial', ok: [200, 'PreferenciasMaterial', 'Guardadas'], err: [400, 409] },
  { m: 'get', p: `${E}/precios`, tag: 'precios', s: 'Tu lista de precios por categoría, con lo viejo marcado', q: [['categoria', { type: 'string' }], ['q', { type: 'string', maxLength: 80 }], ['viejos', { type: 'boolean' }], cursor], ok: [200, 'PrecioMaterial', 'Página', 'pagina'] },
  { m: 'post', p: `${E}/precios`, tag: 'precios', s: 'Agregar un precio a mano o un material nuevo (el nombre se propone al catálogo; el precio nunca)', body: 'NuevoPrecio', idem: true, ok: [201, 'PrecioMaterial', 'Precio'], err: [400] },
  { m: 'get', p: `${E}/precios/{id}`, tag: 'precios', s: 'Detalle de un precio y cómo varió', ok: [200, 'PrecioDetalle', 'Precio'], err: [404] },
  { m: 'patch', p: `${E}/precios/{id}`, tag: 'precios', s: 'Cambiar un precio (los presupuestos abiertos con precio que se actualiza avisan)', body: 'CambioPrecio', ok: [200, 'PrecioMaterial', 'Precio'], err: [400, 409] },
  { m: 'delete', p: `${E}/precios/{id}`, tag: 'precios', s: 'Quitar un precio de tu lista (los presupuestos ya armados no cambian)', ok: [204, null, 'Quitado'] },
  { m: 'post', p: `${E}/precios/lectura/revision`, tag: 'precios', s: 'Revisar lo leído de la lista del corralón: qué sube, baja, queda igual o es nuevo. No guarda nada', d: 'La foto se lee en el teléfono y nunca se manda: van solo las filas.', body: 'LecturaLista', ok: [200, 'RevisionLectura', 'Comparación'], err: [400] },
  { m: 'post', p: `${E}/precios/lectura`, tag: 'precios', s: 'Guardar los precios leídos y revisados', body: 'LecturaLista', idem: true, ok: [200, 'ResultadoLectura', 'Guardados'], err: [400] },
  { m: 'get', p: `${E}/mano-de-obra`, tag: 'precios', s: 'Tus tarifas de mano de obra: hora, visita, urgencia y por tarea', ok: [200, 'ManoDeObra', 'Tarifas'] },
  { m: 'put', p: `${E}/mano-de-obra`, tag: 'precios', s: 'Cambiar hora, visita y recargo de urgencia (lo decidís vos)', body: 'GuardarTarifasBase', ok: [200, 'ManoDeObra', 'Guardadas'], err: [400, 409] },
  { m: 'post', p: `${E}/mano-de-obra/tareas`, tag: 'precios', s: 'Agregar una tarifa por tarea', body: 'NuevaTarifaTarea', ok: [201, 'TarifaTarea', 'Tarifa'], err: [400] },
  { m: 'patch', p: `${E}/mano-de-obra/tareas/{id}`, tag: 'precios', s: 'Cambiar una tarifa por tarea', body: 'CambioTarifaTarea', ok: [200, 'TarifaTarea', 'Tarifa'], err: [400, 409] },
  { m: 'delete', p: `${E}/mano-de-obra/tareas/{id}`, tag: 'precios', s: 'Quitar una tarifa por tarea', ok: [204, null, 'Quitada'] },
  { m: 'get', p: `${E}/catalogo/materiales`, tag: 'precios', s: 'Buscar en el catálogo de nombres de Handyx (sin precios)', q: [['q', { type: 'string', minLength: 2, maxLength: 80 }, true], ['categoria', { type: 'string' }]], ok: [200, 'MaterialCatalogo', 'Hasta 30 nombres', 'lista'] },
  { m: 'get', p: `${E}/catalogo/codigos`, tag: 'equipamiento', s: 'Nombre sugerido para un código de barras leído en el teléfono (sin precios)', q: [['codigo', { type: 'string', pattern: '^[0-9A-Za-z-]{4,32}$' }, true]], ok: [200, 'SugerenciaCodigo', 'Sugerencia'] },

  // ── Ingresos, gastos y cobros ──
  { m: 'get', p: `${E}/ingresos`, tag: 'ingresos', s: 'Tus ingresos del mes: bruto (verificado, informado y por fuera), gastos, neto y ganancia por trabajo. Sin comisión de Handyx', q: [mes], ok: [200, 'ResumenIngresos', 'Resumen'] },
  { m: 'get', p: `${E}/ingresos/exportacion`, tag: 'ingresos', s: 'Exportar el mes (CSV, solo para vos)', q: [mes], ok: [200, null, 'Planilla del mes', 'csv'] },
  { m: 'get', p: `${E}/ingresos/cobros`, tag: 'ingresos', s: 'Cobros del mes con su estado (informado ≠ verificado)', q: [mes, cursor], ok: [200, 'Cobro', 'Página', 'pagina'] },
  { m: 'get', p: `${E}/pagos/{id}/cobro`, tag: 'ingresos', s: 'Un cobro (reemplaza la vista Pago en las pantallas nuevas)', ok: [200, 'Cobro', 'Cobro'], err: [404] },
  { m: 'post', p: `${E}/pagos/{id}/informe`, tag: 'ingresos', s: 'Informar cómo te pagó el cliente: efectivo, Mercado Pago o transferencia, todo o una parte (TR-Cobro)', d: 'Queda informado por vos hasta que el cliente lo confirma o se verifica. Reemplaza a /pagos/{id}/reporte.', body: 'InformeCobro', idem: true, ok: [200, 'Cobro', 'Informado'], err: [400, 409] },
  { m: 'get', p: `${E}/gastos`, tag: 'ingresos', s: 'Tus gastos (no los ve el cliente)', q: [['mes', { $ref: '#/components/schemas/Mes' }], ['trabajoId', { type: 'string', format: 'uuid' }], cursor], ok: [200, 'Gasto', 'Página', 'pagina'] },
  { m: 'post', p: `${E}/gastos`, tag: 'ingresos', s: 'Cargar un gasto a mano o con la foto del ticket; con «cobrárselo al cliente» va como adicional para que lo acepte', body: { json: 'NuevoGasto', multipart: { datos: 'NuevoGasto', ticket: archivo('JPEG, PNG o WebP de hasta 5 MB, sin metadatos') }, requeridos: ['datos'] }, idem: true, ok: [201, 'Gasto', 'Gasto'], err: [400, 404, 413, 415] },
  { m: 'patch', p: `${E}/gastos/{id}`, tag: 'ingresos', s: 'Corregir un gasto', body: 'CambioGasto', ok: [200, 'Gasto', 'Gasto'], err: [400, 409] },
  { m: 'delete', p: `${E}/gastos/{id}`, tag: 'ingresos', s: 'Borrar un gasto (si el cliente ya aceptó el adicional, el adicional sigue)', ok: [204, null, 'Borrado'] },
  { m: 'get', p: `${E}/ingresos-externos`, tag: 'ingresos', s: 'Cobros por fuera de Handyx que cargaste', q: [mes], ok: [200, 'IngresoExterno', 'Cobros por fuera', 'lista'] },
  { m: 'post', p: `${E}/ingresos-externos`, tag: 'ingresos', s: 'Cargar un cobro por fuera de Handyx', body: 'NuevoIngresoExterno', idem: true, ok: [201, 'IngresoExterno', 'Cargado'], err: [400] },
  { m: 'delete', p: `${E}/ingresos-externos/{id}`, tag: 'ingresos', s: 'Borrar un cobro por fuera', ok: [204, null, 'Borrado'] },

  // ── Equipamiento y lista de compras ──
  { m: 'get', p: `${E}/equipamiento`, tag: 'equipamiento', s: 'Tu equipamiento por categoría y ubicación, con lo que hay que mantener o reponer', ok: [200, 'ResumenEquipamiento', 'Resumen'] },
  { m: 'get', p: `${E}/equipamiento/items`, tag: 'equipamiento', s: 'Herramientas y consumibles', q: [['categoria', { type: 'string' }], ['ubicacion', { type: 'string' }], ['prestados', { type: 'boolean' }], ['q', { type: 'string', maxLength: 80 }], cursor], ok: [200, 'ItemEquipo', 'Página', 'pagina'] },
  { m: 'post', p: `${E}/equipamiento/items`, tag: 'equipamiento', s: 'Sumar una herramienta (con foto o código de barras)', body: { json: 'NuevoItemEquipo', multipart: { datos: 'NuevoItemEquipo', foto: archivo('JPEG, PNG o WebP de hasta 5 MB, sin metadatos') }, requeridos: ['datos'] }, idem: true, ok: [201, 'ItemEquipo', 'Agregada'], err: [400, 413, 415] },
  { m: 'get', p: `${E}/equipamiento/items/{id}`, tag: 'equipamiento', s: 'Una herramienta con su mantenimiento e historial (préstamos y trabajos donde se usó)', ok: [200, 'ItemEquipoDetalle', 'Herramienta'], err: [404] },
  { m: 'patch', p: `${E}/equipamiento/items/{id}`, tag: 'equipamiento', s: 'Corregir una herramienta', body: 'CambioItemEquipo', ok: [200, 'ItemEquipoDetalle', 'Herramienta'], err: [400, 409] },
  { m: 'post', p: `${E}/equipamiento/items/{id}/prestamo`, tag: 'equipamiento', s: 'Prestarla a otro profesional', body: 'PrestarEquipo', ok: [200, 'ItemEquipoDetalle', 'Prestada'], err: [400, 409] },
  { m: 'post', p: `${E}/equipamiento/items/{id}/devolucion`, tag: 'equipamiento', s: 'Volvió el préstamo', body: 'ConVersion', ok: [200, 'ItemEquipoDetalle', 'Devuelta'], err: [409] },
  { m: 'post', p: `${E}/equipamiento/items/{id}/movimiento`, tag: 'equipamiento', s: 'Moverla (camioneta, taller, obra u otro lugar)', body: 'MoverEquipo', ok: [200, 'ItemEquipoDetalle', 'Movida'], err: [400, 409] },
  { m: 'post', p: `${E}/equipamiento/items/{id}/baja`, tag: 'equipamiento', s: '«Ya no la tengo» con el motivo: sale del equipamiento y queda en el historial; se puede reponer', body: 'BajaEquipo', ok: [200, 'ResultadoBajaEquipo', 'Dada de baja'], err: [400, 409] },
  { m: 'post', p: `${E}/equipamiento/items/{id}/mantenimientos/{mantenimientoId}/hecho`, tag: 'equipamiento', s: 'Marcar un mantenimiento como hecho (calcula el próximo)', body: 'ConVersion', ok: [200, 'ItemEquipoDetalle', 'Hecho'], err: [409] },
  { m: 'get', p: `${E}/lista-compras`, tag: 'equipamiento', s: 'Tu lista de compras', ok: [200, 'ItemCompra', 'Lista', 'lista'] },
  { m: 'post', p: `${E}/lista-compras`, tag: 'equipamiento', s: 'Sumar algo a la lista de compras', body: 'NuevoItemCompra', ok: [201, 'ItemCompra', 'Sumado'], err: [400] },
  { m: 'delete', p: `${E}/lista-compras/{id}`, tag: 'equipamiento', s: 'Sacar algo de la lista de compras', ok: [204, null, 'Sacado'] },
  { m: 'post', p: `${E}/lista-compras/pedido`, tag: 'equipamiento', s: 'Pasar la lista de compras a tu pedido de ferretería (para comparar precios)', ok: [200, 'PedidoFerreteria', 'Pedido borrador'] },

  // ── Modo trabajo y cierre ──
  { m: 'get', p: `${E}/trabajos/{id}/modo`, tag: 'modo-trabajo', s: 'Modo trabajo: tareas (la seguridad primero), cronómetro, fotos y notas', ok: [200, 'ModoTrabajo', 'Modo trabajo'], err: [404, 409] },
  { m: 'post', p: `${E}/trabajos/{id}/modo/pausa`, tag: 'modo-trabajo', s: 'Pausar el cronómetro', body: 'ConVersion', ok: [200, 'ModoTrabajo', 'En pausa'], err: [409] },
  { m: 'post', p: `${E}/trabajos/{id}/modo/reanudacion`, tag: 'modo-trabajo', s: 'Seguir después de una pausa', body: 'ConVersion', ok: [200, 'ModoTrabajo', 'En curso'], err: [409] },
  { m: 'post', p: `${E}/trabajos/{id}/tareas`, tag: 'modo-trabajo', s: 'Sumar una tarea (en una obra, a una jornada y con quién la hace)', body: 'NuevaTarea', ok: [201, 'Tarea', 'Tarea'], err: [400, 409] },
  { m: 'patch', p: `${E}/trabajos/{id}/tareas/{tareaId}`, tag: 'modo-trabajo', s: 'Marcar una tarea lista, cambiarla o reordenarla', body: 'CambioTarea', ok: [200, 'Tarea', 'Tarea'], err: [400, 409] },
  { m: 'delete', p: `${E}/trabajos/{id}/tareas/{tareaId}`, tag: 'modo-trabajo', s: 'Quitar una tarea', ok: [204, null, 'Quitada'], err: [409] },
  { m: 'post', p: `${E}/trabajos/{id}/fotos`, tag: 'modo-trabajo', s: 'Sumar una foto del trabajo (antes, durante o después), achicada y sin ubicación', body: { multipart: { foto: archivo('JPEG, PNG o WebP de hasta 5 MB'), momento: 'string', tareaId: 'uuid' }, requeridos: ['foto', 'momento'] }, idem: true, ok: [201, 'ModoTrabajo', 'Foto guardada'], err: [400, 409, 413, 415] },
  { m: 'post', p: `${E}/trabajos/{id}/notas`, tag: 'modo-trabajo', s: 'Guardar una nota (dictada o escrita) en el trabajo', body: 'NuevaNota', idem: true, ok: [201, 'ModoTrabajo', 'Nota guardada'], err: [400] },
  { m: 'get', p: `${E}/trabajos/{id}/antes-despues`, tag: 'modo-trabajo', s: 'Antes y después con «qué cambiaste»', ok: [200, 'AntesDespues', 'Antes y después'], err: [404] },
  { m: 'put', p: `${E}/trabajos/{id}/antes-despues`, tag: 'modo-trabajo', s: 'Elegir las fotos y escribir qué cambiaste (se suma al informe)', body: 'GuardarAntesDespues', ok: [200, 'AntesDespues', 'Guardado'], err: [400, 409] },
  { m: 'get', p: `${E}/trabajos/{id}/informe`, tag: 'modo-trabajo', s: 'El informe por secciones, que se completa solo con lo cargado', ok: [200, 'InformeTrabajo', 'Informe'], err: [404] },
  { m: 'put', p: `${E}/trabajos/{id}/informe/secciones/{seccion}`, tag: 'modo-trabajo', s: 'Completar o corregir una sección del informe', body: 'GuardarSeccionInforme', ok: [200, 'InformeTrabajo', 'Informe'], err: [400, 409] },
  { m: 'post', p: `${E}/trabajos/{id}/informe/envio`, tag: 'modo-trabajo', s: 'Mandar el informe por el chat y en PDF, y pedir la conformidad. Empieza la garantía', body: 'EnvioInforme', idem: true, ok: [200, 'InformeTrabajo', 'Enviado'], err: [400, 409] },
  { m: 'post', p: `${E}/trabajos/{id}/demora`, tag: 'modo-trabajo', s: 'Avisarle al cliente que llegás 15 o 30 minutos tarde (tarjeta en el chat; lo manda el especialista)', body: 'AvisoDemora', idem: true, ok: [201, 'MensajeChat', 'Aviso enviado'], err: [400, 409] },
  { m: 'get', p: `${E}/trabajos/{id}/adjuntos`, tag: 'modo-trabajo', s: 'Lo guardado desde el Taller (informe eléctrico, modelo 3D, plano)', ok: [200, 'AdjuntoTrabajo', 'Adjuntos', 'lista'], err: [404] },
  { m: 'post', p: `${E}/trabajos/{id}/adjuntos`, tag: 'modo-trabajo', s: 'Guardar en el trabajo algo del Taller', body: { multipart: { archivo: archivo('PDF o imagen (10 MB), GLB o USDZ (15 MB), por sus bytes'), datos: 'CamposAdjuntoTrabajo' }, requeridos: ['archivo', 'datos'] }, idem: true, ok: [201, 'AdjuntoTrabajo', 'Guardado'], err: [400, 413, 415] },
  { m: 'post', p: `${E}/trabajos/{id}/ayuda`, tag: 'equipo', s: 'Pedir ayuda: sumar un contacto profesional a este trabajo (invitación; el reparto se acuerda aparte)', body: 'SumarAyuda', ok: [201, 'InvitacionObra', 'Invitación'], err: [400, 404, 409] },

  // ── Obras ──
  { m: 'get', p: `${E}/obras`, tag: 'obras', s: 'Tus obras (en curso, próximas y terminadas), como titular o miembro', q: [['grupo', { type: 'string', enum: ['en_curso', 'proximas', 'terminadas'] }]], ok: [200, 'ObraResumen', 'Obras', 'lista'] },
  { m: 'post', p: `${E}/obras`, tag: 'obras', s: 'Proponer una obra nueva a un cliente tuyo o a uno nuevo con un enlace (F-ObraNueva)', body: 'NuevaObra', idem: true, ok: [201, 'Obra', 'Obra en borrador'], err: [400, 404] },
  { m: 'get', p: `${E}/obras/{id}`, tag: 'obras', s: 'La obra entera: avance, etapas, días, equipo, alertas y plata (la plata solo para el titular)', ok: [200, 'Obra', 'Obra'], err: [404] },
  { m: 'post', p: `${E}/obras/{id}/cancelacion`, tag: 'obras', s: 'Cancelar una obra antes de empezar (después, solo Operations)', body: 'ConVersion', ok: [200, 'Obra', 'Cancelada'], err: [409] },
  { m: 'get', p: `${E}/obras/{id}/propuesta`, tag: 'obras', s: 'La propuesta de obra (etapas, jornadas, montos y equipo)', ok: [200, 'PropuestaObra', 'Propuesta'], err: [404] },
  { m: 'put', p: `${E}/obras/{id}/propuesta`, tag: 'obras', s: 'Armar o cambiar la propuesta de obra (solo en borrador)', body: 'GuardarPropuestaObra', ok: [200, 'PropuestaObra', 'Guardada'], err: [400, 409] },
  { m: 'post', p: `${E}/obras/{id}/propuesta/envio`, tag: 'obras', s: 'Mandar la propuesta por el chat (tarjeta). El cliente la acepta o la rechaza en su app', body: 'ConVersion', idem: true, ok: [200, 'PropuestaObra', 'Enviada'], err: [409] },
  { m: 'post', p: `${E}/obras/{id}/propuesta/retiro`, tag: 'obras', s: 'Retirar la propuesta para cambiarla', body: 'ConVersion', ok: [200, 'PropuestaObra', 'Retirada'], err: [409] },
  { m: 'get', p: `${E}/obras/{id}/jornadas/{jornadaId}`, tag: 'obras', s: 'Una jornada: quién viene, tareas, avance y materiales', ok: [200, 'JornadaObra', 'Jornada'], err: [404] },
  { m: 'put', p: `${E}/obras/{id}/jornadas/{jornadaId}/personas`, tag: 'obras', s: 'Quién viene esa jornada (miembros de la obra)', body: 'PersonasJornada', ok: [200, 'JornadaObra', 'Jornada'], err: [400, 409] },
  { m: 'post', p: `${E}/obras/{id}/jornadas/{jornadaId}/tareas`, tag: 'obras', s: 'Sumar una tarea a la jornada y elegir quién la hace', body: 'NuevaTarea', ok: [201, 'Tarea', 'Tarea'], err: [400, 409] },
  { m: 'post', p: `${E}/obras/{id}/jornadas/{jornadaId}/cambio`, tag: 'obras', s: 'Pedir otro horario o día para esta jornada o esta y las que siguen. Hasta que el cliente acepta, siguen las fechas de ahora', body: 'CambioJornadas', idem: true, ok: [201, 'CambioJornadasPedido', 'Pedido de cambio (así queda)'], err: [400, 409] },
  { m: 'post', p: `${E}/obras/{id}/cambios/{cambioId}/retiro`, tag: 'obras', s: 'Retirar un pedido de cambio de fecha', ok: [200, 'CambioJornadasPedido', 'Retirado'], err: [409] },
  { m: 'post', p: `${E}/obras/{id}/jornadas/{jornadaId}/avance`, tag: 'obras', s: 'Cargar el avance del día con fotos y una nota (lo ve el cliente en el chat de la obra)', body: { multipart: { datos: 'NuevoAvanceJornada', fotos: 'binary[]:Hasta 4: JPEG, PNG o WebP, achicadas y sin ubicación' }, requeridos: ['datos'] }, idem: true, ok: [201, 'JornadaObra', 'Jornada con el avance'], err: [400, 409, 413, 415] },

  // ── Repuestos ──
  { m: 'get', p: `${E}/trabajos/{id}/repuestos`, tag: 'repuestos', s: 'Repuestos del trabajo u obra: esperan aprobación, aprobados y comprados', ok: [200, 'RepuestosTrabajo', 'Repuestos'], err: [404] },
  { m: 'post', p: `${E}/trabajos/{id}/repuestos`, tag: 'repuestos', s: '«Lo consigo yo»: cargar un repuesto con tu precio (y mandarlo a aprobar si se lo cobrás al cliente)', body: 'NuevoRepuesto', idem: true, ok: [201, 'Repuesto', 'Repuesto'], err: [400, 409] },
  { m: 'post', p: `${E}/trabajos/{id}/repuestos/{repuestoId}/aprobacion`, tag: 'repuestos', s: 'Mandarlo a aprobar por el chat (tarjeta para el cliente)', body: 'ConVersion', idem: true, ok: [200, 'Repuesto', 'Esperando aprobación'], err: [409] },
  { m: 'post', p: `${E}/trabajos/{id}/repuestos/{repuestoId}/recordatorio`, tag: 'repuestos', s: 'Recordarle al cliente que falta aprobarlo (lo manda el especialista, por el chat)', ok: [204, null, 'Recordado'], err: [409, 429] },
  { m: 'post', p: `${E}/trabajos/{id}/repuestos/{repuestoId}/retiro`, tag: 'repuestos', s: 'Sacarlo de aprobación para cambiarlo', body: 'ConVersion', ok: [200, 'Repuesto', 'Sin mandar'], err: [409] },
  { m: 'post', p: `${E}/trabajos/{id}/repuestos/{repuestoId}/compra`, tag: 'repuestos', s: 'Marcarlo comprado con el precio que pagaste y la foto del ticket (queda como gasto si elegiste)', body: { json: 'CompraRepuesto', multipart: { datos: 'CompraRepuesto', ticket: archivo('JPEG, PNG o WebP de hasta 5 MB') }, requeridos: ['datos'] }, idem: true, ok: [200, 'Repuesto', 'Comprado'], err: [400, 409, 413, 415] },
  { m: 'post', p: `${E}/trabajos/{id}/repuestos/{repuestoId}/cancelacion`, tag: 'repuestos', s: 'Ya no hace falta', body: 'ConVersion', ok: [200, 'Repuesto', 'Cancelado'], err: [409] },

  // ── Equipo, búsquedas y reparto ──
  { m: 'get', p: `${E}/obras/{id}/equipo`, tag: 'equipo', s: 'Quién trabaja en la obra, su parte, las invitaciones y las búsquedas', ok: [200, 'EquipoObra', 'Equipo'], err: [404] },
  { m: 'post', p: `${E}/obras/{id}/invitaciones`, tag: 'equipo', s: 'Invitar a un contacto o generar un enlace con código que vence en 48 h (solo el titular)', body: 'NuevaInvitacion', idem: true, ok: [201, 'InvitacionObra', 'Invitación'], err: [400, 403, 409] },
  { m: 'post', p: `${E}/obras/{id}/invitaciones/{invitacionId}/cancelacion`, tag: 'equipo', s: 'Cancelar una invitación pendiente', ok: [200, 'InvitacionObra', 'Cancelada'], err: [409] },
  { m: 'post', p: `${E}/invitaciones/consulta`, tag: 'equipo', s: 'Ver la obra antes de aceptar una invitación (código en el cuerpo; sin dirección)', body: 'CodigoInvitacion', ok: [200, 'ObraParaSumarse', 'Obra'], err: [404, 409, 429] },
  { m: 'post', p: `${E}/invitaciones/aceptacion`, tag: 'equipo', s: 'Aceptar una invitación (solo verificados; el código sirve una vez)', body: 'CodigoInvitacion', idem: true, ok: [200, 'MiembroObra', 'Te sumaste'], err: [403, 404, 409, 429] },
  { m: 'post', p: `${E}/invitaciones/rechazo`, tag: 'equipo', s: 'Rechazar una invitación', body: 'CodigoInvitacion', ok: [204, null, 'Rechazada'], err: [404, 409] },
  { m: 'delete', p: `${E}/obras/{id}/miembros/{miembroId}`, tag: 'equipo', s: 'Quitar a un miembro (el titular) o salir de la obra (vos)', ok: [204, null, 'Listo'], err: [403, 409] },
  { m: 'post', p: `${E}/obras/{id}/busquedas`, tag: 'equipo', s: 'Publicar una búsqueda: la ven solo verificados de la zona y del oficio; cierra sola en 24 h', body: 'NuevaBusqueda', idem: true, ok: [201, 'Busqueda', 'Publicada'], err: [400, 403, 409] },
  { m: 'post', p: `${E}/obras/{id}/busquedas/{busquedaId}/cancelacion`, tag: 'equipo', s: 'Cancelar una búsqueda abierta', ok: [200, 'Busqueda', 'Cancelada'], err: [409] },
  { m: 'get', p: `${E}/obras/{id}/busquedas/{busquedaId}/postulantes`, tag: 'equipo', s: 'Quiénes se postularon (solo el titular)', ok: [200, 'Postulacion', 'Postulantes', 'lista'], err: [403, 404] },
  { m: 'post', p: `${E}/obras/{id}/busquedas/{busquedaId}/postulantes/{postulacionId}/eleccion`, tag: 'equipo', s: 'Elegir a quién sumar (nadie entra solo): la búsqueda queda cubierta', idem: true, ok: [200, 'MiembroObra', 'Sumado al equipo'], err: [403, 409] },
  { m: 'get', p: `${E}/busquedas`, tag: 'equipo', s: '«Te buscan para una obra»: búsquedas abiertas de tu oficio y tu zona (solo si estás verificado)', ok: [200, 'BusquedaRecibida', 'Búsquedas', 'lista'], err: [403] },
  { m: 'get', p: `${E}/busquedas/{id}`, tag: 'equipo', s: 'Detalle de una búsqueda (zona aproximada; la dirección llega si te eligen)', ok: [200, 'BusquedaRecibida', 'Búsqueda'], err: [404] },
  { m: 'post', p: `${E}/busquedas/{id}/postulacion`, tag: 'equipo', s: 'Postularte con un mensaje opcional', body: 'NuevaPostulacion', idem: true, ok: [201, 'Postulacion', 'Postulado'], err: [400, 403, 409] },
  { m: 'delete', p: `${E}/busquedas/{id}/postulacion`, tag: 'equipo', s: 'Retirar tu postulación', ok: [204, null, 'Retirada'], err: [409] },
  { m: 'post', p: `${E}/busquedas/{id}/descarte`, tag: 'equipo', s: '«Ahora no»: no mostrarla más. Sin consecuencias', ok: [204, null, 'Descartada'] },
  { m: 'get', p: `${E}/profesionales/{id}`, tag: 'equipo', s: 'El perfil de otro profesional como lo ve un cliente (solo si hay relación: contacto, miembro o postulante)', ok: [200, 'PerfilProfesional', 'Perfil'], err: [404] },
  { m: 'get', p: `${E}/contactos-profesionales`, tag: 'equipo', s: 'Tus contactos profesionales (Pedir ayuda, Invitar)', ok: [200, 'ContactoProfesional', 'Contactos', 'lista'] },
  { m: 'post', p: `${E}/contactos-profesionales`, tag: 'equipo', s: 'Agregar a un profesional con el que hay relación (agregarlo dos veces devuelve el mismo)', body: 'NuevoContactoProfesional', ok: [200, 'ContactoProfesional', 'Contacto'], err: [404] },
  { m: 'delete', p: `${E}/contactos-profesionales/{id}`, tag: 'equipo', s: 'Quitar un contacto profesional', ok: [204, null, 'Quitado'] },
  { m: 'post', p: `${E}/contactos-profesionales/{id}/chat`, tag: 'chat', s: 'Abrir (o devolver) el chat de equipo con un contacto profesional', ok: [200, 'ChatResumen', 'Chat'], err: [404] },
  { m: 'get', p: `${E}/obras/{id}/reparto`, tag: 'equipo', s: 'El reparto del pago: cuánto le toca a cada uno y cómo cobra. Handyx no toca la plata', ok: [200, 'Reparto', 'Reparto'], err: [404] },
  { m: 'put', p: `${E}/obras/{id}/reparto`, tag: 'equipo', s: 'Armar el reparto (solo el titular): las partes tienen que sumar el total', body: 'GuardarReparto', ok: [200, 'Reparto', 'Guardado'], err: [400, 403, 409] },
  { m: 'post', p: `${E}/obras/{id}/reparto/envio`, tag: 'equipo', s: 'Mandar el reparto al equipo para que cada uno lo acepte', body: 'ConVersion', idem: true, ok: [200, 'Reparto', 'Enviado'], err: [400, 409] },
  { m: 'post', p: `${E}/obras/{id}/reparto/respuesta`, tag: 'equipo', s: 'Aceptar o rechazar tu parte', body: 'RespuestaReparto', ok: [200, 'Reparto', 'Respondido'], err: [400, 409] },

  // ── Chat ──
  { m: 'get', p: `${E}/chats`, tag: 'chat', s: 'Tus chats, el más reciente primero, con filtro (pedidos, obras, equipo, soporte)', q: [['filtro', { type: 'string', enum: ['todos', 'pedidos', 'obras', 'equipo', 'soporte'] }], cursor], ok: [200, 'ChatResumen', 'Página', 'pagina'] },
  { m: 'post', p: `${E}/pedidos/{id}/chat`, tag: 'chat', s: 'Abrir (o devolver) el chat de un pedido antes de contratar. No compromete nada', ok: [200, 'ChatResumen', 'Chat'], err: [404] },
  { m: 'get', p: `${E}/chats/{id}`, tag: 'chat', s: 'Un chat con sus personas, el mensaje fijado y lo que podés hacer', ok: [200, 'Chat', 'Chat'], err: [404] },
  { m: 'get', p: `${E}/chats/{id}/mensajes`, tag: 'chat', s: 'Mensajes, de los más nuevos hacia atrás (abrirlo marca leído). Un mensaje borrado vuelve sin contenido', q: [cursor], ok: [200, 'MensajeChat', 'Página', 'pagina'], err: [404] },
  { m: 'post', p: `${E}/chats/{id}/mensajes`, tag: 'chat', s: 'Mandar texto (JSON) o fotos y videos de hasta 1 minuto (multipart). La misma clave no duplica', body: { json: 'EnviarMensajeChat', multipart: { datos: 'EnviarMensajeChat', media: 'binary[]:Hasta 10: JPEG, PNG o WebP (5 MB) o MP4/WebM de hasta 60 s (25 MB), por sus bytes, sin ubicación' }, requeridos: ['datos'] }, idem: true, ok: [201, 'MensajeChat', 'Enviado'], err: [400, 404, 409, 413, 415] },
  { m: 'patch', p: `${E}/chats/{id}/mensajes/{mensajeId}`, tag: 'chat', s: 'Editar un mensaje tuyo de texto (todos ven «editado»; las tarjetas no se editan)', body: 'EditarMensaje', ok: [200, 'MensajeChat', 'Editado'], err: [400, 403, 409] },
  { m: 'delete', p: `${E}/chats/{id}/mensajes/{mensajeId}`, tag: 'chat', s: 'Borrar para todos un mensaje tuyo: se ve «Mensaje eliminado» y queda oculto y guardado por si hay un reclamo', ok: [200, 'MensajeChat', 'Borrado (sin contenido)'], err: [403, 409] },
  { m: 'post', p: `${E}/chats/{id}/mensajes/borrado`, tag: 'chat', s: 'Borrar para todos varios mensajes tuyos (los ajenos de la selección no se tocan)', body: 'SeleccionMensajes', ok: [204, null, 'Borrados'], err: [400] },
  { m: 'post', p: `${E}/chats/{id}/mensajes/reenvio`, tag: 'chat', s: 'Reenviar mensajes a otro chat tuyo (texto y fotos; las tarjetas no)', body: 'ReenvioMensajes', idem: true, ok: [201, 'MensajeChat', 'Mensajes nuevos en el otro chat', 'lista'], err: [400, 404] },
  { m: 'put', p: `${E}/chats/{id}/mensajes/{mensajeId}/reaccion`, tag: 'chat', s: 'Reaccionar (una por persona; cambiarla reemplaza la anterior)', body: 'Reaccion', ok: [200, 'MensajeChat', 'Con la reacción'], err: [400, 404] },
  { m: 'delete', p: `${E}/chats/{id}/mensajes/{mensajeId}/reaccion`, tag: 'chat', s: 'Sacar tu reacción', ok: [200, 'MensajeChat', 'Sin tu reacción'], err: [404] },
  { m: 'put', p: `${E}/chats/{id}/fijado`, tag: 'chat', s: 'Fijar un mensaje en el chat (o soltarlo con null)', body: 'Fijar', ok: [200, 'Chat', 'Chat'], err: [400, 404] },
  { m: 'put', p: `${E}/chats/{id}/silencio`, tag: 'chat', s: 'Silenciar el chat hasta una hora (o null para volver a escucharlo)', body: 'Silencio', ok: [200, 'Chat', 'Chat'], err: [400] },
  { m: 'post', p: `${E}/chats/{id}/leido`, tag: 'chat', s: 'Marcar leído hasta un mensaje', body: 'Leido', ok: [204, null, 'Marcado'] },
  { m: 'get', p: `${E}/chats/{id}/archivos`, tag: 'chat', s: 'Fotos, videos y archivos del chat', q: [['tipo', { type: 'string', enum: ['foto', 'video', 'archivo'] }], cursor], ok: [200, 'MediaChat', 'Página', 'pagina'], err: [404] },
  { m: 'post', p: `${E}/chats/{id}/miembros`, tag: 'chat', s: 'Agregar a un contacto profesional al grupo de la obra (queda invitado hasta que acepta; solo el titular)', body: 'AgregarPersona', ok: [201, 'MiembroChat', 'Invitado'], err: [400, 403, 409] },
  { m: 'post', p: `${E}/chats/{id}/salida`, tag: 'chat', s: 'Salir del grupo (solo si ya no trabajás en la obra)', ok: [204, null, 'Saliste'], err: [409] },

  // ── Ferretería ──
  { m: 'get', p: `${E}/ferreteria/categorias`, tag: 'ferreteria', s: 'Categorías del catálogo de las ferreterías adheridas', ok: [200, 'CategoriaCatalogo', 'Categorías', 'lista'] },
  { m: 'get', p: `${E}/ferreteria/productos`, tag: 'ferreteria', s: 'Productos con sus variantes, por categoría o buscando', q: [['categoria', { type: 'string' }], ['subcategoria', { type: 'string' }], ['q', { type: 'string', maxLength: 80 }], cursor], ok: [200, 'ProductoCatalogo', 'Página', 'pagina'] },
  { m: 'get', p: `${E}/ferreteria/pedido`, tag: 'ferreteria', s: 'Tu pedido en armado (uno solo, agrupado por trabajo). Si no hay, se crea vacío', ok: [200, 'PedidoFerreteria', 'Pedido borrador'] },
  { m: 'post', p: `${E}/ferreteria/pedido/items`, tag: 'ferreteria', s: 'Sumar una variante al pedido, para un trabajo o para vos', body: 'AgregarItemPedido', ok: [200, 'PedidoFerreteria', 'Pedido'], err: [400, 404] },
  { m: 'patch', p: `${E}/ferreteria/pedido/items/{itemId}`, tag: 'ferreteria', s: 'Cambiar la cantidad o las casillas de gasto y cobro', body: 'CambioItemPedido', ok: [200, 'PedidoFerreteria', 'Pedido'], err: [400, 409] },
  { m: 'delete', p: `${E}/ferreteria/pedido/items/{itemId}`, tag: 'ferreteria', s: 'Sacar algo del pedido', ok: [200, 'PedidoFerreteria', 'Pedido'] },
  { m: 'post', p: `${E}/ferreteria/comparacion`, tag: 'ferreteria', s: 'Comparar el precio de cada ferretería adherida con stock, distancia y horario. Solo lee', d: 'Es un POST para que la posición vaya en el cuerpo; no se guarda.', body: 'Comparacion', ok: [200, 'OfertaFerreteria', 'Ofertas', 'lista'], err: [400, 404] },
  { m: 'get', p: `${E}/ferreteria/pedidos`, tag: 'ferreteria', s: 'Tus pedidos mandados, el más nuevo primero', q: [cursor], ok: [200, 'PedidoFerreteria', 'Página', 'pagina'] },
  { m: 'get', p: `${E}/ferreteria/pedidos/{id}`, tag: 'ferreteria', s: 'Cómo va un pedido: enviado, confirmado con precios (y reemplazos), preparando, listo y retirado', ok: [200, 'PedidoFerreteria', 'Pedido'], err: [404] },
  { m: 'post', p: `${E}/ferreteria/pedidos/{id}/envio`, tag: 'ferreteria', s: 'Mandar el pedido a la ferretería elegida (los precios pueden cambiar hasta que confirma)', body: 'EnvioPedidoFerreteria', idem: true, ok: [200, 'PedidoFerreteria', 'Enviado'], err: [400, 409] },
  { m: 'post', p: `${E}/ferreteria/pedidos/{id}/items/{itemId}/reemplazo`, tag: 'ferreteria', s: 'Aceptar o rechazar un reemplazo sugerido por la ferretería', body: 'RespuestaReemplazo', ok: [200, 'PedidoFerreteria', 'Pedido'], err: [400, 409] },
  { m: 'post', p: `${E}/ferreteria/pedidos/{id}/cancelacion`, tag: 'ferreteria', s: 'Cancelar el pedido (antes de retirarlo)', body: 'ConVersion', ok: [200, 'PedidoFerreteria', 'Cancelado'], err: [409] },
  { m: 'get', p: `${E}/ferreteria/pedidos/{id}/retiro`, tag: 'ferreteria', s: 'El QR de retiro (firmado y de un solo uso) y la lista para el mostrador', ok: [200, 'Retiro', 'Retiro'], err: [404, 409] },

  // ── Camino Handyx ──
  { m: 'get', p: `${E}/camino`, tag: 'camino', s: 'Tu camino: lo verificado, el próximo premio, el kit de bienvenida y los mini caminos. Nada se resta', ok: [200, 'Camino', 'Camino'] },
  { m: 'get', p: `${E}/camino/caminos/{id}`, tag: 'camino', s: 'Un camino con sus hitos y premios (todos a la vista de antemano; sin azar)', ok: [200, 'MiniCamino', 'Camino'], err: [404] },
  { m: 'post', p: `${E}/camino/celebraciones/{hitoId}`, tag: 'camino', s: 'Marcar celebrado un hito (el regalo aparece una sola vez)', ok: [204, null, 'Celebrado'] },
  { m: 'get', p: `${E}/camino/premios`, tag: 'camino', s: 'Vitrina: los premios ganados y su canje', ok: [200, 'PremioGanado', 'Premios', 'lista'] },
  { m: 'post', p: `${E}/camino/premios/{hitoId}/canje`, tag: 'camino', s: 'Canjear un premio disponible: talle, color y retiro o envío (la dirección se guarda cifrada)', body: 'NuevoCanje', idem: true, ok: [201, 'Canje', 'Canje pedido'], err: [400, 409] },
  { m: 'post', p: `${E}/camino/canjes/{id}/cancelacion`, tag: 'camino', s: 'Cancelar un canje antes de que lo preparen (el premio vuelve a estar disponible)', body: 'ConVersion', ok: [200, 'Canje', 'Cancelado'], err: [409] },
  { m: 'put', p: `${E}/camino/kit`, tag: 'camino', s: 'Elegir el talle de la remera, cómo querés el manual y dónde retirarlo', body: 'ElegirKit', ok: [200, 'KitBienvenida', 'Elegido'], err: [400, 409] },
  { m: 'get', p: `${E}/camino/insignias`, tag: 'camino', s: 'Insignias por usar la app (sin premio físico)', ok: [200, 'Insignia', 'Insignias', 'lista'] },
  { m: 'get', p: `${E}/camino/manual`, tag: 'camino', s: 'Los 6 capítulos del manual y cuáles leíste', ok: [200, 'CapituloManual', 'Capítulos', 'lista'] },
  { m: 'post', p: `${E}/camino/manual/{capitulo}/lectura`, tag: 'camino', s: 'Marcar leído un capítulo (leerlo entero da una insignia)', ok: [200, 'CapituloManual', 'Capítulos', 'lista'], err: [404] },
  { m: 'get', p: `${E}/camino/puntos-retiro`, tag: 'camino', s: 'Puntos Handyx y ferreterías aliadas para retirar premios', ok: [200, 'PuntoRetiro', 'Puntos', 'lista'] },

  // ── Agenda y tu día ──
  { m: 'get', p: `${E}/agenda/resumen`, tag: 'agenda', s: 'Pasadas, hoy y futuras, la semana de un vistazo y lo cobrado del mes', ok: [200, 'ResumenAgenda', 'Resumen'] },
  { m: 'get', p: `${E}/agenda/turnos`, tag: 'agenda', s: 'Turnos de una vista: pasadas (con su cobro), hoy o futuras', q: [['vista', { type: 'string', enum: ['pasadas', 'hoy', 'futuras'] }, true], cursor], ok: [200, 'TurnoAgenda', 'Página', 'pagina'] },
  { m: 'get', p: `${E}/agenda/mes`, tag: 'agenda', s: 'El mes completo con obras y trabajos por día', q: [mes, ['filtro', { type: 'string', enum: ['todo', 'obras', 'trabajos'] }]], ok: [200, 'AgendaMes', 'Mes'] },
  { m: 'get', p: `${E}/agenda/dias/{fecha}`, tag: 'agenda', s: 'Los turnos de un día del mes', ok: [200, 'TurnoAgenda', 'Turnos', 'lista'], err: [400] },
  { m: 'get', p: `${E}/dia`, tag: 'agenda', s: 'Tu día: las paradas de hoy en orden con el tramo entre una y otra', ok: [200, 'Dia', 'Tu día'] },
  { m: 'post', p: `${E}/dia/recorrido`, tag: 'agenda', s: 'Tu día con el primer tramo desde donde estás (la posición va en el cuerpo y no se guarda). Solo lee', body: 'RecorridoDia', ok: [200, 'Dia', 'Tu día'], err: [400] },
  { m: 'put', p: `${E}/dia/orden`, tag: 'agenda', s: 'Reordenar las paradas de hoy (no le cambia el horario a ningún cliente)', body: 'OrdenParadas', ok: [200, 'Dia', 'Tu día'], err: [400, 409] },

  // ── Cuenta ──
  { m: 'get', p: `${E}/perfil/propio`, tag: 'cuenta', s: 'Tu perfil como lo ven los clientes, con lo que está en revisión aparte (CU-Perfil)', ok: [200, 'PerfilPropio', 'Perfil'] },
  { m: 'put', p: `${E}/perfil/presentacion`, tag: 'cuenta', s: 'Cambiar tu presentación corta', body: 'GuardarPresentacion', ok: [200, 'PerfilPropio', 'Perfil'], err: [400, 409] },
  { m: 'post', p: `${E}/perfil/foto`, tag: 'cuenta', s: 'Cambiar tu foto de perfil (pública; no es la selfie de verificación)', body: { multipart: { foto: archivo('JPEG, PNG o WebP de hasta 5 MB, sin metadatos') }, requeridos: ['foto'] }, ok: [200, 'PerfilPropio', 'Perfil'], err: [400, 413, 415] },
  { m: 'get', p: `${E}/bandeja`, tag: 'cuenta', s: 'Todos tus avisos (reemplaza a /avisos). Cada uno abre su detalle; ninguno acepta nada', q: [cursor], ok: [200, 'AvisoBandeja', 'Página', 'pagina'] },
  { m: 'post', p: `${E}/bandeja/{id}/leido`, tag: 'cuenta', s: 'Marcar leído un aviso', ok: [204, null, 'Marcado'] },
  { m: 'delete', p: `${E}/bandeja/{id}`, tag: 'cuenta', s: 'Borrar un aviso (lo importante sigue en su pantalla)', ok: [204, null, 'Borrado'] },
  { m: 'delete', p: `${E}/bandeja`, tag: 'cuenta', s: 'Borrar todos los avisos', ok: [204, null, 'Borrados'] },
  { m: 'get', p: `${E}/privacidad/exportacion`, tag: 'cuenta', s: 'Estado de la descarga de tus datos (null si no pediste)', ok: [200, 'ExportacionDatos', 'Exportación o null', 'nulo'] },
  { m: 'post', p: `${E}/privacidad/exportacion`, tag: 'cuenta', s: 'Pedir tus datos: se arman en hasta 48 h y se bajan con una URL firmada corta', body: 'Reautenticacion', ok: [202, 'ExportacionDatos', 'Pedida'], err: [400, 401, 409, 429] },
];
