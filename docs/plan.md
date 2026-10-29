# Plan · PWA Especialista de Handyx (Bloque 4) · 6 fases

Estado: **fases 1, 2 y 3 cerradas localmente (29/10/2026)**. La fase 4 es el rediseño premium (`docs/rediseno.md`); siguen el backend (5) y el deploy (6). Los checks solo se marcan con resultado observable.
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
- **Auth de consumidores:**
  - Email y contraseña con Argon2id, con código de 6 dígitos al email para verificar.
  - Google (en todos los dispositivos) y Apple (solo en dispositivos Apple), con OpenID Connect validado en el servidor.
  - Cookie HttpOnly/Secure/SameSite=Lax, CSRF, sesiones revocables y roles `usuario`/`especialista`.
  - Sin SMS.
  - Personal interno: `ADMIN_ACCOUNTS_JSON` vigente.
- **Esquema compartido (decidido por Ignacio):** `handyx-client-be` es el único dueño de migraciones y del esquema; `handyx-specialist-be` consume esa versión y no edita migraciones propias.
- **Datos:** pre-registro (`growth`) y cuentas reales separados; no se migran interesados a cuentas activas.

## 3. Conflictos a resolver

1. **Fee:** la landing muestra 5%/10%; este bloque fija 0% en la demo (10/11–10/12). La landing no se toca sin OK de Ignacio.
2. **Llegada (resuelto el 29/10/2026):** automática por geocerca con la app abierta, con un botón de respaldo cuando la ubicación
   anda mal. Sigue pendiente el chequeo con LEG-46.
3. **Cupones y camada fundadora:** no se muestran mientras el fee sea 0 %. "Tu precio" lleva la sugerencia de Handyx. El mínimo de
   $ 5.000 queda `PENDIENTE`.
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
- [x] **3.2 Responsive y accesibilidad:** 360/390/768/820/desktop, una mano, teclado, labels, foco, contraste, estados no solo por color.
- [x] **3.3 Motion y QA visual:** microinteracciones, `prefers-reduced-motion`, manifest/íconos/offline visual, capturas sanitizadas, catálogo de componentes. Sellos de habilitación solo con verificación del backend.
- Evidencia del 3.1: `docs/diseno.md` y `e2e/capturas.cjs` (28 capturas a 390×844).
- Evidencia del 3.2: `npm run accesibilidad` (axe WCAG 2.2 AA en 0, teclado, foco, zoom 200 %) y 196 capturas en 7 tamaños; checklist en `docs/diseno.md`.
- Evidencia del 3.3: `docs/pwa.md`, `docs/componentes.md`, `docs/capturas/` (sanitizadas), recorrido J de `npm run e2e` y control de movimiento en `npm run accesibilidad`.

### Fase 4 · Rediseño premium Handyx — Opus 5.5 / high (salvo indicación)
Pedido de Ignacio del 29/10/2026. El diseño de la fase 3 no está a la altura de la demo de la landing: faltan pantallas, el mapa y
la entrada de una app on demand, y la cabecera ocupa lugar. Detalle de cada lote, inventario de pantallas y mapa de pantallas en
`docs/rediseno.md`. Se rehace la capa visual y se conservan los datos, el mock, los contratos y las pruebas.
- [x] **4.1 Marca Handyx y sistema visual v2** (evidencia: `/catalogo/` en el mock, recorrido K, `docs/diseno.md` → "Kit Handyx v2" y `docs/componentes.md`):
  - Todos los textos pasan de "Handy" a "Handyx" ("Tarifa de Handyx", "Handyx sugiere", "Verificado por Handyx"). Los personajes siguen siendo "los Handys".
  - Tokens v2.
  - Kit `.hd-*` de la demo portado a React: barra compacta, pestañas flotantes, hoja arrastrable, isla, stepper de precio, confeti y monto que sube.
  - Catálogo solo en el mock.
- [x] **4.2 Arranque y cuenta** (evidencia: recorridos A y L1–L6, `docs/screens.md` → A0–A3, contrato 0.3.0):
  - Carga animada: colores que cambian, los Handys saltan y terminan de la mano bajo el logo.
  - Bienvenida en 3 láminas.
  - Entrar con email, con Google (Android, iPhone y computadora) o con Apple (solo en iPhone, iPad y Mac).
  - Crear cuenta con **código de 6 dígitos al email**.
  - Recuperar con contraseña nueva y enlace vencido.
  - Sesión expirada.
- [ ] **4.3 Mapa, ubicación en tiempo real y trayectos** (Opus / xhigh). Hecho localmente, menos el mapa base. Falta bajar los datos
  de OpenStreetMap: el entorno bloquea Overpass y Ignacio lo habilita (`docs/mapa.md`).
  - MapLibre con teselas propias de Mar del Plata y Batán y estilo Handyx.
  - Zonas aproximadas.
  - Posición del especialista en vivo durante el viaje, simulada en el mock.
  - Trayecto dibujado hasta la casa del cliente, con tiempo estimado.
  - Carga diferida y respaldo sin mapa.
