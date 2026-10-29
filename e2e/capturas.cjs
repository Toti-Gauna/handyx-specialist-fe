// Catálogo de capturas por pantalla y escenario (insumo de la fase 3 y de Handy Docs). Solo datos de prueba.
// Uso: npm run build && node e2e/capturas.cjs [carpeta]   ·   ANCHOS=360x740,390x844,820x1180 para otros tamaños.
// Cada captura es una carga completa: el estado de prueba arranca de los fixtures del escenario.
const { mkdirSync } = require('node:fs');
const { join } = require('node:path');
const { chromium } = require('playwright');
const { servir } = require('./servidor.cjs');

const { PANTALLAS } = require('./pantallas.cjs');

// Sanitización: una captura solo puede mostrar datos sintéticos. Emails @example.test, los DNI/CUIT de prueba y,
// en toda pantalla con datos de la cuenta, el banner amarillo "Datos de prueba".
const DOCUMENTOS_DE_PRUEBA = new Set(['30111222', '20301112229']);
const SIN_DATOS_DE_CUENTA = new Set(['sin-conexion', 'no-encontrada']);
function problemasDeSanitizacion(nombre, texto) {
  const problemas = [];
  for (const email of texto.match(/[\w.+-]+@[\w-]+(\.[\w-]+)+/g) ?? []) if (!email.endsWith('@example.test')) problemas.push(`email ${email}`);
  for (const m of texto.matchAll(/(\$\s*)?\b\d[\d.-]{5,}\d\b/g)) {
    const cifras = m[0].replace(/\D/g, '');
    const esFecha = /^\d{4}-\d{2}-\d{2}$/.test(m[0]);
    if (!m[1] && !esFecha && [7, 8, 10, 11].includes(cifras.length) && !DOCUMENTOS_DE_PRUEBA.has(cifras)) problemas.push(`número ${m[0]}`);
  }
  if (/\+54/.test(texto)) problemas.push('teléfono');
  if (!SIN_DATOS_DE_CUENTA.has(nombre) && !texto.includes('Datos de prueba')) problemas.push('falta el banner "Datos de prueba"');
  return problemas;
}

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
        const visible = await p.evaluate(() => [document.body.innerText, ...[...document.querySelectorAll('input, textarea')].map((e) => e.value)].join('\n'));
        const sucio = problemasDeSanitizacion(nombre, visible);
        if (sucio.length) {
          fallas++;
          console.log(`✘ ${w}x${h} ${nombre}: sin sanitizar (${sucio.join(', ')})`);
          await p.close();
          continue;
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
