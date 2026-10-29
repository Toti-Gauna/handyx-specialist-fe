# Plan · PWA Especialista de Handyx (Bloque 4)

Estado: **fases 1 y 2 y lote 3.1 cerrados localmente (29/10/2026)**; lotes 3.2–3.3 y fases 4–5 pendientes. Los checks solo se marcan con resultado observable.
Seguimiento de avance, comandos y bloqueos: `docs/handoff.md`.
Cada entrega distingue: decidido · mock · conectado · probado · desplegado.

## 1. Estado real de los repos (auditoría inicial, 29/10/2026)

| Repo | Estado | Aporte |
|---|---|---|
| `handyx-specialist-fe` / `-be` | Vacíos (README, commit inicial) | Desarrollo desde cero |
| `handyx-client-fe` / `-be` | Vacíos | Los contratos compartidos se fijan acá |
| `Handy-landing-page-fe` | Vite 8 + TS sin framework, zod 4 | Fuente visual: `src/brand/tokens.ts`, `src/styles/demo-app.css` (kit `.hd-*`), `demo-especialista.css`, 25 pantallas `e-*` en `src/render/demo/especialista.ts`, lógica pura con tests en `src/demo/` |
| `Handy-landing-page-be` | Express 5 + Prisma 7 + Postgres, esquema `growth` | Referencia de capas, cifrado de PII (AES-256-GCM + HMAC), auditoría, logger con lista blanca |
| `handy-internal-portal` | Vite + TS, `AdminSessionClient` | Futuro consumidor de la revisión de Operations |

Notion verificado en el lote 1.3: TECH-03, TECH-20, PROD-21 (incluye PROD-03/13/18/23/24) y PROD-06/11. Sin página propia encontrada: PROD-15, PROD-26, LEG-39/40.

## 2. Decisiones propuestas (reversibles)

- **FE (decidido por Ignacio):** React + Next.js + TypeScript, PWA para Hostinger. Hostinger sirve estático: Next.js con `output: 'export'` (sin SSR, sin Route Handlers ni middleware de Next; toda la lógica de servidor vive en el BE). Service worker y manifest propios (sin dependencia de runtime Node). Tokens y kit `.hd-*` de la landing portados a componentes; no se clonan pantallas de la demo.
- **BE:** Node 22, TS ESM, Express 5, Prisma 7 sobre Neon; capas `routes → controllers → services → repositories`, Zod. El scaffold del BE se hace en 4.1, después del dueño del esquema (`handyx-client-be`), para no crear un esquema paralelo.
- **Auth de consumidores:** cuenta con Argon2id, cookie HttpOnly/Secure/SameSite=Lax, CSRF, sesiones revocables, roles `usuario`/`especialista`. Sin OTP/SMS. Personal interno: `ADMIN_ACCOUNTS_JSON` vigente.
- **Esquema compartido (decidido por Ignacio):** `handyx-client-be` es el único dueño de migraciones y del esquema; `handyx-specialist-be` consume esa versión y no edita migraciones propias.
- **Datos:** pre-registro (`growth`) y cuentas reales separados; no se migran interesados a cuentas activas.

## 3. Conflictos a resolver

1. **Fee:** la landing muestra 5%/10%; este bloque fija 0% en la demo (10/11–10/12). La landing no se toca sin OK de Ignacio.
2. **"Llegué":** la demo de la landing usa geocerca simulada sin confirmación manual; este bloque pide evento "Llegué". Propuesta: evento explícito, geolocalización opcional.
3. **Cupones, mínimo $ 5.000, "Tu precio":** se traen como mock rotulado; lo no confirmado queda `PENDIENTE`.
4. **TECH-01 (React Native) vs PWA:** excepción documentada.

## 4. Fases y lotes

