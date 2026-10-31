// Después de `next build`: escribe out/sw.js con la política de src/pwa/politica.ts (sin tipos), la versión del
// build y la precarga mínima para mostrar "Sin conexión". La versión cambia con cualquier archivo del sitio,
// así un deploy nuevo descarta la caché anterior.
import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';
import { join, relative } from 'node:path';

const out = 'out';
const base = process.env.NEXT_PUBLIC_BASE_PATH ?? '';
const recorrer = (d) => readdirSync(d).flatMap((n) => (statSync(join(d, n)).isDirectory() ? recorrer(join(d, n)) : [join(d, n)]));
const archivos = recorrer(out)
  .map((f) => relative(out, f).split('\\').join('/'))
  .filter((f) => f !== 'sw.js')
  .sort();

const hash = createHash('sha256');
for (const f of archivos) hash.update(f).update(readFileSync(join(out, f)));
const version = hash.digest('hex').slice(0, 12);

// Lo justo para la pantalla sin conexión: su HTML, la hoja de estilos, las fuentes latinas, los Handys que usa e íconos.
const precarga = [
  'sin-conexion/',
  ...archivos.filter((f) => f.endsWith('.css')),
  ...archivos.filter((f) => /^_next\/static\/media\/(archivo|dm-sans)-latin-w[a-z]+-normal\.[^/]+\.woff2$/.test(f)),
  'handys/handy-cano-roto.webp',
  'handys/handy-lamparita-rota.webp',
  'logo-handyx.webp',
  'icono-app-192.png',
  'manifest.webmanifest',
].map((f) => `${base}/${f}`);
for (const p of precarga) {
  const f = p.slice(base.length + 1);
  if (!existsSync(join(out, f.endsWith('/') ? `${f}index.html` : f))) throw new Error(`generar-sw: falta ${f} en out/`);
}

const politica = stripTypeScriptTypes(readFileSync('src/pwa/politica.ts', 'utf8')).replace(/^export /gm, '')
  .replace(/(\S) {2,}/g, '$1 ')
  .replace(/[ \t]+$/gm, '')
  .replace(/\n{3,}/g, '\n\n');

const sw = `// Generado por scripts/generar-sw.mjs en cada build: no editar. Política: src/pwa/politica.ts.
const VERSION = ${JSON.stringify(version)};
const BASE = ${JSON.stringify(base)};
const PRECARGA = ${JSON.stringify(precarga)};
const CACHE = 'handyx-esp-' + VERSION;
${politica}
const guardable = (r) => r.ok && r.type === 'basic' && !r.redirected;

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(PRECARGA)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((ks) => Promise.all(ks.filter((k) => k.startsWith('handyx-esp-') && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

async function pagina(pedido, url) {
  const cache = await caches.open(CACHE);
  try {
    const r = await fetch(pedido);
    if (guardable(r)) await cache.put(claveDePagina(url), r.clone());
    return r;
  } catch {
    return (await cache.match(claveDePagina(url))) ?? (await cache.match(BASE + '/sin-conexion/')) ?? Response.error();
  }
}

async function cachePrimero(pedido) {
  const cache = await caches.open(CACHE);
  const guardada = await cache.match(pedido);
  if (guardada) return guardada;
  const r = await fetch(pedido);
  if (guardable(r)) await cache.put(pedido, r.clone());
  return r;
}

async function redPrimero(pedido) {
  const cache = await caches.open(CACHE);
  try {
    const r = await fetch(pedido);
    if (guardable(r)) await cache.put(pedido, r.clone());
    return r;
  } catch (e) {
    const guardada = await cache.match(pedido);
    if (guardada) return guardada;
    throw e;
  }
}

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  const que = estrategia({ metodo: e.request.method, modo: e.request.mode, url, origen: self.location.origin, base: BASE });
  if (que === 'pagina') e.respondWith(pagina(e.request, url));
  else if (que === 'cache-primero') e.respondWith(cachePrimero(e.request));
  else if (que === 'red-primero') e.respondWith(redPrimero(e.request));
});
`;
writeFileSync(join(out, 'sw.js'), sw);
console.log(`generar-sw: out/sw.js versión ${version}, ${precarga.length} archivos precargados`);
