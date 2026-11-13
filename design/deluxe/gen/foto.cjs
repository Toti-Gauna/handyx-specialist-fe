const { chromium } = require('playwright'); const fs = require('fs');
(async () => { const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  for (const f of process.argv.slice(3)) { let h = fs.readFileSync(process.argv[2] + '/' + f, 'utf8').replace('<script src="./support.js"></script>', '').replace(/<link rel="stylesheet"[^>]*>/, '');
    await p.setContent(h); await p.waitForTimeout(150); await p.screenshot({ path: 'shots/' + f.replace('.dc.html', '.png') }); }
  await b.close(); })();
