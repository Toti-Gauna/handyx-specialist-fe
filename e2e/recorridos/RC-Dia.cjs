// Recorrido RC-Dia del lienzo, hasta la llegada y el cobro (lote 1.3): F-InicioDia → F-InicioRuta → TR-EnCamino →
// (Modo trabajo, lote 2.3) → TR-Cobro. Además: avisar una demora con un toque, reordenar paradas con botones (no cambia
// el horario de ningún cliente), compartir la ubicación solo durante el viaje, «Ya llegué» de respaldo y el cobro
// informado ≠ verificado. Axe en cada pantalla.
// Lo corre e2e/flujos.cjs (carga todos los e2e/recorridos/*.cjs) o solo: `node e2e/recorridos/RC-Dia.cjs` sobre out/.
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');

const ver = (p, t, o) => p.getByText(t, o).first().waitFor();
const panel = async (p, ...acciones) => {
  await p.getByRole('button', { name: 'Panel de prueba' }).click();
  for (const a of acciones) await p.getByRole('button', { name: a }).click();
  await p.keyboard.press('Escape');
};

let AXE = null;
async function axe(p, nombre, { h1 = true } = {}) {
  AXE ??= readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');
  await p.addScriptTag({ content: AXE });
  const v = await p.evaluate(async () => {
    const r = await axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'] } });
    return r.violations.map((x) => `${x.id}: ${x.nodes.map((n) => n.target.join(' ')).join(', ')}`);
  });
  assert.deepEqual(v, [], `axe en ${nombre}`);
  if (h1) assert.ok((await p.evaluate(() => document.querySelectorAll('h1').length)) <= 1, `${nombre}: como mucho un h1`);
}

/** Los botones de aceptar, cotizar o cobrar nunca se animan (pedido de Ignacio). */
async function sinAnimar(p, nombre) {
  const animados = await p.evaluate(() =>
    [...document.querySelectorAll('.ui-boton')].filter((b) => {
      const s = getComputedStyle(b);
      return s.animationName !== 'none' || b.getAnimations().length > 0;
    }).length,
  );
  assert.equal(animados, 0, `${nombre}: hay botones animados`);
}

const RECORRIDOS = [
  [
    'RC-Dia-1-tu-dia-hasta-el-cobro',
    async ({ p, base, foto }) => {
      await p.goto(`${base}/inicio/?escenario=habilitado`);
      // Tu día en el Inicio: la tira de paradas y la próxima con escribirle, avisar demora y salir
      await ver(p, 'Tu día · 3 paradas');
      await p.getByRole('list', { name: 'Tus paradas de hoy' }).waitFor();
      await ver(p, 'Pierde la canilla');
      await foto('01-tu-dia');
      await axe(p, 'F-InicioDia');
      await sinAnimar(p, 'F-InicioDia');
      await p.getByRole('button', { name: 'Avisar una demora' }).click();
      await p.getByRole('button', { name: 'Llego 15 min tarde' }).click();
      await ver(p, 'Avisaste la demora');
      // Tu recorrido: reordenar con botones no le cambia el horario a nadie
      await p.getByRole('link', { name: 'Ver recorrido' }).click();
      await p.waitForURL('**/inicio/recorrido/');
      await ver(p, 'Tu recorrido', { exact: false });
      await ver(p, 'no le cambia el horario a ningún cliente');
      await ver(p, /Sale en/);
      await foto('02-recorrido');
      await axe(p, 'F-InicioRuta');
      await p.getByRole('button', { name: 'Bajar: Pierde la canilla' }).click();
      await p.locator('[aria-current="step"]').getByText('Retiro en ferretería').waitFor();
      await p.getByRole('button', { name: 'Subir: Pierde la canilla' }).click();
      await p.locator('[aria-current="step"]').getByText('Pierde la canilla').waitFor();
      await foto('03-recorrido-reordenado');
      // Salir: el viaje con la ubicación compartida solo durante el viaje
      await p.getByRole('button', { name: 'Salir para la parada 2' }).click();
      await p.waitForURL('**/en-camino/**');
      await ver(p, 'Vas para lo de Lucía Ferreyra');
      await ver(p, 'Compartí tu ubicación durante el viaje');
      await foto('04-en-camino');
      await axe(p, 'TR-EnCamino');
      await panel(p, 'Señal imprecisa');
      await p.getByRole('button', { name: 'Compartir mi ubicación' }).click();
      await ver(p, 'Lucía ve que vas en camino');
      await ver(p, 'Como estás ubicación imprecisa');
      await foto('05-compartiendo');
      await p.getByRole('button', { name: 'Ya llegué' }).click();
      // Llegada (respaldo) → el trabajo en el lugar; el Modo trabajo es del lote 2.3
      await p.waitForURL('**/trabajos/detalle/**');
      await ver(p, 'En el lugar');
      await ver(p, 'Avisaste con «Ya llegué» (ubicación imprecisa)');
      await p.getByRole('button', { name: 'Empezar el trabajo' }).click();
      await ver(p, 'Trabajando hace');
      await p.getByRole('button', { name: 'Terminé', exact: true }).click();
      await ver(p, 'Total a cobrar');
      await p.getByRole('button', { name: 'Sí, terminé' }).click();
      // ¿Cómo te pagó?: informado por vos, todavía sin verificar
      await p.waitForURL('**/trabajos/cobro/**');
      await ver(p, 'Recibís el 100 %: directo a vos');
      await p.getByRole('radio', { name: 'Mercado Pago' }).check();
      await foto('06-como-te-pago');
      await axe(p, 'TR-Cobro');
      await p.getByRole('button', { name: 'Informar el cobro' }).click();
      await ver(p, 'Informado por vos · sin verificar');
      await ver(p, 'Queda «informado por vos» hasta que Lucía Ferreyra lo confirma');
      await foto('07-cobro-informado');
      await axe(p, 'TR-Cobro informado');
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
