// Recorridos de punta a punta sobre la exportación estática (out/) con el origen de datos de prueba.
// Uso: npm run build && node e2e/flujos.cjs     (requiere `playwright` instalado y su Chromium)
// Cada escenario arranca con una carga completa (`?escenario=`); dentro de él se navega SIN recargar,
// porque el estado de prueba vive solo en memoria de la pestaña.
const assert = require('node:assert/strict');
const { join } = require('node:path');
const { servir } = require('./servidor.cjs');
const { activarMapas, esperarMapas } = require('./pantallas.cjs');
const { chromium } = require('playwright');

const resultados = [];
async function escenario(nombre, navegador, base, pasos, { ancho = 390, alto = 844, capturas = null, movimiento = 'reduce', agente = undefined } = {}) {
  if (process.env.SOLO && !nombre.startsWith(process.env.SOLO)) return;
  const ctx = await navegador.newContext({ viewport: { width: ancho, height: alto }, reducedMotion: movimiento, userAgent: agente });
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
  // Un navegador sin WebGL: el mapa no puede dibujarse y tiene que quedar el texto (lote 4.3).
  const navSinWebgl = await chromium.launch({ args: ['--disable-webgl', '--disable-3d-apis'] });
  const capturas = process.env.CAPTURAS ?? null;

  await escenario('A-alta-completa-hasta-habilitar', nav_, base, async ({ p, foto }) => {
    await p.goto(`${base}/?escenario=nuevo`);
    // Carga → bienvenida → crear cuenta en tres pasos → código por email → cuenta creada
    await p.waitForURL('**/bienvenida/');
    await foto('01-bienvenida');
    await p.getByRole('button', { name: 'Saltear' }).click();
    await ir(p, 'Crear cuenta');
    await p.waitForURL('**/registro/');
    await foto('02-registro-email');
    await p.getByLabel('Email').fill('nueva@example.test');
    await p.getByRole('button', { name: 'Siguiente' }).click();
    await p.getByLabel('Contraseña').fill('una-clave-larga-123');
    await ver(p, 'Seguridad:');
    await p.getByRole('button', { name: 'Siguiente' }).click();
    await p.getByRole('button', { name: 'Crear cuenta' }).click();
    await ver(p, 'Para crear tu cuenta tenés que aceptar los términos.');
    await foto('03-registro-aceptaciones');
    await p.getByRole('checkbox').nth(0).check();
    await p.getByRole('checkbox').nth(1).check();
    await p.getByRole('button', { name: 'Crear cuenta' }).click();
    await p.waitForURL('**/verificar/');
    await ver(p, 'nu•••@example.test');
    await foto('03b-verificar');
    await p.getByLabel('Código de 6 números').fill('482913');
    await ver(p, 'Tu cuenta está');
    await ver(p, 'hasta el 10/12/2026');
    await foto('04-cuenta-creada-fee');
    await p.getByRole('button', { name: 'Completar mi alta' }).click();
    await p.waitForURL('**/alta/');
    // Alta guiada (lote 4.4): lista con anillo de progreso y un paso por pantalla
    await ver(p, 'Completá tu');
    await ver(p, 'de 6 listos');
    await foto('05-alta-inicio');
    // Paso 1: una pregunta por pantalla (vacía: error y foco en el campo)
    await p.getByRole('button', { name: /Tus datos/ }).click();
    await ver(p, '¿Cómo te llamás?');
    await p.getByRole('button', { name: 'Siguiente' }).click();
    await ver(p, 'Completá tu nombre.');
    assert.equal(await p.evaluate(() => document.activeElement?.getAttribute('aria-invalid')), 'true', 'el foco queda en el campo con error');
    await foto('05b-alta-datos-error');
    const responder = async (etiqueta, valor) => {
      await p.getByLabel(etiqueta, { exact: true }).fill(valor);
      await p.getByRole('button', { name: 'Siguiente' }).click();
    };
    await responder('Nombre', 'Persona');
    await responder('Apellido', 'De Prueba');
    await responder('Fecha de nacimiento', '1990-01-31');
    await responder('Nacionalidad', 'Argentina');
    await p.getByLabel('Otro', { exact: true }).check();
    await p.getByRole('button', { name: 'Siguiente' }).click();
    await responder('Ciudad', 'Mar del Plata');
    await ver(p, 'Pregunta 7 de 7');
    await p.getByRole('button', { name: 'Listo' }).click();
    await ver(p, 'de 6 listos');
    // Paso 2: números, DNI con la cámara (frente y dorso, simulada) y constancia
    await p.getByRole('button', { name: /DNI y CUIT/ }).click();
    await p.getByLabel('DNI', { exact: true }).fill('30111222');
    await p.getByLabel('CUIT o CUIL', { exact: true }).fill('20301112229');
    await p.getByRole('button', { name: 'Guardar y seguir' }).click();
    await ver(p, 'Sacale una foto al frente del DNI');
    await ver(p, 'Cámara simulada: no se usa la tuya');
    await foto('06-alta-dni-frente');
    await p.getByRole('button', { name: 'Sacar foto de prueba' }).click();
    await p.getByRole('button', { name: 'Seguir con el dorso' }).click();
    await ver(p, 'Ahora, el dorso');
    await p.getByRole('button', { name: 'Sacar foto de prueba' }).click();
    await p.getByRole('button', { name: 'Usar las dos fotos' }).click();
    await ver(p, 'de CUIT o CUIL');
    await p.getByRole('button', { name: /Cargar un documento de prueba/ }).click();
    await p.getByRole('button', { name: /Cargar un documento de prueba/ }).waitFor({ state: 'detached' });
    await foto('06b-alta-constancia');
    await p.getByRole('button', { name: 'Listo' }).click();
    // Paso 3: selfie con óvalo
    await p.getByRole('button', { name: /Tu foto/ }).click();
    await p.getByRole('button', { name: 'Sacar foto de prueba' }).click();
    await foto('07-alta-selfie');
    await p.getByRole('button', { name: 'Usar esta foto' }).click();
    await ver(p, 'de 6 listos');
    // Paso 4: rubros en mosaico; Gas pide matrícula
    await p.getByRole('button', { name: /Tus rubros/ }).click();
    await p.getByRole('button', { name: /Plomería/ }).click();
    await p.getByRole('button', { name: /Gas/ }).click();
    await p.getByRole('button', { name: 'Guardar rubros' }).click();
    await ver(p, 'Matrícula o certificación');
    await p.getByRole('button', { name: /Cargar un documento de prueba/ }).click();
    await p.getByRole('button', { name: /Cargar un documento de prueba/ }).waitFor({ state: 'detached' });
    await foto('08-alta-rubros');
    await p.getByRole('button', { name: 'Listo' }).click();
    // Paso 5: zonas en el mapa y horarios en bloques
    await p.getByRole('button', { name: /Zonas y horarios/ }).click();
    await p.getByRole('button', { name: 'Centro', exact: true }).click();
    await p.getByRole('button', { name: 'La Perla', exact: true }).click();
    await p.getByRole('button', { name: 'Lunes a la mañana' }).click();
    await esperarMapas(p);
    await foto('09-alta-zonas');
    await p.getByRole('button', { name: 'Guardar zonas y horarios' }).click();
    await ver(p, '2 barrios · 1 franja');
    // Paso 6: turno de antecedentes, sin carga de archivos
    await p.getByRole('button', { name: /Antecedentes en persona/ }).click();
    await ver(p, 'No subas el certificado');
    assert.equal(await p.locator('input[type=file]').count(), 0, 'no hay carga de archivos de antecedentes');
    await p.locator('.al-horas .hx-chip:not([disabled])').first().click();
    await p.getByRole('button', { name: /^Reservar el/ }).click();
    await ver(p, 'Tu turno');
    await foto('10-alta-turno');
    await p.getByRole('button', { name: 'Listo' }).click();
    await ver(p, '6');
    // Resumen y envío
    await p.getByRole('button', { name: 'Revisar y enviar' }).click();
    await ver(p, 'Está todo para enviar');
    await foto('11-alta-resumen');
    await p.getByRole('button', { name: 'Enviar mi alta a revisión' }).click();
    await ver(p, 'Estamos revisando');
    await foto('12-alta-enviada');
    assert.equal(await p.getByRole('button', { name: /Cargar/ }).count(), 0, 'enviada no se edita');
    // Operations: con documentos solo cargados no se puede habilitar
    await panel(p, 'Tomar el alta en revisión');
    await panel(p, 'Habilitar');
    await p.getByRole('button', { name: 'Panel de prueba' }).click();
    await ver(p, 'No se puede habilitar');
    await p.keyboard.press('Escape');
    // El turno ya está reservado: Operations solo registra el resultado
    await panel(p, 'Verificar documentos y matrículas', 'Aprobar antecedentes (presencial)', 'Habilitar');
    await ver(p, 'Tu alta está');
    await foto('13-alta-habilitada');
    // Empezar → Inicio con el modal del fee 0 %
    await ir(p, 'Empezar');
    await ver(p, 'Handyx no te cobra tarifa durante la demo');
    await foto('14-modal-fee');
    await p.getByRole('button', { name: 'Entendido' }).click();
    await p.getByRole('heading', { name: 'Handyx no te cobra tarifa durante la demo' }).waitFor({ state: 'detached' });
    // Zonas y horarios ya vienen del alta; recibir pedidos se activa recién ahora
    await ver(p, 'No hay pedidos abiertos ahora');
    await foto('15-inicio-sin-disponibilidad');
    await ir(p, 'Cobertura, días y horarios');
    assert.equal(await p.getByLabel('Centro').isChecked(), true, 'las zonas del alta quedaron guardadas');
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
    await ver(p, 'Pedidos para vos');
    await ver(p, 'No disponible');
    await foto('00-inicio');
    await p.getByRole('link', { name: 'Ver todos' }).click();
    await p.waitForURL('**/pedidos/');
    await ver(p, 'Cambiar el flexible del inodoro');
    assert.equal(await p.getByText('Pérdida debajo de la bacha').count(), 0, 'con "Disponible" apagado no hay urgentes');
    await ver(p, 'No estás disponible para urgentes');
    await foto('01-pedidos-sin-urgentes');
    // Encender "Disponible" en el inicio: aparece el pedido entrante, que nunca acepta solo
    await nav(p, 'Inicio');
    await p.getByRole('switch', { name: /urgentes/i }).first().click();
    await ver(p, 'Pedido urgente para vos');
    await ver(p, 'Búsqueda abierta · quedan');
    await foto('02-pedido-entrante');
    await p.getByRole('link', { name: 'Ver y cotizar' }).click();
    await p.waitForURL('**/pedidos/detalle/**');
    await ver(p, 'Todavía no ves el nombre ni la dirección exacta');
    await ver(p, 'Handyx sugiere $ 45.000');
    await foto('03-pedido-urgente');
    // Tu precio: cuándo, el sugerido con atajos, qué incluye y lo que recibís (fee 0 %)
    await p.getByRole('link', { name: /Poner mi precio/ }).click();
    await p.waitForURL('**/pedidos/propuesta/**');
    await ver(p, '¿Cuándo podés ir?');
    await p.getByRole('button', { name: /^En 1 hora/ }).click();
    await p.getByRole('button', { name: '+ $ 2.000' }).click();
    await ver(p, '$ 47.000');
    await ver(p, 'Handyx no te cobra tarifa');
    await p.getByRole('button', { name: 'Materiales incluidos' }).click();
    await foto('04-tu-precio');
    await p.getByRole('button', { name: 'Enviar propuesta de $ 47.000' }).click();
    await p.waitForURL('**/pedidos/detalle/**');
    await ver(p, 'Esperando al cliente');
    await ver(p, 'Vence en');
    await foto('05-esperando');
    // Revocar "Disponible" corta la oferta
    await nav(p, 'Cuenta');
    await p.getByRole('link', { name: /Rubros y zonas/ }).click();
    await p.getByRole('switch', { name: /urgentes/i }).click();
    await ver(p, 'Apagado: no te ofrecemos pedidos urgentes');
    await foto('06-ahora-apagado');
    await nav(p, 'Inicio');
    await ver(p, 'No disponible');
  }, { capturas });

  await escenario('N-te-eligieron-bandeja-y-avisos', nav_, base, async ({ p, foto }) => {
    await p.goto(`${base}/pedidos/detalle/?id=00000000-0000-4000-8000-0000000000b4&escenario=habilitado`);
    await p.getByRole('link', { name: /Poner mi precio/ }).click();
    await p.waitForURL('**/pedidos/propuesta/**');
    // Sin qué incluye no se manda: el foco va al campo
    await p.locator('#tp-alcance textarea').fill('');
    await p.getByRole('button', { name: /^Enviar propuesta/ }).click();
    await p.waitForFunction(() => document.activeElement?.matches('#tp-alcance textarea'));
    await p.locator('#tp-alcance textarea').fill('Visita para ver la medianera y presupuestar');
    await p.getByRole('button', { name: /^Enviar propuesta/ }).click();
    await p.waitForURL('**/pedidos/detalle/**');
    await ver(p, 'Esperando al cliente');
    // El cliente elige: isla con enlace, confeti solo en la transición y el trabajo se abre desde acá
    await panel(p, 'Acepta tu última propuesta');
    await ver(p, '¡El cliente te eligió!');
    await p.getByRole('link', { name: 'Ver el trabajo' }).first().waitFor();
    assert.equal(await p.getByText('La búsqueda terminó', { exact: true }).count(), 0, 'te eligieron: no se muestra "la búsqueda terminó"');
    await foto('01-te-eligieron');
    await p.locator('main').getByRole('link', { name: 'Ver el trabajo' }).click();
    await p.waitForURL('**/trabajos/detalle/**');
    await ver(p, 'Agendado');
    await foto('02-trabajo');
    // Bandeja: filtros en chips y orden por cercanía (calculada en el teléfono)
    await nav(p, 'Inicio');
    await p.getByRole('link', { name: 'Ver todos' }).click();
    await p.waitForURL('**/pedidos/');
    await p.getByRole('button', { name: 'Más cerca' }).click();
    await ver(p, /A unos .* de vos/);
    await ver(p, 'Tu ubicación se usa solo en el teléfono');
    await foto('03-bandeja-cerca');
    await p.getByRole('button', { name: /^Programados/ }).click();
    assert.equal(await p.getByText('Revoque y pintura').count(), 0, 'el filtro Programados deja afuera las obras');
    // Avisos: Nuevos / Antes, borrar uno (botón accesible) y "Borrar todos" con confirmación
    await p.locator('header').getByRole('link', { name: /Avisos/ }).first().click();
    await p.waitForURL('**/notificaciones/');
    await ver(p, 'Nuevos', { exact: true });
    await ver(p, 'Antes', { exact: true });
    await foto('04-avisos');
    const antes = await p.locator('.av-item').count();
    await p.getByRole('button', { name: /^Borrar el aviso: ¡El cliente te eligió!/ }).click();
    await ver(p, 'Borraste el aviso');
    await p.waitForFunction((n) => document.querySelectorAll('.av-item').length === n - 1, antes);
    await p.getByRole('button', { name: 'Borrar todos' }).click();
    await ver(p, '¿Borrar todos los avisos?');
    await foto('05-borrar-todos');
    await p.getByRole('button', { name: 'Sí, borrar todos' }).click();
    await ver(p, 'No tenés avisos');
    await foto('06-sin-avisos');
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
    // Paso a paso. Sin compartir la ubicación no hay llegada automática: aparece el respaldo "Ya llegué" (lote 4.6)
    await p.getByRole('button', { name: 'Salgo para allá' }).click();
    await p.waitForURL('**/en-camino/?id=*');
    await ver(p, 'Como estás sin compartir la ubicación');
    await foto('04-en-camino');
    await p.getByRole('button', { name: 'Ya llegué' }).click();
    await p.waitForURL('**/trabajos/detalle/**');
    await ver(p, 'En el lugar');
    await ver(p, 'Avisaste con «Ya llegué» (sin compartir la ubicación)');
    await foto('05-en-el-lugar');
    await p.getByRole('button', { name: 'Empezar el trabajo' }).click();
    await ver(p, 'Trabajando hace');
    await foto('06-en-curso');
    await p.getByRole('button', { name: 'Terminé el trabajo' }).click();
    await ver(p, '¿Terminaste el trabajo?');
    await ver(p, 'Total a cobrar');
    await foto('07-confirmar-terminar');
    await p.getByRole('button', { name: 'Sí, terminé' }).click();
    await p.waitForURL('**/trabajos/terminado/**');
    await ver(p, '¡Terminaste el trabajo!');
    await ver(p, 'directo del cliente a vos');
    await foto('08-terminado');
    // Caja: el cobro nuevo está pendiente; informarlo no lo verifica
    await p.getByRole('link', { name: 'Ver la Caja' }).click();
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
    await p.getByRole('link', { name: /Cambiar la fecha/ }).waitFor();
    await foto('01-trabajo-agendado');
    // Cambiar la fecha (lote 4.6): motivo, día y franja; sin motivo no se manda
    await p.getByRole('link', { name: /Cambiar la fecha/ }).click();
    await p.waitForURL('**/trabajos/cambio/**');
    await p.getByRole('button', { name: 'Pedir el cambio' }).click();
    await ver(p, 'Elegí el motivo: el cliente lo ve.');
    await p.waitForFunction(() => document.activeElement?.id === 'cf-motivo');
    await p.getByRole('button', { name: 'Me falta un repuesto' }).click();
    await p.locator('.hx-tira__dia:not([disabled])').nth(1).click();
    await p.getByRole('button', { name: /Tarde · 16 a 20/ }).click();
    await ver(p, 'Le proponés el');
    await foto('02-cambiar-fecha');
    await p.getByRole('button', { name: 'Pedir el cambio' }).click();
    await p.waitForURL('**/trabajos/detalle/**');
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
    await p.waitForURL(/\/acceso\/\?motivo=sesion/);
    await ver(p, 'Por seguridad cerramos tu sesión');
    await foto('04-acceso');
    await p.getByLabel('Email').fill('especialista@example.test');
    await p.getByLabel('Contraseña').fill('clave-de-prueba-123');
    await p.getByRole('button', { name: 'Entrar' }).click();
    await p.waitForURL('**/inicio/');
    // Baja: estado honesto, sesión cerrada y cancelación
    await nav(p, 'Cuenta');
    await p.getByRole('link', { name: /Privacidad y baja/ }).click();
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
    await ver(p, 'Tarifa de Handyx durante la demo');
    await ver(p, 'Quedan 23 días');
    await ver(p, 'no es un descuento sobre tu precio');
    await foto('01-contador-fee');
    // Último día y fin de la demo
    await panel(p, '10/12 22:00 · último día de fee 0 %');
    await ver(p, 'Hoy es el último día sin tarifa de Handyx');
    await foto('02-ultimo-dia');
    await panel(p, '11/12 12:00 · la demo terminó');
    await ver(p, 'La demo terminó el 10/12/2026. No hay ninguna tarifa definida.');
    await ver(p, 'Handyx no aplica ninguna tarifa sin una política aprobada');
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
    // Obra en curso (lote 4.7): resumen con el avance, la jornada de hoy y lo cobrado
    await ver(p, 'Etapa 2: Pintura');
    await ver(p, 'Jornada de hoy');
    await ver(p, 'Falta cobrar');
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
    await panel(p, 'Handyx responde un caso de soporte');
    await ver(p, 'Esperando tu respuesta');
    await foto('06-caso-respondido');
    // Caja: pagos de todos los estados y simulación rotulada
    await nav(p, 'Cuenta');
    await p.getByRole('link', { name: 'Caja: pagos directos' }).click();
    for (const t of ['Pendiente', 'Reportado, sin verificar', 'Verificado', 'Falló']) await ver(p, t, { exact: true });
    await ver(p, 'Handyx nunca te pide tu contraseña de Mercado Pago');
    await foto('07-caja');
    assert.equal(await p.getByText('retirar', { exact: false }).filter({ hasText: /^Retirar/ }).count(), 0, 'no hay retiros de Handyx');
    await p.getByRole('button', { name: 'Ver la simulación posterior a la demo' }).click();
    await ver(p, 'SIMULACIÓN · no vigente');
    await foto('08-caja-simulacion');
    // Preferencias: avisos distintos para urgentes y programados
    await nav(p, 'Cuenta');
    await p.getByRole('link', { name: /Notificaciones/ }).click();
    await ver(p, 'Pedidos urgentes', { exact: true });
    await ver(p, 'Pedidos programados', { exact: true });
    await foto('09-cuenta-preferencias');
  }, { capturas });

  for (const [estado, texto] of [['en_revision', 'Estamos revisando'], ['correccion', 'Operations te pidió una corrección'], ['rechazado', 'No pudimos habilitar']]) {
    await escenario(`H-alta-${estado}`, nav_, base, async ({ p, foto }) => {
      await p.goto(`${base}/?escenario=${estado}`);
      // La puerta lleva al alta mientras no esté habilitada
      await p.waitForURL('**/alta/');
      await ver(p, texto);
      await foto('01-estado');
      if (estado === 'en_revision') {
        assert.equal(await p.getByRole('button', { name: /Cargar/ }).count(), 0, 'en revisión no se edita');
        // El turno de antecedentes se elige igual mientras Operations revisa
        await p.getByRole('button', { name: 'Elegir mi turno de antecedentes' }).click();
        await p.locator('.al-horas .hx-chip:not([disabled])').first().click();
        await p.getByRole('button', { name: /^Reservar el/ }).click();
        await ver(p, 'Tu turno');
        await p.getByRole('button', { name: 'Listo' }).click();
        await ver(p, 'Turno:');
        await foto('02-con-turno');
      }
      if (estado === 'correccion') {
        // Lo marcado va primero y con acceso directo; enviar queda bloqueado hasta corregirlo
        await p.getByRole('button', { name: 'Revisar y volver a enviar' }).click();
        await ver(p, 'Para enviarla todavía falta');
        assert.equal(await p.getByRole('button', { name: 'Volver a enviar mi alta' }).isDisabled(), true);
        await p.goBack();
        await p.getByRole('button', { name: 'Corregir: DNI y CUIT o CUIL' }).click();
        await ver(p, 'Sacale una foto al frente del DNI');
        await ver(p, 'La foto del DNI se ve cortada');
        await p.getByRole('button', { name: 'Sacar foto de prueba' }).click();
        await p.getByRole('button', { name: 'Seguir con el dorso' }).click();
        await p.getByRole('button', { name: 'Sacar foto de prueba' }).click();
        await p.getByRole('button', { name: 'Usar las dos fotos' }).click();
        await p.getByRole('button', { name: 'Listo' }).click();
        await ver(p, 'Ya corregiste lo marcado');
        await foto('02-corregido');
        await p.getByRole('button', { name: 'Revisar y volver a enviar' }).click();
        await p.getByRole('button', { name: 'Volver a enviar mi alta' }).click();
        await ver(p, 'Estamos revisando');
      }
      // Inicio todavía no ofrece pedidos
      await p.goto(`${base}/inicio/?escenario=${estado}`);
      await ver(p, 'Todavía no recibís pedidos');
    }, { capturas });
  }

  await escenario('K-kit-catalogo', nav_, base, async ({ p, foto }) => {
    await p.goto(`${base}/catalogo/`);
    await ver(p, 'Catálogo del kit');
    await foto('01-catalogo');
    // Mosaico: elegir y sacar un rubro
    const electricidad = p.getByRole('button', { name: /^Electricidad/ });
    await electricidad.click();
    assert.equal(await electricidad.getAttribute('aria-pressed'), 'true');
    await electricidad.click();
    assert.equal(await electricidad.getAttribute('aria-pressed'), 'false');
    // Precio: − / +, sugerido, atajos, monto escrito y mínimo
    const precio = p.locator('.hx-precio__valor');
    await p.getByRole('button', { name: 'Subir $ 500' }).click();
    await precio.getByText('$ 44.500').waitFor();
    await p.getByRole('button', { name: 'Dejar el sugerido' }).click();
    await precio.getByText('$ 44.000').waitFor();
    await p.getByRole('button', { name: '+ $ 5.000' }).click();
    await precio.getByText('$ 49.000').waitFor();
    await ver(p, 'Handyx no te cobra tarifa durante la demo (0 %)');
    await p.getByRole('button', { name: 'Escribir otro monto' }).click();
    await p.getByLabel('Escribí tu precio (en pesos)').fill('3.000');
    await p.getByRole('button', { name: 'Usar este precio' }).click();
    await precio.getByText('$ 3.000').waitFor();
    await ver(p, 'Ese valor es muy bajo');
    // Días: los pasados no se tocan; elegir el jueves 19
    assert.equal(await p.locator('.hx-tira').getByRole('button', { name: 'domingo 15 de noviembre' }).isDisabled(), true, 'día pasado habilitado');
    const jueves = p.locator('.hx-tira').getByRole('button', { name: 'jueves 19 de noviembre' });
    await jueves.click();
    assert.equal(await jueves.getAttribute('aria-pressed'), 'true');
    // Calendario: pasar de mes
    await p.getByRole('button', { name: 'Ver diciembre' }).click();
    await p.getByRole('heading', { name: 'diciembre 2026' }).waitFor();
    // Ruedas: con el teclado
    await p.getByRole('listbox', { name: 'Hora' }).focus();
    await p.keyboard.press('ArrowDown');
    await p.keyboard.press('ArrowDown');
    await ver(p, '12:00 h');
    // Isla: se anuncia y se cierra
    await p.getByRole('button', { name: 'Te eligieron' }).click();
    await p.getByRole('status').filter({ hasText: '¡El cliente te eligió!' }).waitFor();
    await foto('02-isla');
    await p.getByRole('button', { name: 'Cerrar el aviso' }).click();
    await p.getByText('¡El cliente te eligió!').waitFor({ state: 'detached' });
    // Hoja arrastrable: tocar la manija la agranda; con las flechas vuelve
    const manija = p.locator('.hx-hoja__manija');
    await manija.click();
    await manija.click();
    assert.equal(await manija.getAttribute('aria-expanded'), 'true');
    await manija.press('ArrowDown');
    assert.equal(await manija.getAttribute('aria-expanded'), 'false');
    // Barra con título grande: al bajar dentro de la pantalla aparece el título chico
    const marco = p.locator('.cat-marco__pantalla').first();
    assert.equal(await p.locator('.hx-barra--grande.hx-barra--sombra').count(), 0, 'la barra arranca sin sombra');
    await marco.evaluate((el) => el.scrollTo(0, 300));
    await p.locator('.hx-barra--grande.hx-barra--sombra').waitFor();
    // Celebrar: con "reducir movimiento" no hay confeti, pero el monto llega a su valor
    await p.getByRole('button', { name: 'Probar la celebración' }).click();
    await ver(p, '$ 47.700');
    assert.equal(await p.locator('.hx-confeti').count(), 0, 'confeti con reducir movimiento');
  }, { capturas });

  const IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Mobile/15E148 Safari/604.1';

  await escenario('L1-carga-y-bienvenida', nav_, base, async ({ p, foto }) => {
    // Con movimiento: la carga se ve, cambia de color y se saltea tocando
    await p.goto(`${base}/?escenario=nuevo`);
    const carga = p.locator('[data-carga]');
    await carga.waitFor();
    await p.waitForTimeout(400);
    await foto('01-carga');
    await carga.click();
    await carga.waitFor({ state: 'detached' });
    await p.waitForURL('**/bienvenida/');
    // Bienvenida: Siguiente, los puntos y la última lámina con las dos salidas
    await ver(p, 'Vos ponés');
    await p.getByRole('button', { name: 'Siguiente' }).click();
    await p.locator('[aria-current="true"][aria-label="Ver la lámina 2"]').waitFor();
    await p.getByRole('button', { name: 'Ver la lámina 3' }).click();
    await p.getByRole('link', { name: 'Ya tengo cuenta' }).waitFor();
    await foto('02-bienvenida-final');
    await p.getByRole('link', { name: 'Ya tengo cuenta' }).click();
    await p.waitForURL('**/acceso/');
    // En Android, Windows o Linux no se ofrece Apple
    await ver(p, 'Continuar con Google');
    assert.equal(await p.getByRole('button', { name: 'Continuar con Apple' }).count(), 0, 'Apple fuera de un dispositivo Apple');
  }, { capturas, movimiento: 'no-preference' });

  await escenario('L2-apple-en-iphone-y-cuenta-nueva', nav_, base, async ({ p, foto }) => {
    await p.goto(`${base}/acceso/?escenario=nuevo`);
    await p.getByRole('button', { name: 'Continuar con Apple' }).click();
    await ver(p, 'Elegí tu cuenta de Apple');
    await foto('01-apple');
    await p.getByRole('button', { name: /especialista\.apple@example\.test/ }).click();
    // Cuenta nueva: verificada por Apple, falta aceptar
    await p.waitForURL('**/registro/aceptar/');
    await p.getByRole('button', { name: 'Aceptar y seguir' }).click();
    await ver(p, 'Para seguir tenés que aceptar los términos.');
    await p.getByRole('checkbox').nth(0).check();
    await p.getByRole('checkbox').nth(1).check();
    await p.getByRole('button', { name: 'Aceptar y seguir' }).click();
    await ver(p, 'Tu cuenta está');
    await foto('02-cuenta-creada');
    await p.getByRole('button', { name: 'Completar mi alta' }).click();
    await p.waitForURL('**/alta/');
  }, { capturas, agente: IPHONE });

  await escenario('L3-google-cuenta-existente', nav_, base, async ({ p }) => {
    await p.goto(`${base}/acceso/?escenario=habilitado`);
    await p.getByRole('button', { name: 'Continuar con Google' }).click();
    await p.getByRole('button', { name: /especialista@example\.test/ }).click();
    await p.waitForURL('**/inicio/');
  });

  await escenario('L4-codigo-incorrecto-y-reenvio', nav_, base, async ({ p, foto }) => {
    await p.goto(`${base}/verificar/?escenario=sin_verificar`);
    await ver(p, 'cu•••@example.test');
    await ver(p, 'Podés pedir otro código en');
    assert.equal(await p.getByRole('button', { name: 'Mandarme otro código' }).count(), 0, 'reenvío antes de la espera');
    await p.getByLabel('Código de 6 números').fill('000000');
    await ver(p, 'Te quedan 4 intentos');
    await foto('01-codigo-incorrecto');
    // El foco vuelve al código para probar de nuevo
    assert.equal(await p.evaluate(() => document.activeElement?.getAttribute('autocomplete')), 'one-time-code');
    await p.getByLabel('Código de 6 números').fill('482913');
    await ver(p, 'Tu cuenta está');
  }, { capturas });

  await escenario('L5-recuperar-y-contrasena-nueva', nav_, base, async ({ p, foto }) => {
    await p.goto(`${base}/acceso/?escenario=habilitado`);
    await ir(p, 'Olvidé mi contraseña');
    await p.waitForURL('**/recuperar/');
    await p.getByLabel('Email').fill('especialista@example.test');
    await p.getByRole('button', { name: 'Mandarme el enlace' }).click();
    await ver(p, 'Por seguridad no te decimos si la cuenta existe');
    await foto('01-revisa-tu-correo');
    await p.getByRole('link', { name: 'Abrir el enlace del email' }).click();
    await ver(p, 'Elegí una contraseña');
    // El token sale de la barra de direcciones apenas se lee
    assert.equal(new URL(p.url()).search, '', 'el token quedó en la URL');
    await p.getByLabel('Contraseña nueva').fill('una-frase-nueva-y-larga');
    await ver(p, 'Muy buena');
    await foto('02-contrasena-nueva');
    await p.getByRole('button', { name: 'Guardar la contraseña' }).click();
    await ver(p, 'Tu contraseña');
    await ir(p, 'Entrar');
    await p.waitForURL('**/acceso/');
    await p.getByLabel('Email').fill('especialista@example.test');
    await p.getByLabel('Contraseña').fill('clave-de-prueba-123');
    await p.getByRole('button', { name: 'Entrar' }).click();
    await ver(p, 'El email o la contraseña no son correctos.');
    // Credenciales incorrectas no son una sesión vencida: no aparece "Tu sesión expiró"
    assert.equal(await p.getByText('Tu sesión expiró').count(), 0, 'una contraseña incorrecta abrió el aviso de sesión vencida');
    await p.getByLabel('Contraseña').fill('una-frase-nueva-y-larga');
    await p.getByRole('button', { name: 'Entrar' }).click();
    await p.waitForURL('**/inicio/');
  }, { capturas });

  await escenario('L6-enlace-vencido', nav_, base, async ({ p, foto }) => {
    await p.goto(`${base}/recuperar/?escenario=habilitado`);
    await p.getByLabel('Email').fill('especialista@example.test');
    await p.getByRole('button', { name: 'Mandarme el enlace' }).click();
    await p.getByRole('link', { name: 'Probar un enlace vencido' }).click();
    await ver(p, 'Los enlaces sirven una sola vez');
    await foto('01-vencido');
    await ir(p, 'Pedir otro enlace');
    await p.waitForURL('**/recuperar/');
  }, { capturas });

  // ── Mapa, ubicación en vivo y trayectos (lote 4.3) ──
  const mapaListo = async (p, n = 1) => {
    await activarMapas(p);
    await p.waitForFunction((k) => document.querySelectorAll('[data-mapa="listo"]').length >= k, n, { timeout: 20000 });
  };
  const chip = (p, texto) => p.locator('.vj-compartir .chip').getByText(texto).waitFor();

  await escenario('M1-zona-aproximada-del-pedido', nav_, base, async ({ p, foto }) => {
    await p.goto(`${base}/pedidos/detalle/?id=00000000-0000-4000-8000-0000000000b2&escenario=habilitado`);
    await ver(p, 'El círculo es aproximado');
    // Hasta la primera interacción el motor no se baja: se ve la zona en texto y "Ver el mapa" (lote 4.9)
    assert.equal(await p.locator('[data-mapa="en_espera"]').count(), 1);
    await ver(p, 'Zona aproximada: Centro');
    await p.getByRole('button', { name: 'Ver el mapa' }).click();
    await mapaListo(p);
    assert.equal(await p.getByRole('region', { name: 'Zona aproximada del pedido en Centro' }).count(), 1);
    // Antes del acuerdo no hay pin de destino: solo la zona
    assert.equal(await p.locator('.hx-mapa-pin').count(), 0);
    await foto('01-pedido');
  }, { capturas });

  await escenario('M2-en-camino-compartir-senal-y-llegue', nav_, base, async ({ p, foto }) => {
    await p.goto(`${base}/trabajos/detalle/?id=00000000-0000-4000-8000-0000000000c1&escenario=habilitado`);
    await ver(p, 'Cómo llegar');
    await mapaListo(p);
    assert.equal(await p.locator('.hx-mapa-pin').count(), 1);
    const google = await p.getByRole('link', { name: /Google Maps/ }).getAttribute('href');
    assert.match(google, /^https:\/\/www\.google\.com\/maps\/dir\/\?api=1&destination=-38\.\d+,-57\.\d+&travelmode=driving$/);
    assert.equal(await p.getByRole('link', { name: /Waze/ }).getAttribute('target'), '_blank');
    await p.getByRole('button', { name: 'Salgo para allá' }).click();
    await p.waitForURL('**/en-camino/?id=*');
    await ver(p, 'Compartí tu ubicación durante el viaje');
    await mapaListo(p);
    // Antes de compartir no se lee el GPS: no hay punto propio en el mapa
    assert.equal(await p.locator('.hx-mapa-yo').count(), 0);
    await foto('01-permiso');
    await panel(p, 'GPS simulado rápido (×6)');
    await p.getByRole('button', { name: 'Compartir mi ubicación' }).click();
    await chip(p, 'Ubicación precisa');
    await ver(p, 've tu ubicación mientras esta pantalla esté abierta');
    await ver(p, 'Llegás en');
    assert.equal(await p.locator('.hx-mapa-yo').count(), 1);
    await foto('02-compartiendo');
    await panel(p, 'Señal imprecisa');
    await chip(p, 'Ubicación imprecisa');
    await panel(p, 'Sin señal');
    await chip(p, 'Sin señal de ubicación');
    await panel(p, 'Permiso de ubicación negado');
    await ver(p, 'No tenemos permiso para ver tu ubicación');
    assert.equal(await p.locator('.hx-mapa-yo').count(), 0, 'sin permiso no se muestra una posición');
    await foto('03-sin-permiso');
    await panel(p, 'Señal normal');
    await p.getByRole('button', { name: 'Volver a intentar' }).click();
    await chip(p, 'Ubicación precisa');
    await p.getByRole('button', { name: 'Dejar de compartir' }).click();
    await ver(p, 'Tu ubicación está en pausa');
    await p.getByRole('button', { name: 'Seguir compartiendo' }).click();
    await chip(p, 'Ubicación precisa');
    // Con buena señal no hay "Ya llegué": la llegada se marca sola al entrar en la cuadra (geocerca, lote 4.6)
    await ver(p, 'La llegada se marca sola');
    assert.equal(await p.getByRole('button', { name: 'Ya llegué' }).count(), 0, 'con buena señal no hay respaldo');
    await p.waitForURL('**/trabajos/detalle/**', { timeout: 120000 });
    await ver(p, 'Llegada marcada sola al entrar en la cuadra');
    await ver(p, 'le avisamos al cliente');
    await foto('04-llegaste');
  }, { capturas });

  await escenario('M3-sin-mapa-queda-el-texto', navSinWebgl, base, async ({ p, foto }) => {
    await p.goto(`${base}/pedidos/detalle/?id=00000000-0000-4000-8000-0000000000b2&escenario=habilitado`);
    await ver(p, 'Zona aproximada: Centro');
    await activarMapas(p);
    await p.waitForSelector('[data-mapa="sin_mapa"]', { timeout: 20000 });
    await ver(p, 'Zona aproximada: Centro');
    await foto('01-respaldo');
  }, { capturas });

  await escenario('O-adicionales-terminaste-y-cancelar', nav_, base, async ({ p, foto }) => {
    await p.goto(`${base}/en-camino/?id=00000000-0000-4000-8000-0000000000c1&escenario=habilitado`);
    await p.getByRole('button', { name: 'Salgo para allá' }).click();
    // Con la señal imprecisa la geocerca no sirve: aparece "Ya llegué" con el motivo
    await panel(p, 'Señal imprecisa');
    await p.getByRole('button', { name: 'Compartir mi ubicación' }).click();
    await ver(p, 'Como estás ubicación imprecisa');
    await foto('01-respaldo');
    await p.getByRole('button', { name: 'Ya llegué' }).click();
    await p.waitForURL('**/trabajos/detalle/**');
    await ver(p, 'Avisaste con «Ya llegué» (ubicación imprecisa)');
    // Llamar por la app: número puente, sin mostrar teléfonos
    await p.getByRole('button', { name: /Llamar por la app/ }).click();
    await ver(p, 'Ninguno de los dos ve el teléfono del otro');
    assert.match(await p.getByRole('link', { name: 'Llamar' }).getAttribute('href'), /^tel:\+0+$/);
    await p.keyboard.press('Escape');
    await p.getByRole('button', { name: 'Empezar el trabajo' }).click();
    await ver(p, 'Trabajando hace');
    // Adicional: "Opción personalizada" primero; rige el precio vigente hasta que el cliente acepta
    await p.getByRole('link', { name: /Agregar repuestos o mano de obra/ }).click();
    await p.waitForURL('**/trabajos/adicional/**');
    assert.equal((await p.locator('.tr-opcion').first().textContent()).includes('Opción personalizada'), true);
    await p.getByRole('button', { name: /^Mandárselo al cliente/ }).click();
    await ver(p, 'Elegí qué querés agregar.');
    await p.getByRole('button', { name: /Flexible/ }).click();
    await p.getByRole('button', { name: '+ $ 5.000' }).click();
    await ver(p, 'Si lo acepta');
    await foto('02-adicional');
    await p.getByRole('button', { name: 'Mandárselo al cliente · $ 5.000' }).click();
    await p.waitForURL('**/trabajos/detalle/**');
    await ver(p, 'Esperando al cliente');
    await ver(p, 'rige el precio vigente: $ 45.000');
    await foto('03-adicional-pendiente');
    await panel(p, 'Acepta tu último adicional');
    await ver(p, 'Incluye los adicionales que aceptó el cliente');
    await ver(p, '$ 50.000');
    // Terminar: desglose con el adicional, ¡Terminaste! con el total e informar el cobro (queda reportado)
    await p.getByRole('button', { name: 'Terminé el trabajo' }).click();
    await ver(p, 'Total a cobrar');
    await p.getByRole('button', { name: 'Sí, terminé' }).click();
    await p.waitForURL('**/trabajos/terminado/**');
    await ver(p, '¡Terminaste el trabajo!');
    await ver(p, 'Total que paga el cliente');
    assert.equal(await p.locator('.tr-desglose__total dd').textContent(), '$ 50.000');
    await foto('04-terminaste');
    await p.getByRole('button', { name: /Ya me pagó|Ya lo cobré/ }).click();
    await p.getByRole('button', { name: 'Sí, ya lo cobré' }).click();
    await ver(p, 'Reportado, sin verificar');
    await foto('05-cobro-reportado');
    // Cancelar otro trabajo: primero las alternativas, después el motivo y la confirmación
    await p.goto(`${base}/trabajos/cancelar/?id=00000000-0000-4000-8000-0000000000c1&escenario=habilitado`);
    await ver(p, 'Antes de cancelar');
    await p.getByRole('button', { name: 'Cancelar el trabajo' }).click();
    await ver(p, 'Elegí el motivo.');
    await p.getByRole('button', { name: 'No me siento a salvo en el lugar' }).click();
    await ver(p, 'llamá al 911');
    await foto('06-cancelar');
    await p.getByRole('button', { name: 'Cancelar el trabajo' }).click();
    await ver(p, '¿Cancelar este trabajo?');
    await p.getByRole('button', { name: 'Sí, cancelar' }).click();
    await p.waitForURL('**/trabajos/detalle/**');
    await ver(p, 'Este trabajo fue cancelado');
    await foto('07-cancelado');
  }, { capturas });

  await escenario('P-obra-3-etapas-5-jornadas', nav_, base, async ({ p, foto }) => {
    // "Hecho cuando" del lote 4.7: una obra de 3 etapas en 5 jornadas, con un cambio de jornada, un adicional y el cobro de cada etapa
    const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');
    await p.goto(`${base}/trabajos/detalle/?id=00000000-0000-4000-8000-0000000000c6&escenario=habilitado`);
    await ver(p, 'Todavía no empezó');
    await foto('01-obra-agendada');
    await p.getByRole('button', { name: 'Salgo para allá' }).click();
    await p.waitForURL('**/en-camino/**');
    await p.getByRole('button', { name: 'Ya llegué' }).click();
    await p.waitForURL('**/trabajos/detalle/**');
    await p.getByRole('button', { name: 'Empezar el trabajo' }).click();
    await ver(p, 'Etapa 1: Preparación');
    assert.equal(await p.getByRole('button', { name: 'Terminé el trabajo' }).count(), 0, 'una obra se cierra desde el plan');
    // Diario: nota y fotos (vista previa en memoria); el cliente lo ve
    await p.getByRole('link', { name: /Diario de obra/ }).click();
    await p.waitForURL('**/obra/diario/**');
    await p.getByRole('button', { name: 'Publicar en el diario' }).click();
    await ver(p, 'Contá en una frase qué hiciste hoy.');
    await p.getByLabel('¿Qué hiciste hoy?').fill('Protegimos pisos y muebles y enduimos el living.');
    await p.locator('#ob-fotos-entrada').setInputFiles([{ name: 'avance-1.png', mimeType: 'image/png', buffer: PNG }, { name: 'avance-2.png', mimeType: 'image/png', buffer: PNG }]);
    await p.getByRole('button', { name: 'Quitar la foto 2' }).click();
    assert.equal(await p.locator('.ob-fotos__nueva').count(), 1);
    await foto('02-diario');
    await p.getByRole('button', { name: 'Publicar en el diario' }).click();
    await ver(p, 'Publicaste el avance');
    await ver(p, 'Protegimos pisos y muebles');
    assert.equal(await p.getByRole('img', { name: /Foto 1 del avance/ }).count(), 1);
    // Jornadas: pedir otro día para la 3 no mueve las demás; cambia cuando el cliente acepta
    await p.getByRole('link', { name: 'Volver al trabajo' }).click();
    await p.getByRole('link', { name: /Jornadas/ }).click();
    await p.waitForURL('**/obra/jornadas/**');
    await ver(p, 'Jornada 5 de 5');
    const antes = await p.locator('.ob-jornada__cuando').allTextContents();
    await p.getByRole('button', { name: /Pedir otro día para la jornada 3/ }).click();
    await p.getByRole('button', { name: 'Pedir este día' }).click();
    await ver(p, 'Elegí el motivo: el cliente lo ve.');
    await p.getByRole('button', { name: 'Por el clima' }).click();
    await p.locator('dialog[open] .hx-tira__dia:not([disabled])').nth(4).click();
    await ver(p, 'Pedís el');
    await foto('03-otro-dia');
    await p.getByRole('button', { name: 'Pedir este día' }).click();
    await ver(p, 'Pediste pasarla al');
    await panel(p, 'Acepta el cambio de jornada');
    await p.getByText(/Pediste pasarla al/).waitFor({ state: 'detached' });
    const despues = await p.locator('.ob-jornada__cuando').allTextContents();
    assert.notEqual(despues[2], antes[2], 'la jornada 3 cambió de día');
    for (const i of [0, 1, 3, 4]) assert.equal(despues[i], antes[i], `la jornada ${i + 1} no se movió`);
    await foto('04-jornadas');
    // Plan: un adicional en la etapa 1, aceptado, y el cobro de cada etapa
    await p.getByRole('link', { name: 'Volver al trabajo' }).click();
    await p.getByRole('link', { name: /Plan de obra/ }).click();
    await p.waitForURL('**/obra/plan/**');
    await p.getByRole('link', { name: 'Agregar repuestos o mano de obra' }).click();
    await p.waitForURL('**/trabajos/adicional/**');
    await ver(p, 'etapa 1: Preparación');
    await p.getByRole('button', { name: /Materiales extra/ }).click();
    await p.getByRole('button', { name: '+ $ 5.000' }).click();
    await p.getByRole('button', { name: /^Mandárselo al cliente/ }).click();
    await p.waitForURL('**/obra/plan/**');
    await ver(p, 'esperando al cliente');
    await panel(p, 'Acepta tu último adicional');
    await ver(p, 'Total de la etapa');
    for (const [i, monto] of [[1, '$ 65.000'], [2, '$ 150.000'], [3, '$ 40.000']]) {
      await p.getByRole('button', { name: 'Terminé esta etapa' }).click();
      await ver(p, `¿Terminaste la etapa ${i}?`);
      await ver(p, monto);
      await p.getByRole('button', { name: 'Sí, terminé la etapa' }).click();
      await ver(p, `Terminaste la etapa ${i}`);
      await p.getByRole('button', { name: new RegExp(`Ya me pagó: informarlo \\(etapa ${i}`) }).click();
      await ver(p, `Vas a informar que cobraste ${monto}`);
      await p.getByRole('button', { name: 'Sí, ya lo cobré' }).click();
      await p.locator('dialog[open]').waitFor({ state: 'detached' });
      if (i === 1) await foto('05-etapa-1-cobrada');
    }
    assert.equal(await p.getByText('Reportado, sin verificar', { exact: true }).count(), 3, 'informar no verifica');
    // Cierre de la obra
    await p.getByRole('button', { name: 'Cerrar la obra' }).click();
    await p.getByRole('button', { name: 'Sí, cerrar la obra' }).click();
    await p.waitForURL('**/trabajos/terminado/**');
    await ver(p, '¡Terminaste la obra!');
    await ver(p, 'Etapa por etapa');
    assert.equal((await p.locator('.tr-desglose--tarjeta .tr-desglose__total dd').textContent()).trim(), '$ 0', 'falta cobrar: nada');
    await foto('06-cierre');
  }, { capturas });

  await escenario('Q-agenda-chat-contactos-cuenta-caja-ayuda', nav_, base, async ({ p, foto }) => {
    // Agenda: mes con marcas, lista del día y detalle del turno (una obra, jornada por jornada)
    await p.goto(`${base}/agenda/?escenario=habilitado`);
    await p.getByRole('button', { name: /18 de noviembre, 2 eventos/ }).click();
    await ver(p, 'jornada 1 de 5');
    await p.locator('.ag-turno').first().click();
    await ver(p, 'Detalle del turno');
    await foto('01-detalle-turno');
    await p.getByRole('link', { name: 'Ver el trabajo' }).click();
    await p.waitForURL('**/trabajos/detalle/**');
    // Mensajes y chat: agregar a contactos, respuestas rápidas que completan (no mandan) y programar turno
    await nav(p, 'Mensajes');
    await p.getByText('Cliente de prueba 2').first().click();
    await p.getByRole('button', { name: 'Agregar a contactos' }).click();
    await ver(p, 'Lo agregaste a tus contactos');
    await p.getByRole('link', { name: /En tus contactos/ }).waitFor();
    const antes = await p.locator('.chat .burbuja').count();
    await p.getByRole('button', { name: '¿Me mandás una foto del problema?' }).click();
    assert.equal(await p.getByLabel('Escribí un mensaje').inputValue(), '¿Me mandás una foto del problema?');
    assert.equal(await p.locator('.chat .burbuja').count(), antes, 'una respuesta rápida no se manda sola');
    await p.getByRole('button', { name: 'Enviar mensaje' }).click();
    await ver(p, '¿Me mandás una foto del problema?');
    await foto('02-chat');
    await p.getByRole('link', { name: /Programar turno/ }).click();
    await p.waitForURL('**/pedidos/propuesta/**');
    await p.getByRole('link', { name: 'Volver al chat' }).click();
    await p.waitForURL('**/mensajes/hilo/**');
    // Contactos: solo los agregados desde un chat; quitar no borra la conversación
    await nav(p, 'Mensajes');
    await p.getByRole('link', { name: 'Contactos' }).click();
    await ver(p, 'Cliente de prueba 5');
    await ver(p, 'Cliente de prueba 2');
    await foto('03-contactos');
    await p.getByRole('button', { name: 'Sacar a Cliente de prueba 2 de tus contactos' }).click();
    await ver(p, 'Lo sacaste de tus contactos');
    assert.equal(await p.getByRole('link', { name: 'Escribirle a Cliente de prueba 2' }).count(), 0);
    // Cuenta: cómo te paga el cliente (al menos una forma)
    await nav(p, 'Cuenta');
    await ver(p, 'Verificado por Handyx');
    await foto('04-cuenta');
    await p.getByRole('link', { name: /Cómo te paga el cliente/ }).click();
    await p.getByRole('switch', { name: /Efectivo/ }).click();
    await p.waitForFunction(() => document.querySelector('[role="switch"][aria-checked="false"]') !== null);
    await p.getByRole('switch', { name: /Mercado Pago/ }).click();
    await ver(p, 'Dejá al menos una forma de cobro');
    assert.equal(await p.getByRole('switch', { name: /Mercado Pago/ }).getAttribute('aria-checked'), 'true');
    await foto('05-cobros');
    // Caja: lo cobrado del mes, filtros por estado y el desglose
    await p.getByRole('link', { name: 'Ver la Caja' }).click();
    await ver(p, 'Cobrado este mes');
    await p.getByRole('button', { name: /^Con problemas · 1/ }).click();
    assert.equal(await p.locator('.cj-mov').count(), 1);
    await ver(p, 'Falló', { exact: true });
    assert.equal(await p.locator('.cj-mov__desglose').first().isVisible(), false, 'el desglose arranca cerrado');
    await p.getByRole('button', { name: /Ver el desglose/ }).click();
    await ver(p, 'Referencia del proveedor');
    await foto('06-caja');
    // Centro de ayuda: temas en pastillas y preguntas que se abren
    await p.goto(`${base}/soporte/?escenario=habilitado`);
    await p.getByRole('button', { name: 'Cobros' }).click();
    await p.getByText('¿Cuánto cobra Handyx?').click();
    await ver(p, 'Handyx no te cobra tarifa: 0 %');
    await foto('07-ayuda');
  }, { capturas });

  await escenario('J-sin-conexion-service-worker', nav_, base, async ({ p, foto }) => {
    await p.goto(`${base}/?escenario=habilitado`);
    await p.waitForURL('**/inicio/');
    await p.waitForFunction(() => Boolean(navigator.serviceWorker.controller), null, { timeout: 15000 });
    // Una navegación con el service worker activo deja guardado el HTML de esa pantalla
    await p.goto(`${base}/agenda/?escenario=habilitado`);
    await ver(p, 'Noviembre 2026');
    await p.context().setOffline(true);
    await ver(p, 'Lo que ves puede estar desactualizado');
    await foto('01-franja');
    // Pantalla nunca visitada: la del caño roto (estática, sin datos de la cuenta)
    await p.goto(`${base}/caja/`);
    await ver(p, 'Se nos cortó el caño');
    await foto('02-sin-conexion');
    // Pantalla ya visitada: se abre su copia
    await p.goto(`${base}/agenda/?escenario=habilitado`);
    await ver(p, 'Noviembre 2026');
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
  await navSinWebgl.close();
  srv.close();
  const mal = resultados.filter(([, r]) => r !== 'OK');
  console.log(`\n${resultados.length - mal.length}/${resultados.length} recorridos OK`);
  process.exit(mal.length ? 1 : 0);
}

main();
