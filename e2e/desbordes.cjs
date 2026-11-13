// Desbordes con las fuentes reales (lote 0.2), inspirado en design/deluxe/gen/quiebres.cjs y medir.cjs. Recorre las
// pantallas de e2e/pantallas.cjs en anchos de celular y falla si:
//   · un texto pasa el borde de su caja visible (fondo, borde o sombra) o de la pantalla, o no entra en su elemento;
//   · un control queda partido: una palabra cortada en dos renglones, o el control recortado por la pantalla;
//   · el contenido queda bajo la acción fija o la barra de pestañas al llegar al final de la página.
// Uso: npm run build && npm run desbordes      ·   ANCHOS=320x568,390x844 (por defecto) · SOLO=inicio
// Los desbordes que ya tenían las pantallas antes del kit v3 están en e2e/desbordes-conocidos.json (por pantalla):
// no hacen fallar, pero el lote que rehace esa pantalla los tiene que sacar de la lista. Todo desborde nuevo falla.
// ESTRICTO=1 ignora la lista.
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const { servir } = require('./servidor.cjs');
const { PANTALLAS, esperarMapas } = require('./pantallas.cjs');
const { chromium } = require('playwright');

const ANCHOS = (process.env.ANCHOS ?? '320x568,390x844').split(',').map((a) => a.split('x').map(Number));

/** Se ejecuta en la página: devuelve los problemas encontrados. */
function medir() {
  const res = [];
  const texto = (e) => (e.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 40);
  const visible = (e) => {
    const s = getComputedStyle(e);
    return s.display !== 'none' && s.visibility !== 'hidden' && e.getClientRects().length > 0;
  };
  const decorativo = (e) => e.closest('svg, [aria-hidden="true"], .visualmente-oculto, .maplibregl-map, [data-desbordes="ignorar"], dialog:not([open])');

  // 1 y 2: textos y controles
  for (const e of document.querySelectorAll('body *')) {
    if (decorativo(e) || !visible(e)) continue;
    const propios = [...e.childNodes].filter((n) => n.nodeType === 3 && n.textContent.trim());
    if (!propios.length) continue;
    const t = texto(e);
    const s = getComputedStyle(e);
    // Rectángulo del texto propio (sin hijos: un "(se abre aparte)" oculto para lectores no cuenta).
    const rects = propios.flatMap((n) => {
      const rg = document.createRange();
      rg.selectNodeContents(n);
      return [...rg.getClientRects()].filter((x) => x.width > 0);
    });
    if (!rects.length) continue;
    const rr = { left: Math.min(...rects.map((x) => x.left)), right: Math.max(...rects.map((x) => x.right)), width: 1 };
    if (e.scrollWidth > e.clientWidth + 1 && s.overflowX === 'visible' && e.clientWidth > 0 && s.whiteSpace !== 'nowrap' && s.display !== 'inline') res.push(`NO ENTRA: ${t}`);
    // Un texto que se recorta a sí mismo (con "…") no se sale: se mide en otra regla.
    const seRecorta = s.overflowX !== 'visible';
    if (!seRecorta && rr.width > 0 && (rr.right > innerWidth + 1 || rr.left < -1)) {
      // Dentro de una tira que se desliza a lo ancho, salir de la pantalla es lo esperado.
      let a = e.parentElement;
      let desliza = false;
      while (a && a !== document.body) {
        const sa = getComputedStyle(a);
        if (sa.overflowX === 'auto' || sa.overflowX === 'scroll' || sa.overflowX === 'hidden') {
          desliza = true;
          break;
        }
        a = a.parentElement;
      }
      if (!desliza) res.push(`SALE DE LA PANTALLA: ${t}`);
    }
    // Caja visible más cercana (si antes hay una tira que se desliza o recorta, lo que sale es a propósito)
    let c = seRecorta ? null : e;
    while (c && c !== document.body) {
      const sc = getComputedStyle(c);
      if (c !== e && sc.overflowX !== 'visible') break;
      const caja = (sc.backgroundColor !== 'rgba(0, 0, 0, 0)' && sc.backgroundColor !== 'transparent') || parseFloat(sc.borderLeftWidth) > 0 || sc.boxShadow !== 'none';
      if (caja && c !== e) {
        const cr = c.getBoundingClientRect();
        if (cr.width < innerWidth + 2 && rr.width > 0 && (rr.left < cr.left - 1 || rr.right > cr.right + 1)) res.push(`SALE DE SU CAJA: ${t} (${Math.round(Math.max(cr.left - rr.left, rr.right - cr.right))} px)`);
        break;
      }
      c = c.parentElement;
    }
    // Palabras partidas en dos renglones (en un control es un control partido; en el resto, un corte feo)
    const ctl = e.closest('a, button, [role=button], [role=tab], [role=radio], [role=switch], [role=option], label');
    for (const n of propios) {
      const palabras = n.textContent.split(/(\s+)/);
      let pos = 0;
      for (const w of palabras) {
        // Las direcciones, códigos, fechas y números largos pueden cortarse en sus signos: solo cuentan las palabras.
        if (w.trim().length >= 4 && !/[@/\\_.\d-]/.test(w)) {
          const r = document.createRange();
          r.setStart(n, pos);
          r.setEnd(n, pos + w.length);
          const tops = new Set([...r.getClientRects()].filter((x) => x.width > 1).map((x) => Math.round(x.top)));
          if (tops.size > 1) res.push(`${ctl ? 'CONTROL PARTIDO' : 'PALABRA PARTIDA'}: «${w.trim()}» en ${t}`);
        }
        pos += w.length;
      }
    }
  }
  for (const c of document.querySelectorAll('a, button, [role=button], [role=tab], input, select, textarea')) {
    if (decorativo(c) || !visible(c)) continue;
    const r = c.getBoundingClientRect();
    if (r.width > 0 && (r.left < -1 || r.right > innerWidth + 1)) {
      let a = c.parentElement;
      let desliza = false;
      while (a && a !== document.body) {
        const sa = getComputedStyle(a);
        if (sa.overflowX !== 'visible') {
          desliza = true;
          break;
        }
        a = a.parentElement;
      }
      if (!desliza) res.push(`CONTROL RECORTADO: ${texto(c) || c.getAttribute('aria-label') || c.tagName}`);
    }
  }

  // 3: contenido bajo lo fijo de abajo (con la página al final)
  const fijos = [...document.querySelectorAll('body *')].filter((e) => {
    if (!visible(e) || e.closest('dialog')) return false;
    const s = getComputedStyle(e);
    if (s.position !== 'fixed' && s.position !== 'sticky') return false;
    const r = e.getBoundingClientRect();
    return r.bottom >= innerHeight - 30 && r.top > innerHeight * 0.4 && r.height < innerHeight * 0.5;
  });
  if (fijos.length) {
    const tope = Math.min(...fijos.map((f) => f.getBoundingClientRect().top));
    const main = document.querySelector('main') ?? document.body;
    let fin = 0;
    let ultimo = '';
    for (const e of main.querySelectorAll('*')) {
      // Lo de una hoja abierta (dialog) va por encima de la acción fija de la pantalla: no queda tapado (lote 2.3).
      if (fijos.some((f) => f.contains(e) || e.contains(f)) || decorativo(e) || !visible(e) || e.closest('dialog[open]')) continue;
      const s = getComputedStyle(e);
      if (s.position === 'fixed' || s.position === 'absolute') continue;
      const propio = [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()) || e.matches('a, button, input, img');
      if (!propio) continue;
      const r = e.getBoundingClientRect();
      if (r.bottom > fin) {
        fin = r.bottom;
        ultimo = texto(e) || e.tagName;
      }
    }
    if (fin > tope + 1) res.push(`BAJO LA ACCIÓN FIJA: ${ultimo} (${Math.round(fin - tope)} px)`);
  }
  return [...new Set(res)];
}

