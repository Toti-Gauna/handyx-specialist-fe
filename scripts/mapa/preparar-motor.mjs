// Copia el worker de MapLibre a public/mapa/motor/ (lote 4.3). MapLibre 6 lo busca al lado de su propio módulo, pero el
// build lo empaqueta en otro lado: src/mapa/motor.ts le indica esta copia con setWorkerUrl. El nombre lleva la versión,
// así un cambio de versión no usa un worker viejo de la caché. No se versiona en Git: sale de node_modules en cada build.
import { copyFileSync, mkdirSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';

const { version } = JSON.parse(readFileSync('node_modules/maplibre-gl/package.json', 'utf8'));
const destino = 'public/mapa/motor';
mkdirSync(destino, { recursive: true });
for (const f of readdirSync(destino)) if (f.startsWith('maplibre-gl-worker-')) rmSync(join(destino, f));
copyFileSync('node_modules/maplibre-gl/dist/maplibre-gl-worker.mjs', join(destino, `maplibre-gl-worker-${version}.js`));
console.log(`preparar-motor: worker de MapLibre ${version} en ${destino}/`);
