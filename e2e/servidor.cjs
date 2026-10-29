// Servidor estático mínimo para out/ (lo usan los recorridos y las capturas).
const { createServer } = require('node:http');
const { readFileSync, existsSync, statSync } = require('node:fs');
const { join, extname } = require('node:path');

const RAIZ = join(__dirname, '..', 'out');
const TIPOS = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webp': 'image/webp', '.png': 'image/png', '.webmanifest': 'application/manifest+json', '.txt': 'text/plain' };

function servir() {
  return new Promise((ok) => {
    const s = createServer((req, res) => {
      let ruta = decodeURIComponent(new URL(req.url, 'http://x').pathname);
      let f = join(RAIZ, ruta);
      if (existsSync(f) && statSync(f).isDirectory()) f = join(f, 'index.html');
      if (!existsSync(f)) { res.writeHead(404); return res.end('no encontrado'); }
      res.writeHead(200, { 'Content-Type': TIPOS[extname(f)] ?? 'application/octet-stream' });
      res.end(readFileSync(f));
    }).listen(0, () => ok(s));
  });
}

module.exports = { servir };
