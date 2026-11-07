// Política del service worker (lote 3.3). scripts/generar-sw.mjs copia este archivo, sin tipos, dentro de out/sw.js.
// Regla: solo se guardan archivos estáticos y públicos de la propia app (HTML sin datos, JS, CSS, fuentes, imágenes).
// Nunca la API (está en otro origen y además no entra en la lista), nunca un POST y nunca nada de otro sitio.

export type Estrategia = 'ninguna' | 'pagina' | 'cache-primero' | 'red-primero';

export interface PedidoSw {
  metodo: string;
  modo: string;
  url: URL;
  origen: string;
  base: string;
}

const INMUTABLE = /\.(woff2|webp|png|svg|ico)$/;
const ESTATICO = /\.(txt|css|js|webmanifest)$/;

export function estrategia({ metodo, modo, url, origen, base }: PedidoSw): Estrategia {
  if (metodo !== 'GET' || url.origin !== origen) return 'ninguna';
  if (!url.pathname.startsWith(`${base}/`) || url.pathname === `${base}/sw.js`) return 'ninguna';
  if (modo === 'navigate') return 'pagina';
  if (url.pathname.startsWith(`${base}/_next/static/`) || INMUTABLE.test(url.pathname)) return 'cache-primero';
  if (ESTATICO.test(url.pathname)) return 'red-primero';
  return 'ninguna';
}

/** Las pantallas reciben el id por query (?id=…): el HTML es el mismo, así que se guarda una copia por ruta. */
export function claveDePagina(url: URL): string {
  return `${url.origin}${url.pathname}`;
}
