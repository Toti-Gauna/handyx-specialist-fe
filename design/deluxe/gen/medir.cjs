const { chromium } = require('playwright');
const fs = require('fs');
(async () => {
  const b = await chromium.launch();
  const b2 = b;
  const dir = process.argv[2];
  const files = process.argv.slice(3);
  for (const f of files) {
    let html = fs.readFileSync(dir + '/' + f, 'utf8').replace('<script src="./support.js"></script>', '');
    const mm = html.match(/"width":(\d+),"height":(\d+)/); const p = await b2.newPage({ viewport: { width: +mm[1], height: +mm[2] } });
    await p.setContent(html, { waitUntil: 'networkidle' }); await p.evaluate(() => document.fonts.ready);
    const r = await p.evaluate(() => {
      const raiz = document.querySelector('x-dc > div');
      const hijos = [...raiz.children];
      const abajo = hijos.filter(e => { const s = getComputedStyle(e); return s.position === 'absolute' && s.bottom === '0px' && e.tagName !== 'SECTION' && e.getBoundingClientRect().bottom >= innerHeight - 4 && e.getBoundingClientRect().height < 300; });
      const cont = hijos.filter(e => { const s = getComputedStyle(e); return s.position === 'absolute' && ['72px','26px','84px','90px','196px','232px','92px','262px','268px','312px','370px','380px','488px'].includes(s.top); });
      const topAbajo = abajo.length ? Math.min(...abajo.map(e => e.getBoundingClientRect().top)) : innerHeight;
      const finCont = cont.length ? Math.max(...cont.map(e => e.getBoundingClientRect().bottom)) : 0;
      const ancho = Math.max(...[...raiz.querySelectorAll('*')].map(e => e.getBoundingClientRect().right));
      return { topAbajo: Math.round(topAbajo), finCont: Math.round(finCont), ancho: Math.round(ancho) };
    });
    const solapa = r.finCont - r.topAbajo;
    await p.close();
    console.log(f.padEnd(28), 'contenido termina', r.finCont, '| barra empieza', r.topAbajo, solapa > 0 ? `<< TAPA ${solapa}px` : '', r.ancho > 392 ? `ANCHO ${r.ancho}` : '');
  }
  await b.close();
})();
