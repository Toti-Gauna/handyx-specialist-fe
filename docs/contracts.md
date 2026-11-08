# Contrato compartido Usuario · Especialista · Portal (lote 1.3)

Versión: **0.11.1 (borrador)** · `src/contracts/version.ts` · fecha 08/11/2026.

**0.11.0 → 0.11.1 (ola 1, lote 1.5: lo que pidieron los lotes de la ola 1; compatible).**
- `Preferencias` suma `letraGrande` (opcional hasta 1.0.0): «Letra más grande» en Cuenta (lote 1.4), guardada en el
  servidor (`notification_preferences.letra_grande`), nunca en el navegador.
- Implementado en `handyx-specialist-be` (lote 1.5): acceso con segunda verificación, seguridad, registro por pasos,
  onboarding, mapa de arreglos (con SSE), perfil propio, preferencias, bandeja y descarga de datos. Decisiones del
  servidor que la app tiene que saber: un error de reautenticación es **400** con el campo
  `reautenticacion.password|codigo` (nunca 401: la sesión sigue); el código al email de D6-Acceso solo vale una vez y
  solo el último; con la segunda verificación solo por email, entrar con un código al email responde 401 (falta otra
  forma); los textos para especialistas de RG-10 son `esp-terminos-especialista-2026-11-08-prov` y
  `esp-privacidad-especialista-2026-11-08-prov` (provisorios); el detalle del mapa y la propuesta valen también fuera
  de tus zonas (lo viste yendo hacia otro destino), la bandeja y los avisos no.

**Servidor del bloque Taller, ola 2 (lote 2.5, sin cambio de contrato).** Implementado en `handyx-specialist-be` todo lo
de agenda y tu día (`/agenda/*`, `/dia`, `/dia/recorrido`, `/dia/orden`, `/trabajos/{id}/demora`), cobros e ingresos
(`/pagos/{id}/cobro|informe`, `/ingresos*`, `/gastos*`, `/ingresos-externos*`), presupuestos, lista de precios, mano de
obra, catálogo de nombres y kits, equipamiento y lista de compras, Modo trabajo, antes y después, informe y adjuntos. El
cliente de servidor de esos dominios está en `src/data/http/servidor/` (un archivo por dominio, cada método = una ruta,
validado con el contrato): los adaptadores HTTP de los lotes 2.1 a 2.4 delegan ahí y el cierre de la ola los compone.
Decisiones del servidor que la app tiene que saber:
- **Gasto solo «cobrárselo al cliente»** (sin «registrarlo como gasto»): crea el adicional y la respuesta lo describe
  (`id` = `adicionalId`); no queda en tus gastos ni en `GET /gastos`. Cobrárselo exige un trabajo activo (si no, 409).
- **Presupuesto**: sin `obraId` hasta la 3.5 (404, como lo ajeno); un pedido exige que ya tengas el chat con ese cliente.
  Solo el borrador se edita (409); `vigenteHasta` pasado lo muestra `vencido` (el cliente ya no lo responde). La versión
  nueva sale de la última enviada (enviada, vista, rechazada o vencida) y entra con los precios nuevos. El presupuesto
  llega al chat como tarjeta (`message_cards`) y el cliente lo ve y lo responde en su app (contrato de usuario draft.5).
- **Precios**: `precioCliente` null = el costo. La lectura de la lista empareja por el id que eligió el teléfono o por el
  nombre (sin acentos ni mayúsculas); `revisar` = misma palabra con otra unidad (no se toca); lo nuevo entra en `otra` con
  tu modo por defecto; al subir el costo, el precio al cliente sube en la misma proporción (conserva tu margen).
- **Tu día**: el orden propio se guarda por día (`version` 0 hasta el primero); los ids tienen que ser turnos de hoy
  (400 si no). Sin motor de trayectos propio, los tramos van en línea recta a 25 km/h (orientativos). Las obras de varios
  días (0.8.0) aparecen como `jornada` y en `AgendaMes.dias[].obras` con el id del trabajo hasta que existan las obras.
- **Cobro**: informar un pendiente lo deja `reportado` (fuente especialista); uno ya reportado por el cliente conserva su
  estado y suma lo informado; más que lo acordado es 400 (`monto`). La planilla es CSV (UTF-8 con BOM, sin fórmulas).
