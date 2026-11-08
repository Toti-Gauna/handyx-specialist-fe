// Recorrido RC-Presupuesto del lienzo (lote 2.2): F-Trabajo → H0-Presupuesto → H0-AgregarMaterial → H0-MaterialOpciones →
// H0-MaterialNuevo → H0-AgregarLista → F-Chat (llega por el chat; el cliente acepta desde el Panel de prueba) y, aparte,
// H0-Precios → H0-PreciosFoto (se lee en el teléfono) → H0-PreciosRevisar → H0-PrecioItem → H0-ManoObra.
// Además: axe en cada pantalla, un solo h1 y nada de la foto sale del teléfono (ninguna petición lleva imágenes).
// Lo corre e2e/flujos.cjs (carga todos los e2e/recorridos/*.cjs) o solo: `node e2e/recorridos/RC-Presupuesto.cjs` sobre out/.
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');

const id = (n) => `00000000-0000-4000-8000-${n.toString(16).padStart(12, '0')}`;
const TRABAJO = id(0xc7); // «Pierde la canilla» de Lucía Ferreyra (src/data/mock/nucleo.ts)
const CARTUCHO = id(0x220001); // src/data/mock/presupuestos.ts

const ver = (p, t, o) => p.getByText(t, o).first().waitFor();
const panel = async (p, ...acciones) => {
  await p.getByRole('button', { name: 'Panel de prueba' }).click();
  for (const a of acciones) await p.getByRole('button', { name: a }).click();
  await p.keyboard.press('Escape');
};

let AXE = null;
async function axe(p, nombre) {
  AXE ??= readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');
  await p.addScriptTag({ content: AXE });
  const v = await p.evaluate(async () => {
    const r = await axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'] } });
    return r.violations.map((x) => `${x.id}: ${x.nodes.map((n) => n.target.join(' ')).join(', ')}`);
  });
  assert.deepEqual(v, [], `axe en ${nombre}`);
  assert.ok((await p.evaluate(() => document.querySelectorAll('h1').length)) <= 1, `${nombre}: como mucho un h1`);
}

