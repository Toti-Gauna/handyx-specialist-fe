# Contrato compartido Usuario · Especialista · Portal (lote 1.3)

Versión: **0.7.0 (borrador)** · `src/contracts/version.ts` · fecha 29/10/2026.

**0.6.0 → 0.7.0 (fase 4, lote 4.6, cambios para el dueño del contrato):** trabajo de punta a punta.
- **Llegada**: `Trabajo` suma `llegada` (`modo` automática o respaldo, `motivo` y hora; null hasta llegar). La automática
  la marca el servidor (actor `sistema`) al recibir una posición dentro de `RADIO_LLEGADA_M` (80 m) con precisión de
  `PRECISION_MAX_LLEGADA_M` (50 m) o mejor. El respaldo "Ya llegué" va por `POST /v1/especialista/trabajos/{id}/llegada`
  con el motivo (`sin_permiso`, `imprecisa`, `sin_senal`, `sin_ubicacion`). En los dos casos el usuario recibe el aviso.
- `POST /trabajos/{id}/eventos` queda para salir, empezar y terminar (`AVANCES_TRABAJO`). Cancelar pasa a
  `POST /trabajos/{id}/cancelacion`, siempre con motivo (`MOTIVOS_CANCELACION`). Con el trabajo en curso cancela solo
  Operations.
- **Adicionales**: nuevos `Adicional` y `NuevoAdicional` (repuesto o mano de obra, descripción e importe mayor a cero) y
  la máquina `MAQUINA_ADICIONAL`. Endpoints `POST /trabajos/{id}/adicionales` (con `Idempotency-Key`) y
  `POST /trabajos/{id}/adicionales/{adicionalId}/retiro`. `TrabajoDetalle` suma `adicionales` y `totalVigente` (lo
  acordado más los aceptados). Terminar retira los pendientes y crea (o actualiza, si estaba pendiente) el cobro por el
  total vigente.
- `NuevoCambio` suma `motivo` (`MOTIVOS_CAMBIO`, nullable), que se le muestra al usuario.
- **Llamada por la app**: `POST /trabajos/{id}/llamada` devuelve un número puente de Handyx (`LlamadaPuente`, con
  vencimiento). Ninguna parte ve el teléfono de la otra. Necesita un proveedor de telefonía (fase 5, con autorización).

**0.5.0 → 0.6.0 (fase 4, lote 4.5, cambios para el dueño del contrato):** pedidos, propuesta y avisos.
- `PedidoDetalle` suma `precioSugerido` (`PrecioSugerido`: `monto`, `fuente` y `version`, o null) y `trabajoId` (el trabajo
  que nació de este pedido para este especialista, o null). Los dos son obligatorios y nullables.
- "Handyx sugiere" es una **referencia por rubro y tipo**: el especialista decide el precio y la propuesta no se valida
  contra la sugerencia. La tabla real la define Product (la del mock es de prueba y dice su fuente).
- `TIPOS_AVISO` suma `te_eligieron`: el servidor lo emite cuando el cliente acepta la propuesta del especialista, con destino
  `trabajo` y el id del trabajo nuevo.
- Endpoints nuevos: `DELETE /v1/especialista/avisos/{id}` y `DELETE /v1/especialista/avisos` (borrar uno o todos los avisos
  del especialista). Borrar un aviso no toca el pedido, el trabajo ni el pago al que apunta.

**0.4.0 → 0.5.0 (fase 4, lote 4.4, cambios para el dueño del contrato):** alta guiada.
- `PerfilEspecialista` suma `citaAntecedentes` (turno reservado o null). Es obligatorio y nullable.
- Nuevos `TurnoAntecedentes`, `CitaAntecedentes` y `ReservaTurno`. Endpoints `GET /v1/especialista/antecedentes/turnos` y
  `PUT /v1/especialista/antecedentes/turno`.
- La máquina de verificación presencial deja que el especialista reserve el turno (`pendiente_cita` o `no_asistio` →
  `cita_coordinada`). El resultado sigue siendo solo de Operations. **Nunca un archivo del certificado.**
- `POST /v1/especialista/documentos/dni` suma el campo `dorso` (multipart): el DNI va con frente y dorso.
- `PUT /v1/especialista/disponibilidad` durante el alta (borrador, corrección, enviada o en revisión) acepta zonas y franjas.
  `urgentesAhora` y `programados` siguen en false hasta la habilitación (403 `sin_permiso`).

**0.3.0 → 0.4.0 (fase 4, lote 4.3):** mapa, ubicación en vivo y trayectos (`docs/mapa.md`).
- `PedidoElegible` suma `zonaMapa`: centro ya desplazado por el servidor y radio en metros. Antes del acuerdo, nunca el punto
  exacto.
- `Trabajo` suma `destino`, con la misma regla que `direccion`.
- Nuevos `Punto`, `ZonaMapa`, `Barrio`, `Posicion`, `Trayecto` (con `version`, que sube al recalcular) y `Viaje`
  (`ESTADOS_VIAJE`).