- [x] **4.4 Alta guiada** (evidencia: recorridos A y H, `docs/screens.md` → B0–B8, contrato 0.5.0):
  - Lista de pasos con progreso.
  - DNI y selfie con marco de cámara.
  - Rubros en mosaico.
  - Zonas en el mapa.
  - Turno presencial de antecedentes.
  - Corrección con acceso directo a cada paso.
  - Celebración al quedar habilitado.
- [x] **4.5 Inicio, pedidos y propuesta** (evidencia: recorridos B y N, `docs/screens.md` → C1, C3, C4, D1 y D1b, contrato 0.6.0):
  - Inicio sobre el mapa con "Disponible".
  - Pedido entrante.
  - Precio con **"Handyx sugiere · Vos decidís"** (sugerencia por rubro y tipo, siempre editable).
  - Esperando al cliente.
  - "¡El cliente te eligió!" con aviso.
  - Bandeja con filtros y avisos agrupados.
- [x] **4.6 Trabajo de punta a punta** (evidencia: recorridos C, D, M2 y O, `docs/screens.md` → E2 a E2f, contrato 0.7.0):
  - Salgo para allá.
  - En camino, con trayecto y ubicación en vivo.
  - **Llegada automática con la app abierta y botón de respaldo cuando la ubicación falla** (sin permiso, imprecisa o sin señal).
  - En curso, con **adicionales** (repuestos y mano de obra que el cliente acepta).
  - ¡Terminaste! e informar el cobro.
  - Cambiar la fecha y cancelar.
- [ ] **4.7 Obras de varios días:**
  - Plan de obra por jornadas y etapas, en el calendario y en una línea de tiempo.
  - Avance diario con fotos y notas.
  - Adicionales por etapa.
  - Cobro por etapa.
  - Cambios de fecha de una jornada sin tocar el resto.
  - Resumen de la obra completa.
- [ ] **4.8 Agenda, mensajes, cuenta, caja y ayuda** (Sonnet 5.5 / high):
  - Agenda mensual con jornadas de obra.
  - Chat con respuestas rápidas y propuestas en el hilo.
  - Contactos.
  - Cuenta, cobros y notificaciones.
  - Caja con filtros.
  - Centro de ayuda.
- [ ] **4.9 QA premium y sí de diseño:**
  - E2E nuevos (más de 15 recorridos) y axe en 0 en 4 tamaños.
  - Lectores de pantalla y "reducir movimiento".
  - Lighthouse móvil ≥ 90.
  - Página de flujos con capturas.
  - Revisión de Ignacio.

### Fase 5 · Backend y DB conectados — Opus 5.5 / high (salvo indicación)
Se trabaja en `handyx-client-be` (dueño del esquema y de las migraciones) y `handyx-specialist-be`. Empieza con el sí de diseño del 4.9.
- [ ] **5.1 Modelo y migraciones:**
  - ERD y diccionario de datos: tipo, nulabilidad, sensibilidad, claves foráneas, índices, retención y dueño.
  - Importes en centavos ≥ 0.
  - Un acuerdo activo por pedido.
  - Login y claves de idempotencia únicos.
  - Sin cascadas que rompan las retenciones.
  - Suma: obras por jornadas y etapas, adicionales, posiciones del viaje y tabla de precios sugeridos.
- [ ] **5.2 Cuentas, sesiones y acceso** (Opus / xhigh):
  - Email y contraseña con Argon2id.
  - **Código de 6 dígitos por email**, con vencimiento, intentos limitados y reenvío con espera.
  - **Google y Apple** con OpenID Connect, validando el token en el servidor y vinculando cuentas por email verificado.
  - Recuperación con token de un solo uso.
  - Cookie HttpOnly, CSRF y sesiones revocables.
- [ ] **5.3 Alta, verificación y privacidad:**
  - DNI y CUIT/CUIL cifrados.
  - Fotos y documentos privados con URL firmada.
  - Verificación solo por Operations.
  - Rechazo de `verified=true` enviado por el cliente y de archivos de antecedentes.
  - Turnos presenciales.
  - Retenciones parametrizadas: DNI 90 días y ubicación 30 días.
  - Baja real.
- [ ] **5.4 Pedidos, negociación y precio sugerido:**
  - Filtro en el servidor y opt-out de urgentes.
  - Zona aproximada calculada por el servidor.
  - Propuestas bidireccionales.
  - Aceptación transaccional con versión e idempotencia.
  - Vencimientos en el servidor.
  - Precios sugeridos versionados.
- [ ] **5.5 Ubicación en tiempo real y trayectos** (Opus / xhigh):
  - Posiciones del viaje por una conexión en vivo (SSE), solo durante el viaje y solo para las dos partes.
  - Geocerca de llegada en el servidor y respaldo manual auditado.
  - Motor de trayectos (§5) y geocodificación de direcciones.
  - Retención de 30 días.
- [ ] **5.6 Trabajo, obras, chat, agenda y soporte:**
  - Eventos del trabajo, obras por jornada y adicionales con aceptación.
  - Chat con archivos privados.
  - Outbox con reintento acotado.
  - Push opcional, nunca requisito.
  - Reclamos auditables.
