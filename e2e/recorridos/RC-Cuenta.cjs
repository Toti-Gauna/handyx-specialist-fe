// RC-Cuenta (lote 1.4): «Tu cuenta, todo lo tuyo en un lugar». Recorre F-Cuenta → CU-Perfil → CU-Datos → CU-Disponibilidad →
// CU-Cobros → CU-Notificaciones → CU-Privacidad → D6-Seguridad → D6-TOTP, más D6-Avisos y D6-Ayuda y «Letra más grande».
// Uso: npm run build (o `npx next build --webpack`) && node e2e/recorridos/RC-Cuenta.cjs   (CAPTURAS=/ruta guarda capturas)
const assert = require('node:assert/strict');
const { join } = require('node:path');
const { chromium } = require('playwright');
const { servir } = require('../servidor.cjs');

const CODIGO_TOTP = '246810'; // lo acepta el mock (src/data/mock/cuenta-estado.ts)
const CLAVE = 'clave-de-prueba-123';

const ver = (p, t, o) => p.getByText(t, o).first().waitFor();
const nav = (p, n) => p.getByRole('navigation', { name: 'Secciones' }).getByText(n, { exact: true }).click();
// Las filas de Cuenta están en el contenido (`main`): así no se confunde con la campana ni con la barra de abajo.
const ir = (p, nombre) => p.getByRole('main').getByRole('link', { name: nombre }).first().click();

async function correr(nombre, navegador, base, pasos, { ancho = 390, alto = 844, capturas = process.env.CAPTURAS ?? null } = {}) {
  if (process.env.SOLO && !nombre.startsWith(process.env.SOLO)) return true;
  const ctx = await navegador.newContext({ viewport: { width: ancho, height: alto }, reducedMotion: 'reduce' });
  const p = await ctx.newPage();
  const errores = [];
  p.on('pageerror', (e) => errores.push('PAGEERROR ' + e.message));
  p.on('console', (m) => m.type() === 'error' && !/Failed to load resource/.test(m.text()) && errores.push('CONSOLE ' + m.text()));
  p.setDefaultTimeout(8000);
  const foto = async (n) => {
    if (!capturas) return;
    await p.screenshot({ path: join(capturas, `${nombre}-${n}.png`), fullPage: true });
  };
  try {
    await pasos({ p, base, foto });
    assert.deepEqual(errores, [], 'errores de consola');
    console.log(`✔ ${nombre}`);
    return true;
  } catch (e) {
    await p.screenshot({ path: join(capturas ?? '/tmp', `FALLO-${nombre}.png`), fullPage: true }).catch(() => undefined);
    console.log(`✘ ${nombre}: ${e.message.split('\n').slice(0, 6).join(' | ')}`);
    return false;
  } finally {
    await ctx.close();
  }
}

