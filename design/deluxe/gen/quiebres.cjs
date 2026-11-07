// Detecta: palabras que no entran (se salen o se cortan), botones/chips con el texto en dos líneas y textos recortados.
const { chromium } = require('playwright'); const fs = require('fs');
(async () => {
  const b = await chromium.launch(); const dir = 'deluxe/project';
  const solo = process.argv.slice(2);
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.dc.html') && !/^(Main|A-|B-|C-|RC-|FL-|UX-)/.test(f) && (!solo.length || solo.includes(f)));
  const out = {};
  for (const f of files) {
    let h = fs.readFileSync(dir + '/' + f, 'utf8').replace('<script src="./support.js"></script>', '');
    const m = h.match(/"width":(\d+),"height":(\d+)/);
    const p = await b.newPage({ viewport: { width: +m[1], height: +m[2] } });
    await p.setContent(h); await p.evaluate(() => document.fonts.ready);
    const r = await p.evaluate(() => {
      const res = [];
      const lineas = e => { const tops = new Set(); for (const n of e.childNodes) { if (n.nodeType !== 3 || !n.textContent.trim()) continue; const rg = document.createRange(); rg.selectNodeContents(n); for (const x of rg.getClientRects()) if (x.width > 1) tops.add(Math.round((x.top + x.height / 2) / 6)); } return tops.size; };
      for (const e of document.querySelectorAll('x-dc *, body > div *')) {
        if (e.closest('svg') || e.closest('[aria-hidden="true"]')) continue;
        const cs = getComputedStyle(e); if (cs.display === 'none' || cs.visibility === 'hidden') continue;
        const txt = [...e.childNodes].filter(n => n.nodeType === 3).map(n => n.textContent).join('').trim();
        if (!txt) continue;
        const t = e.textContent.trim().replace(/\s+/g, ' ').slice(0, 40);
        if (e.scrollWidth > e.clientWidth + 1 && cs.overflow === 'visible' && e.clientWidth > 0 && cs.whiteSpace !== 'nowrap') res.push('NO ENTRA: ' + t);
        const rg = document.createRange(); rg.selectNodeContents(e); const rr = rg.getBoundingClientRect();
        let a = e.parentElement; while (a && a.tagName !== 'BODY') { const s = getComputedStyle(a); if (s.overflow !== 'visible' || s.overflowX !== 'visible') { const ar = a.getBoundingClientRect(); if (rr.left < ar.left - 1 || rr.right > ar.right + 1) res.push('RECORTADO: ' + t); break; } a = a.parentElement; }
        // control o pastilla con el texto partido
        const ctl = e.closest('a,button,[role=button],[role=tab],[role=radio],[role=option]');
        const est = (e.getAttribute('style') || '') + ((ctl && ctl.getAttribute('style')) || '');
        const pastilla = /border-radius: (999|1[0-9]|2[0-9])/.test(est) && /(background|border)/.test(est);
        const n = lineas(e);
        if (n > 1 && (ctl || pastilla) && t.length <= 34 && e.getBoundingClientRect().width < 330) res.push('EN DOS LÍNEAS: ' + t);
      }
      return [...new Set(res)];
    });
    if (r.length) out[f] = r; await p.close();
  }
  await b.close();
  for (const [f, r] of Object.entries(out)) console.log(f + '\n  ' + r.join('\n  '));
  console.log('pantallas con problemas:', Object.keys(out).length);
})();
