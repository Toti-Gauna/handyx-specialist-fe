const { chromium } = require('playwright'); const fs = require('fs');
const axe = fs.readFileSync('/home/user/handyx-specialist-fe/node_modules/axe-core/axe.min.js','utf8');
(async () => {
  const b = await chromium.launch(); const dir = 'deluxe/project';
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.dc.html') && !/^(Main|A-|B-|C-)/.test(f));
  const resumen = {}; const porArchivo = {};
  for (const f of files) {
    let h = fs.readFileSync(dir + '/' + f, 'utf8').replace('<script src="./support.js"></script>', '').replace(/<link rel="stylesheet"[^>]*>/, '');
    const m = h.match(/"width":(\d+),"height":(\d+)/); const W = m ? +m[1] : 390, H = m ? +m[2] : 844;
    const p = await b.newPage({ viewport: { width: W, height: H } });
    const estilo = (h.match(/<style>([\s\S]*?)<\/style>/) || ['', ''])[1];
    await p.setContent('<!doctype html><html lang="es"><head><meta charset="utf-8"><title>x</title><style>' + estilo + '</style></head><body>' + h.split('<x-dc>')[1].split('</x-dc>')[0].replace(/<helmet>[\s\S]*?<\/helmet>/, '') + '</body></html>');
    await p.addScriptTag({ content: axe });
    const r = await p.evaluate(async () => {
      const res = await axe.run(document, { runOnly: ['wcag2a', 'wcag2aa'], rules: { 'page-has-heading-one': { enabled: false }, 'landmark-one-main': { enabled: false }, region: { enabled: false } } });
      const viol = res.violations.map(v => ({ id: v.id, n: v.nodes.length, ej: v.nodes.slice(0, 2).map(n => n.target.join(' ') + ' :: ' + (n.any[0]?.message || '').slice(0, 90)) }));
      const chicos = [...document.querySelectorAll('a,button,[role=switch],[role=tab],[role=radio],[role=checkbox]')].filter(e => { const r = e.getBoundingClientRect(); return r.width > 0 && (r.width < 44 || r.height < 44) && !e.closest('p'); }).map(e => (e.textContent.trim().slice(0, 30) || e.getAttribute('aria-label') || e.tagName) + ` ${Math.round(e.getBoundingClientRect().width)}x${Math.round(e.getBoundingClientRect().height)}`);
      const letra = [...document.querySelectorAll('body *')].filter(e => e.childNodes.length && [...e.childNodes].some(n => n.nodeType === 3 && n.textContent.trim()) && parseFloat(getComputedStyle(e).fontSize) < 11).length;
      const raizEl = document.body.firstElementChild; const rr = raizEl.getBoundingClientRect();
      const desborde = [];
      for (const e of document.querySelectorAll('body *')) {
        if (e.closest('[aria-hidden="true"]') || e.closest('svg')) continue;
        const cs = getComputedStyle(e); if (cs.display === 'none') continue;
        const tieneTexto = [...e.childNodes].some(n => n.nodeType === 3 && n.textContent.trim());
        if (!tieneTexto) continue;
        // 1) texto que se sale de su propia caja
        if (e.scrollWidth > e.clientWidth + 2 && cs.overflow === 'visible' && cs.whiteSpace !== 'nowrap' && e.clientWidth > 0) desborde.push('caja: ' + e.textContent.trim().slice(0, 28));
        // 2) texto que pasa el borde de la tarjeta o de la pantalla
        const rg = document.createRange(); rg.selectNodeContents(e); const r = rg.getBoundingClientRect();
        let cont = e.parentElement; while (cont && cont !== raizEl && getComputedStyle(cont).overflow === 'visible' && !/(border-radius|background)/.test(cont.getAttribute('style') || '')) cont = cont.parentElement;
        const cr = (cont || raizEl).getBoundingClientRect();
        if (r.width && (r.right > cr.right + 2 || r.left < cr.left - 2) && r.right <= rr.right + 400) desborde.push('borde: ' + e.textContent.trim().slice(0, 28));
        // 3) montos partidos en dos líneas
        if (/^[+−-]?\s?\$\s?[\d.]+/.test(e.textContent.trim()) && e.textContent.trim().length < 14 && rg.getClientRects().length > 1) desborde.push('monto partido: ' + e.textContent.trim());
      }
      return { viol, chicos, letra, desborde: [...new Set(desborde)] };
    });
    porArchivo[f] = r;
    for (const v of r.viol) { resumen[v.id] = resumen[v.id] || { pantallas: 0, nodos: 0, ej: v.ej }; resumen[v.id].pantallas++; resumen[v.id].nodos += v.n; }
    await p.close();
  }
  await b.close();
  fs.writeFileSync('gen/revision.json', JSON.stringify(porArchivo, null, 1));
  console.log('Pantallas:', files.length);
  console.log('AXE:', JSON.stringify(resumen, null, 1));
  const chicos = Object.entries(porArchivo).filter(([f, r]) => r.chicos.length).map(([f, r]) => f + ': ' + r.chicos.length + ' → ' + r.chicos.slice(0, 4).join(' | '));
  console.log('TOQUE < 44 px en', chicos.length, 'pantallas'); console.log(chicos.slice(0, 40).join('\n'));
  console.log('DESBORDES en', Object.values(porArchivo).filter(r => r.desborde.length).length, 'pantallas'); console.log(Object.entries(porArchivo).filter(([f, r]) => r.desborde.length).map(([f, r]) => f + ': ' + r.desborde.slice(0, 5).join(' | ')).join('\n'));
  console.log('LETRA < 11 px:', Object.entries(porArchivo).filter(([f, r]) => r.letra).map(([f, r]) => f + ':' + r.letra).join(', '));
})();