### Fase 1 · Bases — Opus 5.5 / high
- [x] **1.1 Base ejecutable:** scaffold FE, scripts dev/build/typecheck/lint/test, rutas, layout, adapters `mock`/`http`; inventario de faltantes. Evidencia: `docs/handoff.md` (build mock y http, 35 pruebas OK, Playwright).
- [x] **1.2 Alta, elegibilidad y alcance:** mapa de pantallas/estados alta → revisión → habilitación → disponibilidad → pedido → propuesta → chat/agenda → trabajo → pago directo → caja → soporte. Documento cargado ≠ verificado; antecedentes nunca como upload. Evidencia: `docs/screens.md` + pruebas de `maquinas.ts`.
- [x] **1.3 Contratos:** OpenAPI versionado, schemas/tipos compartidos (fuente única), máquinas de estado, matriz pantalla/API/permiso/QA. Evidencia: `src/contracts/`, `docs/contracts.md`, `docs/api/openapi.yaml`, `docs/matriz.md`.
- Docs: `architecture.md`, `screens.md`, `contracts.md`, `state-machines.md`, `auth-permissions.md`, `matriz.md`, `api/openapi.yaml`, `handoff.md`.

### Fase 2 · Mockup completo — Sonnet 5.5 / high
Fixtures sintéticos rotulados; el mock permite éxito, rechazo, expiración y caída de red.
- [x] **2.1 Registro, perfil y verificación:** acceso, datos base, DNI/CUIT-CUIL/foto/certificación, estados pendiente/corrección/verificación/habilitado/rechazado, cita presencial de antecedentes, modal de fee, baja.
- [x] **2.2 Inicio, disponibilidad y pedidos:** Inicio ≠ Mis trabajos, opt-in urgente "Ahora" revocable, cobertura/rubros, bandeja, notificaciones diferenciadas. Opt-out impide oferta mock.
- [x] **2.3 Propuestas y chat:** detalle, precio/horario/alcance, aceptar/rechazar/contraofertar, vencimiento 5 min, presupuesto en chat, fotos. Chat previo a contratar.
- [x] **2.4 Agenda, servicio y soporte:** calendario con fecha alternativa, historial, llegada/inicio/fin, cancelación, reclamo.
- [x] **2.5 Caja, pago y bordes:** MP directo/efectivo, reportado/verificado/fallido, fee 0%, escenario rotulado post-demo, sin saldo retirable de Handy.
- Evidencia de la fase 2: `docs/qa.md` (escenarios y comprobaciones por lote) y `docs/handoff.md` (comandos y resultados). 11 recorridos E2E + 60 pruebas, todo con datos de prueba.
- Escenarios obligatorios (todos cubiertos, ver `docs/qa.md`): registro incompleto; documento faltante; rubro habilitado/no; verificación pendiente/corrección; antecedentes presenciales pendientes; disponible/revocado; urgente con opt-in apagado; propuesta vencida/rechazada; contrapropuesta; acuerdo; mensaje fallido; doble aceptación; programado/obra; efectivo reportado; MP pendiente/verificado/fallido; reclamo; baja; sesión expirada.

### Fase 3 · Refinación de diseño — Opus 5.5 / high
- [x] **3.1 Sistema visual y jerarquía de acción:** pedido/urgencia/vigencia/monto; enviar, aceptar y rechazar inequívocos; sin dark patterns.
- [ ] **3.2 Responsive y accesibilidad:** 360/390/768/820/desktop, una mano, teclado, labels, foco, contraste, estados no solo por color.
- [ ] **3.3 Motion y QA visual:** microinteracciones, `prefers-reduced-motion`, manifest/íconos/offline visual, capturas sanitizadas, catálogo de componentes. Sellos de habilitación solo con verificación del backend.
- Evidencia del 3.1: `docs/diseno.md` y `e2e/capturas.cjs` (28 capturas a 390×844).

