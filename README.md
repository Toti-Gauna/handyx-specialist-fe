# handyx-specialist-fe

PWA de especialistas de **Handyx** (handyc.com · Mar del Plata): alta y verificación, disponibilidad, pedidos,
propuestas, chat, agenda, trabajos, caja de pagos directos y soporte. Comparte identidad, contratos y estados con la
app Usuario y el portal interno.

Estado: **fase 1 (bases)** del Bloque 4. Ver `docs/plan.md` y `docs/handoff.md`.

## Uso

```sh
npm ci
npm run dev              # http://localhost:3000 con datos de prueba (banner amarillo)
npm run lint | typecheck | test
npm run build            # exportación estática a out/ (vista previa, mock)
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
| `docs/api/openapi.yaml` | Borrador de api-especialista v0.1.0 |
