# Handoff · PWA Especialista de Handyx

Fecha: 29/10/2026 · Rama: `claude/pensive-hypatia-jajjgm` → PR a `main` · Bloque 4 · **Fase 1 (lotes 1.1–1.3)**.
Modelo de la sesión: `claude-opus-5-5` (seleccionado por Ignacio con `/model`); el plan y la decisión de stack se
hicieron antes con `claude-sonnet-5-5`.

Estado: **fase 1 cerrada localmente.** Base ejecutable, mapa de pantallas y contrato v0.1.0 con pruebas. Ninguna
pantalla de negocio construida (fase 2), backend inexistente (fase 4), nada desplegado (fase 5).

| Ítem | Decidido | Mock | Conectado | Probado | Desplegado |
|---|---|---|---|---|---|
| Stack Next.js estático + guardas de build | ✔ | — | — | ✔ (build mock y http) | — |
| Contrato compartido v0.1.0 (estados, DTO, fee, dinero) | ✔ | — | — | ✔ (unitarias) | — |
| Adaptador mock (sesión, perfil, disponibilidad, bandeja, fee) | ✔ | ✔ | — | ✔ | — |
| Cliente HTTP (cookies, CSRF, idempotencia, errores) | ✔ | — | ✘ (no hay API) | ✔ (fetch simulado) | — |
| Pantallas | rutas reservadas | — | — | navegación con Playwright | — |

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