async function main() {
  const srv = await servir();
  const base = `http://localhost:${srv.address().port}`;
  const nav = await chromium.launch();
  const problemas = [];
  for (const [ancho, alto] of ANCHOS) {
    const ctx = await nav.newContext({ viewport: { width: ancho, height: alto }, reducedMotion: 'reduce', hasTouch: true, isMobile: true });
    for (const [nombre, ruta, esperar, escenario] of PANTALLAS) {
      if (process.env.SOLO && !nombre.startsWith(process.env.SOLO)) continue;
      const p = await ctx.newPage();
      const sep = ruta.includes('?') ? '&' : '?';
      try {
        await p.goto(`${base}${ruta}${sep}escenario=${escenario}`);
        await p.getByText(esperar).first().waitFor({ timeout: 10000 });
        await esperarMapas(p);
        await p.evaluate(() => document.fonts.ready);
        await p.locator('.esqueleto').first().waitFor({ state: 'detached', timeout: 4000 }).catch(() => undefined);
        await p.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
        await p.waitForTimeout(150);
        for (const r of await p.evaluate(medir)) problemas.push(`${ancho}px · ${nombre}: ${r}`);
      } catch (e) {
        problemas.push(`${ancho}px · ${nombre}: NO CARGÓ (${e.message.split('\n')[0]})`);
      }
      await p.close();
    }
    await ctx.close();
  }
  // La pantalla de escritorio (X-Escritorio): computadora con mouse.
  const ctx = await nav.newContext({ viewport: { width: 1280, height: 800 }, reducedMotion: 'reduce' });
  const p = await ctx.newPage();
  await p.goto(`${base}/inicio/`);
  await p.getByText('Escaneá con tu celular').waitFor({ timeout: 10000 });
  for (const r of await p.evaluate(medir)) problemas.push(`1280px · escritorio: ${r}`);
  await ctx.close();

  await nav.close();
  srv.close();
  const conocidos = process.env.ESTRICTO ? {} : JSON.parse(readFileSync(join(__dirname, 'desbordes-conocidos.json'), 'utf8'));
  const clave = (pr) => pr.replace(/^\d+px · /, '');
  const esConocido = (pr) => {
    const k = clave(pr);
    const pantalla = k.slice(0, k.indexOf(':'));
    return (conocidos[pantalla] ?? []).includes(k.slice(pantalla.length + 2));
  };
  const nuevos = problemas.filter((pr) => !esConocido(pr));
  const vistos = new Set(problemas.map(clave));
  const resueltos = Object.entries(conocidos).flatMap(([pantalla, l]) => l.map((x) => `${pantalla}: ${x}`)).filter((k) => !vistos.has(k) && !k.startsWith('_'));
  for (const pr of nuevos) console.log('✘ ' + pr);
  for (const pr of problemas.filter(esConocido)) console.log('· conocido: ' + pr);
  for (const k of resueltos) console.log('✔ ya no pasa (sacalo de desbordes-conocidos.json): ' + k);
  console.log(nuevos.length ? `\n${nuevos.length} desbordes nuevos` : `✔ sin desbordes nuevos (${problemas.length - nuevos.length} conocidos)`);
  process.exit(nuevos.length ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
