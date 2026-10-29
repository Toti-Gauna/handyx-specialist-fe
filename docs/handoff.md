# Handoff · PWA Especialista de Handyx

Fecha: 29/10/2026 · Rama: `claude/pensive-hypatia-jajjgm` (PR #1 mergeado con fases 1–2 y 3.1; 3.2 y 3.3 sin PR) · Bloque 4 · **Fase 3 cerrada localmente.**
Modelos: fases 1 y 3 con `claude-opus-5-5`; fase 2 con `claude-sonnet-5-5` (según el plan).

Estado: mockup navegable completo con datos de prueba, sistema visual, accesibilidad WCAG 2.2 AA automática y PWA instalable.
**Nada conectado ni desplegado.**

## Fase 3 · Lote 3.3 (movimiento, PWA y QA visual)

- **Movimiento breve** (`docs/diseno.md` → "Movimiento"): avisos, errores, vacíos y listas aparecen; las hojas suben y el Handy roto
  tambalea una vez. Todo dura 0,6 s o menos, dentro de `prefers-reduced-motion: no-preference`. `npm run accesibilidad` comprueba
  que con "reducir movimiento" no corra ninguna animación.
- **Los Handys** (`public/handys/`, copia de la landing; componente `Handy`, siempre decorativo):
  - Acceso: el grupo.
  - Errores (`ErrorCaja`): un Handy roto según la falla, como en la demo de la landing.
  - Franja "Sin conexión": la lamparita rota.
  - Pantalla `/sin-conexion/`: el caño roto.
  - 404: la llave rota.
- **PWA** (`docs/pwa.md`):
  - Manifest con `id` e íconos `any`/`maskable` separados.
  - `out/sw.js` generado en cada build desde `src/pwa/politica.ts` (con pruebas). Solo guarda archivos estáticos públicos; nunca la API,
    mutaciones ni otros sitios, y no tiene cola offline.
  - Sin red: copia de la pantalla (los datos fallan con el Handy roto y "Reintentar") o `/sin-conexion/`.
  - Franja "Sin conexión" en el marco.
- **QA visual**:
  - `e2e/capturas.cjs` ahora rechaza capturas con datos no sintéticos (emails, DNI/CUIT, teléfonos) o sin el banner de prueba.
  - Catálogo en `docs/capturas/`: 32 pantallas a 390×844 y 6 a 1280×800, en webp, con `npm run capturas:docs`.
  - Catálogo de componentes en `docs/componentes.md`.
- Nuevas pantallas en la auditoría y las capturas: error de red, error del servidor, sin conexión y 404. `?falla=red|servidor`
  arranca el mock con esa falla.
- El servidor de pruebas devuelve `404.html` con estado 404, como tiene que hacerlo el hosting.
- **Sellos de habilitación**: "Verificado por Handy" solo con `verificado` del servidor (sin cambios: se revisó).

### Comandos del lote 3.3 (29/10/2026, local)

| Comando | Resultado |
|---|---|
| `npm run lint` · `typecheck` | OK |
| `npm test` | 66 pruebas: 64 OK, 2 omitidas (sincronías con otros repos); +5 de la política del service worker |
| `npm run build` | OK, 23 páginas + `out/sw.js` (9 archivos precargados) |
| `npm run e2e` | 12/12 recorridos, incluido J (sin conexión: franja, `/sin-conexion/`, copia de pantalla y caché solo con archivos permitidos) |
| `npm run accesibilidad` (390×844, `ANCHO=320x568`, `ANCHO=1280x800`) | 0 violaciones axe en 32 pantallas y 6 diálogos; 0 áreas < 24 px; 0 problemas de teclado, foco, zoom y movimiento |
| `ANCHOS=` 7 tamaños `npm run capturas` | 224/224 sin desborde y sanitizadas |
| `build:hostinger` con API ficticia | OK, sin fixtures ni banner; `sw.js` no menciona la API |

**Límites**:
- La instalación real (Android/iOS), el modo avión en un teléfono y los lectores de pantalla quedan para el lote 5.2.
- iOS no muestra aviso de instalación: hay que usar "Agregar a inicio".
- Para el deploy: servir `sw.js` con `Cache-Control: no-cache` y configurar `404.html` en el hosting (`docs/pwa.md`).

**Próximo paso**: fase 4 (backend y DB conectados), bloqueada hasta que exista `handyx-client-be` (dueño del esquema y de las
migraciones). Empieza por el lote 4.1 (modelo y migraciones) en ese repo.


## Fase 3 · Lote 3.2 (responsive y accesibilidad)

- **Tamaños**: celular (320–767 px), tablet (768–1099: columna ancha, listas en dos columnas, hojas centradas) y escritorio (≥ 1100: riel
  de navegación lateral). 196/196 capturas en 7 tamaños, sin desborde horizontal.
- **Auditoría automática** `npm run accesibilidad` (axe-core 4.14.0, WCAG 2.2 A/AA): 0 violaciones en 28 pantallas y 6 diálogos, en 320, 390 y
  1280 px. Además verifica áreas táctiles, foco visible, foco atrapado en las hojas, foco al primer error y texto al 200 % sin desborde.
- **Corregido**:
  - Nombre accesible del logo y de los días del calendario.
  - Enlaces sueltos de 23 px.
  - Tab que salía de las hojas (ahora el foco circula dentro).
  - Desborde a 360 px por la fila Contraofertar/Rechazar, y a 320 px por las pestañas.
  - Compositor del chat que tapaba botones en pantallas bajas.
  - Botón "Cerrar" de las hojas que se angostaba a 39 px en 320 px.
  - "Hoy" marcado solo con color.
  - Historial sin distinción hecho/pendiente.
  - Palabras largas que desbordaban con texto agrandado.
  - Manifest que forzaba la orientación vertical.
- **Nuevo**: título propio por pantalla (WCAG 2.4.2). El foco va al primer campo con error en registro, alta, propuestas, cambios y soporte.
- Checklist completo en `docs/diseno.md` → "Responsive y accesibilidad".

### Comandos del lote 3.2 (29/10/2026, local)

| Comando | Resultado |
|---|---|
| `npm run lint` · `typecheck` · `npm test` | OK · 59/61 (2 omitidas) |
| `npm run build` | OK, 22 páginas |
| `npm run e2e` | 11/11 recorridos |
| `npm run accesibilidad` (390×844) y con `ANCHO=320x568` / `ANCHO=1280x800` | 0 violaciones axe, 0 áreas < 24 px, 0 problemas de teclado/foco/zoom |
| (a 320×568) | 30 días del calendario de 38×46 px: por encima de 24 px (WCAG 2.5.8), documentado |
| `build:hostinger` con API ficticia | OK, sin fixtures ni banner en `out/` |
| `ANCHOS=320x568,…,1280x800 npm run capturas` | 196/196 sin desborde |

**Límite**: sin lectores de pantalla reales ni dispositivos físicos (lote 5.2).


## Fase 3 · Lote 3.1 (sistema visual y jerarquía de acción)

- `globals.css` reescrito sobre la capa de tokens `--hd-*` de la demo de la landing: tarjetas blancas con sombra suave, chips en tinte,
  montos con cifras tabulares, escala de espacios y tipografía únicas, texto legible sobre fondos oscuros, sin estilos inline.
- **Tipo vs estado**: `ChipTipo` (urgente oscuro, programado y obra neutros) separado de los chips de estado; ningún estado usa `noche`.
- **Jerarquía**: tarjeta de pedido tipo → rubro → zona y fecha → descripción → búsqueda; propuesta con rótulo, monto, horario,
  alcance y vencimiento; una acción primaria por pantalla; en el alta "Atrás/Siguiente" pasan a secundarios.
- **Decisiones**: con una propuesta del usuario vigente se esconde "Enviar una propuesta" (queda contraofertar); aceptar verde,
  rechazar en contorno rojo, siempre con confirmación.
- **Urgencia sin presión**: tiempos en texto neutro ("La búsqueda cierra en…", "Vence en…", "hasta las 21:00"); vencer se muestra en gris.
  La tarifa de Handy aparece una vez por pantalla, no en cada tarjeta.
- **Corregido**: "Operations verifica tus documentos" figuraba hecho con documentos en revisión; plurales ("1 propuesta espera"); texto
  ilegible en el contador del fee; progreso del alta que se cortaba (ahora "Paso N de 6 · …" con barra segmentada).
- Nuevo `e2e/capturas.cjs`: 28 capturas por pantalla y escenario, con control de desborde horizontal (`ANCHOS=` para otros tamaños).
- Documento: `docs/diseno.md` (tokens, tipo vs estado, jerarquía de acción, urgencia sin dark patterns, claims).

### Comandos del lote 3.1 (29/10/2026, local)

| Comando | Resultado |
|---|---|
| `npm run lint` · `typecheck` | OK |
| `npm test` | 61 pruebas: 59 OK, 2 omitidas (sincronías con otros repos) |
| `npm run build` | OK, 22 páginas |
| `node e2e/flujos.cjs` | 11/11 recorridos OK |
| `node e2e/capturas.cjs` (390×844) | 28/28 capturas, sin desborde horizontal |

---

## Fase 2 · qué se hizo

- **2.1 Registro, perfil y verificación**: acceso, registro con aceptaciones explícitas (textos provisorios), recuperación neutra, aviso del
  fee 0 % tras el registro, alta por pasos (datos, identidad, rubros y matrícula, foto, antecedentes presenciales **sin archivos**, resumen),
  estados de revisión/corrección/rechazo/habilitación, cuenta con contador del fee y quién ve qué, preferencias y baja con estado real.
  Los documentos son "documentos de prueba": no se sube ni se lee ningún archivo real.
- **2.2 Inicio, disponibilidad y pedidos**: Inicio distinto de Mis trabajos, modal del fee 0 % en el primer ingreso, interruptores de
  "Ahora" y programados (revocables al instante), cobertura y franjas, bandeja por orden de llegada con datos mínimos, avisos urgente vs
  programado que solo abren el detalle.
- **2.3 Propuestas y chat**: detalle del pedido, enviar propuesta, contraoferta, aceptar/rechazar con confirmación, vigencia con cuenta
  regresiva (5 min en urgentes), retirar, chat antes de contratar, presupuesto estructurado en el hilo, fotos de prueba, reintento sin duplicar.
- **2.4 Agenda, servicio y soporte**: Mis trabajos (activos e historial), detalle con acuerdo inmutable, cambio de fecha como propuesta,
  paso a paso con **"Llegué"** explícito, obra por etapas, cancelación, agenda mensual con superposiciones, ayuda y reclamos con historial.
- **2.5 Caja y bordes**: pagos directos (MP y efectivo) con estados pendiente/reportado/verificado/fallido/discrepancia, fee $ 0, sin saldo ni
  retiros de Handy, y simulación post-demo rotulada "no vigente" (solo existe en el mock).

## Comandos ejecutados (29/10/2026, local, desde `npm ci` limpio)

| Comando | Resultado |
|---|---|
| `npm run lint` · `npm run typecheck` | OK |
| `npm test` | 60 pruebas: 58 OK, 2 omitidas (sincronías que piden rutas a otros repos) |
| `HANDY_LANDING_TOKENS=… node --test src/brand/tokens.test.ts` | 2 OK |
| `npm run build` (origen de prueba) | OK, 22 páginas estáticas |
| `node e2e/flujos.cjs` (Chromium 390×844, movimiento reducido) | **11/11 recorridos OK**, 0 errores de consola |
| `NEXT_PUBLIC_DATA_SOURCE=http … npm run build:hostinger` | OK; `verificar-bundle`: sin fixtures, panel, credenciales ni correos de prueba |
| `npm audit --omit=dev` | 0 vulnerabilidades |

## Defectos corregidos durante la fase (por si reaparecen)

- Un cambio de fecha rechazado seguía figurando como pendiente en el trabajo (el estado vencía o se rechazaba pero no se limpiaba).
- Carreras "guardar y refrescar": mostrar "guardado" o habilitar de nuevo un control antes de tener la versión nueva producía un 409 de
  versión. Ahora el refresco va **dentro** de la acción (el botón sigue deshabilitado hasta tener la versión vigente).
- Al cambiar las claves de una consulta (por ejemplo, de pestaña) se reusaban datos de la anterior.
- La barra del chat quedaba tapada por la navegación inferior.

## Decisiones tomadas (reversibles)

1. El aviso del fee 0 % se ve en tres lugares: tras el registro, modal de Inicio (registra `POST /v1/fee/aviso`) y contador en Cuenta.
2. Chat previo a la propuesta: `POST /v1/especialista/pedidos/{id}/conversacion`. Es un endpoint nuevo respecto de TECH-03.
3. Los cambios de fecha/importe de un trabajo son propuestas (`reemplazaA` = propuesta aceptada vigente): el acuerdo no cambia hasta la aceptación.
4. Reportar un cobro lo deja "reportado, sin verificar".
5. Cancelar un trabajo no tiene penalización automática (PROD-21 §4).
6. La baja cierra las sesiones; el estado se ve al volver a entrar en `/baja/` y se cancela mientras esté "solicitada".
7. Vigencia de propuestas programadas: 24 h **provisoria** (PROD-21 deja `[H]` sin valor).

## Abiertos y límites visibles

- Heredados de la fase 1: monorepo vs copia sincronizada (TECH-20), fin inclusivo del 10/12, dos precios (visita + trabajo), confirmación de
  finalización del usuario, "Llegué" sonoro (LEG-46), `MAX_RELANZAMIENTOS`.
- **Nuevos**: opciones de género (PROD-15), tamaño máximo de archivos, vigencia de propuestas programadas, textos legales definitivos
  (hoy provisorios y rotulados), y cómo se verifica el email al registrarse (sin OTP/SMS contratado; el mock abre sesión directamente).
- Contrato 0.2.0 trae **cambios no compatibles con 0.1.0** (ver `docs/contracts.md`): hay que transferirlos a `handyx-client-be` cuando exista.

## Qué NO está hecho (no atribuir a esta fase)

- Backend, base de datos, autenticación real, almacenamiento privado, Mercado Pago, push y webhooks: **fase 4** (todo bloqueado hasta que
  exista `handyx-client-be`).
- Refinación visual, responsive 360/768/820/desktop, accesibilidad completa (foco, contraste, lector de pantalla), service worker, manifest
  verificado, offline y capturas finales: **fase 3**. Hoy solo se probó 390×844.
- E2E en CI: el script usa Playwright, que no es dependencia del repo (en esta máquina viene instalado). Se agrega en el lote 5.1.
- Pruebas en dispositivos físicos y rendimiento en gama baja: fase 5.

## Próximo paso

Fase 3 · lote 3.1 (sistema visual y jerarquía de acción) con Opus 5.5 high. Insumos: capturas con `CAPTURAS=/ruta node e2e/flujos.cjs`,
`docs/qa.md` y los puntos de la sección "Lo que esta fase NO demuestra".

---

# Historial · Fase 1

Fecha: 29/10/2026 · Lotes 1.1–1.3 (PR #1). Modelo: `claude-opus-5-5`.

## Lote 1.1 · Auditoría y base ejecutable ✔

- **Auditoría**: `handyx-specialist-fe`, `handyx-specialist-be`, `handyx-client-fe` y `handyx-client-be` estaban
  vacíos (solo README). Referencias reutilizadas: tokens, íconos, lenguaje visual y flujos de la demo de
  `Handy-landing-page-fe`; capas y seguridad de `Handy-landing-page-be`; patrón de sesión/CSRF/no-storage de
  `handy-internal-portal`.
- **Base**: Next.js 16.4.2 + React 19.3.1 + TypeScript 5.9.3 (como el portal), `output: 'export'`, fuentes
  empaquetadas, tokens de la landing (copia byte a byte), marco de app con cabecera y navegación de la demo,
  16 rutas reservadas que dicen qué lote las construye, puerta de entrada (`/`) con error + reintentar.
- **Datos**: puerto `EspecialistaApi`, adaptador mock en memoria y cliente HTTP. El alias `@handyx/origen-datos` deja
  el mock fuera del bundle de producción.
- **Desvío**: tests con `node --test` en vez de Vitest (`npm` 10.9.4 falla con "Cannot read properties of null
  (reading 'edgesOut')" al resolver vitest 4/5 en un proyecto limpio). Igual que landing FE y portal.

## Lote 1.2 · Alta, elegibilidad y alcance ✔

`docs/screens.md`: 28 pantallas/estados con ruta, lote, estados y reglas; datos del perfil con sensibilidad y quién
los ve; escenarios de mock. Cierre comprobado en código: `cargado` nunca pasa a `verificado` sin revisión de
Operations y no existe campo, estado ni endpoint para archivos de antecedentes (pruebas en
`src/contracts/contratos.test.ts`).

## Lote 1.3 · Contratos con Usuario y Portal ✔

- `src/contracts/` v0.1.0: rubros, tiempos (Buenos Aires, 20 min / 5 min / 12 h), dinero en centavos, fee 0 %
  10/11–10/12 con contador, máquinas de estado con actor, DTO Zod estrictos.
- `docs/contracts.md`: dueño de cada pieza y de cada escritura; diferencias con TECH-03; versionado.
- `docs/state-machines.md`, `docs/auth-permissions.md`, `docs/matriz.md` (pantalla/API/permiso/QA) y
  `docs/api/openapi.yaml` (22 rutas, 21 esquemas; prueba que mantiene sus enums iguales al contrato).
- Cierre: no hay copia independiente de identidad, pedidos ni estados. El contrato tiene una sola fuente (hoy este
  borrador; mañana `handyx-client-be`), y las copias se verifican byte a byte.

## Comandos ejecutados (29/10/2026, local)

| Comando | Resultado |
|---|---|
| `npm install` | OK, 140 paquetes |
| `npm run lint` | OK, sin avisos |
| `npm run typecheck` | OK |
| `npm test` | 37 pruebas: 35 OK, 2 omitidas (sincronías que piden variables) |
| `HANDY_LANDING_TOKENS=../Handy-landing-page-fe/src/brand/tokens.ts node --test src/brand/tokens.test.ts` | 2 OK (tokens idénticos a la landing) |
| `npm run build` (mock) | OK, 19 páginas estáticas |
| `NEXT_PUBLIC_DATA_SOURCE=http NEXT_PUBLIC_API_BASE_URL=https://api.example.test npm run build:hostinger` | OK; `verificar-bundle`: sin fixtures ni banner en `out/` |
| `npm run build:hostinger` sin variables | Rechazado (esperado: producción exige `http` + https) |
| Playwright 390×844 sobre `out/` | `/` → `/inicio/`; nav a Cuenta con `aria-current`; 0 errores de consola |

Primera medición: el build http **sí** llevaba fixtures cuando la elección era un ternario en tiempo de ejecución.
Se corrigió con el alias de build y se agregó `scripts/verificar-bundle.mjs` para que no vuelva a pasar.

## Notion (verificado el 29/10/2026)

Leídos: TECH-03 (modelo lógico), TECH-20 (api-usuario / api-especialista), PROD-21 (mapa de flujo) y PROD-06/11
(herramientas y chat). Incorporado al mapa y al contrato:
- Inicio sin tasas de aceptación, tiempos ni puntualidad.
- La oferta muestra cuánto cobra Handy.
- Datos mínimos antes de que el usuario elija.
- Orden de llegada.
- 20 min / 5 min / 12 h.
- Relanzamiento que no vuelve a ofrecer el pedido a quien lo dejó pasar.
- Chat con el pedido como primer mensaje.

No encontrados como página propia: PROD-15, PROD-26, LEG-39 y LEG-40 (se usan los valores del prompt).

## Conflictos y decisiones abiertas

1. **TECH-20 vs repos**: TECH-20 dice monorepo con paquete compartido; los repos están separados. Se usa copia
   sincronizada con prueba. Decidir si se mantiene o se crea un paquete.
2. **Fin del fee 0 %**: inclusive el 10/12 (Ignacio) vs "cupones desde el 10/12". Parametrizado en `fee.ts`.
3. **Dos precios** (visita + trabajo, PROD-21) vs un `monto` por propuesta: se agrega `tipo` en 0.2.0 si se confirma.
4. **Confirmación de finalización** por el usuario: PENDIENTE.
5. **"Llegué" sonoro** (PROD-11 A): en PWA no se garantiza sonido; requiere validación de Legal (LEG-46) para urgencias.
6. **Landing**: sigue mostrando 5 %/10 % en su demo; no se tocó (sin OK de Ignacio).
7. **`MAX_RELANZAMIENTOS = 3`**: provisorio (PROD-21 dice que el urgente se relanza mientras siga abierto).

## Bloqueos externos

- Backend: `handyx-client-be` (dueño del esquema) y `handyx-specialist-be` vacíos. El adaptador HTTP no puede
  conectarse hasta la fase 4. No bloquea la fase 2 (mock).
- Legal: avisos aprobados antes de recolectar DNI, CUIT/CUIL, nacimiento y género en producción.
- Mercado Pago: ruta directa no confirmada.
- Render/Hostinger: subdominio y recurso de la PWA y de `api-especialista` sin definir; no se crea nada sin autorización.

## Próximo paso

Fase 2 · lote 2.1 (registro, perfil y verificación mock) con Sonnet 5.5 high. Pasos:
1. Ampliar `EspecialistaApi` y el mock con auth, documentos, envío de alta y aviso de fee.
2. Agregar escenarios por `?escenario=` en vista previa.
3. Construir A1–A4, B1–B7, G1–G3 de `docs/screens.md`.
