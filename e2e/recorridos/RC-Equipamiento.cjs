// Recorrido RC-Equipamiento del lienzo (lote 2.4): H0-Equipo → H0-EquipoCategoria → H0-EquipoDetalle → H0-EquipoBaja →
// (reponer: lista de compras; comparar ferreterías llega con la ola 4) → H0-EquipoAgregar. Además: filtros por lugar,
// buscar, mover, prestar y que te la devuelvan, mantenimiento hecho, sumar con el código de barras (cámara simulada) y
// la lista de compras. Axe en cada pantalla.
// Lo corre e2e/flujos.cjs (carga todos los e2e/recorridos/*.cjs) o solo: `node e2e/recorridos/RC-Equipamiento.cjs` sobre out/.
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');

const ver = (p, t, o) => p.getByText(t, o).first().waitFor();
const enMain = (p) => p.getByRole('main');

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
    'RC-Equipamiento-1-categoria-detalle-y-baja',
    async ({ p, base, foto }) => {
      await p.goto(`${base}/taller/equipamiento/?escenario=habilitado`);
      // H0-Equipo: mosaicos por categoría con la alerta escrita (nunca solo el color) y la pestaña Taller marcada
      await ver(p, 'equipamiento');
      await ver(p, 'Matafuego vence 12/12');
      await ver(p, '3 quedan pocos');
      await ver(p, '1 por calibrar');
      assert.equal(await p.getByRole('navigation', { name: 'Secciones' }).getByRole('link', { name: 'Taller' }).getAttribute('aria-current'), 'page');
      await foto('01-equipo');
      await axe(p, 'H0-Equipo');
      // Lo prestado, con a quién y cuándo vuelve
      await p.getByRole('radio', { name: 'Prestado' }).check();
      await ver(p, 'Termofusora 20–32 mm');
      await ver(p, 'Prestada a Sofía');
      await ver(p, 'Vuelve el 20/11');
      await p.getByRole('radio', { name: 'Todo' }).check();

      // H0-EquipoCategoria: buscar y abrir una herramienta
      await enMain(p).getByRole('link', { name: /^Eléctricas/ }).click();
      await p.waitForURL(/taller\/equipamiento\/categoria\/\?c=electricas/);
      await ver(p, '8 herramientas');
      await p.getByRole('searchbox', { name: 'Buscar en eléctricas' }).fill('amol');
      assert.equal(await enMain(p).getByRole('link', { name: /Taladro/ }).count(), 0, 'la búsqueda filtra');
      await foto('02-categoria');
      await axe(p, 'H0-EquipoCategoria');
      await enMain(p).getByRole('link', { name: /Amoladora 115 mm/ }).click();
      await p.waitForURL('**/taller/equipamiento/herramienta/**');

      // H0-EquipoDetalle: mantenimiento e historial (préstamos y trabajos donde se usó)
      await ver(p, 'Cambiar escobillas');
      await ver(p, 'En 25 días');
      await ver(p, 'Usada en «Baño completo» · Jornada 1 · Demolición');
      await ver(p, 'Prestada a Sofía Ruiz · del 02/11 al 05/11 · devuelta');
      await foto('03-detalle');
      await axe(p, 'H0-EquipoDetalle');
      // Mover (en una hoja, con la versión del servidor)
      await p.getByRole('button', { name: 'Mover', exact: true }).click();
      await p.getByRole('dialog').getByRole('radio', { name: 'En el taller' }).check();
      await p.getByRole('button', { name: 'Mover al taller' }).click();
      await ver(p, 'La moviste al taller.');
      // Prestar y que te la devuelvan: prestada no se mueve ni se saca
      await p.getByRole('button', { name: 'Prestar', exact: true }).click();
      await p.getByLabel('¿A quién se la prestás?').fill('Diego Herrera');
      await axe(p, 'Prestar');
      await p.getByRole('dialog').getByRole('button', { name: 'Prestar', exact: true }).click();
      await ver(p, 'Anotamos que se la prestaste a Diego Herrera.');
      assert.ok(await p.getByRole('button', { name: 'Ya no la tengo' }).isDisabled(), 'prestada no se puede sacar');
      await p.getByRole('button', { name: 'Me la devolvió' }).click();
      await ver(p, 'Anotamos que Diego Herrera te la devolvió.');
      // Mantenimiento hecho: calcula el próximo
      await p.getByRole('button', { name: 'Ya lo hice' }).click();
      await ver(p, 'Anotamos «Cambiar escobillas» como hecho.');
      await ver(p, 'Cada 6 meses · próxima 16/05');

      // H0-EquipoBaja: el motivo y si la reponés; sale del equipamiento pero queda en el historial
      await p.getByRole('button', { name: 'Ya no la tengo' }).click();
      await ver(p, '¿Qué pasó con la amoladora?');
      await p.getByRole('dialog').getByRole('radio', { name: 'Se rompió' }).check();
      await p.getByRole('radio', { name: /Sumarla a la lista de compras/ }).check();
      await foto('04-baja');
      await axe(p, 'H0-EquipoBaja');
      await p.getByRole('button', { name: 'Sacarla de mi equipamiento' }).click();
      await p.waitForURL(/taller\/equipamiento\/categoria\/\?c=electricas/);
      await ver(p, /Sacaste «Amoladora 115 mm» de tu equipamiento\. Queda en el historial de tus trabajos\. La sumamos a tu lista de compras\./);
      await ver(p, '7 herramientas');
      assert.equal(await enMain(p).getByRole('link', { name: /Amoladora 115 mm/ }).count(), 0, 'ya no está en la lista');
    },
  ],
  [
    'RC-Equipamiento-2-agregar-y-lista-de-compras',
    async ({ p, base, foto }) => {
      await p.goto(`${base}/taller/equipamiento/agregar/?c=electricas&escenario=habilitado`);
      await ver(p, 'Agregar herramienta');
      // Sin nombre no se guarda: el foco va al campo con el error
      await p.getByRole('button', { name: 'Guardar en tu equipamiento' }).click();
      await ver(p, 'Escribí el nombre de la herramienta.');
      await p.waitForFunction(() => document.activeElement?.getAttribute('aria-invalid') === 'true', null, { timeout: 3000 });
      // Código de barras con la cámara simulada: el servidor sugiere el nombre (sin precios)
      await p.getByRole('button', { name: 'Leer el código de barras' }).click();
      await ver(p, 'Cámara simulada: no se usa la tuya');
      await axe(p, 'Leer el código');
      await p.getByRole('button', { name: 'Leer el código de prueba' }).click();
      await ver(p, /Leímos el código 7790000000017: «Amoladora angular 115 mm»/);
      assert.equal(await p.getByLabel('Nombre').inputValue(), 'Amoladora angular 115 mm');
      await p.getByRole('switch', { name: /Recordarme el mantenimiento/ }).click();
      assert.equal(await p.getByLabel('Qué hay que hacer').inputValue(), 'Revisar las escobillas');
      await p.getByRole('radio', { name: 'Cada 6 meses' }).check();
      await foto('05-agregar');
      await axe(p, 'H0-EquipoAgregar');
      await p.getByRole('button', { name: 'Guardar en tu equipamiento' }).click();
      await p.waitForURL(/taller\/equipamiento\/categoria\/\?c=electricas/);
      await ver(p, 'Sumaste «Amoladora angular 115 mm» a tu equipamiento.');
      await ver(p, '9 herramientas');

      // La lista de compras desde H0-Equipo: sumar y sacar
      await p.goto(`${base}/taller/equipamiento/?escenario=habilitado`);
      await p.getByRole('button', { name: /Lista de compras: cartuchos, teflón y tarugos/ }).click();
      await ver(p, 'Cartuchos de silicona');
      await p.getByLabel('Sumar a la lista').fill('Discos de corte');
      await p.getByRole('button', { name: 'Sumar a la lista', exact: true }).click();
      await ver(p, 'Discos de corte');
      await foto('06-compras');
      await axe(p, 'Lista de compras');
      await p.getByRole('button', { name: 'Sacar Discos de corte de la lista' }).click();
      await p.getByRole('dialog').getByText('Discos de corte', { exact: true }).waitFor({ state: 'detached' });
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
      const foto = async (n) => capturas && p.screenshot({ path: join(capturas, `${nombre}-${n}.png`) });
      try {
        await pasos({ p, base, foto });
        assert.deepEqual(errores, [], 'errores de consola');
        console.log(`✔ ${nombre}`);
      } catch (e) {
        mal += 1;
        await p.screenshot({ path: join(capturas ?? '/tmp', `FALLO-${nombre}.png`) }).catch(() => undefined);
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
