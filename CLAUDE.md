# Handyx · PWA Especialista (handyx-specialist-fe)

Retomar siempre desde `docs/handoff.md`. Plan de 5 fases (no inventar más): `docs/plan.md`.

## Stack

React 19 + Next.js 16 (App Router) + TypeScript `strict`, exportación estática (`output: 'export'`) para Hostinger.
**Sin servidor en el frontend**: nada de SSR, Route Handlers, Server Actions ni middleware de Next. Tests con
`node --test` (TypeScript nativo de Node 22). Imports relativos con extensión `.ts`/`.tsx`; sintaxis TS borrable
(`erasableSyntaxOnly`: sin enums ni parameter properties).

## Reglas que no se negocian

- **Contrato compartido** en `src/contracts/` (dueño: `handyx-client-be`, que también es el único dueño del esquema y
  de las migraciones). No se edita por cuenta propia: cambios de contrato se versionan (`version.ts`) y se reflejan en
  `docs/api/openapi.yaml` (la prueba `openapi.test.ts` compara los enums).
- **Datos**: las pantallas usan `api` de `@handyx/origen-datos`. Mock solo con banner "Datos de prueba". Producción
  (`build:hostinger`) exige `http` y verifica que el bundle no tenga fixtures. **Nunca** caer a fixtures ante un error.
- **Nada en el navegador**: ni `localStorage`, `sessionStorage`, IndexedDB ni `document.cookie`. Sesión = cookie
  HttpOnly del backend; CSRF solo en memoria.
- `NEXT_PUBLIC_*` es público: sin secretos, claves de DB ni de Mercado Pago.
- **Verificación**: documento cargado ≠ verificado; solo Operations verifica. Antecedentes **nunca** como archivo.
  Sellos de habilitación solo con estado del servidor.
- **Plata**: centavos enteros + moneda (`contracts/dinero.ts`). Fee de Handy 0 % del 10/11 al 10/12/2026 (modal de
  primer ingreso, post-registro y contador en Cuenta); no es descuento sobre el precio del especialista; al terminar
  no se infiere ninguna tarifa. El pago del servicio va directo al especialista (MP o efectivo): reportado ≠
  verificado, sin saldo "de Handy".
- **Oferta**: el especialista no está obligado a aceptar ni recibe asignaciones; urgentes solo con opt-in revocable.
  Inicio sin tasas de aceptación, tiempos de respuesta ni puntualidad. Avisos abren el detalle, nunca aceptan.
- Datos de prueba sintéticos (`*@example.test`, "Especialista De Prueba", ids `00000000-…`). Nada de datos reales en
  fixtures, logs, capturas ni a proveedores de IA.

## Convenciones del código (fase 2)

- Una pantalla de negocio = un archivo en `src/pantallas/`; `src/app/**/page.tsx` solo la monta (con `Suspense`). Los ids van en `?id=`.
- Datos: `useCarga` (consulta; un error conserva lo ya cargado y ofrece reintentar, nunca cae a fixtures) y `useAccion` (mutación:
  estado de envío, error y **Idempotency-Key estable al reintentar**). Un 401 abre el aviso de sesión expirada.
- **El refresco de datos va dentro de la acción**, antes de liberar el control: así un segundo envío no usa una versión vieja (409).
- Aceptar/rechazar/terminar/cancelar piden confirmación en una `Hoja` con el resumen. Avisos y bandeja nunca aceptan nada.
- Estados con ícono **y** texto (`lib/etiquetas.ts`); el color es solo apoyo. Importes siempre con `lib/formato.ts` (centavos enteros).
- El mock emula al servidor en `src/data/mock/*` (un archivo por dominio) y se controla desde el **Panel de prueba** del banner
  amarillo (escenarios `?escenario=`, fallas, reloj, Operations, usuario, pagos). Una regla nueva en la UI va con su prueba en `mock.test.ts`.
- Todo endpoint nuevo entra a la vez en `data/api.ts`, el mock, `data/http/adaptador.ts` y `docs/api/openapi.yaml`.
- Recorridos de punta a punta: `npm run build && node e2e/flujos.cjs` (Playwright; `SOLO=C` corre uno; `CAPTURAS=/ruta` guarda capturas).

## Lenguaje y marca

Español rioplatense con voseo; montos `$ 45.000`; "verificados" sí, "matriculados"/"despachamos" no; sin "inmediato"
ni "al instante". Tokens de `src/brand/tokens.ts` = copia byte a byte de la landing
(`HANDY_LANDING_TOKENS=<ruta> npm test` lo verifica). Lenguaje visual de la demo de la landing (`demo-app.css`):
mosaicos grises, botones con base que se hunde, Archivo 900 ensanchado + DM Sans, sin gradientes ni vidrio.
Reglas de forma (tokens `--hd-*`, `ChipTipo` vs chips de estado, una acción primaria, aceptar verde / rechazar en contorno
rojo, urgencia en texto neutro, sin estilos inline, movimiento solo con `no-preference`, Handys decorativos): `docs/diseno.md`;
catálogo en `docs/componentes.md`. Capturas sanitizadas: `npm run capturas` (catálogo: `npm run capturas:docs`).

**Service worker** (`docs/pwa.md`): `out/sw.js` lo genera `scripts/generar-sw.mjs` con la política de `src/pwa/politica.ts`. Solo
archivos estáticos públicos; nunca la API, mutaciones ni otros sitios, y sin cola offline. Cambiar la política exige su prueba.

## Comandos

```sh
npm ci
npm run dev | build | build:hostinger | lint | typecheck | test
npm run e2e | accesibilidad | capturas | capturas:docs   # después de npm run build (Playwright)
```

Antes de cada PR: `lint`, `typecheck`, `test`, `build`, `npm run e2e`, `npm run accesibilidad` y `build:hostinger` con una API
ficticia (el CI corre todo menos el E2E y la accesibilidad hasta el lote 5.1). Accesibilidad mínima: WCAG 2.2 AA con axe en 0,
áreas táctiles ≥ 44 px, foco visible, foco al primer error y texto al 200 % sin desborde (`docs/diseno.md`).
Mantener `docs/` (TECH-12) junto al código.
