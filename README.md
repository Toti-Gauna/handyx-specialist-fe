# handyx-specialist-fe

PWA de especialistas de **Handyx** (handyc.com · Mar del Plata): alta y verificación, disponibilidad, pedidos,
propuestas, chat, agenda, trabajos, caja de pagos directos y soporte. Comparte identidad, contratos y estados con la
app Usuario y el portal interno.

Estado: **fases 1–3 (mockup navegable con datos de prueba, sistema visual, accesibilidad y PWA)** del Bloque 4: sin backend conectado ni desplegado. Ver `docs/plan.md` y `docs/handoff.md`.

## Uso

```sh
npm ci
npm run dev              # http://localhost:3000 con datos de prueba (banner amarillo + Panel de prueba)
npm run lint | typecheck | test
npm run build            # exportación estática a out/ (vista previa, mock) + out/sw.js
npm run e2e              # recorridos de punta a punta (después de npm run build)
npm run accesibilidad    # axe WCAG 2.2 AA, áreas táctiles, teclado, foco y zoom
npm run capturas         # capturas sanitizadas por pantalla (carpeta capturas/, ignorada por git)
npm run capturas:docs    # regenera el catálogo de docs/capturas/ (ImageMagick)
NEXT_PUBLIC_DATA_SOURCE=http NEXT_PUBLIC_API_BASE_URL=https://… npm run build:hostinger   # producción
```

Variables: `.env.example`. Todas son públicas (`NEXT_PUBLIC_*`): nunca secretos.

## Documentación

| Documento | Contenido |
|---|---|
| `docs/plan.md` | Fases, lotes y decisiones |
| `docs/handoff.md` | Estado, comandos ejecutados, bloqueos y próximo paso |
| `docs/architecture.md` | Stack, estructura, mock/HTTP, rutas, seguridad del frontend |
| `docs/screens.md` | Mapa de pantallas, estados y requisitos |
| `docs/contracts.md` | Dueños del esquema y del contrato, escrituras por entidad, versionado |
| `docs/state-machines.md` | Máquinas de estado con actor |
| `docs/auth-permissions.md` | Sesión, CSRF y matriz de permisos |
| `docs/matriz.md` | Pantalla · API · permiso · QA |
| `docs/diseno.md` | Sistema visual, tipo vs estado, jerarquía de acción, urgencia sin dark patterns, accesibilidad, movimiento y Handys |
| `docs/componentes.md` | Catálogo de componentes |
| `docs/capturas/` | Capturas sanitizadas por pantalla (celular y escritorio) |
| `docs/pwa.md` | Manifest, service worker (qué guarda y qué nunca) y sin conexión |
| `docs/qa.md` | Escenarios de prueba, cómo reproducirlos y qué NO demuestra la fase 2 |
| `docs/api/openapi.yaml` | Borrador de api-especialista v0.2.0 |
