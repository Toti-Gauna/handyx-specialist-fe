const { chromium } = require('playwright'); const fs = require('fs');
(async () => { const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1800, height: 1100 } });
  const f = process.argv[2]; let h = fs.readFileSync('deluxe/project/' + f, 'utf8').replace('<script src="./support.js"></script>', '').replace(/<link rel="stylesheet"[^>]*>/, '');
  await p.setContent(h); await p.screenshot({ path: 'shots/' + f.replace('.dc.html', '.png') }); await b.close(); })();