### Fase 4 · Backend y DB conectados — Opus 5.5 / high
- [ ] **4.1 Modelo y migraciones:** ERD y diccionario (tipo, nulabilidad, sensibilidad, FK, índice, retención, dueño); importes en centavos ≥ 0; un acuerdo activo por pedido; login e idempotency keys únicos; sin cascadas que rompan retenciones.
- [ ] **4.2 Alta, verificación y privacidad:** cuentas/roles/sesiones; DNI y CUIT/CUIL cifrados; fotos/documentos privados con URL firmada; verificación solo por Operations; rechazo de `verified=true` del cliente y de uploads de antecedentes; retención parametrizada (DNI 90 días, ubicación 30 días, evento inicial a confirmar); baja real con estado honesto.
- [ ] **4.3 Pedidos elegibles y negociación:** filtro en servidor, opt-out urgente, propuestas bidireccionales con autor/rol, aceptación transaccional con versión e idempotencia; vencimientos en servidor (5 min propuesta ≠ 20 min búsqueda).
- [ ] **4.4 Chat, agenda, trabajo y soporte:** hilo desde el pedido, media privada, eventos + outbox con reintento acotado, push nunca requisito, reclamos auditables.
- [ ] **4.5 Caja, Mercado Pago y ledger:** `payment_records`, `fee_policies`, `fee_acceptances`; fee 0% en demo; reportado ≠ verificado; dinero del especialista no es ingreso de Handy; MP como adapter con pruebas sandbox y parte productiva inactiva hasta validar la ruta; comisiones inactivas hasta política aprobada.
- [ ] **4.6 Integración y QA transversal:** adapter HTTP, contract tests, E2E, IDOR, opt-out, errores de red; sin fallback a fixtures en producción; analytics sin PII.

### Fase 5 · Deploy — Sonnet 5.5 / high
- [ ] **5.1 CI, staging y readiness:** lint/tipos/build/unit/integración/E2E, contract tests, base aislada con datos sintéticos, HTTPS/CORS/cookies, service worker sin cachear datos privados ni aceptar/pagar offline.
- [ ] **5.2 Dos celulares:** ruta completa del alta al reclamo; casos de red, urgencia y permisos; rendimiento gama baja (ref. Moto E20) declarando qué fue emulado y qué en dispositivo.
- [ ] **5.3 Deploy web y rollback:** Hostinger/Render/Neon existentes, backup, `migrate deploy`, smoke, guía de rollback; si falta acceso, pasos manuales marcados pendientes.
- [ ] **5.4 Mapa final y Handy Docs:** PROD-26 con capturas sanitizadas, ERD, OpenAPI, setup, `env.example`, guía de alta/operación/pagos, QA ejecutado, deploy/rollback, handoff.

## 5. Dependencias y límites

- **Legal:** avisos provisionales; la landing-be responde 503 en producción salvo `PRIVACY_NOTICE_PROVISIONAL_OK=true`. Recolectar DNI, CUIT/CUIL, nacimiento y género en producción requiere aviso aprobado (LEG-39/40).
- **Mercado Pago:** ruta no confirmada (checkout del especialista, enlace o referencia manual). Hasta entonces: sandbox y efectivo/manual.
- **Modelo:** se informa el modelo real de cada sesión; Opus 5.5 recomendado en fases 1, 3 y 4 se elige en la interfaz.
- **Hardware:** pruebas en celulares y Moto E20 serán emuladas salvo dispositivo real disponible.
- **Producción:** nada se despliega con secretos o permisos faltantes; sin servicios nuevos ni compras.

## 6. Decisiones de Ignacio (29/10/2026)

1. Dueño de migraciones: **`handyx-client-be`**.
2. Stack FE: **React + Next.js + TypeScript** (exportación estática para Hostinger).
3. **Fee 0% hasta el 10/12/2026**, avisado en tres lugares:
   - modal de primer ingreso (inicio);
   - contador en Cuenta (días hasta el 10/12, zona America/Argentina/Buenos_Aires);
   - pantalla posterior al registro, indicando que dura hasta el 10/12.
   Se muestra como fee 0% de Handy, no como descuento sobre el precio del especialista. No implica tarifa posterior: esa requiere política versionada y aceptación aprobadas. La landing no se modifica.
4. "Llegué": evento explícito del especialista (geolocalización opcional). Confirmado junto con el punto 3.
