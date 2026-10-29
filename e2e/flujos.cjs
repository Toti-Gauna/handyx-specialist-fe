// Recorridos de punta a punta sobre la exportación estática (out/) con el origen de datos de prueba.
// Uso: npm run build && node e2e/flujos.cjs     (requiere `playwright` instalado y su Chromium)
// Cada escenario arranca con una carga completa (`?escenario=`); dentro de él se navega SIN recargar,
// porque el estado de prueba vive solo en memoria de la pestaña.
const assert = require('node:assert/strict');
const { join } = require('node:path');
const { servir } = require('./servidor.cjs');
const { chromium } = require('playwright');

const resultados = [];
async function escenario(nombre, navegador, base, pasos, { ancho = 390, alto = 844, capturas = null } = {}) {
  if (process.env.SOLO && !nombre.startsWith(process.env.SOLO)) return;
  const ctx = await navegador.newContext({ viewport: { width: ancho, height: alto }, reducedMotion: 'reduce' });
  const p = await ctx.newPage();
  const errores = [];
  p.on('pageerror', (e) => errores.push('PAGEERROR ' + e.message));
  p.on('console', (m) => m.type() === 'error' && !/Failed to load resource/.test(m.text()) && errores.push('CONSOLE ' + m.text()));
  p.setDefaultTimeout(8000);
  // Captura de un paso: la página entera, o solo lo visible si hay una hoja abierta (es fija a la ventana).
  const foto = async (n) => {
    if (!capturas) return;
    await p.locator('.esqueleto').first().waitFor({ state: 'detached', timeout: 4000 }).catch(() => undefined);
    const hoja = (await p.locator('dialog[open]').count()) > 0;
    const ruta = join(capturas, `${nombre}-${n}.png`);
    if (hoja) return p.screenshot({ path: ruta });
    // Ventana tan alta como la página: así la barra de navegación fija queda abajo, como en el teléfono.
    const vista = p.viewportSize();
    const alto = await p.evaluate(() => document.documentElement.scrollHeight);
    await p.setViewportSize({ width: vista.width, height: Math.max(alto, vista.height) });
    await p.screenshot({ path: ruta });
    await p.setViewportSize(vista);
  };
  const ctxP = { p, base, foto };
  try {
    await pasos(ctxP);
    assert.deepEqual(errores, [], 'errores de consola');
    resultados.push([nombre, 'OK']);
    console.log(`✔ ${nombre}`);
  } catch (e) {
    await p.screenshot({ path: join(capturas ?? '/tmp', `FALLO-${nombre}.png`), fullPage: true }).catch(() => undefined);
    resultados.push([nombre, 'FALLÓ: ' + e.message.split('\n')[0]]);
    console.log(`✘ ${nombre}: ${e.message.split('\n').slice(0, 5).join(' | ')}`);
  } finally {
    await ctx.close();
  }
}

// Ayudas
const panel = async (p, ...acciones) => {
  await p.getByRole('button', { name: 'Panel de prueba' }).click();
  for (const a of acciones) await p.getByRole('button', { name: a }).click();
  await p.keyboard.press('Escape');
};
const ir = async (p, texto) => { await p.getByRole('link', { name: texto }).first().click(); };
const nav = (p, n) => p.locator('nav.app-nav').getByText(n, { exact: true }).click();
const ver = (p, t, o) => p.getByText(t, o).first().waitFor();

