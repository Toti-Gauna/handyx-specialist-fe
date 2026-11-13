// E2E de la PWA con el origen de datos REAL (http) contra la API local de handyx-specialist-be (lote 5.8).
// Nada de mock: sin panel de prueba, sin banner, sin fixtures. Datos sintéticos de la base de pruebas aislada.
//
// 1. En handyx-specialist-be (base de pruebas aislada, ver docs/testing.md):
//      NODE_ENV=test TEST_DATABASE_URL=… npm run e2e:api        → API en 127.0.0.1:3299 y control en :3298
// 2. Acá, el build con origen http en otra carpeta (no pisa el `out/` del mock):
//      NEXT_PUBLIC_DATA_SOURCE=http NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:3299 npm run build && mv out out-http
//      OUT=out-http npm run e2e:backend
//
// El control (solo el script de pruebas del BE) hace lo que harían Operations y la API de usuario: habilitar y crear
// un pedido; también deja leer el código del email (que en pruebas queda en memoria). La PWA se sirve en
// 127.0.0.1:5176, el único origen que acepta esa API.
const assert = require('node:assert/strict');
const { resolve, join } = require('node:path');
const { servir } = require('./servidor.cjs');
const { chromium } = require('playwright');

const API = process.env.HANDYX_API_URL ?? 'http://127.0.0.1:3299';
const CONTROL = process.env.HANDYX_CONTROL_URL ?? 'http://127.0.0.1:3298';
const OUT = resolve(process.env.OUT ?? 'out-http');
const CAPTURAS = process.env.CAPTURAS ?? null;
const DEMO = new Date('2026-11-12T13:00:00Z');

const control = async (metodo, ruta) => {
  const r = await fetch(`${CONTROL}${ruta}`, { method: metodo });
  if (!r.ok) throw new Error(`control ${ruta}: ${r.status}`);
  return r.json();
};
const ver = (p, t, o) => p.getByText(t, o).first().waitFor();
// Barra de pestañas del kit v3 (lote 0.2): Inicio · Obras · Taller · Mensajes · Cuenta.
const nav = (p, n) => p.getByRole('navigation', { name: 'Secciones' }).getByText(n, { exact: true }).click();

/** Nada en el navegador: ni storage, ni IndexedDB, ni cookies legibles (la de sesión es HttpOnly). */
async function sinNadaEnElNavegador(p) {
  // Solo se LEE para auditar que la PWA no guarde nada (la regla de lint protege el código de la app).
  /* eslint-disable no-restricted-globals */
  const r = await p.evaluate(async () => ({
    local: localStorage.length,
    sesion: Object.keys(sessionStorage),
    cookie: document.cookie,
    idb: (await indexedDB.databases()).map((d) => d.name),
  }));
  /* eslint-enable no-restricted-globals */
  // sessionStorage: solo la marca de la pantalla de carga (una vez por sesión, sin datos), si existe.
  assert.deepEqual({ ...r, sesion: r.sesion.filter((k) => !/intro|carga/i.test(k)) }, { local: 0, sesion: [], cookie: '', idb: [] });
}