- **Modo trabajo**: se abre con el trabajo `en_curso` (antes, 409); sin pausas guardadas el cronómetro corre desde que
  empezó. Una tarea «con foto» no se marca hecha sin una foto suya (400 `estado`). Asignar a otro miembro llega con la 3.5.
- **Informe**: «La causa» es obligatoria para mandarlo; se manda una sola vez (después, 409) y escribe el informe que lee
  la app del usuario, la garantía (`garantiaDias` o la de la propuesta o 30) y el pedido de conformidad. El PDF queda
  `null` hasta tener el almacenamiento autorizado. `version` suma las de las secciones, el informe y la conformidad.
- **Equipamiento**: «Reponer en la ferretería» la suma a la lista de compras (`pedidoFerreteriaId` null hasta la 4.3) y
  `POST /lista-compras/pedido` responde 503. `/catalogo/codigos` sugiere solo nombres publicados (sin categoría todavía).
- `POST /trabajos/{id}/ayuda` y `/contactos-profesionales*` llegan con la 3.5.

**0.10.0 → 0.11.0 (ola 0, lote 0.1: el contrato completo del bloque Taller, para que las olas 1 a 4 trabajen en
paralelo sin cambiarlo).** Diseño de referencia: el lienzo (`design/deluxe/`); qué pantalla usa qué endpoint: §6.
- **Un archivo por dominio** en `src/contracts/`: `comun.ts` (fecha, mes, cantidad, persona visible, profesional,
  archivo firmado, límites de archivos), `seguridad.ts`, `registro.ts`, `mapa.ts`, `presupuestos.ts`, `ingresos.ts`,
  `equipamiento.ts`, `modo-trabajo.ts`, `obras.ts`, `repuestos.ts`, `equipo.ts`, `chat.ts`, `ferreterias.ts`,
  `camino.ts`, `agenda.ts` y `cuenta.ts`. `dto.ts` guarda lo común y lo de las fases 2 a 4. La prueba de sincronía
  compara **todos** los archivos que no son pruebas.
- **Sin comisión al especialista, nunca** (decisión de Ignacio del 08/11/2026): `BPS_ESPECIALISTA = 0` (`fee.ts`);
  `PoliticaFee.bpsEspecialista` solo admite 0 y `politicaVigente` ignora una política que le cobre algo (falla
  cerrada); `Pago.feeHandy` y `CajaResumen.feeHandyPeriodo` quedan por compatibilidad y **solo valen 0**
  (`MontoSinComisionSchema`); `neto` = `monto`. `avisoFee` queda obsoleto (el modal y el contador se van en el lote
  0.2). Quién los usaba: en la PWA, `components/FeeAviso.tsx`, `components/ModalFee.tsx`, `lib/tarifa.ts`,
  `kit/Precio.tsx`, `pantallas/TuPrecio.tsx`, `pantallas/trabajo/AgregarAdicional.tsx`, `pantallas/trabajo/Terminado.tsx`,
  `pantallas/Caja.tsx` y el mock (`data/mock/{caja,cuenta,obras,trabajos,fixtures}.ts`); en `handyx-specialist-be`,
  `services/caja.service.ts`, `services/trabajos.vista.ts`, `services/propuestas.service.ts`,
  `services/trabajos.comun.ts`, `services/pedidos.service.ts` y `scripts/ops.ts` (`fee:publicar`). Ninguno se rompe:
  todos ya usaban 0. El backend fija el 0 en su lote (ERD: `CHECK especialista_bp = 0`).
- **Compatibles con 0.10.0** (opcionales hasta 1.0.0): `Propuesta`/`NuevaPropuesta` suman `incluyeMateriales` y
  `garantiaDias`; `MediosCobro`/`GuardarMediosCobro` suman `transferencia` (alias o CBU cifrado, vuelve enmascarado);
  `Preferencias` suma `avisosRecordatorios`, `avisosCamino`, `avisosNovedades` y `silencio`. `HorarioSchema` se
  exporta (franja u hora exacta). `ACTORES` suma `ferreteria`; `transicion` se exporta para las máquinas de cada dominio.
  `dinero.ts` suma `multiplicar` (importe × cantidad con hasta 3 decimales, con enteros).
