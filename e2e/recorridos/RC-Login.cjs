// Recorrido RC-Login del lienzo (lote 1.1): D6-Bienvenida → D6-Login → D6-Login2FA → adentro; alternativas
// D6-Recuperar y D6-Acceso → D6-Codigo; X-Escritorio desde una computadora. Además, auditoría axe de cada pantalla.
// Lo corre e2e/flujos.cjs (carga todos los e2e/recorridos/*.cjs) o solo: `node e2e/recorridos/RC-Login.cjs` sobre out/.
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');

const IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Mobile/15E148 Safari/604.1';
const CLAVE = 'clave-de-prueba-123';
const ver = (p, t, o) => p.getByText(t, o).first().waitFor();
const SALIR_DE_ACCESO = (u) => !/\/(acceso|bienvenida|recuperar)\//.test(new URL(u).pathname);

let AXE = null;
async function axe(p, nombre) {
  AXE ??= readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');
  await p.addScriptTag({ content: AXE });
  const v = await p.evaluate(async () => {
    const r = await axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'] } });
    return r.violations.map((x) => `${x.id}: ${x.nodes.map((n) => n.target.join(' ')).join(', ')}`);
  });
  assert.deepEqual(v, [], `axe en ${nombre}`);
  const h1 = await p.evaluate(() => document.querySelectorAll('h1').length);
  assert.equal(h1, 1, `${nombre}: un solo h1`);
}

