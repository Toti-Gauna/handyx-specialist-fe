// Recorrido RC-Agenda del lienzo (lote 2.1): «Pestaña Taller: agenda, plata y equipamiento». F-Herramientas → F-Agenda (hoy,
// futuras con una oferta que no es un turno) → F-AgendaPasadas (cobro informado ≠ verificado) → F-AgendaMes → F-Ingresos
// (sin tarifa de Handyx) → H0-Gasto (con foto, sin foto, y cobrárselo al cliente con confirmación) y borrar un gasto.
// Los pasos de equipamiento del lienzo (H0-Equipo…) son del lote 2.4 (RC-Equipamiento): acá solo se comprueba su acceso.
// Lo corre e2e/flujos.cjs (carga todos los e2e/recorridos/*.cjs) o solo: `node e2e/recorridos/RC-Agenda.cjs` sobre out/.
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');

const ver = (p, t, o) => p.getByText(t, o).first().waitFor();
const nav = (p, n) => p.getByRole('navigation', { name: 'Secciones' }).getByText(n, { exact: true }).click();

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
    'RC-Agenda-1-taller-agenda-mes',
    async ({ p, base, foto }) => {
      await p.goto(`${base}/inicio/?escenario=habilitado`);
      await nav(p, 'Taller');
      await p.waitForURL('**/taller/');
      // F-Herramientas: la agenda de la semana y los accesos, sin cifras inventadas ni tarifa de Handyx
      await ver(p, 'Tu ');
      await ver(p, 'Hoy, 2 turnos · próximo 18:00');
      for (const t of ['Ingresos y gastos', 'Presupuestos y precios', 'Tu equipamiento', 'Herramientas del teléfono', 'Ferretería']) await ver(p, t, { exact: true });
      assert.equal(await p.getByText('0 % durante la demo').count(), 0);
      const hrefs = await p.getByRole('main').getByRole('link').evaluateAll((l) => l.map((a) => a.getAttribute('href')));
      for (const r of ['/taller/ingresos/', '/taller/herramientas/', '/taller/equipamiento/', '/precios/']) assert.ok(hrefs.some((h) => h?.endsWith(r)), `falta el acceso a ${r}`);
      await foto('01-taller');
      await axe(p, 'F-Herramientas');

      // F-Agenda: hoy con los dos turnos y la semana entera
      await p.getByRole('link', { name: /^Agenda/ }).click();
      await p.waitForURL('**/agenda/');
      await ver(p, 'Pierde la canilla');
      await ver(p, 'Revoque');
      await ver(p, '2 turnos');
      await foto('02-agenda-hoy');
      await axe(p, 'F-Agenda');
      // Otro día de la semana: se ve su lista (el de mañana tiene una jornada de obra y un trabajo)
      await p.getByRole('button', { name: /Mié/ }).click();
      await ver(p, 'Mañana · miércoles 18');
      await ver(p, 'Obra · jornada 1 de 5');

      // Futuras: una oferta pendiente se dice escrita y no es un turno
      await p.getByRole('radio', { name: /Futuras/ }).check();
      await ver(p, 'Oferta sin confirmar');
      await foto('03-agenda-futuras');

      // F-AgendaPasadas: el cobro informado no se muestra como verificado
      await p.getByRole('radio', { name: /Pasadas/ }).check();
      await ver(p, 'Cobrado y verificado este mes');
      await ver(p, 'Cobrado · verificado');
      await ver(p, 'Informado', { exact: true });
      await foto('04-agenda-pasadas');
      await axe(p, 'F-AgendaPasadas');

      // F-AgendaMes: el mes con obras y trabajos, filtro y día elegido
      await p.getByRole('link', { name: 'Ver el mes' }).click();
      await p.waitForURL('**/agenda/mes/');
      await ver(p, 'Mes completo');
      await ver(p, /2 obras/);
      await p.getByRole('button', { name: /^17 de noviembre, hoy/ }).click();
      await ver(p, '12:00 a 20:00 · Revoque'.replace('12:00 a 20:00', '09:00 a 17:00'));
      await p.getByRole('radio', { name: 'Trabajos' }).check();
      await p.getByRole('button', { name: /^17 de noviembre, hoy, 1 trabajo/ }).waitFor();
      assert.equal(await p.getByRole('button', { name: /^17 de noviembre, hoy.*obra/ }).count(), 0, 'filtrando trabajos no hay obras');
      await foto('05-agenda-mes');
      await axe(p, 'F-AgendaMes');
      // Mes siguiente y vuelta a hoy con un botón
      await p.getByRole('button', { name: 'Mes siguiente' }).click();
      await ver(p, 'diciembre 2026');
      await p.getByRole('button', { name: 'Ir a hoy' }).click();
      await ver(p, 'noviembre 2026');
      await p.getByRole('link', { name: 'Ver como lista' }).click();
      await p.waitForURL('**/agenda/');
    },
  ],
  [
    'RC-Agenda-2-ingresos-y-gasto',
    async ({ p, base, foto }) => {
      await p.goto(`${base}/taller/?escenario=habilitado`);
      await p.getByRole('link', { name: /Ingresos y gastos/ }).click();
      await p.waitForURL('**/taller/ingresos/');
      // F-Ingresos: neto = bruto − gastos; lo informado aparte; ninguna tarifa de Handyx
      await ver(p, 'NETO · LO QUE TE QUEDA');
      await ver(p, 'En Handyx · informado, falta verificar');
      await ver(p, 'Lo informado sin verificar se muestra aparte');
      await ver(p, 'Ganancia por trabajo');
      assert.equal(await p.getByText(/Tarifa de Handyx|comisión simulada/i).count(), 0);
      await foto('01-ingresos');
      await axe(p, 'F-Ingresos');
      const netoAntes = await p.locator('.ui-ing-cabeza__neto').textContent();

      // H0-Gasto: validaciones, foto del ticket y dos casillas
      await p.getByRole('link', { name: 'Cargar un gasto con la foto del ticket' }).click();
      await p.waitForURL('**/taller/ingresos/gasto/');
      await ver(p, 'Registrarlo como gasto');
      await axe(p, 'H0-Gasto');
      await p.getByRole('button', { name: 'Guardar gasto' }).click();
      await ver(p, 'Escribí cuánto gastaste');
      await p.waitForFunction(() => document.activeElement?.getAttribute('aria-invalid') === 'true'); // el foco va al primer error
      assert.equal(await p.getByRole('checkbox', { name: /Cobrárselo al cliente/ }).isDisabled(), true, 'sin un trabajo en curso no se puede cobrar');
      await p.getByRole('button', { name: 'Sacar una foto del ticket' }).click();
      await ver(p, 'Foto lista · queda privada');
      await p.getByLabel('Monto').fill('13.000');
      await p.getByLabel('Qué compraste (si querés)').fill('Cartucho para la canilla');
      await foto('02-gasto');
      await p.getByRole('button', { name: 'Guardar gasto' }).click();
      await p.waitForURL('**/taller/ingresos/**');
      await ver(p, 'Guardamos tu gasto');
      await ver(p, 'Cartucho para la canilla');
      const netoDespues = await p.locator('.ui-ing-cabeza__neto').textContent();
      assert.notEqual(netoAntes, netoDespues, 'el gasto baja el neto');
      // Deshacer: borrarlo, con confirmación
      await p.getByRole('button', { name: /Borrar el gasto: Cartucho para la canilla/ }).click();
      await ver(p, '¿Borrar este gasto?');
      await axe(p, 'Hoja de borrar un gasto');
      await p.getByRole('button', { name: 'Sí, borrarlo' }).click();
      await ver(p, 'Borraste el gasto');
      assert.equal(await p.locator('.ui-ing-cabeza__neto').textContent(), netoAntes, 'al borrarlo vuelve el neto');
    },
  ],
  [
    'RC-Agenda-3-gasto-cobrarselo-al-cliente',
    async ({ p, base, foto }) => {
      await p.goto(`${base}/taller/ingresos/gasto/?escenario=habilitado`);
      await ver(p, 'Registrarlo como gasto');
      // La obra en curso permite cobrárselo al cliente; antes de mandarlo se pide confirmar
      await p.getByLabel('Trabajo', { exact: true }).selectOption({ index: 1 });
      const opciones = await p.getByLabel('Trabajo', { exact: true }).locator('option').allTextContents();
      const enCurso = opciones.findIndex((t) => /Revoque/.test(t));
      assert.ok(enCurso > 0, 'la obra en curso está entre los trabajos');
      await p.getByLabel('Trabajo', { exact: true }).selectOption({ index: enCurso });
      await p.getByLabel('Monto').fill('8500');
      await p.getByRole('checkbox', { name: /Cobrárselo al cliente/ }).check();
      await p.getByRole('checkbox', { name: /Registrarlo como gasto/ }).uncheck();
      await p.getByRole('button', { name: 'Guardar gasto' }).click();
      await ver(p, '¿Se lo cobrás al cliente?');
      await ver(p, 'No suma al precio hasta que lo acepte en el chat');
      await foto('01-confirmar');
      await axe(p, 'Hoja de cobrárselo al cliente');
      await p.getByRole('button', { name: 'Todavía no' }).click();
      assert.equal(await p.getByText('¿Se lo cobrás al cliente?').isVisible(), false);
      await p.getByRole('button', { name: 'Guardar gasto' }).click();
      await p.getByRole('button', { name: 'Sí, mandárselo' }).click();
      await p.waitForURL('**/taller/ingresos/**');
      // Ninguna casilla: no se puede guardar
      await p.goto(`${base}/taller/ingresos/gasto/`);
      await p.getByLabel('Monto').fill('1000');
      await p.getByRole('checkbox', { name: /Registrarlo como gasto/ }).uncheck();
      await p.getByRole('button', { name: 'Guardar gasto' }).click();
      await ver(p, 'Elegí al menos una');
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
    const navegador = await chromium.launch();
    let mal = 0;
    for (const [nombre, pasos, o = {}] of RECORRIDOS) {
      if (process.env.SOLO && !nombre.startsWith(process.env.SOLO)) continue;
      const ctx = await navegador.newContext({ viewport: { width: o.ancho ?? 390, height: o.alto ?? 844 }, reducedMotion: o.movimiento ?? 'reduce' });
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
    await navegador.close();
    srv.close();
    process.exit(mal ? 1 : 0);
  })();
}
