// Auditoría de accesibilidad: axe-core (WCAG 2.2 A/AA) en cada pantalla y en los diálogos de decisión,
// áreas táctiles, recorrido con teclado y texto al 200 %. Uso: npm run build && node e2e/accesibilidad.cjs
// Sale con error si hay violaciones de axe o áreas táctiles por debajo de 24×24 px (WCAG 2.5.8).
const { readFileSync } = require('node:fs');
const { chromium } = require('playwright');
const { servir } = require('./servidor.cjs');
const { PANTALLAS, id } = require('./pantallas.cjs');

const AXE = readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');
const ETIQUETAS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

async function auditar(p, nombre, informe) {
  await p.addScriptTag({ content: AXE });
  const r = await p.evaluate(async (tags) => {
    // eslint-disable-next-line no-undef
    const res = await axe.run(document, { runOnly: { type: 'tag', values: tags } });
    return res.violations.map((v) => ({ id: v.id, impacto: v.impact, ayuda: v.help, nodos: v.nodes.slice(0, 3).map((n) => n.target.join(' ')) }));
  }, ETIQUETAS);
  for (const v of r) informe.push({ nombre, ...v });
}

/** Elementos interactivos más chicos que el mínimo. Los enlaces dentro de un párrafo están exceptuados (WCAG 2.5.8). */
async function areas(p, nombre, informe) {
  const chicos = await p.evaluate(() => {
    const sel = 'a[href], button, input:not([type=hidden]), select, textarea, [role=switch], [role=tab]';
    return [...document.querySelectorAll(sel)]
      .filter((e) => {
        const r = e.getBoundingClientRect();
        if (r.width === 0 || r.height === 0) return false;
        if (e.closest('.visualmente-oculto')) return false;
        const enTexto = e.tagName === 'A' || e.classList.contains('enlace') ? !!e.closest('p, li span, .aviso__texto, .burbuja__meta, label') : false;
        if (enTexto) return false;
        if (e.matches('input[type=checkbox], input[type=radio]') && e.closest('.opcion, .casilla')) return false; // el label agranda el área
        return r.width < 44 || r.height < 44;
      })
      .map((e) => {
        const r = e.getBoundingClientRect();
        return { el: `${e.tagName.toLowerCase()}${e.className ? '.' + String(e.className).split(' ').join('.') : ''} "${(e.textContent || e.getAttribute('aria-label') || '').trim().slice(0, 30)}"`, w: Math.round(r.width), h: Math.round(r.height) };
      });
  });
  for (const c of chicos) informe.push({ nombre, ...c, grave: c.w < 24 || c.h < 24 });
}

