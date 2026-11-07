const { chromium } = require('playwright'); const fs = require('fs');
(async () => { const b = await chromium.launch();
  for (const f of process.argv.slice(2)) { let h = fs.readFileSync('deluxe/project/' + f, 'utf8'); const m = h.match(/"width":(\d+),"height":(\d+)/);
    const p = await b.newPage({ viewport: { width: +m[1], height: +m[2] } });
    h = h.replace('<script src="./support.js"></script>', '').replace(/<link rel="stylesheet"[^>]*>/, ''); await p.setContent(h); await p.screenshot({ path: 'shots/' + f.replace('.dc.html', '.png') }); await p.close(); }
  await b.close(); })();