- [ ] **5.7 Caja, Mercado Pago y ledger:**
  - `payment_records`, `fee_policies` y `fee_acceptances`, con fee 0 % en la demo.
  - Reportado ≠ verificado.
  - Mercado Pago como adaptador, primero en sandbox.
  - Comisiones inactivas hasta que haya una política aprobada.
- [ ] **5.8 Integración y QA transversal:**
  - Adaptador HTTP y pruebas de contrato.
  - E2E contra el backend.
  - Pruebas de IDOR y opt-out.
  - Errores de red.
  - Nunca caer a fixtures.
  - Analytics sin PII.

### Fase 6 · Deploy — Sonnet 5.5 / high
- [ ] **6.1 CI, staging y readiness:**
  - Lint, tipos, build, unitarias, integración, E2E y pruebas de contrato en el CI.
  - Base aislada con datos sintéticos.
  - HTTPS, CORS y cookies.
  - El service worker no guarda datos privados ni deja aceptar o pagar sin conexión.
  - Teselas del mapa y `sw.js` con su caché correcta.
- [ ] **6.2 Dos celulares (Android e iPhone):**
  - Recorrido completo, del alta al reclamo.
  - Ubicación en vivo, llegada y respaldo.
  - Entrar con Google y con Apple.
  - Red, permisos y rendimiento en gama baja (referencia: Moto E20), declarando qué fue emulado y qué en un teléfono real.
- [ ] **6.3 Deploy web y rollback:**
  - Hostinger, Render y Neon.
  - Backup y `migrate deploy`.
  - Smoke y guía de rollback.
  - Lo que no tenga acceso queda como paso manual pendiente.
- [ ] **6.4 Mapa final y Handyx Docs:**
  - PROD-26 con capturas sanitizadas.
  - ERD, OpenAPI, setup y `env.example`.
  - Guías de alta, operación y pagos.
  - QA ejecutado, deploy y rollback, y handoff.

## 5. Dependencias y límites

- **Legal:** avisos provisionales; la landing-be responde 503 en producción salvo `PRIVACY_NOTICE_PROVISIONAL_OK=true`. Recolectar DNI, CUIT/CUIL, nacimiento y género en producción requiere aviso aprobado (LEG-39/40).
- **Mercado Pago:** ruta no confirmada (checkout del especialista, enlace o referencia manual). Hasta entonces: sandbox y efectivo/manual.
- **Modelo:** se informa el modelo real de cada sesión. El modelo recomendado (Opus 5.5 en las fases 1, 3, 4 y 5) se elige en la interfaz.
- **Hardware:** pruebas en celulares y Moto E20 serán emuladas salvo dispositivo real disponible.
- **Producción:** nada se despliega con secretos o permisos faltantes; sin servicios nuevos ni compras.
- **Cuentas y costos que necesitan la autorización de Ignacio** (no se crea ni se compra nada sin su OK):
  - Apple Developer Program (≈ USD 99 al año), para entrar con Apple.
  - Proyecto de Google Cloud para entrar con Google (gratis).
  - Proveedor de emails transaccionales para los códigos (plan gratis con cuenta).
  - Motor de trayectos: servidor propio con datos de OpenStreetMap (una instancia paga chica en Render) o un servicio con plan gratis y cuenta.
  - Las teselas del mapa se sirven desde Hostinger, sin costo extra.

## 6. Decisiones de Ignacio (29/10/2026)

1. Dueño de migraciones: **`handyx-client-be`**.
2. Stack FE: **React + Next.js + TypeScript** (exportación estática para Hostinger).
3. **Fee 0% hasta el 10/12/2026**, avisado en tres lugares:
   - modal de primer ingreso (inicio);
   - contador en Cuenta (días hasta el 10/12, zona America/Argentina/Buenos_Aires);
   - pantalla posterior al registro, indicando que dura hasta el 10/12.
   Se muestra como fee 0% de Handy, no como descuento sobre el precio del especialista. No implica tarifa posterior: esa requiere política versionada y aceptación aprobadas. La landing no se modifica.
4. ~~"Llegué": evento explícito del especialista (geolocalización opcional).~~ Reemplazada por la decisión 5.

### Decisiones del 29/10/2026 (rediseño)

5. **Llegada**: automática con la app abierta, con botón de respaldo si la ubicación anda mal.
6. **Mapa completo de Mar del Plata**:
   - El cliente ve al especialista en vivo durante el viaje.
   - Handyx dibuja el trayecto del especialista hasta la casa del cliente.
7. **Verificación del email** con un código de 6 dígitos.
8. **Entrar con Google y con Apple**: Apple solo se ofrece en dispositivos Apple.
9. **Adicionales** durante el trabajo, y una vista ampliada de las **obras de varios días**.
10. **Precio sugerido por Handyx**, y todos los textos de la marca pasan a **"Handyx"**.
11. **Cupones y camada fundadora** fuera de la app mientras el fee sea 0 %.
12. **Pantalla de carga**: los Handys terminan **todos de la mano** con el logo.
13. **Imágenes nuevas de los Handys** en distintas poses, sobre fondo verde (`docs/handys-prompt.md`).
14. El rediseño es la **fase 4**: el backend pasa a la fase 5 y el deploy a la 6.