async function main() {
  const srv = await servir();
  const base = `http://localhost:${srv.address().port}`;
  const nav = await chromium.launch();
  // ANCHO=1280x800 audita el diseño de escritorio (riel lateral); por defecto, el celular.
  const [ancho, alto] = (process.env.ANCHO ?? '390x844').split('x').map(Number);
  const ctx = await nav.newContext({ viewport: { width: ancho, height: alto }, reducedMotion: 'reduce' });
  const violaciones = [];
  const tactiles = [];
  const teclado = [];

  for (const [nombre, ruta, texto, escenario] of PANTALLAS) {
    const p = await ctx.newPage();
    const sep = ruta.includes('?') ? '&' : '?';
    await p.goto(`${base}${ruta}${sep}escenario=${escenario}`);
    await p.getByText(texto).first().waitFor({ timeout: 8000 });
    await auditar(p, nombre, violaciones);
    await areas(p, nombre, tactiles);
    // Texto al 200 % (WCAG 1.4.4 / 1.4.10): nada desborda hacia los costados
    await p.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
    await p.waitForTimeout(80);
    const desborde = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    if (desborde > 0) teclado.push(`${nombre}: con texto al 200 % desborda ${desborde}px hacia el costado`);
    await p.close();
  }

  // Diálogos de decisión y formularios en hojas
  const dialogos = [
    ['hoja-aceptar', `/pedidos/detalle/?id=${id(0xb2)}`, 'Aceptar propuesta', '¿Aceptar esta propuesta?'],
    ['hoja-propuesta', `/pedidos/detalle/?id=${id(0xb4)}`, 'Enviar una propuesta', 'Tu precio (en pesos)'],
    ['hoja-cancelar', `/trabajos/detalle/?id=${id(0xc1)}`, 'Cancelar este trabajo', '¿Cancelar este trabajo?'],
    ['hoja-cambio', `/trabajos/detalle/?id=${id(0xc1)}`, 'Proponer otra fecha o cambio', 'Nueva fecha y hora'],
    ['hoja-baja', '/cuenta/', 'Eliminar mi cuenta y mis datos', '¿Eliminar tu cuenta?'],
    ['hoja-caso', '/soporte/', 'Abrir un caso', '¿Sobre qué es?'],
  ];
  for (const [nombre, ruta, boton, espera] of dialogos) {
    const p = await ctx.newPage();
    await p.goto(`${base}${ruta}`);
    await p.getByRole('button', { name: boton }).first().click();
    await p.getByText(espera).first().waitFor({ timeout: 8000 });
    await auditar(p, nombre, violaciones);
    await areas(p, nombre, tactiles);
    // El foco queda dentro del diálogo y Escape lo cierra
    const dentro = await p.evaluate(() => !!document.activeElement?.closest('dialog[open]'));
    if (!dentro) teclado.push(`${nombre}: el foco no quedó dentro del diálogo al abrirlo`);
    for (let i = 0; i < 15; i++) await p.keyboard.press('Tab');
    const sigue = await p.evaluate(() => !!document.activeElement?.closest('dialog[open]'));
    if (!sigue) teclado.push(`${nombre}: Tab sacó el foco del diálogo`);
    await p.keyboard.press('Escape');
    const cerrado = await p.evaluate(() => !document.querySelector('dialog[open]'));
    if (!cerrado) teclado.push(`${nombre}: Escape no cerró el diálogo`);
    await p.close();
  }

  // Errores de formulario: al enviar con datos faltantes, el foco va al primer campo marcado
  for (const [nombre, ruta, boton, escenario] of [
    ['registro', '/registro/', 'Crear cuenta', 'nuevo'],
    ['alta-datos', '/alta/', 'Guardar y seguir', 'incompleto'],
    ['caso', '/soporte/', 'Abrir un caso', 'habilitado'],
  ]) {
    const p = await ctx.newPage();
    await p.goto(`${base}${ruta}?escenario=${escenario}`);
    await p.getByRole('button', { name: boton }).first().click();
    if (nombre === 'caso') await p.getByRole('button', { name: 'Enviar', exact: true }).click();
    await p.waitForTimeout(300);
    const ok = await p.evaluate(() => document.activeElement?.getAttribute('aria-invalid') === 'true');
    if (!ok) teclado.push(`${nombre}: tras el error el foco no quedó en el primer campo marcado`);
    await p.close();
  }

  // Teclado: todo lo enfocable de Inicio muestra el foco
  {
    const p = await ctx.newPage();
    await p.goto(`${base}/inicio/`);
    await p.getByText('Tu disponibilidad').first().waitFor();
    const vistos = new Set();
    for (let i = 0; i < 40; i++) {
      await p.keyboard.press('Tab');
      const f = await p.evaluate(() => {
        const e = document.activeElement;
        if (!e || e === document.body) return null;
        const s = getComputedStyle(e);
        const visible = (s.outlineStyle !== 'none' && parseFloat(s.outlineWidth) >= 2) || s.boxShadow !== 'none';
        return { clave: `${e.tagName}:${(e.textContent || e.getAttribute('aria-label') || '').trim().slice(0, 25)}`, visible };
      });
      if (!f || vistos.has(f.clave)) continue;
      vistos.add(f.clave);
      if (!f.visible) teclado.push(`inicio: sin foco visible en ${f.clave}`);
    }
    if (vistos.size < 8) teclado.push(`inicio: solo ${vistos.size} elementos alcanzables con Tab`);
    await p.close();
  }

  // Movimiento (WCAG 2.3.3): con "reducir movimiento" no corre ninguna animación; sin esa preferencia, el error sí anima.
  const movimiento = [];
  for (const preferencia of ['reduce', 'no-preference']) {
    const c = await nav.newContext({ viewport: { width: ancho, height: alto }, reducedMotion: preferencia });
    const p = await c.newPage();
    await p.goto(`${base}/pedidos/?falla=red&escenario=habilitado`);
    await p.getByText('No pudimos conectarnos').first().waitFor({ timeout: 8000 });
    const animaciones = await p.evaluate(() => document.getAnimations().filter((a) => a instanceof CSSAnimation).length);
    if (preferencia === 'reduce' && animaciones > 0) movimiento.push(`con "reducir movimiento" hay ${animaciones} animaciones`);
    if (preferencia === 'no-preference' && animaciones === 0) movimiento.push('sin preferencia no anima nada (¿se rompió el CSS?)');
    await c.close();
  }
  teclado.push(...movimiento);

  await nav.close();
  srv.close();

  const graves = tactiles.filter((t) => t.grave);
  console.log(`\naxe (WCAG 2.2 A/AA): ${violaciones.length} violaciones`);
  for (const v of violaciones) console.log(`  ✘ ${v.nombre} · ${v.id} (${v.impacto}): ${v.ayuda} → ${v.nodos.join(' | ')}`);
  console.log(`Áreas táctiles < 44 px: ${tactiles.length} (de ellas < 24 px: ${graves.length})`);
  for (const t of tactiles) console.log(`  ${t.grave ? '✘' : '·'} ${t.nombre} · ${t.el} ${t.w}×${t.h}`);
  console.log(`Teclado, foco y movimiento: ${teclado.length} problemas`);
  for (const t of teclado) console.log(`  ✘ ${t}`);
  process.exit(violaciones.length || graves.length || teclado.length ? 1 : 0);
}
main();
