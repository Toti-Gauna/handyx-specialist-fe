// Recorrido RC-Pedido del lienzo (lote 1.3): F-Inicio (pedido flotante sobre el mapa) → F-Pedido → F-Precio (cinta) →
// F-PrecioTeclado → F-Fecha → F-FechaHora → F-Revisar → F-Enviada → F-Chat → F-Trabajo (el cliente acepta). Además: el
// mapa de arreglos como Uber («Me voy hasta Batán», lista equivalente, pedidos cercanos, «Ahora no» sin consecuencias),
// nunca la dirección antes de aceptar, los botones de acción sin animar y axe en cada pantalla.
// Lo corre e2e/flujos.cjs (carga todos los e2e/recorridos/*.cjs) o solo: `node e2e/recorridos/RC-Pedido.cjs` sobre out/.
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
    'RC-Pedido-1-del-mapa-a-la-propuesta',
    async ({ p, base, foto }) => {
      await p.goto(`${base}/inicio/?escenario=habilitado`);
      await ver(p, 'Tu día · 3 paradas');
      // Disponible está solo en la cabecera; al prenderlo llegan los urgentes flotando sobre el mapa
      assert.equal(await p.getByRole('switch', { name: /Recibir pedidos/ }).count(), 1, 'un solo Disponible');
      await p.getByRole('switch', { name: 'Recibir pedidos: No disponible' }).click();
      await ver(p, /Pedido urgente · quedan/);
      await ver(p, 'Pedido 1 de 2');
      await p.getByRole('button', { name: 'Siguiente' }).click();
      await ver(p, 'Pierde la canilla de la cocina');
      await foto('01-pedido-flotante');
      await axe(p, 'F-Inicio con el pedido flotante');
      await sinAnimar(p, 'F-Inicio');
      // Ver el pedido abre el detalle en una hoja: zona aproximada, sin dirección ni nombre del cliente
      await p.getByRole('button', { name: 'Ver pedido' }).click();
      const hoja = p.locator('dialog[open]');
      await hoja.getByText('Lo que cuenta el cliente').waitFor();
      await hoja.getByText('La dirección exacta llega cuando el cliente acepta').waitFor();
      assert.equal(await hoja.getByText(/Calle De Prueba|Cliente de prueba/).count(), 0, 'nada de dirección ni nombre antes de aceptar');
      await hoja.getByRole('img', { name: /Foto 1 que mandó el cliente/ }).waitFor();
      await foto('02-pedido');
      await axe(p, 'F-Pedido');
      await hoja.getByRole('link', { name: 'Cotizar' }).click();
      // Tu precio: la cinta es un slider de verdad (flechas) y los atajos; recibís el 100 %
      await p.waitForURL('**/pedidos/propuesta/**');
      await ver(p, 'Paso 1 de 2');
      const cinta = p.getByRole('slider', { name: 'Tu precio' });
      await cinta.focus();
      for (let i = 0; i < 4; i++) await p.keyboard.press('ArrowRight');
      assert.match(await cinta.getAttribute('aria-valuetext'), /\$\s47\.000/);
      await ver(p, /\$\s2\.000 más que lo sugerido/);
      await ver(p, 'Handyx no te cobra comisión');
      await foto('03-precio-cinta');
      await axe(p, 'F-Precio');
      // O lo escribís con el teclado
      await p.getByRole('button', { name: 'Escribir', exact: true }).click();
      for (const t of ['4', '8', '5', '0', '0']) await p.getByRole('button', { name: t, exact: true }).click();
      await ver(p, /\$\s3\.500 más que lo sugerido/);
      await foto('04-precio-teclado');
      await axe(p, 'F-PrecioTeclado');
      await p.getByRole('button', { name: /^Usar \$\s48\.500$/ }).click();
      await p.getByRole('switch', { name: /Garantía de 30 días/ }).click();
      await p.getByRole('button', { name: 'Siguiente: la fecha' }).click();
      // ¿Cuándo vas?: el día en el calendario; las franjas pasadas u ocupadas no se pueden elegir
      await ver(p, 'Paso 2 de 2');
      await p.getByRole('button', { name: /^18 de noviembre/ }).click();
      assert.equal(await p.getByRole('button', { name: /^9 a 13\s*, ya tenés trabajo/ }).isDisabled(), true);
      await foto('05-fecha');
      await axe(p, 'F-Fecha');
      // Horario a medida: hora exacta con un atajo
      await p.getByRole('button', { name: 'Otro horario o una hora exacta' }).click();
      await p.getByRole('radio', { name: 'Hora exacta' }).check();
      await p.getByRole('button', { name: 'A las 6:30' }).click();
      await foto('06-fecha-hora');
      await axe(p, 'F-FechaHora');
      await p.getByRole('button', { name: 'Proponer a las 6:30' }).click();
      await ver(p, 'Tu horario: mañana, a las 6:30');
      // Revisar y enviar
      await p.getByRole('button', { name: 'Revisar la propuesta' }).click();
      await ver(p, 'Hasta que acepte, no es un trabajo agendado');
      await ver(p, 'Incluye materiales · garantía de 30 días · recibís el 100 %');
      await foto('07-revisar');
      await axe(p, 'F-Revisar');
      await sinAnimar(p, 'F-Revisar');
      await p.getByRole('button', { name: /^Enviar propuesta de \$\s48\.500$/ }).click();
      await ver(p, 'Le llegó tu');
      await ver(p, /\$\s48\.500 · mañana, a las 6:30/);
      await foto('08-enviada');
      await axe(p, 'F-Enviada');
      // Escribirle mientras decide: abre el chat del pedido
      await p.getByRole('button', { name: /Escribile si querés/ }).click();
      await p.waitForURL('**/mensajes/hilo/**');
      await foto('09-chat');
      // El cliente acepta (Panel de prueba): aviso y el trabajo agendado, ahora sí con la dirección
      await panel(p, 'Acepta tu última propuesta');
      await ver(p, '¡El cliente te eligió!');
      await p.getByRole('link', { name: 'Ver el trabajo' }).first().click();
      await p.waitForURL('**/trabajos/detalle/**');
      await ver(p, 'Agendado');
      await ver(p, 'Te la mostramos porque el cliente aceptó');
      await foto('10-trabajo');
      await axe(p, 'F-Trabajo');
    },
  ],
  [
    'RC-Pedido-2-mapa-como-uber',
    async ({ p, base, foto }) => {
      await p.goto(`${base}/inicio/?escenario=habilitado`);
      await p.getByRole('button', { name: /pedidos? cerca/ }).click();
      // Hoja de cercanos estilo «Choose a ride»: uno elegido y una sola acción clara
      await ver(p, 'Cambiar el flexible del inodoro');
      await p.getByText('Revoque y pintura de una medianera').first().click();
      await p.getByRole('button', { name: 'Ver pedido de albañilería' }).waitFor();
      // Distancias solo si lo pedís (la posición no se guarda)
      await p.getByRole('button', { name: 'Medir distancias desde donde estoy' }).click();
      await ver(p, /zona aproximada · \d/);
      await foto('01-cercanos');
      await axe(p, 'F-Inicio con los cercanos');
      // Un marcador del mapa abre el mismo detalle (es un botón de verdad: anda con el teclado)
      await p.locator('button.ui-marcador-pedido:visible', { hasText: 'Albañilería en Playa Grande' }).first().focus();
      await p.keyboard.press('Enter');
      await p.locator('dialog[open]').getByText('Lo que cuenta el cliente').waitFor();
      await p.locator('dialog[open]').getByRole('button', { name: 'Cerrar' }).click();
      // «Me voy hasta…» Batán: los pedidos en esa dirección
      await p.getByRole('button', { name: 'Me voy hasta…' }).click();
      await p.getByRole('searchbox', { name: /Me voy hasta/ }).fill('batan');
      await p.getByRole('button', { name: /^Batán/ }).click();
      await ver(p, /Camino a Batán/);
      // El servidor trae el pedido de Batán, que está fuera de tus zonas (no se filtra en el teléfono)
      await p.locator('button.ui-marcador-pedido:visible', { hasText: 'Electricidad en Batán' }).first().waitFor();
      await foto('02-me-voy-hasta-batan');
      await p.getByRole('button', { name: 'Ver todos' }).click();
      // La vista Lista es equivalente al mapa
      await p.getByRole('radio', { name: 'Lista' }).check();
      await p.getByRole('button', { name: /Plomería · Centro/ }).first().waitFor();
      await foto('03-lista');
      await p.getByRole('radio', { name: 'Mapa' }).check();
      // «Ahora no» lo saca del mapa sin ninguna consecuencia
      await p.getByRole('button', { name: 'Ver pedido de albañilería' }).click();
      await p.locator('dialog[open]').getByText('Lo que cuenta el cliente').waitFor();
      await p.getByRole('button', { name: 'Ahora no · no tiene ninguna consecuencia' }).click();
      await ver(p, 'Lo sacamos de tu mapa');
      assert.equal(await p.getByRole('radio', { name: /Albañilería/ }).count(), 0, 'el pedido descartado ya no está');
      await foto('04-ahora-no');
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
