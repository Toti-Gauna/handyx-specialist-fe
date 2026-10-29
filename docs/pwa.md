# PWA: instalación, service worker y sin conexión (lote 3.3)

## Qué se instala

- `public/manifest.webmanifest`:
  - `id` y `start_url` `./`, `display: standalone`, sin orientación forzada (WCAG 1.3.4).
  - Íconos de 192 y 512 px declarados por separado como `any` y `maskable`: la gota queda dentro de la zona segura del 80 %.
  - Ícono de Apple de 180 px desde `layout.tsx`.
- `out/sw.js`: lo genera `scripts/generar-sw.mjs` en cada `npm run build` y `build:hostinger`. No está en `public/` y no se edita a mano.
  Lo registra `RegistrarSw` solo en un build (en `next dev` no hay service worker).

## Qué guarda y qué no (`src/pwa/politica.ts`, con pruebas en `politica.test.ts`)

| Pedido | Estrategia |
|---|---|
| Navegación a una pantalla de la app | Red primero. Guarda una copia del HTML por ruta (sin `?id=`). Sin red: la copia, y si no hay, `/sin-conexion/` |
| `/_next/static/*`, fuentes e imágenes | Caché primero (los nombres llevan hash) |
| `.txt` (datos de navegación de Next), `.css`, `.js`, manifest | Red primero con copia de respaldo |
| **La API** (otro origen), cualquier POST/PUT/DELETE, JSON del mismo origen, otros sitios, `sw.js` | **Nunca**: el service worker no intercepta |

- El HTML exportado no tiene datos de la cuenta: las pantallas cargan los datos en el navegador desde la API.
- Por eso, sin red, una pantalla guardada se abre, la consulta falla y aparece el Handy roto con "Reintentar". **Nunca** se
  muestran datos viejos de la cuenta ni fixtures.
- Lo mismo vale para los envíos: no hay cola offline ni "enviar cuando vuelva la red". Una propuesta o un reporte de pago que
  no llegó al servidor no existe. La franja "Sin conexión" lo avisa.
- Precarga mínima, para poder mostrar `/sin-conexion/`: su HTML, el CSS, las dos fuentes latinas, dos Handys, el logo, un ícono y
  el manifest.
- La versión es un hash de todo `out/`: cada deploy crea una caché nueva y borra las anteriores (`handyx-esp-*`).
- Cache Storage solo guarda archivos públicos de la app, así que no contradice "nada en el navegador". Esa regla se refiere a
  datos de la cuenta, tokens y CSRF. El recorrido J de `npm run e2e` revisa que la caché solo tenga archivos de la lista permitida.

## Para el deploy (fase 5)

- Servir `sw.js` con `Cache-Control: no-cache` para que un deploy nuevo llegue enseguida. El resto de `_next/static` puede ser
  inmutable.
- Configurar la página de error 404 del hosting con `404.html` (el servidor de pruebas `e2e/servidor.cjs` ya lo hace).
- Con base distinta de `/` (`NEXT_PUBLIC_BASE_PATH`), el alcance del service worker es esa base.