- Endpoints nuevos:
  - Barrios de cobertura.
  - Viaje de un trabajo.
  - Enviar posiciones, solo en camino; el servidor recalcula después de 2 desvíos.
  - Dejar de compartir.
- La posición va en el cuerpo, nunca en la URL. El servidor deja de compartir al llegar, empezar, terminar o cancelar.
- Del lado del cliente (`handyx-client-be`), el seguimiento en vivo es por SSE. Retención de posiciones: 30 días (lote 5.3).

**0.2.0 → 0.3.0 (fase 4, lote 4.2):** cuenta con código por email, Google o Apple y
recuperación con enlace de un solo uso.
- `Sesion.cuenta` suma `emailVerificado` y `terminosAceptados`. Es obligatorio: no es compatible con 0.2.0, y se acepta porque
  todavía no existe la API.
- Nuevos `VerificacionEmail`, `CodigoEmail`, `IngresoProveedor` (`PROVEEDORES`), `ResultadoProveedor`, `Aceptaciones`,
  `EstadoToken` (`ESTADOS_TOKEN`) y `Restablecer`.
- 7 endpoints `/v1/auth/*` nuevos en `docs/api/openapi.yaml`.
- Con sesión pero sin terminar la cuenta, el servidor solo deja verificar, reenviar, aceptar o salir: lo demás responde
  `403 sin_permiso`.
- `version.ts` había quedado vacío en el lote 2.1: se restauró y una prueba lo compara con `info.version` del OpenAPI.

**0.1.0 → 0.2.0 (fase 2, cambios para el dueño del contrato):** DTO de alta (`DatosAlta`, `GuardarDatosAlta`, `PerfilPublico`), cuenta
(`Preferencias`, `Baja`), `Aviso`, `Inicio`, `PedidoDetalle`, `TrabajoDetalle` (etapas de obra y cambio pendiente), `AgendaItem`,
`Conversacion`, `CajaResumen`, `CasoSoporteDetalle`. Cambios no compatibles con 0.1.0 (aceptables antes de que exista la API):
`PerfilEspecialista` suma `email` y `faltantesEnvio` y admite nombre/apellido nulos; `EstadoRubro` suma `elegido`; `Pago` suma
`descripcion`, `feeHandy` y `neto`; `CasoSoporte` suma `asunto`; `AgendaItem` suma `pedidoId`; el código de error
`transicion_invalida` es nuevo. El inventario de endpoints está en `docs/api/openapi.yaml`.

## 1. Quién es dueño de qué

| Pieza | Dueño | Consumidores | Regla |
|---|---|---|---|
| Esquema PostgreSQL (Neon) y **todas** las migraciones | `handyx-client-be` | `handyx-specialist-be` | Un solo historial de migraciones. Nadie más crea migraciones (Ignacio, 29/10/2026) |
| Contrato compartido (`contracts/`: estados, DTO, dinero, fee, rubros, tiempos) | `handyx-client-be` | las dos API, las dos PWA, portal | Copia byte a byte + prueba de sincronía (patrón de la landing con `preregistro.ts`) |
| `api-usuario` | `handyx-client-be` | PWA Usuario | Escribe: cuentas de usuario, perfil usuario, pedidos, aceptación de propuestas del especialista, pagos reportados por el usuario |
| `api-especialista` | `handyx-specialist-be` | esta PWA | Escribe: perfil especialista, documentos, disponibilidad/cobertura, propuestas del especialista, aceptación de propuestas del usuario, eventos del trabajo, reportes de pago del especialista |
| Operación interna (revisión de alta, verificación presencial, búsqueda manual, soporte) | API del portal / admin vigente | `handy-internal-portal` | Personal con `ADMIN_ACCOUNTS_JSON` (mecanismo vigente); no se registra como especialista |
| Pre-registros (`growth`) | `Handy-landing-page-be` | landing, portal | **Separado**: no se migra a cuentas activas; vincular solo con autenticación y aceptación |

Estado real: `handyx-client-be`, `handyx-specialist-be` y `handyx-client-fe` están vacíos. Hasta que
`handyx-client-be` exista, `src/contracts/` de este repo es el **borrador a transferir**; al transferirlo, este
directorio pasa a ser copia y `HANDYX_CONTRATOS=<ruta> npm test` verifica que sea idéntico.

**Conflicto con TECH-20** (Notion, 27/09): pide "monorepo con paquete compartido de auth y tipos", pero los repos
existen separados. Mientras no se decida otra cosa, la copia sincronizada cumple "una sola fuente" sin monorepo.

## 2. Escrituras por entidad (TECH-03 conciliado)

Una tabla tiene un solo servicio que la escribe por dominio; donde dos escriben, la regla está explícita.