const RECORRIDOS = [
  [
    'RC-Presupuesto-1-armar-y-mandar',
    async ({ p, base, foto }) => {
      // Desde el trabajo: abre el borrador de la versión 2
      await p.goto(`${base}/presupuestos/?trabajo=${TRABAJO}&escenario=habilitado`);
      await p.waitForURL(/\/presupuestos\/\?id=/);
      await ver(p, 'Pierde la canilla · versión 2');
      await ver(p, '$ 47.000');
      await ver(p, 'Se actualiza');
      await ver(p, 'Precio fijo');
      await foto('01-presupuesto');
      await axe(p, 'H0-Presupuesto');

      // Agregar un material: buscar, tocar y elegir la cantidad; las opciones van resumidas
      await p.getByRole('link', { name: 'Agregar un material' }).click();
      await p.waitForURL('**/presupuestos/material/**');
      await p.getByRole('searchbox', { name: 'Buscar en tu lista de precios' }).fill('cartucho 35');
      await p.getByRole('button', { name: /^Elegir Cartucho cerámico 35 mm largo/ }).click();
      await p.getByRole('button', { name: 'Sumar 1: Cantidad de Cartucho cerámico 35 mm largo' }).click();
      await ver(p, 'Se lo cobrás a Lucía en el presupuesto');
      await foto('02-agregar-material');
      await axe(p, 'H0-AgregarMaterial');
      // H0-MaterialOpciones: se cambian en una hoja y quedan como tu forma de agregar
      await p.getByRole('button', { name: 'Cambiar las opciones del material' }).click();
      const hoja = p.locator('dialog[open]');
      await hoja.getByText('Lo que elijas queda como tu forma de agregar materiales').waitFor();
      await hoja.getByRole('switch', { name: 'Congelar el precio' }).click();
      assert.equal(await hoja.getByRole('switch', { name: 'Congelar el precio' }).getAttribute('aria-checked'), 'true');
      await foto('03-opciones');
      await axe(p, 'H0-MaterialOpciones');
      await hoja.getByRole('button', { name: 'Listo' }).click();
      await hoja.waitFor({ state: 'detached' }).catch(() => undefined);
      await p.getByRole('button', { name: 'Agregar · $ 22.400' }).click();
      await p.waitForURL(/\/presupuestos\/\?id=/);
      await ver(p, 'Cartucho cerámico 35 mm largo × 2');
      await ver(p, '$ 69.400');

      // Si no está: material nuevo (el nombre suma al catálogo, nunca el precio)
      await p.getByRole('link', { name: 'Agregar un material' }).click();
      await p.getByRole('searchbox', { name: 'Buscar en tu lista de precios' }).fill('Termofusión codo 25 mm');
      await ver(p, 'No hay «Termofusión codo 25 mm» en tu lista.');
      await p.getByRole('link', { name: /¿No está\? Agregalo a tu lista/ }).click();
      await p.waitForURL('**/presupuestos/material-nuevo/**');
      await ver(p, '«Termofusión codo 25 mm» no estaba en tu lista.');
      await ver(p, 'Tu precio queda solo para vos', { exact: false });
      // Sin precio no se guarda: el error se dice y el foco va al campo
      await p.getByRole('button', { name: 'Guardar y agregar' }).click();
      await ver(p, 'Escribí lo que pagaste, en pesos.');
      await p.getByLabel('Precio que pagaste').fill('1450');
      await foto('04-material-nuevo');
      await axe(p, 'H0-MaterialNuevo');
      await p.getByRole('button', { name: 'Guardar y agregar · $ 1.450' }).click();
      await p.waitForURL(/\/presupuestos\/\?id=/);
      await ver(p, 'Termofusión codo 25 mm');

      // O varios de una vez: el kit trae nombres; el precio sale de tu lista
      await p.getByRole('link', { name: 'Agregar varios' }).click();
      await p.waitForURL('**/presupuestos/varios/**');
      await ver(p, 'Kit · Cambio de grifería');
      await ver(p, '3 de 4');
      await foto('05-agregar-varios');
      await axe(p, 'H0-AgregarLista');
      await p.getByRole('button', { name: /^Agregar 3 · / }).click();
      await p.waitForURL(/\/presupuestos\/\?id=/);
      await ver(p, 'Llave de paso 1/2"');

      // Se manda directo por el chat (sin pantalla extra) y llega como tarjeta
      await p.getByRole('button', { name: 'Mandar a Lucía por el chat' }).click();
      await p.waitForURL('**/mensajes/hilo/**');
      await ver(p, /Presupuesto «Pierde la canilla» · versión 2/);
      await foto('06-chat');
      // El cliente acepta (Panel de prueba) y lo dice en el chat
      await panel(p, 'Acepta tu último presupuesto');
      await ver(p, /Acepto el presupuesto/);
    },
  ],
  [
    'RC-Presupuesto-2-lista-de-precios',
    async ({ p, base, foto }) => {
      const imagenes = [];
      p.on('request', (r) => {
        const tipo = r.headers()['content-type'] ?? '';
        if (r.method() !== 'GET' && (/image|multipart/.test(tipo) || (r.postData() ?? '').length > 200_000)) imagenes.push(r.url());
      });
      await p.goto(`${base}/precios/?escenario=habilitado`);
      await ver(p, 'Para qué sirve');
      await ver(p, 'Hace 46 días');
      await foto('07-precios');
      await axe(p, 'H0-Precios');

      // Foto de la lista del corralón: se lee en el teléfono
      await p.getByRole('link', { name: /Foto de la lista del corralón/ }).click();
      await p.waitForURL('**/precios/foto/');
      await ver(p, 'la foto no sale de acá', { exact: false });
      await axe(p, 'H0-PreciosFoto (cámara)');
      await p.getByRole('button', { name: 'Sacar foto de prueba' }).click();
      await ver(p, '5 precios encontrados');
      await ver(p, 'Corralón Simulación · 17/11');
      await foto('08-foto');
      await axe(p, 'H0-PreciosFoto');
      await p.getByRole('button', { name: 'Revisar 5 precios' }).click();

      // Revisar lo leído: sube, igual, nuevo y lo que no se entendió se corrige a mano
      await ver(p, 'Revisá los precios');
      await ver(p, 'Sube 8 %');
      await ver(p, 'Nuevo');
      await ver(p, 'Leímos «$ 1?0»');
      await ver(p, 'Los presupuestos abiertos con precio que se actualiza', { exact: false }).catch(() => undefined);
      await axe(p, 'H0-PreciosRevisar');
      await p.getByRole('button', { name: /Codo 20 mm/ }).click();
      const hoja = p.locator('dialog[open]');
      await hoja.getByLabel('Precio').fill('1.000');
      await hoja.getByRole('button', { name: 'Usar este precio' }).click();
      await ver(p, 'Sube 5 %');
      await foto('09-revisar');
      await p.getByRole('button', { name: 'Guardar 6 precios' }).click();
      await p.waitForURL('**/precios/?guardados=6');
      await ver(p, 'Guardamos 6 precios de la lista.');
      assert.deepEqual(imagenes, [], 'la foto nunca se manda');

      // Detalle e historial
      await p.goto(`${base}/precios/detalle/?id=${CARTUCHO}`).catch(() => undefined);
      // (la navegación completa reinicia el mock: se vuelve a mirar el sembrado)
      await ver(p, 'Cómo varió · miles de pesos');
      await ver(p, '+17 % en 4 meses');
      await axe(p, 'H0-PrecioItem');
      await p.getByRole('radio', { name: /Precio fijo/ }).check();
      await p.getByRole('button', { name: 'Guardar' }).click();
      await ver(p, 'Guardamos el precio.', { exact: false });
      await foto('10-detalle');

      // Mano de obra
      await p.getByRole('link', { name: 'Volver' }).click();
      await p.getByRole('link', { name: /Mano de obra/ }).click();
      await p.waitForURL('**/precios/mano-de-obra/');
      await ver(p, 'Por tarea · Plomería');
      await axe(p, 'H0-ManoObra');
      await p.getByRole('button', { name: 'Agregar una tarea' }).click();
      const t = p.locator('dialog[open]');
      await t.getByLabel('Oficio').selectOption('plomeria');
      await t.getByLabel('Tarea', { exact: true }).fill('Cambio de sifón');
      await t.getByLabel('Cuánto cobrás').fill('12000');
      await t.getByRole('button', { name: 'Guardar la tarea' }).click();
      await ver(p, 'Cambio de sifón');
      await foto('11-mano-de-obra');
    },
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
      const ctx = await nav.newContext({ viewport: { width: o.ancho ?? 390, height: o.alto ?? 844 }, reducedMotion: o.movimiento ?? 'reduce' });
      const p = await ctx.newPage();
      const errores = [];
      p.on('pageerror', (e) => errores.push('PAGEERROR ' + e.message));
      p.on('console', (m) => m.type() === 'error' && !/Failed to load resource|bad HTTP response code|Worker failed/.test(m.text()) && errores.push('CONSOLE ' + m.text()));
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
