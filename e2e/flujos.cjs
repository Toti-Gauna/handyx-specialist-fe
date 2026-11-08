// Recorridos de punta a punta sobre la exportación estática (out/) con el origen de datos de prueba.
// Uso: npm run build && node e2e/flujos.cjs     (requiere `playwright` instalado y su Chromium)
// Cada escenario arranca con una carga completa (`?escenario=`); dentro de él se navega SIN recargar,
// porque el estado de prueba vive solo en memoria de la pestaña.
const assert = require('node:assert/strict');
const { readdirSync, readFileSync } = require('node:fs');
const { join } = require('node:path');
const { servir } = require('./servidor.cjs');
const { activarMapas } = require('./pantallas.cjs');
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
// Barra de pestañas del kit v3 (lote 0.2): Inicio · Obras · Taller · Mensajes · Cuenta.
const nav = (p, n) => p.getByRole('navigation', { name: 'Secciones' }).getByText(n, { exact: true }).click();
const ver = (p, t, o) => p.getByText(t, o).first().waitFor();
// La Agenda ya no es pestaña: se llega desde Inicio (y, en la ola 2, desde Taller).
// Lote 1.3: desde el Inicio, «Ver recorrido» y de ahí la agenda completa.
const agenda = async (p) => {
  await nav(p, 'Inicio');
  await p.getByRole('link', { name: 'Ver recorrido' }).click();
  await p.getByRole('link', { name: 'Ver la agenda completa' }).click();
  await p.waitForURL('**/agenda/');
};

