// Catálogo de capturas por pantalla y escenario (insumo de la fase 3 y de Handy Docs). Solo datos de prueba.
// Uso: npm run build && node e2e/capturas.cjs [carpeta]   ·   ANCHOS=360x740,390x844,820x1180 para otros tamaños.
// Cada captura es una carga completa: el estado de prueba arranca de los fixtures del escenario.
const { mkdirSync } = require('node:fs');
const { join } = require('node:path');
const { chromium } = require('playwright');
const { servir } = require('./servidor.cjs');

const { PANTALLAS } = require('./pantallas.cjs');

async function main() {
  const carpeta = process.argv[2] ?? join(__dirname, '..', 'capturas');
  const anchos = (process.env.ANCHOS ?? '390x844').split(',').map((x) => x.split('x').map(Number));
  const srv = await servir();
  const base = `http://localhost:${srv.address().port}`;
  const nav = await chromium.launch();
  let fallas = 0;
  for (const [w, h] of anchos) {
    const dir = join(carpeta, `${w}x${h}`);
    mkdirSync(dir, { recursive: true });
    const ctx = await nav.newContext({ viewport: { width: w, height: h }, reducedMotion: 'reduce' });
    for (const [nombre, ruta, texto, escenario] of PANTALLAS) {
      const p = await ctx.newPage();
      const sep = ruta.includes('?') ? '&' : '?';
      try {
        await p.goto(`${base}${ruta}${sep}escenario=${escenario}`);
        await p.getByText(texto).first().waitFor({ timeout: 8000 });
        await p.waitForTimeout(150);
        // Desborde horizontal: ningún elemento puede hacer scroll lateral la página.
        const desborde = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
        if (desborde > 0) {
          fallas++;
          console.log(`✘ ${w}x${h} ${nombre}: desborde horizontal de ${desborde}px`);
        }
        await p.screenshot({ path: join(dir, `${nombre}.png`), fullPage: true });
      } catch (e) {
        fallas++;
        console.log(`✘ ${w}x${h} ${nombre}: ${e.message.split('\n')[0]}`);
      }
      await p.close();
    }
    await ctx.close();
  }
  await nav.close();
  srv.close();
  console.log(`${PANTALLAS.length * anchos.length - fallas}/${PANTALLAS.length * anchos.length} capturas OK en ${carpeta}`);
  process.exit(fallas ? 1 : 0);
}
main();