- **No cambian** `CODIGOS_ERROR` ni los enums existentes (las dos API y la PWA tienen tablas exhaustivas): los errores
  nuevos se expresan con los códigos de siempre (`comun.ts`: código incorrecto → 400 `validacion`, intentos → 429
  `limite`, QR usado o búsqueda cerrada → 409 `transicion_invalida`, SMS u otro proveedor sin autorizar → 503).
- **Máquinas nuevas** (con pruebas en `bloque.test.ts`): presupuesto, conformidad, obra, repuesto, búsqueda,
  postulación, pedido de ferretería (el retiro lo marca solo la ferretería, con el QR de un uso), hito del camino (nada
  se libera sin la revisión de Operations) y canje.
- **Reglas puras nuevas**: `faltantesHabilitacion` y `rubrosHabilitables` (matrícula obligatoria en Gas y Aire),
  `repartoCuadra` y `bpsDeParte`, `faltaParaHito` (nunca negativo).
- **Convenciones**: la posición del especialista va siempre en el CUERPO (`POST /mapa/pedidos`,
  `POST /ferreteria/comparacion`, `POST /dia/recorrido`) y no se guarda; en un multipart con datos estructurados, el
  JSON va en la parte `datos` y los archivos aparte; los códigos (invitaciones) van en el cuerpo, nunca en la ruta;
  las distancias del mapa se redondean a 100 m y no hay tiempos de llegada prometidos.
- **Obsoletos hasta 1.0.0** (`deprecated` y `x-reemplazo` en el OpenAPI): `/v1/conversaciones*` → `/chats`;
  `/avisos*` → `/bandeja`; `/agenda` → `/agenda/turnos|mes|resumen`; `/documentos/{tipo}`, `/alta/datos`,
  `/alta/envio`, `/antecedentes/turno(s)` → `/registro/*` (antecedentes por foto o PDF); `/pagos/{id}/reporte` →
  `/pagos/{id}/informe`; `/caja*` → `/ingresos*`; `/pedidos/{id}/conversacion` → `/pedidos/{id}/chat`; `/fee/aviso`
  sin reemplazo.
- **OpenAPI**: 182 rutas nuevas (212 operaciones) y 206 esquemas, generados desde los Zod de cada dominio (Zod →
  JSON Schema 2020-12) para que no se desalineen; `openapi.test.ts` exige cada lista de valores de cada dominio.
- **Esquema**: el diseño de tablas, cifrado, retención, índices y permisos por rol está en
  `handyx-client-be/docs/erd-taller.md` (sin migraciones; cada lote de backend migra lo suyo).
- Fuera de este contrato: la API del ferretero (panel y app, lote 4.2/4.3, propuesta `handyx-ferreterias-be`) y lo
  que responde el cliente (aceptar presupuesto u obra, aprobar repuestos, conformidad, comentarios) en el contrato de
  usuario de `handyx-client-be`. Decisión pendiente: dónde se procesa el escaneo 3D (si es en el servidor, el lote
  2.5 suma su endpoint).

**0.9.0 → 0.10.0 (bloque Taller, H1.3):** IA del Taller detrás de la API (`SugerenciaTablero`, `PresupuestoDictado`,
`PresupuestoSugerido`, `POST /v1/especialista/taller/ia/tablero` y `/taller/ia/presupuesto`), sin datos personales y
con 503 sin proveedor autorizado.

**0.8.0 → 0.9.0 (fase 4, lote 4.8, cambios para el dueño del contrato):** contactos y formas de cobro.
- **Contactos**: `Contacto` (conversación, nombre, un detalle para reconocerlo y la fecha). Solo los que el especialista
  agrega desde un chat; sin teléfonos. Endpoints `GET /v1/especialista/contactos`, `POST /v1/especialista/contactos`
  (`conversacionId`; agregar dos veces devuelve el mismo) y `DELETE /v1/especialista/contactos/{id}` (la conversación
  sigue). `Conversacion` suma `contactoId`.
- **Cómo te paga el cliente**: `MediosCobro` (Mercado Pago, efectivo, la cuenta de Mercado Pago vinculada o no, y
  `version`). `GET /v1/especialista/cobros` y `PUT /v1/especialista/cobros` (al menos una forma, con la versión). La
  vinculación es con Mercado Pago (fase 5): Handyx nunca ve la contraseña ni las claves.