async function main() {
  const srv = await servir();
  const base = `http://localhost:${srv.address().port}`;
  const nav_ = await chromium.launch();
  // Un navegador sin WebGL: el mapa no puede dibujarse y tiene que quedar el texto (lote 4.3).
  const navSinWebgl = await chromium.launch({ args: ['--disable-webgl', '--disable-3d-apis'] });
  const capturas = process.env.CAPTURAS ?? null;


  await escenario('B-opt-in-urgente-y-propuesta', nav_, base, async ({ p, foto }) => {
    // Lote 1.3 (RC-Pedido): Inicio con el mapa, Disponible, pedido flotante, detalle, tu precio con la cinta y enviar
    await p.goto(`${base}/`);
    await p.waitForURL('**/inicio/');
    await ver(p, 'No disponible');
    await foto('00-inicio');
    await p.getByRole('button', { name: /pedidos? cerca/ }).click();
    await ver(p, 'Cambiar el flexible del inodoro');
    assert.equal(await p.getByText('Pierde la canilla de la cocina').count(), 0, 'con "Disponible" apagado no hay urgentes');
    await foto('01-cercanos-sin-urgentes');
    await p.getByRole('switch', { name: /Recibir pedidos/ }).click();
    await ver(p, /Pedido urgente · quedan/);
    await foto('02-pedido-entrante');
    await p.getByRole('button', { name: 'Ver pedido' }).first().click();
    await ver(p, 'La dirección exacta llega cuando el cliente acepta');
    await ver(p, 'Handyx sugiere', { exact: true });
    await foto('03-pedido-urgente');
    await p.getByRole('link', { name: 'Cotizar' }).click();
    await p.waitForURL('**/pedidos/propuesta/**');
    await ver(p, 'Paso 1 de 2');
    await p.getByRole('button', { name: /^\+\s\$\s2\.000$/ }).click();
    await ver(p, 'Handyx no te cobra comisión');
    await foto('04-tu-precio');
    await p.getByRole('button', { name: 'Siguiente: la fecha' }).click();
    await ver(p, 'Paso 2 de 2');
    await p.getByRole('button', { name: /^18 de noviembre/ }).click();
    await p.getByRole('button', { name: /^13 a 17/ }).click();
    await p.getByRole('button', { name: 'Revisar la propuesta' }).click();
    await ver(p, 'Hasta que acepte, no es un trabajo agendado');
    await p.getByRole('button', { name: /^Enviar propuesta de/ }).click();
    await ver(p, 'Le llegó tu');
    await foto('05-enviada');
    await p.getByRole('link', { name: 'Ver el pedido' }).click();
    await p.waitForURL('**/pedidos/detalle/**');
    await ver(p, 'Esperando al cliente');
    await foto('06-esperando');
    // Apagar «Disponible» desde el Inicio corta los urgentes
    await p.getByRole('link', { name: 'Volver al inicio' }).click();
    await p.waitForURL('**/inicio/');
    await p.getByRole('switch', { name: 'Recibir pedidos: Disponible' }).click();
    await ver(p, 'No disponible');
  }, { capturas });

  await escenario('N-te-eligieron-bandeja-y-avisos', nav_, base, async ({ p, foto }) => {
    await p.goto(`${base}/pedidos/detalle/?id=00000000-0000-4000-8000-0000000000b4&escenario=habilitado`);
    await p.getByRole('link', { name: 'Cotizar' }).click();
    await p.waitForURL('**/pedidos/propuesta/**');
    await p.getByRole('button', { name: 'Siguiente: la fecha' }).click();
    // El cliente pidió un horario: «Voy en ese horario» viene elegido
    await p.getByRole('button', { name: 'Revisar la propuesta' }).click();
    await p.getByRole('button', { name: /^Enviar propuesta de/ }).click();
    await p.getByRole('link', { name: 'Ver el pedido' }).click();
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
    // La bandeja vieja la reemplazó el Inicio (lote 1.3): pedidos cercanos y distancias medidas solo si lo pedís
    await p.getByRole('link', { name: 'Volver' }).click();
    await p.waitForURL('**/inicio/');
    await p.getByRole('button', { name: /pedidos? cerca/ }).click();
    await p.getByRole('button', { name: 'Medir distancias desde donde estoy' }).click();
    await ver(p, /zona aproximada · \d/);
    await foto('03-cercanos-con-distancia');
    // Avisos: Nuevos / Antes, borrar uno (botón accesible) y "Borrar todos" con confirmación
    await p.locator('header').getByRole('link', { name: /Avisos/ }).first().click();
    await p.waitForURL('**/notificaciones/');
    await ver(p, 'Hoy', { exact: true });
    await ver(p, 'Nuevo', { exact: true });
    await foto('04-avisos');
    const antes = await p.locator('.ui-aviso').count();
    await p.getByRole('button', { name: /^Quitar el aviso: ¡El cliente te eligió!/ }).click();
    await p.waitForFunction((n) => document.querySelectorAll('.ui-aviso').length === n - 1, antes);
    await p.getByRole('button', { name: 'Borrar todos los avisos' }).click();
    await ver(p, '¿Borrar todos los avisos?');
    await foto('05-borrar-todos');
    await p.getByRole('button', { name: 'Sí, borrar todos' }).click();
    await ver(p, 'No tenés avisos');
    await foto('06-sin-avisos');
  }, { capturas });

  await escenario('C-aceptar-propuesta-y-trabajo', nav_, base, async ({ p, foto }) => {
    await p.goto(`${base}/pedidos/detalle/?id=00000000-0000-4000-8000-0000000000b2&escenario=habilitado`);
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
    await p.getByRole('button', { name: 'Salir para allá' }).click();
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
    await p.getByRole('button', { name: 'Terminé', exact: true }).click();
    await ver(p, '¿Terminaste el trabajo?');
    await ver(p, 'Total a cobrar');
    await foto('07-confirmar-terminar');
    await p.getByRole('button', { name: 'Sí, terminé' }).click();
    // TR-Cobro (lote 1.3): informar el cobro no lo verifica
    await p.waitForURL('**/trabajos/cobro/**');
    await ver(p, '¿Cómo te pagó?');
    await foto('08-como-te-pago');
    await p.getByRole('button', { name: 'Informar el cobro' }).click();
    await ver(p, 'Informado por vos · sin verificar');
    await foto('09-cobro-informado');
  }, { capturas });

  await escenario('D-cambio-de-fecha-y-doble-aceptacion', nav_, base, async ({ p, foto }) => {
    await p.goto(`${base}/`);
    await p.waitForURL('**/inicio/');
    await nav(p, 'Obras');
    await p.getByText('Plomería · Cliente de prueba 5').click();
    await p.getByRole('link', { name: /Cambiar (la )?fecha/ }).waitFor();
    await foto('01-trabajo-agendado');
    // Cambiar la fecha (lote 4.6): motivo, día y franja; sin motivo no se manda
    await p.getByRole('link', { name: /Cambiar (la )?fecha/ }).click();
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
    await ver(p, 'Mientras tanto sigue valiendo lo acordado');
    await ver(p, '$ 45.000');
    await foto('03-cambio-esperando');
    // Doble aceptación: otra persona gana la propuesta
    await p.getByRole('link', { name: 'Volver' }).click();
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
    await nav(p, 'Obras');
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
    await nav(p, 'Inicio');
    await ver(p, 'Tu sesión expiró');
    await foto('03-sesion-expirada');
    await p.getByRole('button', { name: 'Volver a entrar' }).click();
    await p.waitForURL(/\/acceso\/\?motivo=sesion/);
    await ver(p, 'Por seguridad cerramos tu sesión');
    await foto('04-acceso');
    await p.getByLabel('Email o teléfono').fill('especialista@example.test');
    await p.getByLabel('Contraseña', { exact: true }).fill('clave-de-prueba-123');
    await p.getByRole('button', { name: 'Entrar', exact: true }).click();
    await p.waitForURL('**/inicio/');
    // Baja: estado honesto, sesión cerrada y cancelación
    await nav(p, 'Cuenta');
    await p.getByRole('link', { name: /Privacidad y baja/ }).click();
    await p.getByRole('button', { name: /Darme de baja/ }).click();
    await ver(p, 'Es una baja real, no solo cerrar la sesión');
    await foto('05-confirmar-baja');
    await p.getByRole('button', { name: 'Sí, quiero darme de baja' }).click();
    await p.waitForURL('**/acceso/');
    await p.getByLabel('Email o teléfono').fill('especialista@example.test');
    await p.getByLabel('Contraseña', { exact: true }).fill('clave-de-prueba-123');
    await p.getByRole('button', { name: 'Entrar', exact: true }).click();
    await p.waitForURL('**/baja/');
    await ver(p, 'Todavía no se borró nada');
    await foto('06-baja-solicitada');
    await p.getByRole('button', { name: /Cancelar la baja/ }).click();
    await p.waitForURL('**/inicio/');
  }, { capturas });

  await escenario('G-sin-contador-fee-en-cuenta', nav_, base, async ({ p, foto }) => {
    await p.goto(`${base}/`);
    await p.waitForURL('**/inicio/');
    await nav(p, 'Cuenta');
    await ver(p, 'Tu cuenta');
    // Lote 0.2: Handyx no le cobra comisión al especialista, nunca; ni el contador ni el modal del «0 % durante la demo».
    assert.equal(await p.getByText('Tarifa de Handyx durante la demo').count(), 0, 'quedó el contador del fee');
    await foto('01-cuenta-sin-contador');
  }, { capturas });

  await escenario('I-agenda-avisos-obra-soporte-caja', nav_, base, async ({ p, foto }) => {
    await p.goto(`${base}/`);
    await p.waitForURL('**/inicio/');
    // Avisos: urgente y programado se distinguen; abrir no acepta nada
    await p.getByRole('link', { name: 'Avisos' }).first().click();
    await ver(p, 'Nada se acepta desde acá.');
    await ver(p, 'Pedido urgente en tu zona');
    await ver(p, 'Nuevo pedido programado');
    await foto('01-avisos');
    // Agenda: un día con trabajo y la oferta que se superpone
    await agenda(p);
    await p.getByRole('button', { name: /18 de noviembre/ }).click();
    await ver(p, 'Confirmado');
    await foto('02-agenda');
    // Obra: etapas, cada una con su estado y su importe
    await nav(p, 'Obras');
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
    await p.getByRole('button', { name: 'Enviar el caso' }).click();
    await ver(p, 'Reclamo de prueba');
    await ver(p, 'Abierto');
    await foto('05-caso-abierto');
    await panel(p, 'Handyx responde un caso de soporte');
    await ver(p, 'Esperando tu respuesta');
    await foto('06-caso-respondido');
    // Caja: pagos de todos los estados y simulación rotulada
    await nav(p, 'Cuenta');
    await p.getByRole('link', { name: /^Tus cobros/ }).click();
    for (const t of ['Pendiente', 'Reportado, sin verificar', 'Verificado', 'Falló']) await ver(p, t, { exact: true });
    await ver(p, 'Handyx nunca te pide tu contraseña de Mercado Pago');
    await foto('07-caja');
    assert.equal(await p.getByText('retirar', { exact: false }).filter({ hasText: /^Retirar/ }).count(), 0, 'no hay retiros de Handyx');
    await p.getByRole('button', { name: 'Ver la simulación posterior a la demo' }).click();
    await ver(p, 'SIMULACIÓN · no vigente');
    await foto('08-caja-simulacion');
    // Preferencias: avisos distintos para urgentes y programados
    await nav(p, 'Cuenta');
    await p.getByRole('link', { name: /^Avisos Qué te llega/ }).click();
    await ver(p, 'Pedidos urgentes', { exact: true });
    await ver(p, 'Pedidos programados', { exact: true });
    await foto('09-cuenta-preferencias');
  }, { capturas });

  await escenario('K-kit-catalogo', nav_, base, async ({ p, foto }) => {
    await p.goto(`${base}/catalogo/v2/`);
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

  await escenario('L2-apple-en-iphone-y-cuenta-nueva', nav_, base, async ({ p, foto }) => {
    await p.goto(`${base}/acceso/?escenario=nuevo`);
    await p.getByRole('button', { name: 'Apple', exact: true }).click();
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

  // ── Mapa, ubicación en vivo y trayectos (lote 4.3) ──
  const mapaListo = async (p, n = 1) => {
    await activarMapas(p);
    await p.waitForFunction((k) => document.querySelectorAll('[data-mapa="listo"]').length >= k, n, { timeout: 20000 });
  };
  const chip = (p, texto) => p.locator('.nu-viaje .ui-chip').getByText(texto).first().waitFor();

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
    const google = await p.getByRole('link', { name: /Google Maps/ }).getAttribute('href');
    assert.match(google, /^https:\/\/www\.google\.com\/maps\/dir\/\?api=1&destination=-38\.\d+,-57\.\d+&travelmode=driving$/);
    assert.equal(await p.getByRole('link', { name: /Waze/ }).getAttribute('target'), '_blank');
    await p.getByRole('button', { name: 'Salir para allá' }).click();
    await p.waitForURL('**/en-camino/?id=*');
    await ver(p, 'Compartí tu ubicación durante el viaje');
    assert.equal(await p.locator('.hx-mapa-pin').count() <= 1, true);
    await mapaListo(p);
    // Antes de compartir no se lee el GPS: no hay punto propio en el mapa
    assert.equal(await p.locator('.hx-mapa-yo').count(), 0);
    await foto('01-permiso');
    await panel(p, 'GPS simulado rápido (×6)');
    await p.getByRole('button', { name: 'Compartir mi ubicación' }).click();
    await chip(p, 'Ubicación precisa');
    await ver(p, 've que vas en camino');
    await ver(p, /Llegás \d/);
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
    await p.goto(`${base}/trabajos/detalle/?id=00000000-0000-4000-8000-0000000000c1&escenario=habilitado`);
    await p.getByRole('button', { name: 'Salir para allá' }).click();
    await p.waitForURL('**/en-camino/?id=*');
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
    await p.getByRole('button', { name: 'Terminé', exact: true }).click();
    await ver(p, 'Total a cobrar');
    assert.match((await p.locator('.nu-desglose__total dd').textContent()).replace(/\s/g, ' '), /\$ 50\.000/);
    await p.getByRole('button', { name: 'Sí, terminé' }).click();
    await p.waitForURL('**/trabajos/cobro/**');
    await ver(p, '¿Cómo te pagó?');
    await foto('04-como-te-pago');
    await p.getByRole('radio', { name: 'Una parte' }).check();
    await p.getByLabel('¿Cuánto te pagó?').fill('20.000');
    await p.getByRole('button', { name: 'Informar el cobro' }).click();
    await ver(p, 'Informado por vos · sin verificar');
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
    await p.getByRole('button', { name: 'Salir para allá' }).click();
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
    await p.goto(`${base}/agenda/mes/?escenario=habilitado`);
    await p.getByRole('button', { name: /^18 de noviembre/ }).click();
    await ver(p, 'Obra · jornada 1 de 5');
    await foto('01-detalle-turno');
    await p.getByRole('link', { name: /jornada 1 de 5|Pintura/ }).first().click();
    await p.waitForURL('**/trabajos/detalle/**');
    await p.getByRole('link', { name: 'Volver' }).click();
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
    await p.getByRole('link', { name: 'Volver' }).click();
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
    await p.getByRole('link', { name: /^Medios de cobro/ }).click();
    await p.getByRole('button', { name: /^Efectivo/ }).click();
    await p.getByRole('button', { name: 'Dejar de usar Efectivo' }).click();
    await ver(p, 'Agregar', { exact: true });
    await p.getByRole('button', { name: /^Mercado Pago/ }).click();
    await p.getByRole('button', { name: 'Dejar de usar Mercado Pago' }).click();
    await ver(p, /Dejá al menos una forma de cobro/);
    await foto('05-cobros');
    // Caja: lo cobrado del mes, filtros por estado y el desglose
    await p.goto(`${base}/caja/?escenario=habilitado`);
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
    await p.getByRole('button', { name: /^Cobros/ }).click();
    await p.getByText('¿Cuánto me cobra Handyx?').click();
    await ver(p, 'Recibís el 100 % de tu precio');
    await foto('07-ayuda');
  }, { capturas });

  await escenario('R-taller-electricidad', nav_, base, async ({ p, foto }) => {
    await p.goto(`${base}/inicio/?escenario=habilitado`);
    await nav(p, 'Taller');
    await p.waitForURL('**/taller/');
    await p.getByRole('link', { name: /Herramientas del teléfono/ }).click();
    await p.waitForURL('**/taller/herramientas/');
    await ver(p, 'De tu oficio');
    await foto('01-taller');
    // Sección y caída de tensión: un circuito de tomas corto lo decide el mínimo; uno largo, la caída de tensión
    await p.getByRole('link', { name: /Sección y caída de tensión/ }).click();
    await p.waitForURL('**/taller/conductores/');
    await ver(p, 'La decide la sección mínima del circuito');
    await p.getByLabel('Largo del recorrido').fill('90');
    await ver(p, 'La decide la caída de tensión');
    await p.getByLabel('Potencia', { exact: true }).fill('');
    await ver(p, 'Escribí la potencia mayor que cero.');
    await p.getByLabel('Potencia', { exact: true }).fill('3500');
    await foto('02-conductores');
    assert.ok(await p.getByText('Valores de referencia en revisión técnica').isVisible(), 'el aviso de revisión está a la vista');
    // Planificador de vivienda: sumar un ambiente cambia el grado
    await p.goto(`${base}/taller/vivienda/?escenario=habilitado`);
    await ver(p, 'Grado Mínima');
    await p.getByLabel('Agregar ambiente').selectOption('estar');
    await p.getByRole('button', { name: 'Agregar' }).click();
    await p.getByLabel('Living o comedor', { exact: true }).nth(1).fill('30');
    await ver(p, 'Grado Media');
    await foto('03-vivienda');
    // Tablero: agregar una térmica suma módulos y una etiqueta; quitar el diferencial avisa
    await p.goto(`${base}/taller/tablero/?escenario=habilitado`);
    await ver(p, 'usás 7 + 2 de reserva');
    await p.getByRole('button', { name: 'Agregar' }).click();
    await ver(p, 'usás 8 + 2 de reserva');
    await p.getByRole('button', { name: 'Quitar Diferencial 2P 2' }).click();
    await ver(p, 'Falta un disyuntor diferencial de 30 mA');
    await foto('04-tablero');
    // Ohm con dos datos
    await p.goto(`${base}/taller/ohm/?escenario=habilitado`);
    await ver(p, 'Corriente: 10 A');
    // Nivel: en una computadora no hay giroscopio y se dice
    await p.goto(`${base}/taller/nivel/?escenario=habilitado`);
    await ver(p, 'En 3 m tiene que bajar 60 mm.');
    // Sin permiso del navegador, se explica cómo habilitarlo; con permiso pero sin sensor (computadora), se dice.
    await p.getByRole('button', { name: 'Usar el giroscopio' }).click();
    await ver(p, /No diste permiso al sensor|Este dispositivo no tiene giroscopio/);
    await p.context().grantPermissions(['accelerometer', 'gyroscope', 'magnetometer'], { origin: base });
    await p.reload();
    await p.getByRole('button', { name: 'Usar el giroscopio' }).click();
    await ver(p, 'Este dispositivo no tiene giroscopio');
    await foto('05-nivel');
  }, { capturas });

  await escenario('S-taller-ia', nav_, base, async ({ p, foto }) => {
    // Etiquetas con IA: la foto se achica en el teléfono; la IA (simulada en datos de prueba) propone y vos confirmás
    await p.goto(`${base}/taller/etiquetas/?escenario=habilitado`);
    await ver(p, 'Tu foto se cuida');
    await p.getByLabel('Foto del tablero').setInputFiles(join(__dirname, '..', 'public', 'icono-app-512.png'));
    await p.getByRole('img', { name: 'La foto del tablero que elegiste' }).waitFor();
    await p.getByRole('button', { name: 'Leer el tablero' }).click();
    await ver(p, 'Lo que encontró, de izquierda a derecha');
    await ver(p, 'No se lee');
    await p.getByLabel('Qué protege').nth(4).fill('Aire del dormitorio');
    await ver(p, 'Aire del dormitorio · 20 A');
    await foto('01-etiquetas');
    await p.getByRole('button', { name: 'Abrir en el armador 3D' }).click();
    await p.waitForURL('**/taller/tablero/');
    await ver(p, 'Aire del dormitorio · 20 A');
    await ver(p, 'Luces · 10 A');
    // Presupuesto dictado: los datos personales no salen del teléfono
    await p.goto(`${base}/taller/dictado/?escenario=habilitado`);
    await p.getByLabel('Contá qué hay que hacer').fill('Agregar 4 tomas en la cocina, llamar al 0223 155551234');
    await ver(p, 'Antes de mandarlo sacamos: teléfono.');
    await p.getByRole('button', { name: 'Armar tareas y materiales' }).click();
    await ver(p, 'Agregar 4 tomas');
    await ver(p, 'Cable unipolar 2,5 mm²');
    await ver(p, 'Sin precios: los ponés vos');
    await foto('02-dictado');
  }, { capturas });

  await escenario('T-informe-electrico', nav_, base, async ({ p, foto }) => {
    await p.goto(`${base}/taller/informe/?escenario=habilitado`);
    await ver(p, 'Cargá mediciones para ver el resultado');
    await p.getByLabel('Resistencia de puesta a tierra').fill('25');
    await ver(p, 'Para revisar');
    await ver(p, 'Mejorar la puesta a tierra para bajar de 10 Ω');
    await p.getByLabel('Disparo del diferencial a su corriente nominal').fill('28');
    await p.getByRole('group', { name: 'Tiene disyuntor diferencial de 30 mA' }).getByRole('radio', { name: 'Sí' }).click();
    await p.getByRole('group', { name: 'Bornes ajustados' }).getByRole('radio', { name: 'No', exact: true }).click();
    await ver(p, 'Reajustar los bornes flojos.');
    await ver(p, 'La instalación funciona, pero hay puntos para mejorar.');
    await p.getByLabel('Fotos del informe').setInputFiles(join(__dirname, '..', 'public', 'icono-app-512.png'));
    await p.getByRole('img', { name: 'Foto 1 del informe' }).first().waitFor();
    await foto('01-informe');
    // Sin WebXR ni Quick Look (Chromium de escritorio) no se ofrece la realidad aumentada
    await p.goto(`${base}/taller/iluminacion/?escenario=habilitado`);
    await ver(p, 'Mostrale al cliente cómo queda');
    assert.equal(await p.getByRole('button', { name: /Ver en el techo/ }).count(), 0, 'sin AR en este navegador');
  }, { capturas });

  await escenario('U-canalizacion-y-checklists', nav_, base, async ({ p, foto }) => {
    await p.goto(`${base}/taller/canalizacion/?escenario=habilitado`);
    await ver(p, 'Iluminación (luces y llaves) · 1,5 mm²');
    await ver(p, 'Caja octogonal (luces)');
    await p.getByLabel('Tomas', { exact: true }).fill('6');
    await ver(p, /Tomacorrientes · 2,5 mm²/);
    await p.getByLabel('Luces', { exact: true }).fill('0');
    await p.getByLabel('Llaves', { exact: true }).fill('0');
    assert.equal(await p.getByText('Caja octogonal (luces)').count(), 0, 'sin luces no hay cajas octogonales');
    await foto('01-canalizacion');
    await p.goto(`${base}/taller/checklists/?escenario=habilitado`);
    await ver(p, '0 de');
    await p.getByRole('radio', { name: 'Cambio de toma o llave' }).click();
    for (const c of await p.getByRole('checkbox').all()) await c.check();
    await ver(p, '¡Listo!');
    await foto('02-checklist');
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

  // Recorridos del lienzo por lote (plan por olas): cada archivo de e2e/recorridos/ exporta RECORRIDOS.
  for (const archivo of readdirSync(join(__dirname, 'recorridos')).filter((a) => a.endsWith('.cjs')).sort()) {
    const ruta = join(__dirname, 'recorridos', archivo);
    if (!/module\.exports/.test(readFileSync(ruta, 'utf8'))) {
      // Recorridos que corren solos (sin exportar RECORRIDOS): se lanzan como proceso aparte.
      const r = require('node:child_process').spawnSync(process.execPath, [ruta], { stdio: 'inherit', env: process.env });
      resultados.push([archivo, r.status === 0 ? 'OK' : 'FALLÓ']);
      continue;
    }
    for (const [nombre, pasos, o = {}] of require(ruta).RECORRIDOS) await escenario(nombre, nav_, base, pasos, { capturas, ...o });
  }

  await nav_.close();
  await navSinWebgl.close();
  srv.close();
  const mal = resultados.filter(([, r]) => r !== 'OK');
  console.log(`\n${resultados.length - mal.length}/${resultados.length} recorridos OK`);
  process.exit(mal.length ? 1 : 0);
}

main();