async function main() {
  const srv = await servir();
  const base = `http://localhost:${srv.address().port}`;
  const nav_ = await chromium.launch();
  const ok = [];

  ok.push(
    await correr('RC-Cuenta-recorrido', nav_, base, async ({ p, foto }) => {
      await p.goto(`${base}/?escenario=habilitado`);
      await p.waitForURL('**/inicio/');
      await nav(p, 'Cuenta');
      await p.waitForURL('**/cuenta/');
      // F-Cuenta: nombre, sello (lo dice el servidor), mosaicos y las filas de cada sección
      await ver(p, 'Letra más grande');
      await ver(p, 'Verificado por Handyx');
      for (const t of ['Tu perfil', 'Disponibilidad y zonas', 'Medios de cobro', 'Datos y verificación', 'Seguridad', 'Avisos', 'Privacidad y baja', 'Centro de ayuda', 'Cerrar sesión']) await ver(p, t, { exact: true });
      assert.equal(await p.getByText('0 % durante la demo').count(), 0, 'sin el aviso del 0 % (lote 0.2)');
      await foto('01-cuenta');

      // CU-Perfil: lo que ven los clientes; la presentación se edita en una hoja
      await ir(p, /^Tu perfil/);
      await p.waitForURL('**/cuenta/perfil/');
      await ver(p, 'Así te ven los clientes');
      await foto('02-perfil');
      await p.getByRole('button', { name: 'Editar foto y presentación' }).click();
      await p.getByLabel('Tu presentación').fill('Plomero prolijo, te explico todo.');
      await p.getByRole('button', { name: 'Guardar presentación' }).click();
      await ver(p, 'Guardamos tu presentación.');
      await ver(p, '«Plomero prolijo, te explico todo.»');
      await p.getByRole('link', { name: 'Volver' }).click();
      await p.waitForURL('**/cuenta/');

      // CU-Datos: solo los últimos números; el domicilio nunca se muestra
      await ir(p, /Datos y verificación/);
      await p.waitForURL('**/cuenta/datos/');
      await ver(p, '•• ••• 222');
      await ver(p, 'Solo vos');
      assert.equal(await p.getByText('30111222').count(), 0, 'el DNI nunca sale completo');
      await foto('03-datos');
      await p.getByRole('link', { name: 'Volver' }).click();

      // CU-Disponibilidad: horario de un día en una hoja y zonas
      await ir(p, /Disponibilidad y zonas/);
      await p.waitForURL('**/disponibilidad/');
      await ver(p, 'Urgentes ahora');
      await foto('04-disponibilidad');
      await p.getByRole('button', { name: 'Editar el horario del lunes' }).click();
      await p.getByLabel('Hasta').fill('19:00');
      await p.getByRole('button', { name: 'Guardar horario' }).click();
      await ver(p, '8:00 a 19:00');
      await p.getByRole('button', { name: /Zonas/ }).click();
      await p.getByRole('checkbox', { name: 'Güemes' }).check();
      await p.getByRole('button', { name: 'Guardar zonas' }).click();
      await ver(p, /Güemes/);
      await p.getByRole('link', { name: 'Volver' }).click();

      // CU-Cobros: el pago va directo; transferencia con alias (queda enmascarado)
      await ir(p, /Medios de cobro/);
      await p.waitForURL('**/cuenta/cobros/');
      await ver(p, 'El cliente te paga directo a vos. Handyx no recibe la plata ni te cobra comisión.');
      await foto('05-cobros');
      await p.getByRole('button', { name: 'Agregar transferencia' }).click();
      await p.getByLabel('Tu alias o CBU').fill('julian.ortiz.mdp');
      await p.getByRole('button', { name: 'Usar Transferencia' }).click();
      await ver(p, /Alias o CBU · jul•••dp/);
      assert.equal(await p.getByText('julian.ortiz.mdp').count(), 0, 'el alias vuelve enmascarado');
      await p.getByRole('link', { name: 'Volver' }).click();

      // CU-Notificaciones: un interruptor se guarda al instante y dice Sí o No
      await ir(p, /^Avisos Qué te llega/);
      await p.waitForURL('**/cuenta/notificaciones/');
      await ver(p, 'Pedidos y trabajos');
      await foto('06-notificaciones');
      const nov = p.getByRole('switch', { name: 'Novedades de Handyx' });
      assert.equal(await nov.getAttribute('aria-checked'), 'false');
      await nov.click();
      await p.getByRole('switch', { name: 'Novedades de Handyx' }).and(p.locator('[aria-checked="true"]')).waitFor();
      await p.getByRole('link', { name: 'Volver' }).click();

      // CU-Privacidad: descargar mis datos pide la contraseña y queda pedido
      await ir(p, /Privacidad y baja/);
      await p.waitForURL('**/cuenta/privacidad/');
      await ver(p, 'Descargar mis datos');
      await foto('07-privacidad');
      await p.getByRole('button', { name: /Descargar mis datos/ }).click();
      await p.getByLabel('Tu contraseña').fill('equivocada-123456');
      await p.getByRole('button', { name: 'Pedir mis datos' }).click();
      await ver(p, /No coincide/);
      await p.getByLabel('Tu contraseña').fill(CLAVE);
      await p.getByRole('button', { name: 'Pedir mis datos' }).click();
      await ver(p, /Lo estamos armando/);
      await p.getByRole('link', { name: 'Volver' }).click();

      // D6-Seguridad → D6-TOTP: 3 pasos, la clave se ve una vez y quedan los códigos de respaldo
      await ir(p, /^Seguridad/);
      await p.waitForURL('**/cuenta/seguridad/');
      await ver(p, 'Segunda verificación');
      await ver(p, 'Todavía no disponible'); // SMS sin proveedor
      await foto('08-seguridad');
      await p.getByRole('link', { name: 'Activar la app autenticadora' }).click();
      await p.waitForURL('**/cuenta/seguridad/app/');
      await ver(p, 'Paso 1 de 3');
      await p.getByLabel('Tu contraseña').fill(CLAVE);
      await p.getByRole('button', { name: 'Seguir' }).click();
      await ver(p, 'Paso 2 de 3');
      await ver(p, 'JBSW Y3DP EHPK 3PXP');
      await foto('09-totp');
      await p.getByLabel('Escribí el código que muestra la app').fill('000000');
      await p.getByRole('button', { name: 'Activar' }).click();
      await ver(p, /No coincide/);
      await p.getByLabel('Escribí el código que muestra la app').fill(CODIGO_TOTP);
      await p.getByRole('button', { name: 'Activar' }).click();
      await ver(p, 'Paso 3 de 3');
      assert.equal(await p.getByRole('list', { name: 'Tus códigos de respaldo' }).getByRole('listitem').count(), 10);
      await foto('10-codigos');
      assert.equal(await p.evaluate(() => JSON.stringify([localStorage, sessionStorage])), '[{},{}]', 'nada en el almacenamiento del navegador');
      assert.equal(await p.evaluate(() => document.cookie), '', 'ni cookies');
      await p.getByRole('button', { name: 'Ya los guardé' }).click();
      await p.waitForURL('**/cuenta/seguridad/');
      await ver(p, 'Activa');
    }),
  );

  ok.push(
    await correr('RC-Cuenta-letra-grande', nav_, base, async ({ p, foto }) => {
      await p.goto(`${base}/cuenta/?escenario=habilitado`);
      const px = () => p.evaluate(() => parseFloat(getComputedStyle(document.documentElement).fontSize));
      await ver(p, 'Letra más grande');
      const antes = await px();
      await p.getByRole('switch', { name: 'Letra más grande' }).click();
      await p.getByRole('switch', { name: 'Letra más grande' }).and(p.locator('[aria-checked="true"]')).waitFor();
      assert.ok((await px()) > antes, 'la letra se agranda en toda la app');
      await foto('01-grande');
      // Se guardó en el servidor: otra pantalla la sigue mostrando agrandada
      await ir(p, /^Avisos Qué te llega/);
      await p.waitForURL('**/cuenta/notificaciones/');
      assert.ok((await px()) > antes);
      await p.getByRole('switch', { name: 'Letra más grande' }).count();
    }),
  );

  ok.push(
    await correr('RC-Cuenta-avisos', nav_, base, async ({ p, foto }) => {
      await p.goto(`${base}/notificaciones/?escenario=habilitado`);
      await ver(p, 'Nada se acepta desde acá.');
      await foto('01-avisos');
      const antes = await p.getByRole('button', { name: /^Quitar el aviso/ }).count();
      assert.ok(antes > 0);
      await p.getByRole('button', { name: /^Quitar el aviso/ }).first().click();
      await p.waitForFunction((n) => document.querySelectorAll('.ui-aviso').length === n, antes - 1);
      // Borrar todos pide confirmación
      await p.getByRole('button', { name: 'Borrar todos los avisos' }).click();
      await ver(p, '¿Borrar todos los avisos?');
      await p.getByRole('button', { name: 'No, volver' }).click();
      assert.equal(await p.locator('.ui-aviso').count(), antes - 1, 'cancelar no borra nada');
      await p.getByRole('button', { name: 'Borrar todos los avisos' }).click();
      await p.getByRole('button', { name: 'Sí, borrar todos' }).click();
      await ver(p, 'No tenés avisos');
    }),
  );

  ok.push(
    await correr('RC-Cuenta-ayuda', nav_, base, async ({ p, foto }) => {
      await p.goto(`${base}/soporte/?escenario=habilitado`);
      await ver(p, '¿En qué te');
      await ver(p, 'Lo más consultado');
      await foto('01-ayuda');
      await p.getByRole('button', { name: /Cobros/ }).click();
      await p.getByText('¿Quién me paga?').click();
      await ver(p, 'Handyx no recibe, no guarda ni te transfiere ese dinero.');
      await p.getByRole('searchbox').fill('matricula');
      await ver(p, /Lo que encontramos/);
      await ver(p, '¿Por qué me piden la matrícula?');
      await p.getByRole('searchbox').fill('zzzz');
      await ver(p, 'No encontramos nada con esas palabras.');
      await p.getByRole('searchbox').fill('');
      // Hablar con soporte lleva a tus casos y se puede abrir uno
      await p.getByRole('link', { name: /Hablar con soporte/ }).click();
      await p.waitForURL('**/soporte/casos/');
      await p.getByRole('button', { name: 'Abrir un caso' }).click();
      await p.getByLabel('Asunto').fill('Una duda con un cobro');
      await p.getByLabel('Contanos qué pasó').fill('No me coincide el monto.');
      await p.getByRole('button', { name: 'Enviar el caso' }).click();
      await p.waitForURL('**/soporte/detalle/**');
    }),
  );

  await nav_.close();
  srv.close();
  const mal = ok.filter((x) => !x).length;
  console.log(`\n${ok.length - mal}/${ok.length} recorridos de cuenta OK`);
  process.exit(mal ? 1 : 0);
}

main();