async function main() {
  await control('GET', '/codigo?email=nadie@example.test'); // la API local está arriba
  const srv = await servir({ raiz: OUT, puerto: 5176 });
  const base = 'http://127.0.0.1:5176';
  const navegador = await chromium.launch();
  const ctx = await navegador.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
  await ctx.clock.install({ time: DEMO });
  const p = await ctx.newPage();
  p.setDefaultTimeout(10_000);
  const errores = [];
  const llamadas = [];
  p.on('pageerror', (e) => errores.push('PAGEERROR ' + e.message));
  p.on('console', (m) => m.type() === 'error' && !/Failed to load resource|ERR_CONNECTION_REFUSED/.test(m.text()) && errores.push('CONSOLE ' + m.text()));
  p.on('request', (r) => r.url().startsWith(API) && llamadas.push(`${r.method()} ${new URL(r.url()).pathname}`));
  const foto = (n) => CAPTURAS && p.screenshot({ path: join(CAPTURAS, `backend-${n}.png`), fullPage: true });
  const email = `especialista-${Date.now().toString(36)}@example.test`;
  let paso = 'inicio';
  try {
    paso = 'registro y código por email';
    await p.goto(`${base}/registro/`);
    assert.equal(await p.getByText('Datos de prueba').count(), 0, 'sin banner de prueba en http');
    await p.getByLabel('Email').fill(email);
    await p.getByRole('button', { name: 'Siguiente' }).click();
    await p.getByLabel('Contraseña').fill('una-clave-larga-123');
    await p.getByRole('button', { name: 'Siguiente' }).click();
    await p.getByRole('checkbox').nth(0).check();
    await p.getByRole('checkbox').nth(1).check();
    await p.getByRole('button', { name: 'Crear cuenta' }).click();
    await p.waitForURL('**/verificar/');
    const { codigo } = await control('GET', `/codigo?email=${encodeURIComponent(email)}`);
    assert.match(codigo ?? '', /^\d{6}$/, 'llegó el código (email en memoria)');
    await p.getByLabel('Código de 6 números').fill(codigo);
    await ver(p, 'Tu cuenta está');
    await foto('01-cuenta-creada');
    await sinNadaEnElNavegador(p);

    paso = 'alta: datos guardados en el servidor';
    await p.getByRole('button', { name: 'Completar mi alta' }).click();
    await p.waitForURL('**/alta/');
    await ver(p, 'de 6 listos');
    await p.getByRole('button', { name: /Tus datos/ }).click();
    const responder = async (etiqueta, valor) => {
      await p.getByLabel(etiqueta, { exact: true }).fill(valor);
      await p.getByRole('button', { name: 'Siguiente' }).click();
    };
    await responder('Nombre', 'Especialista');
    await responder('Apellido', 'De Prueba');
    await responder('Fecha de nacimiento', '1990-01-31');
    await responder('Nacionalidad', 'Argentina');
    await p.getByLabel('Otro', { exact: true }).check();
    await p.getByRole('button', { name: 'Siguiente' }).click();
    await responder('Ciudad', 'Mar del Plata');
    await p.getByRole('button', { name: 'Listo' }).click();
    await ver(p, 'Especialista De Prueba');
    // Recargar: lo guardado viene de la API (no hay nada en el navegador).
    await p.reload();
    await ver(p, 'Especialista De Prueba');
    await p.getByRole('button', { name: /Tus datos/ }).getByText('Listo').waitFor();
    await foto('02-alta-datos');

    paso = 'habilitada: tarifa 0 % de la API, bandeja y propuesta';
    await control('POST', `/habilitar?email=${encodeURIComponent(email)}`);
    await control('POST', '/pedido');
    await p.goto(`${base}/`);
    await p.waitForURL('**/inicio/');
    await ver(p, 'Handyx no te cobra tarifa durante la demo');
    await p.getByRole('button', { name: 'Entendido' }).click();
    await p.getByRole('heading', { name: 'Handyx no te cobra tarifa durante la demo' }).waitFor({ state: 'detached' });
    await foto('03-inicio');
    // El urgente llega como hoja (desde la API); nunca acepta solo.
    await ver(p, 'Pedido urgente para vos');
    await ver(p, 'Pierde la canilla de la cocina');
    await foto('04-pedido-entrante');
    await p.getByRole('link', { name: 'Ver y cotizar' }).click();
    await p.waitForURL('**/pedidos/detalle/**');
    await ver(p, 'Todavía no ves el nombre ni la dirección exacta');
    await ver(p, 'Handyx sugiere $ 45.000');
    assert.equal(await p.getByText('Calle Falsa').count(), 0, 'la dirección exacta no llega antes de contratar');
    await p.getByRole('link', { name: /Poner mi precio/ }).click();
    await p.waitForURL('**/pedidos/propuesta/**');
    await p.getByRole('button', { name: /^En 1 hora/ }).click();
    await ver(p, '$ 45.000'); // el sugerido que publicó Operations, como punto de partida
    await p.getByRole('button', { name: '+ $ 2.000' }).click();
    await ver(p, '$ 47.000');
    await p.locator('#tp-alcance textarea').fill('Cambio de cuerito y ajuste');
    await p.getByRole('button', { name: /^Enviar propuesta/ }).click();
    await p.waitForURL('**/pedidos/detalle/**');
    await ver(p, 'Esperando al cliente');
    await foto('05-propuesta');
    assert.ok(llamadas.includes('POST /v1/especialista/propuestas'), 'la propuesta fue a la API');

    paso = 'API caída: error con reintento, nunca datos de prueba';
    await control('POST', '/apagar-api');
    await p.goto(`${base}/pedidos/`);
    await p.getByRole('button', { name: /Reintentar/ }).first().waitFor();
    assert.equal(await p.getByText('Pierde la canilla de la cocina').count(), 0, 'sin datos viejos ni fixtures');
    assert.equal(await p.getByText('Cambiar el flexible del inodoro').count(), 0, 'nunca los pedidos del mock');
    await foto('06-sin-api');
    await control('POST', '/prender-api');
    await p.getByRole('button', { name: /Reintentar/ }).first().click();
    await ver(p, 'Pierde la canilla de la cocina');
    await sinNadaEnElNavegador(p);

    paso = 'salir';
    await nav(p, 'Cuenta');
    await p.getByRole('button', { name: /Cerrar sesión|Salir/ }).first().click();
    const confirmar = p.getByRole('dialog').getByRole('button', { name: /Cerrar sesión|Salir/ });
    if (await confirmar.count()) await confirmar.first().click();
    await p.waitForURL(/\/(ingreso|bienvenida|acceso)\//);
    assert.ok(llamadas.includes('POST /v1/auth/salida'), 'la salida fue a la API');

    assert.deepEqual(errores, [], 'errores de consola');
    console.log(`✔ PWA http contra la API local (${llamadas.length} llamadas a la API)`);
  } catch (e) {
    await p.screenshot({ path: join(CAPTURAS ?? '/tmp', 'FALLO-backend.png'), fullPage: true }).catch(() => undefined);
    console.log(`✘ ${paso}: ${e.message.split('\n').slice(0, 6).join(' | ')}`);
    if (errores.length) console.log(errores.join('\n'));
    process.exitCode = 1;
  } finally {
    await navegador.close();
    srv.close();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