/** [nombre, pasos, opciones] para el `escenario` de flujos.cjs. */
const RECORRIDOS = [
  [
    'RC-Login-1-bienvenida-y-segunda-verificacion',
    async ({ p, base, foto }) => {
      await p.goto(`${base}/bienvenida/?escenario=nuevo`);
      await ver(p, 'tus precios');
      // La ciudad se arma (con movimiento) y la pantalla no tiene láminas ni el 0 % de la demo
      assert.equal(await p.getByText('0 %').count(), 0, 'la bienvenida no habla de la tarifa');
      await foto('01-bienvenida');
      await axe(p, 'bienvenida');
      await p.getByRole('link', { name: 'Ya tengo cuenta' }).click();
      await p.waitForURL('**/acceso/');
      // Vacío: el error se dice con texto y el foco va al primer campo
      await p.getByRole('button', { name: 'Entrar', exact: true }).click();
      await ver(p, 'Escribí tu email o tu teléfono.');
      await p.waitForFunction(() => document.activeElement?.getAttribute('autocomplete') === 'username');
      await axe(p, 'login');
      // Fuera de un dispositivo Apple no se ofrece Apple
      assert.equal(await p.getByRole('button', { name: 'Apple' }).count(), 0);
      await p.getByLabel('Email o teléfono').fill('especialista.2fa@example.test');
      await p.getByLabel('Contraseña', { exact: true }).fill(CLAVE);
      await p.getByRole('button', { name: 'Mostrar la contraseña' }).click();
      assert.equal(await p.getByLabel('Contraseña', { exact: true }).getAttribute('type'), 'text');
      await p.getByRole('checkbox', { name: 'Recordar este teléfono' }).check();
      await foto('02-login');
      await p.getByRole('button', { name: 'Entrar', exact: true }).click();
      // Paso 2 de 2: el código de la app
      await p.waitForURL('**/acceso/verificacion/');
      await ver(p, 'Paso 2 de 2');
      await ver(p, 'Abrí tu app autenticadora');
      await axe(p, 'segunda verificación');
      await p.getByLabel('Código de 6 números').fill('000000');
      await p.getByRole('button', { name: 'Entrar', exact: true }).click();
      await ver(p, 'Te quedan 4 intentos');
      // El foco vuelve al código para probar de nuevo
      await p.waitForFunction(() => document.activeElement?.getAttribute('autocomplete') === 'one-time-code');
      await foto('03-codigo-incorrecto');
      // Por SMS: se manda y se pide con la espera escrita
      await p.getByRole('button', { name: /Mandarme un SMS/ }).click();
      await ver(p, 'termina en 9876');
      await ver(p, '¿No llegó? Pedí otro en');
      // O con un código de respaldo
      await p.getByRole('button', { name: /Usar un código de respaldo/ }).click();
      await p.getByLabel('Código de respaldo').fill('hx7kp2m9qd');
      assert.equal(await p.getByLabel('Código de respaldo').inputValue(), 'HX7KP-2M9QD');
      await p.getByRole('button', { name: 'Entrar', exact: true }).click();
      await p.waitForURL(SALIR_DE_ACCESO);
      await foto('04-adentro');
    },
    { movimiento: 'no-preference' },
  ],
  [
    'RC-Login-2-telefono-y-sesion-vencida',
    async ({ p, base }) => {
      await p.goto(`${base}/acceso/?motivo=sesion&escenario=habilitado`);
      await ver(p, 'Por seguridad cerramos tu sesión');
      await p.getByLabel('Email o teléfono').fill('nadie@example.test');
      await p.getByLabel('Contraseña', { exact: true }).fill(CLAVE);
      await p.getByRole('button', { name: 'Entrar', exact: true }).click();
      await ver(p, 'El email, el teléfono o la contraseña no son correctos.');
      // Datos incorrectos no son una sesión vencida
      assert.equal(await p.getByText('Tu sesión expiró').count(), 0);
      await p.getByLabel('Email o teléfono').fill('223 555-4521');
      await p.getByLabel('Contraseña', { exact: true }).fill(CLAVE);
      await p.getByRole('button', { name: 'Entrar', exact: true }).click();
      await p.waitForURL('**/inicio/');
    },
  ],
  [
    'RC-Login-3-recuperar-la-contrasena',
    async ({ p, base, foto }) => {
      await p.goto(`${base}/acceso/?escenario=habilitado`);
      await p.getByRole('link', { name: '¿Olvidaste la contraseña?' }).click();
      await p.waitForURL('**/recuperar/');
      await axe(p, 'recuperar');
      await p.getByLabel('Email o teléfono').fill('223 555-4521');
      await p.getByRole('button', { name: 'Mandarme el enlace' }).click();
      await ver(p, 'Por seguridad no te decimos si la cuenta existe');
      await foto('01-revisa-tu-email');
      await p.getByRole('link', { name: 'Abrir el enlace del email' }).click();
      await ver(p, 'Creá una');
      // El token sale de la barra de direcciones apenas se lee
      assert.equal(new URL(p.url()).search, '', 'el token quedó en la URL');
      await axe(p, 'contraseña nueva');
      await p.getByRole('textbox', { name: 'Contraseña nueva' }).fill('corta');
      await p.getByRole('button', { name: 'Guardar la contraseña' }).click();
      await ver(p, 'Usá al menos 12 caracteres.');
      await p.getByRole('textbox', { name: 'Contraseña nueva' }).fill('una-frase-nueva-y-larga');
      await ver(p, 'Muy buena');
      await foto('02-contrasena-nueva');
      await p.getByRole('button', { name: 'Guardar la contraseña' }).click();
      await ver(p, 'Por seguridad cerramos las sesiones abiertas en otros teléfonos. Entrá');
      await p.getByRole('link', { name: 'Entrar', exact: true }).click();
      await p.waitForURL('**/acceso/');
      // Lo escrito en «Email o teléfono» vuelve solo
      assert.equal(await p.getByLabel('Email o teléfono').inputValue(), '223 555-4521');
      await p.getByLabel('Contraseña', { exact: true }).fill('una-frase-nueva-y-larga');
      await p.getByRole('button', { name: 'Entrar', exact: true }).click();
      await p.waitForURL('**/inicio/');
    },
  ],
  [
    'RC-Login-4-enlace-vencido',
    async ({ p, base }) => {
      await p.goto(`${base}/recuperar/?escenario=habilitado`);
      await p.getByLabel('Email o teléfono').fill('especialista@example.test');
      await p.getByRole('button', { name: 'Mandarme el enlace' }).click();
      await p.getByRole('link', { name: 'Probar un enlace vencido' }).click();
      await ver(p, 'Los enlaces sirven una sola vez');
      await p.getByRole('link', { name: 'Pedir otro enlace' }).click();
      await p.waitForURL('**/recuperar/');
    },
  ],
  [
    'RC-Login-5-entrar-con-un-codigo',
    async ({ p, base, foto }) => {
      await p.goto(`${base}/acceso/?escenario=habilitado`);
      await p.getByRole('link', { name: 'Entrar sin contraseña, con un código' }).click();
      await p.waitForURL('**/acceso/codigo/');
      await axe(p, 'entrar con un código');
      await p.getByLabel('Email o teléfono').fill('especialista@example.test');
      await p.getByRole('radio', { name: /Código por SMS/ }).check();
      await foto('01-como-entras');
      await p.getByRole('button', { name: 'Mandarme el código' }).click();
      await p.waitForURL('**/acceso/codigo/verificar/');
      await ver(p, 'mensajes');
      await ver(p, 'al teléfono de tu cuenta');
      await axe(p, 'código');
      // Antes de la espera no se puede pedir otro; sí probar por el email
      assert.equal(await p.getByRole('button', { name: 'Pedir otro código' }).count(), 0);
      await p.getByRole('button', { name: 'Probar con el email' }).click();
      await ver(p, 'es•••@example.test');
      await p.getByLabel('Código de 6 números').fill('111111');
      await p.getByRole('button', { name: 'Entrar', exact: true }).click();
      await ver(p, 'Te quedan 4 intentos');
      await p.getByLabel('Código de 6 números').fill('482913');
      await foto('02-codigo');
      await p.getByRole('button', { name: 'Entrar', exact: true }).click();
      await p.waitForURL('**/inicio/');
    },
  ],
  [
    'RC-Login-6-google-y-apple-en-iphone',
    async ({ p, base }) => {
      await p.goto(`${base}/acceso/?escenario=habilitado`);
      await p.getByRole('button', { name: 'Apple' }).waitFor();
      await p.getByRole('button', { name: 'Google' }).click();
      await ver(p, 'Elegí tu cuenta de Google');
      await axe(p, 'elegir cuenta de Google');
      await p.getByRole('button', { name: /^especialista@example\.test/ }).click();
      await p.waitForURL('**/inicio/');
    },
    { agente: IPHONE },
  ],
  [
    'RC-Login-7-recargar-en-el-paso-2',
    async ({ p, base }) => {
      // El desafío vive solo en memoria: recargar pide volver a entrar (nada en el almacenamiento del navegador)
      await p.goto(`${base}/acceso/verificacion/?escenario=habilitado`);
      await ver(p, 'Por seguridad, el paso 2 dura unos minutos');
      await p.getByRole('link', { name: 'Volver a entrar' }).last().click();
      await p.waitForURL('**/acceso/');
      const { cookies, origins } = await p.context().storageState();
      assert.deepEqual([cookies, origins.flatMap((o) => o.localStorage)], [[], []], 'el acceso guardó algo en el navegador');
    },
  ],
  [
    'RC-Login-8-desde-una-computadora',
    async ({ p, base }) => {
      await p.goto(`${base}/bienvenida/?escenario=nuevo`);
      await ver(p, 'Escaneá con tu celular');
    },
    { ancho: 1280, alto: 800 },
  ],
];

