const { chromium } = require('playwright');
const fs = require('fs');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const dir = process.argv[2];
  const files = process.argv.slice(3);
  for (const f of files) {
    let html = fs.readFileSync(dir + '/' + f, 'utf8').replace('<script src="./support.js"></script>', '');
    html = html.replace(/<link rel="stylesheet"[^>]*>/, '');
    await p.setContent(html);
    const r = await p.evaluate(() => {
      const raiz = document.querySelector('x-dc > div');
      const hijos = [...raiz.children];
      const abajo = hijos.filter(e => { const s = getComputedStyle(e); return s.position === 'absolute' && s.bottom === '0px' && e.tagName !== 'SECTION' && e.getBoundingClientRect().bottom >= 840 && e.getBoundingClientRect().height < 300; });
      const cont = hijos.filter(e => { const s = getComputedStyle(e); return s.position === 'absolute' && ['72px','26px','84px','90px','196px','232px','92px','262px','268px','312px','370px','380px','488px'].includes(s.top); });
      const topAbajo = abajo.length ? Math.min(...abajo.map(e => e.getBoundingClientRect().top)) : 844;
      const finCont = cont.length ? Math.max(...cont.map(e => e.getBoundingClientRect().bottom)) : 0;
      const ancho = Math.max(...[...raiz.querySelectorAll('*')].map(e => e.getBoundingClientRect().right));
      return { topAbajo: Math.round(topAbajo), finCont: Math.round(finCont), ancho: Math.round(ancho) };
    });
    const solapa = r.finCont - r.topAbajo;
    console.log(f.padEnd(28), 'contenido termina', r.finCont, '| barra empieza', r.topAbajo, solapa > 0 ? `<< TAPA ${solapa}px` : '', r.ancho > 392 ? `ANCHO ${r.ancho}` : '');
  }
  await b.close();
})();
