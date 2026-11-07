const { chromium } = require('playwright'); const fs = require('fs');
(async () => { const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  for (const f of process.argv.slice(2)) { let h = fs.readFileSync('deluxe/project/' + f, 'utf8').replace('<script src="./support.js"></script>', '');
    await p.setContent(h, { waitUntil: 'networkidle' }); await p.evaluate(() => document.fonts.ready);
    await p.screenshot({ path: 'shots/all/' + f.replace('.dc.html', '.png'), clip: { x: 0, y: 0, width: 390, height: 844 } }); }
  await b.close(); })();
