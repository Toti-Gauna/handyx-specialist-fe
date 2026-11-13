// Recorrido RC-Taller del lienzo, parte común y Electricidad (lote 2.4): T-Taller → T-Medir → T-Escanear → T-Modelo3D →
// T-Nivel → T-Electricidad → T-Tablero → T-TableroPared (sin AR en este navegador: no aparece) → T-Cables → T-Informe.
// F-Herramientas (la pestaña Taller) es del lote 2.1. Además: linterna y lupa, conversor, el escaneo que el teléfono no
// puede armar (no se manda nada) y guardar el modelo en un trabajo. Cámara y giroscopio simulados (datos de prueba).
// Lo corre e2e/flujos.cjs (carga todos los e2e/recorridos/*.cjs) o solo: `node e2e/recorridos/RC-Taller.cjs` sobre out/.
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');

const ver = (p, t, o) => p.getByText(t, o).first().waitFor();

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
    'RC-Taller-1-medir-escanear-y-modelo',
    async ({ p, base, foto }) => {
      await p.goto(`${base}/taller/herramientas/?escenario=habilitado`);
      // T-Taller: las del teléfono para todos y, aparte, las de tu oficio
      await ver(p, 'Herramientas del');
      await ver(p, 'Tu oficio: Electricidad');
      await ver(p, 'Otros oficios · llegan más adelante');
      assert.equal(await p.getByRole('navigation', { name: 'Secciones' }).getByRole('link', { name: 'Taller' }).getAttribute('aria-current'), 'page');
      await foto('01-taller');
      await axe(p, 'T-Taller');

      // T-Medir: sin AR (Chromium de escritorio) se mide con la tarjeta de referencia, paso a paso
      await p.getByRole('link', { name: /^Medir/ }).click();
      await p.waitForURL('**/taller/medir/');
      await ver(p, 'Medís con una tarjeta de referencia');
      assert.equal(await p.getByRole('button', { name: 'Medir con realidad aumentada' }).count(), 0, 'sin AR no se ofrece');
      await axe(p, 'T-Medir (inicio)');
      await p.getByRole('button', { name: 'Empezar: sacar la foto' }).click();
      await ver(p, 'Paso 1 de 3');
      await ver(p, 'Cámara simulada: no se usa la tuya');
      await axe(p, 'T-Medir (foto)');
      await p.getByRole('button', { name: 'Sacar la foto' }).click();
      await ver(p, 'Paso 2 de 3 · La tarjeta');
      // Cada punto se mueve con botones (todo gesto tiene botón)
      await p.getByRole('radio', { name: 'Punto 1: punta izquierda de la tarjeta' }).waitFor();
      await p.getByRole('radio', { name: 'Punto 2: punta derecha de la tarjeta' }).check();
      await p.getByRole('radio', { name: 'Punto 1: punta izquierda de la tarjeta' }).check();
      await p.getByRole('button', { name: 'Mover el punto 1 a la izquierda' }).click();
      await p.getByRole('button', { name: 'Mover el punto 1 a la derecha' }).click();
      await axe(p, 'T-Medir (tarjeta)');
      await p.getByRole('button', { name: 'Listo, la tarjeta está marcada' }).click();
      await ver(p, 'Paso 3 de 3 · Lo que medís');
      for (let i = 0; i < 3; i++) await p.getByRole('button', { name: 'Marcar punto' }).click();
      await ver(p, '1,42 × 1,68 m · 2,39 m²');
      await ver(p, '2 medidas');
      await p.getByLabel('¿Qué mediste? (si querés)').fill('Hueco de la ventana');
      await ver(p, 'Es una medida aproximada: para cortar, confirmala con la cinta.', { exact: false });
      await foto('02-medir');
      await axe(p, 'T-Medir (puntos)');
      await p.getByRole('button', { name: 'Deshacer el último punto' }).click();
      await ver(p, '1 medida');

      // T-Escanear: 30 fotos alrededor; el modelo se arma en el teléfono
      await p.goto(`${base}/taller/escanear/?escenario=habilitado`);
      await ver(p, 'El modelo se arma en tu teléfono');
      await axe(p, 'T-Escanear (antes)');
      await p.getByLabel('¿Qué vas a escanear? (si querés)').fill('Termotanque');
      await p.getByRole('button', { name: 'Empezar a sacar fotos' }).click();
      await ver(p, '0 de 30 fotos');
      assert.ok(await p.getByRole('button', { name: 'Armar 3D' }).isDisabled(), 'sin las 30 fotos no se arma');
      for (let i = 1; i <= 18; i++) await p.getByRole('button', { name: `Sacar foto ${i} de 30` }).click();
      await ver(p, '18 de 30 fotos');
      await foto('03-escanear');
      await axe(p, 'T-Escanear (fotos)');
      for (let i = 19; i <= 30; i++) await p.getByRole('button', { name: `Sacar foto ${i} de 30` }).click();
      await ver(p, '30 de 30 fotos');
      await p.getByRole('button', { name: 'Armar 3D' }).click();
      await ver(p, 'Paso 2 de 3 · La medida de referencia');
      await axe(p, 'T-Escanear (escala)');
      await p.getByRole('button', { name: 'Armar el modelo' }).click();

      // T-Modelo3D: medidas aproximadas, botones para mover la vista y guardar en un trabajo
      await p.waitForURL('**/taller/modelo/', { timeout: 20000 });
      await ver(p, 'Termotanque en 3D');
      const medidas = await p.getByText(/^Alto \d+ cm · diámetro \d+ cm · aprox\.$/).first().textContent();
      const [alto, diametro] = (medidas ?? '').match(/\d+/g).map(Number);
      assert.ok(Math.abs(alto - 85) <= 3 && Math.abs(diametro - 45) <= 3, `medidas del termotanque de prueba: ${medidas}`);
      await foto('04-modelo');
      await axe(p, 'T-Modelo3D');
      await p.getByRole('button', { name: 'Guardar en un trabajo' }).click();
      await p.getByRole('dialog').getByRole('radio').first().check();
      await p.getByRole('button', { name: 'Guardar el modelo' }).click();
      await ver(p, /Lo guardamos en «.+»\. Lo ven vos y tu cliente en el trabajo\./);

      // Si el teléfono no puede armar el modelo, se dice antes de empezar y no se manda nada
      await p.goto(`${base}/taller/escanear/?escenario=habilitado&simular=sin-proceso`);
      await ver(p, 'Este teléfono no puede armar el modelo');
      await ver(p, 'No mandamos nada a ningún lado.', { exact: false });
      assert.ok(await p.getByRole('button', { name: 'Empezar a sacar fotos' }).isDisabled());
      // Sin modelo en memoria, T-Modelo3D lo dice y ofrece escanear
      await p.goto(`${base}/taller/modelo/?escenario=habilitado`);
      await ver(p, 'No hay un modelo armado');
    },
  ],
  [
    'RC-Taller-2-nivel-linterna-y-conversor',
    async ({ p, base, foto }) => {
      // T-Nivel: giroscopio simulado; calibrar y fijar; la pendiente buscada
      await p.goto(`${base}/taller/nivel/?escenario=habilitado`);
      await ver(p, 'En 3 m tiene que bajar 60 mm.');
      await p.getByRole('button', { name: 'Usar el giroscopio' }).click();
      await ver(p, '0,4°');
      await ver(p, 'Casi a nivel · inclinado hacia la izquierda');
      await foto('05-nivel');
      await axe(p, 'T-Nivel');
      await p.getByRole('button', { name: 'Calibrar' }).click();
      await ver(p, 'Calibrado');
      await ver(p, 'A nivel', { exact: true });
      await p.getByRole('button', { name: 'Fijar' }).click();
      assert.equal(await p.getByRole('button', { name: 'Seguir midiendo' }).getAttribute('aria-pressed'), 'true');
      await p.getByRole('radio', { name: 'Plomada' }).check();
      await ver(p, 'Apoyá el teléfono parado contra la pared o la columna.');
      // Plomada y ángulos desde el portal abre el modo plomada
      await p.goto(`${base}/taller/nivel/?modo=plomada&escenario=habilitado`);
      assert.ok(await p.getByRole('radio', { name: 'Plomada' }).isChecked());

      // Linterna y lupa (cámara simulada)
      await p.goto(`${base}/taller/linterna/?escenario=habilitado`);
      await ver(p, 'Linterna apagada');
      await p.getByRole('button', { name: 'Prender la linterna' }).click();
      await ver(p, 'Linterna prendida');
      await p.getByRole('button', { name: 'Lupa 2×' }).click();
      assert.equal(await p.getByRole('button', { name: 'Lupa 2×' }).getAttribute('aria-pressed'), 'true');
      await axe(p, 'Linterna y lupa');

      // Conversor: pulgadas como en el corralón y frigorías a BTU
      await p.goto(`${base}/taller/conversor/?escenario=habilitado`);
      await ver(p, '19,05');
      await p.getByLabel('Valor').fill('1 1/2');
      await ver(p, '38,1');
      await p.getByRole('radio', { name: 'Potencia' }).check();
      await ver(p, '11.905');
      await foto('06-conversor');
      await axe(p, 'Conversor');
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