module.exports = { RECORRIDOS };

// Solo: sirve out/ y corre estos recorridos.
if (require.main === module) {
  const { join } = require('node:path');
  const { servir } = require('../servidor.cjs');
  const { chromium } = require('playwright');
  (async () => {
    const srv = await servir();
    const base = `http://localhost:${srv.address().port}`;
    const nav = await chromium.launch();
    let mal = 0;
    for (const [nombre, pasos, o = {}] of RECORRIDOS) {
      if (process.env.SOLO && !nombre.startsWith(process.env.SOLO)) continue;
      const ctx = await nav.newContext({ viewport: { width: o.ancho ?? 390, height: o.alto ?? 844 }, reducedMotion: o.movimiento ?? 'reduce', userAgent: o.agente });
      const p = await ctx.newPage();
      const errores = [];
      p.on('pageerror', (e) => errores.push('PAGEERROR ' + e.message));
      p.on('console', (m) => m.type() === 'error' && !/Failed to load resource|bad HTTP response code/.test(m.text()) && errores.push('CONSOLE ' + m.text()));
      p.setDefaultTimeout(8000);
      const capturas = process.env.CAPTURAS;
      const foto = async (n) => capturas && p.screenshot({ path: join(capturas, `${nombre}-${n}.png`), fullPage: true });
      try {
        await pasos({ p, base, foto });
        assert.deepEqual(errores, [], 'errores de consola');
        console.log(`✔ ${nombre}`);
      } catch (e) {
        mal += 1;
        await p.screenshot({ path: join(capturas ?? '/tmp', `FALLO-${nombre}.png`), fullPage: true }).catch(() => undefined);
        console.log(`✘ ${nombre}: ${e.message.split('\n').slice(0, 6).join(' | ')}`);
      } finally {
        await ctx.close();
      }
    }
    await nav.close();
    srv.close();
    process.exit(mal ? 1 : 0);
  })();
}
