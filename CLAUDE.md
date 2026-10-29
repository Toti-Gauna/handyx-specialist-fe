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

## Lenguaje y marca

Español rioplatense con voseo; montos `$ 45.000`; "verificados" sí, "matriculados"/"despachamos" no; sin "inmediato"
ni "al instante". Tokens de `src/brand/tokens.ts` = copia byte a byte de la landing
(`HANDY_LANDING_TOKENS=<ruta> npm test` lo verifica). Lenguaje visual de la demo de la landing (`demo-app.css`):
mosaicos grises, botones con base que se hunde, Archivo 900 ensanchado + DM Sans, sin gradientes ni vidrio.

## Comandos

```sh
npm ci
npm run dev | build | build:hostinger | lint | typecheck | test
```

Antes de cada PR: `lint`, `typecheck`, `test`, `build` y `build:hostinger` con una API ficticia (lo corre el CI).
Mantener `docs/` (TECH-12) junto al código.