**0.7.0 → 0.8.0 (fase 4, lote 4.7, cambios para el dueño del contrato):** obras de varios días.
- `EtapaObra` pasa a tener `id`, `orden`, `incluye`, `terminadaEn` y `pagoId`, y `ESTADOS_ETAPA` con su máquina
  (`MAQUINA_ETAPA`): de a una, la arranca el sistema y la termina el especialista.
- `TrabajoDetalle` suma `jornadas` (`Jornada`: etapa, número, horario, estado `programada` o `hecha` y un
  `cambioPendiente` con horario, motivo y fecha del pedido) y `diario` (`EntradaDiario`: etapa, jornada, nota de hasta
  280 caracteres y hasta 4 fotos con URL firmada). En un trabajo de un día los dos van vacíos.
- `Adicional`, `NuevoAdicional` y `Pago` suman `etapaId` (null en un trabajo de un día). En una obra, un adicional va a
  la etapa en curso y se cobra con ella.
- Endpoints nuevos:
  - `POST /trabajos/{id}/etapas/{etapaId}/fin`: termina la etapa, crea su cobro (la etapa más sus adicionales aceptados),
    retira los que no tuvieron respuesta y arranca la siguiente. Devuelve el cobro.
  - `POST /trabajos/{id}/jornadas/{jornadaId}/cambio`: pide otro día para una jornada futura. No mueve las demás; cambia
    cuando el usuario acepta.
  - `POST /trabajos/{id}/diario` (multipart con `fotos`): el avance del día. Con una jornada, la marca `hecha`.
- Una obra se cierra (`eventos` → `finalizado`) solo con todas sus etapas terminadas, y cerrarla no crea otro cobro.
- La agenda muestra una obra jornada por jornada.

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

Estado real (08/11/2026): el contrato de especialista se escribe en `src/contracts/` de este repo (borrador) y se
copia byte a byte a `handyx-specialist-be/src/contracts` (`HANDYX_CONTRATOS=<ruta> npm test` lo verifica en los dos
lados, con todos los archivos que no son pruebas). `handyx-client-be` es dueño del esquema y de las migraciones (y de
su propio contrato de usuario, `src/contracts/v1`); el diseño del esquema del bloque Taller está en su
`docs/erd-taller.md`. Durante las olas, un cambio de contrato lo aplica solo el lote de backend de la ola.

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

## 6. Pantallas del lienzo → endpoints (0.11.0)

Las 150 pantallas de `design/deluxe/` (asignadas a un lote en `docs/plan-olas.md` §5). Rutas relativas a
`/v1/especialista` salvo las que empiezan con `/v1/`. «Local» = se resuelve en el teléfono, sin API. El detalle de cada
endpoint (cuerpo, respuestas y errores) está en `docs/api/openapi.yaml`.