async function main() {
  const srv = await servir();
  const base = `http://localhost:${srv.address().port}`;
  const nav_ = await chromium.launch();
  const capturas = process.env.CAPTURAS ?? null;

  await escenario('A-alta-completa-hasta-habilitar', nav_, base, async ({ p, foto }) => {
    await p.goto(`${base}/?escenario=nuevo`);
    await p.waitForURL('**/acceso/');
    await foto('01-acceso');
    await ir(p, 'Crear cuenta');
    await p.waitForURL('**/registro/');
    await foto('02-registro');
    await p.getByLabel('Email').fill('nueva@example.test');
    await p.getByLabel('Contraseña').fill('una-clave-larga-123');
    await p.getByRole('button', { name: 'Crear cuenta' }).click();
    await ver(p, 'Para crear tu cuenta tenés que aceptar los términos.');
    await foto('03-registro-aceptaciones');
    await p.getByRole('checkbox').nth(0).check();
    await p.getByRole('checkbox').nth(1).check();
    await p.getByRole('button', { name: 'Crear cuenta' }).click();
    await ver(p, '¡Tu cuenta está creada!');
    await ver(p, 'hasta el 10/12/2026');
    await foto('04-cuenta-creada-fee');
    await p.getByRole('button', { name: 'Completar mi alta' }).click();
    await p.waitForURL('**/alta/');
    // Paso 1: datos (primero con un campo vacío: el error se ve y no se avanza)
    await p.getByLabel('Nombre', { exact: true }).fill('Persona');
    await p.getByRole('button', { name: 'Guardar y seguir' }).click();
    await ver(p, 'Completá este dato para poder enviar tu alta.');
    await foto('05-alta-datos-error');
    await p.getByLabel('Apellido').fill('De Prueba');
    await p.locator('input[type=date]').fill('1990-01-31');
    await p.getByLabel('Nacionalidad').fill('Argentina');
    await p.getByLabel('Género').selectOption('otro');
    await p.getByLabel('Ciudad donde vivís').fill('Mar del Plata');
    await p.getByRole('button', { name: 'Guardar y seguir' }).click();
    // Paso 2: identidad
    await ver(p, 'Tu identidad');
    await p.getByLabel('DNI', { exact: true }).fill('30111222');
    await p.getByLabel('CUIT o CUIL', { exact: true }).fill('20301112229');
    await p.getByRole('button', { name: 'Guardar números' }).click();
    await ver(p, 'Ya cargaste el número (••••222)');
    await p.getByRole('button', { name: /Cargar un documento de prueba/ }).first().click();
    await p.getByRole('button', { name: /Cargar un documento de prueba/ }).first().waitFor({ state: 'detached' }).catch(() => undefined);
    await ver(p, 'Cargado, sin revisar');
    await p.getByRole('button', { name: /Cargar un documento de prueba/ }).first().click();
    await foto('06-alta-identidad');
    await p.getByRole('button', { name: 'Siguiente' }).click();
    // Paso 3: rubros con matrícula
    await p.getByLabel(/Plomería/).check();
    await p.getByLabel(/Gas/).check();
    await p.getByRole('button', { name: 'Guardar rubros' }).click();
    await ver(p, 'Matrícula o certificación · Gas');
    await foto('07-alta-rubros-matricula');
    await p.getByRole('button', { name: /Cargar un documento de prueba/ }).click();
    await p.getByRole('button', { name: 'Siguiente' }).click();
    // Paso 4: foto
    await p.getByRole('button', { name: /Cargar un documento de prueba/ }).click();
    await ver(p, 'Cargado, sin revisar');
    await foto('08-alta-foto');
    await p.getByRole('button', { name: 'Siguiente' }).click();
    // Paso 5: antecedentes, sin carga de archivos
    await ver(p, 'Se verifican en persona');
    await foto('09-alta-antecedentes');
    assert.equal(await p.locator('input[type=file]').count(), 0, 'no hay carga de archivos de antecedentes');
    await p.getByRole('button', { name: 'Siguiente' }).click();
    // Paso 6: resumen y envío
    await foto('10-alta-resumen');
    await p.getByRole('button', { name: 'Enviar mi alta a revisión' }).click();
    await ver(p, 'Alta enviada');
    await foto('11-alta-enviada');
    // Operations: con documentos solo cargados no se puede habilitar
    await panel(p, 'Tomar el alta en revisión');
    await ver(p, 'En revisión');
    await foto('12-alta-en-revision');
    await panel(p, 'Habilitar');
    await p.getByRole('button', { name: 'Panel de prueba' }).click();
    await ver(p, 'No se puede habilitar');
    await p.keyboard.press('Escape');
    await panel(p, 'Verificar documentos y matrículas', 'Coordinar cita presencial de antecedentes', 'Aprobar antecedentes (presencial)', 'Habilitar');
    await ver(p, 'Alta habilitada', { exact: true });
    await foto('13-alta-habilitada');
    // Primer ingreso a Inicio: modal del fee 0 %
    await nav(p, 'Inicio');
    await ver(p, 'Handy no te cobra tarifa durante la demo');
    await foto('14-modal-fee');
    await p.getByRole('button', { name: 'Entendido' }).click();
    await p.getByRole('heading', { name: 'Handy no te cobra tarifa durante la demo' }).waitFor({ state: 'detached' });
    // Sin disponibilidad declarada no hay pedidos
    await ver(p, 'No hay pedidos abiertos ahora');
    await foto('15-inicio-sin-disponibilidad');
    await ir(p, 'Cobertura, días y horarios');
    await p.getByLabel('Centro').check();
    await p.getByLabel('La Perla').check();
    await p.getByRole('button', { name: 'Guardar zonas y horarios' }).click();
    await ver(p, 'Guardamos tu disponibilidad.');
    await foto('16-disponibilidad');
    await p.getByRole('switch', { name: /programados/i }).click();
    await ver(p, 'Encendido: ves pedidos para otro día');
    await nav(p, 'Inicio');
    await p.getByRole('link', { name: 'Ver todos' }).click();
    await p.waitForURL('**/pedidos/');
    await ver(p, 'Cambiar el flexible del inodoro');
    await foto('17-pedidos');
  }, { capturas });

  await escenario('B-opt-in-urgente-y-propuesta', nav_, base, async ({ p, foto }) => {
    await p.goto(`${base}/`);
    await p.waitForURL('**/inicio/');
    await ver(p, 'Tu disponibilidad');
    await p.getByRole('link', { name: 'Ver todos' }).click();
    await p.waitForURL('**/pedidos/');
    await ver(p, 'Cambiar el flexible del inodoro');
    assert.equal(await p.getByText('Pérdida debajo de la bacha').count(), 0, 'con "Ahora" apagado no hay urgentes');
    await ver(p, 'Tenés los pedidos urgentes apagados');
    await foto('01-pedidos-sin-urgentes');
    // Encender "Ahora": aparecen los urgentes
    await p.getByRole('link', { name: 'Cambiarlo en mi disponibilidad' }).click();
    await p.getByRole('switch', { name: /urgentes/i }).click();
    await ver(p, 'Encendido: te ofrecemos pedidos urgentes');
    await foto('02-disponibilidad-ahora');
    await nav(p, 'Inicio');
    await p.getByRole('link', { name: 'Ver todos' }).click();
    await p.waitForURL('**/pedidos/');
    await ver(p, 'Pérdida debajo de la bacha');
    await foto('03-pedidos-con-urgente');
    // Detalle del urgente: nada de datos exactos, y se envía una propuesta
    await p.getByText('Pérdida debajo de la bacha').click();
    await ver(p, 'Todavía no ves el nombre ni la dirección exacta');
    await foto('04-pedido-urgente');
    await p.getByRole('button', { name: 'Enviar una propuesta' }).click();
    await p.getByLabel('Tu precio (en pesos)').fill('45.000');
    await ver(p, 'Handy no te cobra tarifa (0 %)');
    await p.getByLabel('Qué incluye').fill('Reparación de la pérdida, materiales incluidos');
    await foto('05-hoja-propuesta');
    await p.getByRole('button', { name: 'Enviar propuesta' }).click();
    await ver(p, 'Vence en');
    await ver(p, '$ 45.000');
    await foto('06-propuesta-enviada');
    // Revocar "Ahora" corta la oferta
    await nav(p, 'Cuenta');
    await p.getByRole('link', { name: 'Mi disponibilidad y cobertura' }).click();
    await p.getByRole('switch', { name: /urgentes/i }).click();
    await ver(p, 'Apagado: no te ofrecemos pedidos urgentes');
    await foto('07-ahora-apagado');
    await nav(p, 'Inicio');
    await ver(p, 'Tus pedidos urgentes están apagados').catch(() => undefined);
  }, { capturas });

  await escenario('C-aceptar-propuesta-y-trabajo', nav_, base, async ({ p, foto }) => {
    await p.goto(`${base}/`);
    await p.waitForURL('**/inicio/');
    await p.getByRole('link', { name: 'Ver todos' }).click();
    await p.waitForURL('**/pedidos/');
    await p.getByText('Cambiar el flexible del inodoro').click();
    await ver(p, 'Propuesta del usuario');
    await foto('01-propuesta-usuario');
    // Aceptar pide confirmación y muestra el resumen del acuerdo
    await p.getByRole('button', { name: 'Aceptar propuesta' }).click();
    await ver(p, '¿Aceptar esta propuesta?');
    await ver(p, 'El acuerdo no cambia sin que las dos partes acepten');
    await foto('02-confirmar-aceptar');
    await p.getByRole('button', { name: 'Sí, aceptar' }).click();
    await p.waitForURL('**/trabajos/detalle/**');
    await ver(p, 'Agendado');
    await ver(p, '$ 38.000');
    await foto('03-trabajo-agendado');
    // Paso a paso, con "Llegué" explícito
    await p.getByRole('button', { name: 'Salgo hacia el lugar' }).click();
    await ver(p, 'En camino');
    await ver(p, 'Compartir la ubicación del teléfono es opcional');
    await foto('04-en-camino');
    await p.getByRole('button', { name: 'Llegué' }).click();
    await ver(p, 'En el lugar');
    await foto('05-en-el-lugar');
    await p.getByRole('button', { name: 'Empezar el trabajo' }).click();
    await p.getByRole('button', { name: 'Terminé el trabajo' }).waitFor();
    await foto('06-en-curso');
    await p.getByRole('button', { name: 'Terminé el trabajo' }).click();
    await ver(p, '¿Terminaste el trabajo?');
    await foto('07-confirmar-terminar');
    await p.getByRole('button', { name: 'Sí, terminé' }).click();
    await ver(p, 'Trabajo terminado');
    await ver(p, 'pagó directamente a vos, no a Handy');
    await foto('08-terminado');
    // Caja: el cobro nuevo está pendiente; informarlo no lo verifica
    await p.getByRole('link', { name: 'Caja', exact: true }).click();
    await ver(p, 'El pago va directo a vos');
    await p.getByRole('button', { name: /Informar cobro|Ya lo cobré/ }).first().click();
    await ver(p, 'Queda como reportado');
    await foto('09-informar-cobro');
    await p.getByRole('button', { name: 'Sí, ya lo cobré' }).click();
    await p.locator('dialog[open]').waitFor({ state: 'detached' });
    // La hoja se cierra con la caja ya actualizada: los $ 38.000 se suman a los $ 30.000 reportados
    assert.equal(await p.getByText('$ 68.000').count() > 0, true, 'la caja no se actualizó al cerrar la hoja');
    await foto('10-caja-reportado');
  }, { capturas });

  await escenario('D-cambio-de-fecha-y-doble-aceptacion', nav_, base, async ({ p, foto }) => {
    await p.goto(`${base}/`);
    await p.waitForURL('**/inicio/');
    await nav(p, 'Trabajos');
    await p.getByText('Plomería · Cliente de prueba 5').click();
    await p.getByRole('button', { name: 'Proponer otra fecha o cambio' }).waitFor();
    await foto('01-trabajo-agendado');
    await p.getByRole('button', { name: 'Proponer otra fecha o cambio' }).click();
    await p.getByRole('button', { name: 'Enviar propuesta de cambio' }).waitFor();
    await foto('02-hoja-cambio');
    await p.getByRole('button', { name: 'Enviar propuesta de cambio' }).click();
    await ver(p, 'Cambio esperando respuesta');
    await ver(p, 'Mientras tanto sigue valiendo el acuerdo de arriba');
    await ver(p, '$ 45.000');
    await foto('03-cambio-esperando');
    // Doble aceptación: otra persona gana la propuesta
    await nav(p, 'Mensajes');
    await p.getByText('Cliente de prueba 2').click();
    await ver(p, 'Cotizando');
    await foto('04-hilo-cotizando');
    await panel(p, 'Doble aceptación: otra persona gana la próxima respuesta');
    await p.getByRole('button', { name: 'Aceptar propuesta' }).click();
    await p.getByRole('button', { name: 'Sí, aceptar' }).click();
    await ver(p, 'Esta propuesta ya no está disponible');
    await foto('05-ya-no-disponible');
  }, { capturas });

  await escenario('E-chat-mensaje-fallido-y-reintento', nav_, base, async ({ p, foto }) => {
    await p.goto(`${base}/`);
    await p.waitForURL('**/inicio/');
    await nav(p, 'Mensajes');
    await ver(p, 'Cliente de prueba 2');
    await foto('01-mensajes');
    await p.getByText('Cliente de prueba 2').click();
    await ver(p, 'Te propongo $ 38.000').catch(() => undefined);
    await foto('02-hilo');
    await panel(p, 'Falla el próximo mensaje');
    await p.getByLabel('Escribí un mensaje').fill('Hola, sí puedo el jueves');
    await p.getByRole('button', { name: 'Enviar mensaje' }).click();
    await ver(p, 'No se envió.');
    await foto('03-mensaje-fallido');
    await p.getByRole('button', { name: 'Reintentar' }).click();
    await p.getByText('No se envió.').waitFor({ state: 'detached' });
    assert.equal(await p.getByText('Hola, sí puedo el jueves').count(), 1, 'sin duplicar');
    await foto('04-reintentado');
    // Foto de prueba en el chat previo a contratar
    await p.getByRole('button', { name: 'Enviar una foto de prueba' }).click();
    await p.getByAltText('Foto enviada en el chat').waitFor();
    await foto('05-foto-de-prueba');
  }, { capturas });

  await escenario('F-red-caida-sesion-expirada-y-baja', nav_, base, async ({ p, foto }) => {
    await p.goto(`${base}/`);
    await p.waitForURL('**/inicio/');
    await nav(p, 'Trabajos');
    await ver(p, 'Plomería · Cliente de prueba 5');
    await foto('01-trabajos');
    await panel(p, 'Sin conexión (red caída)');
    // Lo ya cargado se conserva: el error no borra la pantalla ni la reemplaza por datos de muestra
    await ver(p, 'Plomería · Cliente de prueba 5');
    await p.getByRole('tab', { name: 'Historial' }).click();
    await ver(p, 'No pudimos conectarnos');
    await foto('02-sin-red');
    await panel(p, 'Sin conexión (red caída)');
    await p.getByRole('button', { name: 'Reintentar' }).click();
    await ver(p, 'Plomería · Cliente de prueba 6');
    // Sesión expirada: aviso con salida a Entrar
    await panel(p, 'Expirar la sesión ahora');
    await nav(p, 'Agenda');
    await ver(p, 'Tu sesión expiró');
    await foto('03-sesion-expirada');
    await p.getByRole('button', { name: 'Volver a entrar' }).click();
    await p.waitForURL('**/acceso/');
    await foto('04-acceso');
    await p.getByLabel('Email').fill('especialista@example.test');
    await p.getByLabel('Contraseña').fill('clave-de-prueba-123');
    await p.getByRole('button', { name: 'Entrar' }).click();
    await p.waitForURL('**/inicio/');
    // Baja: estado honesto, sesión cerrada y cancelación
    await nav(p, 'Cuenta');
    await p.getByRole('button', { name: 'Eliminar mi cuenta y mis datos' }).click();
    await ver(p, 'Esto es una baja real, no solo cerrar sesión');
    await foto('05-confirmar-baja');
    await p.getByRole('button', { name: 'Sí, solicitar la baja' }).click();
    await p.waitForURL('**/acceso/');
    await p.getByLabel('Email').fill('especialista@example.test');
    await p.getByLabel('Contraseña').fill('clave-de-prueba-123');
    await p.getByRole('button', { name: 'Entrar' }).click();
    await p.waitForURL('**/baja/');
    await ver(p, 'Todavía no se borró nada');
    await foto('06-baja-solicitada');
    await p.getByRole('button', { name: /Cancelar la baja/ }).click();
    await p.waitForURL('**/inicio/');
  }, { capturas });

  await escenario('G-contador-fee-en-cuenta', nav_, base, async ({ p, foto }) => {
    await p.goto(`${base}/`);
    await p.waitForURL('**/inicio/');
    await nav(p, 'Cuenta');
    await ver(p, 'Tarifa de Handy durante la demo');
    await ver(p, 'Quedan 23 días');
    await ver(p, 'no es un descuento sobre tu precio');
    await foto('01-contador-fee');
    // Último día y fin de la demo
    await panel(p, '10/12 22:00 · último día de fee 0 %');
    await ver(p, 'Hoy es el último día sin tarifa de Handy');
    await foto('02-ultimo-dia');
    await panel(p, '11/12 12:00 · la demo terminó');
    await ver(p, 'La demo terminó el 10/12/2026. No hay ninguna tarifa definida.');
    await ver(p, 'Handy no aplica ninguna tarifa sin una política aprobada');
    await foto('03-demo-terminada');
  }, { capturas });

  await escenario('I-agenda-avisos-obra-soporte-caja', nav_, base, async ({ p, foto }) => {
    await p.goto(`${base}/`);
    await p.waitForURL('**/inicio/');
    // Avisos: urgente y programado se distinguen; abrir no acepta nada
    await p.getByRole('link', { name: 'Avisos' }).first().click();
    await ver(p, 'Abrir un aviso solo te muestra el detalle');
    await ver(p, 'Urgente');
    await ver(p, 'Programado');
    await foto('01-avisos');
    // Agenda: un día con trabajo y la oferta que se superpone
    await nav(p, 'Agenda');
    await p.getByRole('button', { name: /18 de noviembre/ }).click();
    await ver(p, 'Confirmado');
    await foto('02-agenda');
    // Obra: etapas, cada una con su estado y su importe
    await nav(p, 'Trabajos');
    await p.getByText('Albañilería · Cliente de prueba 8').click();
    await ver(p, 'Etapas de la obra');
    await ver(p, 'Etapa 2 · Pintura');
    await ver(p, 'Cada etapa se cobra por separado');
    await foto('03-obra');
    // Reclamo desde un trabajo
    await p.getByRole('link', { name: 'Pedir ayuda o hacer un reclamo' }).click();
    await p.getByLabel('Asunto').fill('Reclamo de prueba');
    await p.getByLabel('Contanos qué pasó').fill('Detalle del reclamo de prueba');
    await foto('04-nuevo-reclamo');
    await p.getByRole('button', { name: 'Enviar', exact: true }).click();
    await ver(p, 'Reclamo de prueba');
    await ver(p, 'Abierto');
    await foto('05-caso-abierto');
    await panel(p, 'Handy responde un caso de soporte');
    await ver(p, 'Esperando tu respuesta');
    await foto('06-caso-respondido');
    // Caja: pagos de todos los estados y simulación rotulada
    await nav(p, 'Cuenta');
    await p.getByRole('link', { name: 'Caja: pagos directos' }).click();
    for (const t of ['Pendiente', 'Reportado, sin verificar', 'Verificado', 'Falló']) await ver(p, t, { exact: true });
    await ver(p, 'Handy nunca te pide tu contraseña de Mercado Pago');
    await foto('07-caja');
    assert.equal(await p.getByText('retirar', { exact: false }).filter({ hasText: /^Retirar/ }).count(), 0, 'no hay retiros de Handy');
    await p.getByRole('button', { name: 'Ver la simulación posterior a la demo' }).click();
    await ver(p, 'SIMULACIÓN · no vigente');
    await foto('08-caja-simulacion');
    // Preferencias: avisos distintos para urgentes y programados
    await nav(p, 'Cuenta');
    await ver(p, 'Pedidos urgentes', { exact: true });
    await ver(p, 'Pedidos programados', { exact: true });
    await foto('09-cuenta-preferencias');
  }, { capturas });

  for (const [estado, texto] of [['en_revision', 'En revisión'], ['correccion', 'Hay que corregir algo'], ['rechazado', 'Alta rechazada']]) {
    await escenario(`H-alta-${estado}`, nav_, base, async ({ p, foto }) => {
      await p.goto(`${base}/?escenario=${estado}`);
      // La puerta lleva al alta mientras no esté habilitada
      await p.waitForURL('**/alta/');
      await ver(p, texto);
      await nav(p, 'Inicio');
      await ver(p, 'Todavía no recibís pedidos');
      await foto('01-inicio');
      await p.getByRole('link', { name: /alta/i }).first().click();
      await p.waitForURL('**/alta/');
      await foto('02-estado');
      if (estado === 'en_revision') assert.equal(await p.getByRole('button', { name: /Cargar/ }).count(), 0, 'en revisión no se edita');
    }, { capturas });
  }

  await escenario('J-sin-conexion-service-worker', nav_, base, async ({ p, foto }) => {
    await p.goto(`${base}/?escenario=habilitado`);
    await p.waitForURL('**/inicio/');
    await p.waitForFunction(() => Boolean(navigator.serviceWorker.controller), null, { timeout: 15000 });
    // Una navegación con el service worker activo deja guardado el HTML de esa pantalla
    await p.goto(`${base}/agenda/?escenario=habilitado`);
    await ver(p, 'número subrayado');
    await p.context().setOffline(true);
    await ver(p, 'Lo que ves puede estar desactualizado');
    await foto('01-franja');
    // Pantalla nunca visitada: la del caño roto (estática, sin datos de la cuenta)
    await p.goto(`${base}/caja/`);
    await ver(p, 'Se nos cortó el caño');
    await foto('02-sin-conexion');
    // Pantalla ya visitada: se abre su copia
    await p.goto(`${base}/agenda/?escenario=habilitado`);
    await ver(p, 'número subrayado');
    // En la caché solo hay archivos estáticos y públicos de la app: nada de la API ni de otros sitios
    const guardado = await p.evaluate(async () => {
      const urls = [];
      for (const k of await caches.keys()) for (const r of await (await caches.open(k)).keys()) urls.push(r.url);
      return urls;
    });
    assert.ok(guardado.length > 0, 'la caché está vacía');
    const raro = guardado.filter((u) => !u.startsWith(base) || !/(\/|\.(js|css|txt|woff2|webp|png|webmanifest)(\?.*)?)$/.test(u));
    assert.deepEqual(raro, [], 'archivos fuera de la lista permitida en la caché');
    await p.context().setOffline(false);
    await p.getByText('Lo que ves puede estar desactualizado').waitFor({ state: 'detached' });
  }, { capturas });

  await nav_.close();
  srv.close();
  const mal = resultados.filter(([, r]) => r !== 'OK');
  console.log(`\n${resultados.length - mal.length}/${resultados.length} recorridos OK`);
  process.exit(mal.length ? 1 : 0);
}

main();
