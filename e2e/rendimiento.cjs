// Rendimiento con Lighthouse móvil (lote 4.9) sobre el build de PRODUCCIÓN (modo http), no sobre el mock: el mock
// suma fixtures y el simulador del servidor, que no viajan a producción. Las pantallas con sesión leen una API
// ficticia local con los datos sintéticos del mock (e2e/rendimiento/api-ficticia.mjs).
//
// Uso (el build apunta a la API ficticia y no se publica nunca: build:hostinger exige https):
//   NEXT_PUBLIC_DATA_SOURCE=http NEXT_PUBLIC_API_BASE_URL=http://localhost:4503 npx next build
//   node e2e/rendimiento.cjs            # SOLO=/caja/ mide una sola ruta; VECES=2 repite cada medición
// Lighthouse se baja con npx en una versión fija; no es dependencia del proyecto.
const { createServer } = require('node:http');
const { readFileSync, existsSync, statSync, mkdtempSync, rmSync } = require('node:fs');
const { join, extname } = require('node:path');
const { tmpdir } = require('node:os');
const { gzipSync } = require('node:zlib');
const { spawn, execFile } = require('node:child_process');
const { promisify } = require('node:util');
const { chromium } = require('playwright');
const { id } = require('./pantallas.cjs');

const LIGHTHOUSE = 'lighthouse@13.6.0';
const PUERTO_APP = 4504;
const PUERTO_API = 4503;
const RAIZ = join(__dirname, '..', 'out');
const RUTAS = [
  '/bienvenida/',
  '/acceso/',
  '/registro/',
  '/inicio/',
  '/pedidos/',
  `/pedidos/detalle/?id=${id(0xb2)}`,
  '/trabajos/',
  `/trabajos/detalle/?id=${id(0xc1)}`,
  '/agenda/',
  '/mensajes/',
  '/caja/',
  '/cuenta/',
  '/soporte/',
  '/notificaciones/',
];
const TIPOS = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webp': 'image/webp', '.png': 'image/png', '.webmanifest': 'application/manifest+json', '.txt': 'text/plain', '.woff2': 'font/woff2' };

/** Como el hosting: texto comprimido y estáticos con hash en caché larga. */
const comprimidos = new Map();
function servir() {
  return new Promise((ok) => {
    const s = createServer((req, res) => {
      let f = join(RAIZ, decodeURIComponent(new URL(req.url, 'http://x').pathname));
      if (existsSync(f) && statSync(f).isDirectory()) f = join(f, 'index.html');
      let estado = 200;
      if (!existsSync(f)) {
        estado = 404;
        f = join(RAIZ, '404.html');
      }
      const tipo = TIPOS[extname(f)] ?? 'application/octet-stream';
      const h = { 'Content-Type': tipo, 'Cache-Control': f.includes('/_next/static/') ? 'public, max-age=31536000, immutable' : 'no-cache' };
      let cuerpo = readFileSync(f);
      if (/text|javascript|json|manifest/.test(tipo) && /gzip/.test(req.headers['accept-encoding'] ?? '')) {
        if (!comprimidos.has(f)) comprimidos.set(f, gzipSync(cuerpo));
        cuerpo = comprimidos.get(f);
        h['Content-Encoding'] = 'gzip';
      }
      res.writeHead(estado, h);
      res.end(cuerpo);
    }).listen(PUERTO_APP, () => ok(s));
  });
}

/** Asíncrono: el servidor de out/ corre en este mismo proceso y tiene que seguir respondiendo. */
async function medir(ruta, dir) {
  const salida = join(dir, 'informe.json');
  await promisify(execFile)(
    'npx',
    ['--yes', LIGHTHOUSE, `http://localhost:${PUERTO_APP}${ruta}`, '--quiet', '--chrome-flags=--headless=new --no-sandbox', '--only-categories=performance,accessibility', '--output=json', `--output-path=${salida}`],
    { env: { ...process.env, CHROME_PATH: chromium.executablePath() } },
  );
  const j = JSON.parse(readFileSync(salida, 'utf8'));
  const a = j.audits;
  return {
    rendimiento: Math.round(j.categories.performance.score * 100),
    accesibilidad: Math.round(j.categories.accessibility.score * 100),
    lcp: a['largest-contentful-paint'].displayValue,
    tbt: a['total-blocking-time'].displayValue,
    cls: a['cumulative-layout-shift'].displayValue,
  };
}

async function main() {
  if (!existsSync(join(RAIZ, 'index.html'))) throw new Error('Falta out/: compilá primero (ver el encabezado de este archivo).');
  if (readFileSync(join(RAIZ, 'acceso', 'index.html'), 'utf8').includes('Datos de prueba')) throw new Error('out/ es el build del mock: medí el de producción (modo http).');
  const srv = await servir();
  const api = spawn(process.execPath, [join(__dirname, 'rendimiento', 'api-ficticia.mjs'), String(PUERTO_API), `http://localhost:${PUERTO_APP}`], { stdio: 'inherit' });
  await new Promise((r) => setTimeout(r, 1500));
  const dir = mkdtempSync(join(tmpdir(), 'lighthouse-'));
  const rutas = process.env.SOLO ? [process.env.SOLO] : RUTAS;
  const veces = Number(process.env.VECES ?? 1);
  const bajos = [];
  try {
    console.log('ruta'.padEnd(52), 'rend.  acces.  LCP     TBT      CLS');
    for (const ruta of rutas) {
      for (let i = 0; i < veces; i++) {
        const r = await medir(ruta, dir);
        console.log(ruta.padEnd(52), String(r.rendimiento).padEnd(6), String(r.accesibilidad).padEnd(7), r.lcp.padEnd(7), r.tbt.padEnd(8), r.cls);
        if (r.rendimiento < 90 || r.accesibilidad < 90) bajos.push(`${ruta} (${r.rendimiento} / ${r.accesibilidad})`);
      }
    }
  } finally {
    api.kill();
    srv.close();
    rmSync(dir, { recursive: true, force: true });
  }
  console.log(bajos.length ? `\nPor debajo de 90: ${bajos.join(', ')}` : '\nTodo en 90 o más.');
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
