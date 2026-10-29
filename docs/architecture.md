# Arquitectura · PWA Especialista de Handyx

Estado: **fase 1 (bases)**. Esqueleto ejecutable, contratos v0.1.0 y adaptadores mock/HTTP. Ninguna pantalla de
negocio está terminada (cada ruta indica el lote que la construye). Nada desplegado.

## Decisiones

| Tema | Decisión | Origen |
|---|---|---|
| Stack | React 19 + Next.js 16 (App Router) + TypeScript `strict` | Ignacio, 29/10/2026 |
| Hosting | Hostinger, archivos estáticos: `output: 'export'`, `trailingSlash: true` | Bloque 4 · deploy |
| Servidor | Ninguno en el frontend: sin SSR, Route Handlers, Server Actions ni middleware de Next. Toda regla y permiso vive en `api-especialista` | Bloque 4 |
| Backend | `handyx-specialist-be` = `api-especialista` (TECH-20); identidad y transacciones compartidas con `api-usuario` | TECH-03 / TECH-20 |
| Esquema y migraciones | Dueño único: `handyx-client-be`. Este repo y `handyx-specialist-be` consumen esa versión | Ignacio, 29/10/2026 |
| Marca | Tokens de la landing copiados byte a byte (`src/brand/tokens.ts`); íconos y lenguaje visual de `demo-app.css` | CLAUDE.md de la landing |
| Fuentes | `@fontsource-variable` (Archivo con ancho variable y DM Sans), empaquetadas: sin pedidos a Google | Como el portal |
| Tests | `node --test` con TypeScript nativo de Node 22 (igual que landing y portal). Vitest 4/5 dispara un error de `npm` 10.9 al resolver peers en un proyecto limpio | Lote 1.1 |

## Estructura

```
src/
  app/                 rutas (App Router). (publico): acceso/registro/recuperar/alta sin nav · (app): con nav
    rutas.ts           mapa de rutas con el lote que construye cada pantalla
  brand/tokens.ts      copia de la landing → variables CSS (--color-*, --radio-*, --fuente*)
  components/          marco de la app, banner de prueba, íconos, puerta de entrada, estados
  config/entorno.ts    origen de datos (mock | http) validado; sin secretos
  contracts/           CONTRATO COMPARTIDO v0.1.0 (borrador a transferir a handyx-client-be)
    dto.ts             esquemas Zod de requests/responses
    maquinas.ts        máquinas de estado con actor
    fee.ts             políticas de tarifa y contador del fee 0 %
    dinero.ts          centavos enteros + moneda
    tiempos.ts         zona Buenos Aires, ventanas y vencimientos
    rubros.ts          seis rubros; gas y aire requieren matrícula
  data/
    api.ts             puerto EspecialistaApi (las pantallas solo conocen esto)
    http/              cliente HTTP (cookies, CSRF en memoria, Idempotency-Key, validación Zod)
    mock/              fixtures sintéticos + reglas emuladas del servidor
    origen.http.ts     origen de producción (no importa el mock)
    origen.mock.ts     origen de desarrollo/preview
  security/            pruebas de política (no-storage)
scripts/               guardas del build de producción
```

## Origen de datos (mock / HTTP)

- `NEXT_PUBLIC_DATA_SOURCE=mock` (por defecto en desarrollo): fixtures sintéticos en memoria, banner amarillo
  **"Datos de prueba"** siempre visible, escenarios y fallas simuladas.
- `NEXT_PUBLIC_DATA_SOURCE=http` + `NEXT_PUBLIC_API_BASE_URL` (https; http solo en localhost).
- Las pantallas importan `api` desde `@handyx/origen-datos`; `next.config.ts` resuelve ese alias en build. Con `http`
  el bundle **no contiene** el mock ni sus fixtures: lo comprueba `scripts/verificar-bundle.mjs` dentro de
  `npm run build:hostinger`, que además rechaza construir producción sin `http` (`scripts/verificar-build.mjs`).
- Un fallo de red, de servidor o de contrato llega a la interfaz como `FalloApi` con su tipo; **nunca** se cae a
  fixtures. Una respuesta que no cumple el esquema Zod es error de `contrato`, no se rellena.

## Rutas con exportación estática

Cada ruta es una carpeta con `index.html`. Los ids de recursos van por query (`/pedidos/detalle/?id=…`), porque no se
conocen en build (no hay `generateStaticParams` para datos de usuarios). Hostinger no necesita reescrituras.

| Ruta | Lote | Ruta | Lote |
|---|---|---|---|
| `/` (puerta: sesión → inicio/alta/acceso) | 1.1 | `/trabajos/`, `/trabajos/detalle/` | 2.4 |
| `/acceso/`, `/registro/`, `/recuperar/` | 2.1 | `/agenda/` | 2.4 |
| `/alta/` (onboarding por pasos) | 2.1 | `/mensajes/`, `/mensajes/hilo/` | 2.3 |
| `/inicio/` | 2.2 | `/caja/` | 2.5 |
| `/pedidos/` | 2.2 | `/cuenta/` | 2.1 / 2.5 |
| `/pedidos/detalle/` | 2.3 | `/soporte/` | 2.4 |
| `/notificaciones/` | 2.2 | | |

Navegación inferior: Inicio · Trabajos · Agenda · Mensajes · Cuenta (Caja y Soporte se abren desde Cuenta e Inicio).

## Seguridad del frontend

- Sesión: cookie HttpOnly/Secure/SameSite del backend. El `csrfToken` vive en memoria del cliente HTTP.
- Nada de `localStorage`, `sessionStorage`, IndexedDB ni `document.cookie` (lint + `src/security/no-storage.test.ts`).
- `NEXT_PUBLIC_*` es público: solo origen de datos, URL de la API y subcarpeta. Sin claves de DB, tokens ni Mercado Pago.
- Ningún dato ni documento va a un proveedor de IA (HandIA deshabilitado en v1).
- Service worker (lote 3.3): sin cachear respuestas de la API ni documentos; aceptar y pagar exigen servidor.

## Lo que no hace este repo

Migraciones, tablas, verificación de identidad, filtros de elegibilidad, vencimientos y cobros: todo eso es del
backend. El frontend muestra el estado que el servidor devuelve y deshabilita lo que el servidor rechazaría.