| Pantalla | Lote | Endpoints |
| --- | --- | --- |
| D6-Error, D6-Fallo | 0.2 | Ninguno propio: el estado de error de cualquier llamada (sin conexión / 5xx con `requestId`). Reintentar repite la misma llamada con la misma `Idempotency-Key` |
| X-Escritorio | 0.2 | Local (solo celular; QR generado en el teléfono) |
| D6-Bienvenida | 1.1 | Local |
| D6-Login | 1.1 | `POST /v1/auth/ingreso/clave` · `POST /v1/auth/proveedor` (Google, Apple) |
| D6-Login2FA | 1.1 | `POST /v1/auth/segunda-verificacion` · `POST /v1/auth/segunda-verificacion/envio` |
| D6-Recuperar | 1.1 | `POST /v1/auth/recuperacion` · `POST /v1/auth/recuperacion/estado` · `POST /v1/auth/recuperacion/nueva` |
| D6-Acceso | 1.1 | `POST /v1/auth/ingreso/codigo` |
| D6-Codigo | 1.1 | `POST /v1/auth/ingreso/codigo/verificacion` (en el registro: `GET/POST /v1/auth/verificacion`, `/reenvio`) |
| RG-1 | 1.2 | `POST /v1/auth/cuenta` · `GET/POST /v1/auth/verificacion` · `PUT /registro/datos` |
| RG-2 | 1.2 | `PUT /registro/domicilio` |
| RG-3 | 1.2 | `PUT /registro/rubros` |
| RG-4 | 1.2 | `GET /mapa/barrios` · `PUT /registro/zonas` |
| RG-5 | 1.2 | `POST /registro/selfie` |
| RG-6 | 1.2 | `POST /registro/dni` |
| RG-7 | 1.2 | `PUT /registro/cuit` |
| RG-8 | 1.2 | `POST /registro/certificados` · `DELETE /registro/certificados/{id}` |
| RG-9 | 1.2 | `POST /registro/antecedentes` |
| RG-10 | 1.2 | `GET /registro` · `POST /registro/envio` |
| D6-Alta | 1.2 | `GET /registro` |
| OB-Aprobado | 1.2 | `GET /onboarding` · `PUT /onboarding` (aviso `alta_habilitada` en `GET /bandeja`) |
| OB-Permisos | 1.2 | `POST /v1/cuenta/push` (la ubicación se pide en el teléfono, solo en el viaje) |
| OB-Tour | 1.2 | Local |
| OB-PrimerosPasos | 1.2 | `GET /onboarding` · `PUT /onboarding` |
| F-Inicio | 1.3 | `GET /inicio` · `PUT /disponibilidad` · `GET /mapa/destinos` · `POST /mapa/pedidos` · `GET /mapa/eventos` (SSE) · `POST /pedidos/{id}/descarte` |
| F-InicioDia | 1.3 | `GET /dia` · `POST /dia/recorrido` · `POST /trabajos/{id}/demora` · `POST /trabajos/{id}/eventos` (salir) |
| F-InicioRuta | 1.3 | `GET /dia` · `PUT /dia/orden` |
| F-Pedido | 1.3 | `GET /mapa/pedidos/{id}` · `POST /pedidos/{id}/descarte` |
| F-Precio, F-PrecioTeclado | 1.3 | `GET /mapa/pedidos/{id}` (precio sugerido). El precio se arma en el teléfono hasta revisar |
| F-Fecha, F-FechaHora | 1.3 | `GET /agenda/mes` · `GET /agenda/dias/{fecha}` (lo ocupado). Franja u hora exacta = `Horario` |
| F-Revisar | 1.3 | `POST /propuestas` (con `incluyeMateriales` y `garantiaDias`) |
| F-Enviada | 1.3 | `POST /pedidos/{id}/chat` |
| F-Trabajo | 1.3 | `GET /trabajos/{id}` · `POST /trabajos/{id}/eventos` · `/llegada` · `/cambio` · `/adicionales` · `GET /trabajos/{id}/modo` |
| TR-EnCamino | 1.3 | `GET /trabajos/{id}/viaje` · `POST/DELETE /trabajos/{id}/viaje/posiciones` · `POST /trabajos/{id}/llegada` · `POST /trabajos/{id}/demora` |
| TR-Cobro | 1.3 | `GET /pagos/{id}/cobro` · `POST /pagos/{id}/informe` |
| F-Cuenta | 1.4 | `GET /perfil/propio` · `GET /camino` · `GET /ingresos` · `GET /equipamiento` · `GET /presupuestos` · `GET /ferreteria/pedidos` · `POST /v1/auth/salida` |
| CU-Perfil | 1.4 | `GET /perfil/propio` · `PUT /perfil/presentacion` · `POST /perfil/foto` |
| CU-Datos | 1.4 | `GET /registro` |
| CU-Disponibilidad | 1.4 | `GET/PUT /disponibilidad` · `GET /mapa/barrios` · `PUT /rubros` |
| CU-Cobros | 1.4 | `GET/PUT /cobros` (con `transferencia`) |
| CU-Notificaciones | 1.4 | `GET/PUT /v1/cuenta/preferencias` (campos de 0.11.0) |
| CU-Privacidad | 1.4 | `GET/POST /privacidad/exportacion` · `GET/POST/DELETE /v1/cuenta/baja` · `POST /v1/auth/salida` |
| D6-Seguridad | 1.4 | `GET /seguridad` · `PUT /seguridad/segunda-verificacion` · `POST /seguridad/codigos-respaldo` · `DELETE /seguridad/dispositivos/{id}` · `PUT /seguridad/clave` · `PUT /seguridad/telefono` · `POST /seguridad/telefono/verificacion` |
| D6-TOTP | 1.4 | `POST /seguridad/totp` · `POST /seguridad/totp/confirmacion` |
| D6-Avisos | 1.4 | `GET /bandeja` · `POST /bandeja/{id}/leido` · `DELETE /bandeja/{id}` · `DELETE /bandeja` |
| D6-Ayuda | 1.4 | `GET/POST /v1/soporte/casos` · `GET /v1/soporte/casos/{id}` (las preguntas frecuentes son contenido de la app) |
| F-Herramientas | 2.1 | `GET /agenda/resumen` · `GET /ingresos` · `GET /presupuestos` · `GET /equipamiento` · `GET /ferreteria/pedidos` |
| F-Agenda | 2.1 | `GET /agenda/resumen` · `GET /agenda/turnos?vista=hoy\|futuras` |
| F-AgendaPasadas | 2.1 | `GET /agenda/turnos?vista=pasadas` |
| F-AgendaMes | 2.1 | `GET /agenda/mes` · `GET /agenda/dias/{fecha}` |
| F-Ingresos | 2.1 | `GET /ingresos` · `GET /ingresos/cobros` · `GET/POST/DELETE /ingresos-externos` · `GET /ingresos/exportacion` |
| H0-Gasto | 2.1 | `POST /gastos` (JSON o multipart con `ticket`) |
| H0-Presupuesto | 2.2 | `POST /presupuestos` · `GET /presupuestos/{id}` · `/versiones` · `POST /presupuestos/{id}/envio` · `/version-nueva` · `/plantilla` · `GET /mano-de-obra` |
| H0-AgregarMaterial | 2.2 | `GET /precios?q=` · `POST /presupuestos/{id}/materiales` |
| H0-MaterialOpciones | 2.2 | `GET/PUT /presupuestos/preferencias` · `PATCH /presupuestos/{id}/materiales/{itemId}` |
| H0-MaterialNuevo | 2.2 | `GET /catalogo/materiales` · `POST /precios` (`sumarAlCatalogo`: solo el nombre) |
| H0-AgregarLista | 2.2 | `GET /presupuestos/kits` · `POST /presupuestos/{id}/materiales` |
| H0-Precios | 2.2 | `GET /precios` |
| H0-PreciosFoto | 2.2 | Local (la foto se lee en el teléfono y nunca se manda) |
| H0-PreciosRevisar | 2.2 | `POST /precios/lectura/revision` · `POST /precios/lectura` |
| H0-PrecioItem | 2.2 | `GET/PATCH/DELETE /precios/{id}` |
| H0-ManoObra | 2.2 | `GET/PUT /mano-de-obra` · `POST /mano-de-obra/tareas` · `PATCH/DELETE /mano-de-obra/tareas/{id}` |
| H0-Modo | 2.3 | `GET /trabajos/{id}/modo` · `POST /trabajos/{id}/modo/pausa\|reanudacion` · `POST/PATCH/DELETE /trabajos/{id}/tareas` · `POST /trabajos/{id}/fotos` · `POST /trabajos/{id}/eventos` (terminé) |
| H0-ModoHerramientas | 2.3 | `POST /trabajos/{id}/notas` (las herramientas son locales) |
| H0-ModoAyuda | 2.3 | `GET /contactos-profesionales` · `POST /contactos-profesionales/{id}/chat` · `POST /trabajos/{id}/llamada` · `POST /trabajos/{id}/ayuda` · `POST /obras/{id}/busquedas` |
| H0-ModoAgenda | 2.3 | `GET /agenda/turnos?vista=futuras` · `POST /trabajos/{id}/demora` · `POST /trabajos/{id}/cambio` |
| H0-AntesDespues, H0-AntesLado | 2.3 | `GET/PUT /trabajos/{id}/antes-despues` · `POST /trabajos/{id}/fotos` |
| H0-Informe | 2.3 | `GET /trabajos/{id}/informe` · `PUT /trabajos/{id}/informe/secciones/{seccion}` |
| H0-InformeEnviado | 2.3 | `POST /trabajos/{id}/informe/envio` · `GET /trabajos/{id}/informe` (conformidad, garantía y PDF) · `GET /pagos/{id}/cobro` |
| H0-Equipo | 2.4 | `GET /equipamiento` · `GET /lista-compras` |
| H0-EquipoCategoria | 2.4 | `GET /equipamiento/items?categoria=` |
| H0-EquipoAgregar | 2.4 | `POST /equipamiento/items` · `GET /catalogo/codigos?codigo=` |
| H0-EquipoDetalle | 2.4 | `GET/PATCH /equipamiento/items/{id}` · `/prestamo` · `/devolucion` · `/movimiento` · `/mantenimientos/{mantenimientoId}/hecho` |
| H0-EquipoBaja | 2.4 | `POST /equipamiento/items/{id}/baja` · `POST /lista-compras` · `POST /ferreteria/comparacion` |
| T-Taller, T-Medir, T-Nivel | 2.4 | Local |
| T-Escanear | 2.4 | Local mientras no se decida dónde se procesa (si es en el servidor, el lote 2.5 suma el endpoint) |
| T-Modelo3D | 2.4 | `POST /trabajos/{id}/adjuntos` (`modelo_3d`) · `POST /chats/{id}/mensajes` · `POST /presupuestos/{id}/materiales` |
| F-Obras | 3.1 | `GET /obras?grupo=` |
| F-ObraNueva | 3.1 | `POST /obras` · `GET /chats?filtro=pedidos` (clientes tuyos) |
| F-Obra | 3.1 | `GET /obras/{id}` |
| F-ObraDia | 3.1 | `GET /obras/{id}/jornadas/{jornadaId}` · `PUT /obras/{id}/jornadas/{jornadaId}/personas` · `PATCH /trabajos/{id}/tareas/{tareaId}` |
| F-ObraDiaHorario | 3.1 | `POST /obras/{id}/jornadas/{jornadaId}/cambio` |
| F-ObraDiaTarea | 3.1 | `POST /obras/{id}/jornadas/{jornadaId}/tareas` |
| F-ObraDiaAvance | 3.1 | `POST /obras/{id}/jornadas/{jornadaId}/avance` |
| F-ObraFecha | 3.1 | `POST /obras/{id}/jornadas/{jornadaId}/cambio` (`solo_esta` o `esta_y_siguientes`) · `POST /obras/{id}/cambios/{cambioId}/retiro` |
| F-ObraRepuestos | 3.1 | `GET /trabajos/{id}/repuestos` · `POST /trabajos/{id}/repuestos/{repuestoId}/aprobacion\|recordatorio\|compra` |
| F-RepuestoOrigen | 3.1 | Local (elige el flujo: «Lo consigo yo» o ferretería) |
| F-ObraRepuesto | 3.1 | `GET /precios` · `POST /trabajos/{id}/repuestos` |
| F-PropuestaObra | 3.1 | `GET/PUT /obras/{id}/propuesta` · `POST /obras/{id}/propuesta/envio\|retiro` |
| F-ObraEquipo | 3.2 | `GET /obras/{id}/equipo` · `DELETE /obras/{id}/miembros/{miembroId}` |
| F-Invitar | 3.2 | `GET /contactos-profesionales` · `POST /obras/{id}/invitaciones` · el invitado: `POST /invitaciones/consulta\|aceptacion\|rechazo` |
| F-Reparto | 3.2 | `GET/PUT /obras/{id}/reparto` · `POST /obras/{id}/reparto/envio` · `POST /obras/{id}/reparto/respuesta` |
| F-ObraBuscar | 3.2 | `POST /obras/{id}/busquedas` · `POST /obras/{id}/busquedas/{busquedaId}/cancelacion` |
| F-InicioConvocatoria | 3.2 | `GET /mapa/eventos` (`busqueda_nueva`) · `GET /busquedas` · `POST /busquedas/{id}/descarte` |
| F-ConvocatoriaDetalle | 3.2 | `GET /busquedas/{id}` · `POST/DELETE /busquedas/{id}/postulacion` |
| F-ObraPostulantes | 3.2 | `GET /obras/{id}/busquedas/{busquedaId}/postulantes` · `POST .../postulantes/{postulacionId}/eleccion` |
| F-PerfilProfesional | 3.2 | `GET /profesionales/{id}` · `POST /contactos-profesionales` · `POST /contactos-profesionales/{id}/chat` |
| F-Mensajes | 3.3 | `GET /chats?filtro=` |
| F-Chat, F-ChatGrupo | 3.3 | `GET /chats/{id}` · `GET/POST /chats/{id}/mensajes` · `POST /chats/{id}/leido` |
| F-ChatAcciones | 3.3 | `PUT/DELETE /chats/{id}/mensajes/{mensajeId}/reaccion` · `PUT /chats/{id}/fijado` · responder = `respondeA` |
| F-ChatEditar | 3.3 | `PATCH /chats/{id}/mensajes/{mensajeId}` |
| F-ChatBorrar | 3.3 | `DELETE /chats/{id}/mensajes/{mensajeId}` (borrado lógico) |
| F-ChatSeleccion | 3.3 | `POST /chats/{id}/mensajes/borrado` · `POST /chats/{id}/mensajes/reenvio` |
| F-ChatMedia | 3.3 | `POST /chats/{id}/mensajes` (multipart) · `GET /chats/{id}/archivos` |
| F-ChatAdjuntar | 3.3 | Cada tarjeta sale de su dominio: `POST /presupuestos/{id}/envio` · `/obras/{id}/propuesta/envio` · `/trabajos/{id}/repuestos/{repuestoId}/aprobacion` · `/obras/{id}/jornadas/{jornadaId}/cambio` · `/trabajos/{id}/informe/envio` |
| F-ChatGrupoInfo | 3.3 | `GET /chats/{id}` · `GET /chats/{id}/archivos` · `POST /chats/{id}/miembros` · `PUT /chats/{id}/silencio` · `POST /chats/{id}/salida` |
| G-Inicio | 3.4 | `GET /camino` |
| G-Bienvenida | 3.4 | `PUT /camino/kit` · `GET /camino/puntos-retiro` |
| G-Manual | 3.4 | `GET /camino/manual` · `POST /camino/manual/{capitulo}/lectura` |
| G-Camino, G-MiniCamino | 3.4 | `GET /camino` · `GET /camino/caminos/{id}` |
| F-Regalo | 3.4 | `GET /camino` (`porCelebrar`) · `POST /camino/celebraciones/{hitoId}` |
| G-Canje | 3.4 | `POST /camino/premios/{hitoId}/canje` · `GET /camino/puntos-retiro` · `POST /camino/canjes/{id}/cancelacion` |
| G-Vitrina | 3.4 | `GET /camino/premios` |
| G-Insignias | 3.4 | `GET /camino/insignias` |
| G-Areas | 3.4 | Ninguno (concepto para más adelante) |
| R-Catalogo | 4.1 | `GET /ferreteria/categorias` · `GET /ferreteria/productos?q=` · `GET /ferreteria/pedido` |
| R-Categoria | 4.1 | `GET /ferreteria/productos?categoria=` · `POST /ferreteria/pedido/items` |
| R-Pedir | 4.1 | `GET /ferreteria/pedido` · `PATCH/DELETE /ferreteria/pedido/items/{itemId}` |
| R-Comparar | 4.1 | `POST /ferreteria/comparacion` |
| R-Ferreterias | 4.1 | `POST /ferreteria/comparacion` · `POST /ferreteria/pedidos/{id}/envio` |
| R-Estado | 4.1 | `GET /ferreteria/pedidos/{id}` · `POST /ferreteria/pedidos/{id}/items/{itemId}/reemplazo` · `/cancelacion` |
| R-Retiro, R-Mostrador | 4.1 | `GET /ferreteria/pedidos/{id}/retiro` (QR firmado de un uso y lista; leer en voz alta es local) |
| FE-Alta, FE-Inicio, FE-Pedido, FE-Escanear, FE-Retiro, FE-Catalogo, FE-Importar, FE-Metricas, FE-Movil, FE-MovilEscanear | 4.2 | API del ferretero (lote 4.3, `handyx-ferreterias-be` propuesto), fuera de este contrato. Del lado del especialista se ven como los estados de `PedidoFerreteria` (confirmar, preparar, listo, escanear el QR → retirado) |
| T-Electricidad, T-Tablero, T-TableroPared, T-Cables | H1 ✔ | `POST /taller/ia/tablero` · `POST /taller/ia/presupuesto` (0.10.0); el resto es local |
| T-Informe | H1 ✔ | `POST /trabajos/{id}/adjuntos` (`informe_taller`) |
| OF-Aire, OF-Plomeria, OF-Gas, OF-Albanileria, OF-Cerrajeria | 7.x | Después del deploy: cada oficio suma lo suyo con su versión de contrato |