| Entidad (TECH-03) | Escribe | Lee | Nota |
|---|---|---|---|
| `accounts`, `sessions` | la API donde se autentica cada rol (código compartido de auth) | ambas | Login único; roles en `account_roles` (usuario/especialista). Staff no está acá |
| `user_profiles` | api-usuario | api-especialista (solo nombre público tras contratar) | |
| `specialist_profiles`, `specialist_categories`, `specialist_credentials` | api-especialista (carga) · portal (revisión/verificación) | api-usuario (perfil público) | `verified=*` nunca viene del cliente |
| verificación presencial de antecedentes | portal | api-especialista (estado) | Sin archivos |
| `specialist_availability` / coverage | api-especialista | api-usuario (búsqueda) | |
| `service_requests`, `request_media` | api-usuario | api-especialista (elegibles, datos mínimos) | Búsqueda manual: portal |
| `proposals` | ambas: cada parte crea las suyas y responde las de la contraparte | ambas | Aceptación en transacción con versión; una sola aceptada activa por pedido |
| `jobs`, `job_events` | se crea en la transacción de aceptación; eventos del especialista (en camino, en curso, fin) desde api-especialista; llegada automática (geocerca) o de respaldo con motivo; cancelaciones con motivo de cada parte desde su API; adicionales (`job_extras`) con la respuesta del usuario | ambas | Snapshot del acuerdo inmutable |
| `conversations`, `messages`, media | cada parte desde su API | participantes + staff | Hilo desde la primera cotización (prompt Bloque 4) — TECH-03 lo ataba a `job_id`: se agrega `request_id` y `job_id` opcional |
| `support_cases`, `support_events` | cada parte abre desde su API; portal gestiona | partes + staff | |
| `payment_records` | reportes: cada parte; verificación: webhook validado o portal | ambas | Reportado ≠ verificado; Handy no es receptor |
| `fee_policies`, `fee_acceptances` | portal (políticas, solo con aprobación); cada API registra la aceptación de su rol | ambas | Demo: 0 bps |
| `commission_entries` (`commission_ledger`) | solo backend con política activa | portal | Demo: `demo_zero`; nada se cobra ni se netea sin mecanismo aprobado |
| `consents`, `account_deletion_requests`, `audit_events` | cada API para su rol; baja ejecutada por proceso privado | portal | |
| `analytics_events` | ambas (allowlist) | métricas | Sin PII ni contenido de chats/documentos |

## 3. Diferencias con TECH-03 (a resolver en 4.1)

| Tema | TECH-03 | Contrato v0.1 | Motivo |
|---|---|---|---|
| Estados de propuesta | pending/accepted/rejected/withdrawn/expired | + `reemplazada` | La contrapropuesta deja la anterior reemplazada (demo de la landing y prompt Bloque 4) |
| Estados de pedido | draft → searching → proposals_received → accepted → in_progress → completed | `buscando`, `sin_propuestas`, `busqueda_manual`, `acordado`, `cancelado`; el progreso vive en `jobs` | TECH-03 pide conciliar nombres; se evita duplicar el estado del trabajo en el pedido |
| `account_roles.role = admin` | incluido | no se usa | El personal sigue con `ADMIN_ACCOUNTS_JSON` (prompt Bloque 4 e invariantes del BE de captación) |
| Conversación | `job_id` | `requestId` + `jobId` opcional | Chat antes de contratar |
| Autor de propuesta | `specialist_id` | `autorRol` + autor + contraparte | Propuestas bidireccionales |

## 4. Versionado

- SemVer del contrato: **patch** = documentación/aclaración; **minor** = campo opcional o estado nuevo compatible;
  **major** = cambio de nombre, estado eliminado o campo obligatorio nuevo.
- Las API exponen `/v1/...`; un major del contrato no rompe `/v1` sin una ruta `/v2` y migración compatible.
- Respuestas validadas con `z.strictObject`: un campo nuevo exige que el consumidor actualice el contrato primero
  (minor); por eso los consumidores se actualizan **antes** que el productor.

## 5. Convenciones comunes

- IDs UUID; timestamps UTC ISO 8601 con `Z`; fechas mostradas en `America/Argentina/Buenos_Aires`.
- Importes: `{ centavos: entero ≥ 0, moneda: 'ARS' }`. Porcentajes en puntos básicos enteros. Nunca floats.
- Errores: `{ error: { codigo, mensaje, requestId, campos? } }` con `codigo` estable (`dto.ts → CODIGOS_ERROR`). Un
  recurso ajeno responde `404 no_encontrado` (no revela existencia).
- Paginación por cursor `{ items, siguienteCursor }`; filtros en servidor.
- Mutaciones críticas (propuestas, aceptación, reportes de pago, cierre de trabajo) con `Idempotency-Key` (UUIDv4) y
  `version` (control optimista → `409 conflicto_version`).
- Vencimientos y ventanas calculados por el servidor; el cliente solo muestra lo recibido.
