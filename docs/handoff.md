# Handoff · PWA Especialista de Handyx

Fecha: 30/10/2026 · Rama: `claude/pensive-hypatia-jajjgm` (PR #1 mergeado; PR #2 abierto con 3.2, 3.3, el plan de la fase 4 y los lotes 4.1 a 4.9) · Bloque 4 · **Fase 4 terminada (sí de diseño dado al arrancar la fase 5; mapa base del 4.3 pendiente). Fase 5: 5.1 y 5.3 a 5.6 hechos; 5.2 en espera de autorizaciones.**
Modelo y esfuerzo de cada lote: según el plan (`docs/rediseno.md`).

Estado: mockup navegable completo con datos de prueba, sistema visual, accesibilidad WCAG 2.2 AA automática y PWA instalable.
**Nada conectado ni desplegado.**

## Fase 5 · Lote 5.6 (trabajo, obras, chat, agenda y soporte)

- `handyx-specialist-be` en tres tandas (`93b0fb6`, `6b322fa`, `ef0e948`; contrato del módulo en `docs/trabajos.md` allá):
  - Trabajo: lista, detalle, salir/empezar/terminar con versión e idempotencia, cancelación con motivo, cambio del acuerdo
    en las dos direcciones. «Terminé» queda `terminado_por_especialista` en la base (el usuario confirma) y se ve
    finalizado; crea el cobro por el total vigente.
  - Obras: adicionales, fin de etapa con su cobro, otro día para una jornada, diario con hasta 4 fotos privadas.
  - Chat cifrado con fotos privadas, contactos, agenda con superposición y avisos sin datos personales.
  - Soporte auditable (eventos inmutables), preferencias, push `no_disponible` sin proveedor y outbox con reintento
    acotado (`npm run avisos:enviar`).
  - Arreglo de seguridad: las URL firmadas aceptaban otra escritura de la firma con la misma decodificación.
- `handyx-client-be` `6af4c3b`: permisos del envío de avisos y aviso `trabajo_cancelado` (contrato `1.0.0-draft.3`).
- `docs/api/openapi.yaml` de este repo corregido donde no coincidía con el contrato en código: mensajes (lista y
  envío de texto o foto) y casos de soporte (lista).
- Pendiente (5.8 o decisión): contrato con archivos para los adjuntos de soporte (hoy, más de 0 es 400), la suscripción
  push cuando haya proveedor, la llamada por número puente (503 sin proveedor de telefonía) y el plan de obra, que lo
  crea la API de usuario.

**Próximo paso**: 5.7 (caja, Mercado Pago y ledger; modelo y esfuerzo en `docs/plan.md`).

## Fase 5 · Lote 5.5 (ubicación en tiempo real y trayectos)

- `handyx-specialist-be` `7dca619` (`docs/viaje.md` allá): `viaje`, `viaje/posiciones` (POST y DELETE) y `llegada` del
  contrato 0.9.0. Posiciones cifradas (30 días, una cada 5 s), trayecto con un OSRM propio y recálculo con dos desvíos,
  geocerca de 80 m que marca la llegada sola, «Ya llegué» auditado (también sin destino exacto) y `pg_notify` sin datos.
- `handyx-client-be` `f98db60`: columnas derivadas en `trips`, contrato del usuario `1.0.0-draft.2` con el viaje en vivo
  por SSE (posición exacta, trayecto y llegada estimada solo mientras se comparte), escucha del canal con reconexión y
  geocodificador Nominatim propio.
- Decisiones 15–17 del plan. **Esquema conciliado** con la rama `fase-4-backend` de la otra sesión (`handyx-client-be`
  `479b689`, `handyx-specialist-be` `1b10a83`): esquema `handyx`, roles `handyx_usuario_app` / `handyx_especialista_app`,
  nombres de TECH-03 y migraciones reversibles. A la otra sesión se le avisó que rebase.
- Pendiente: instancias propias de OSRM y Nominatim (Ignacio), sesiones (5.2) y copiar el contrato del usuario a
  `handyx-client-fe` cuando el bloque 3 rebase.

## Fase 5 · Lote 5.4 (pedidos, negociación y precio sugerido, en `handyx-specialist-be`)

- Commit `5410c95` (contrato del módulo en `docs/pedidos.md` allá): `inicio`, `disponibilidad`, `mapa/barrios`,
  `pedidos` (bandeja paginada y detalle), `propuestas` (enviar, responder, retirar).
- Filtro en el servidor: alta habilitada, rubro habilitado, zonas, ventana vigente y opt-out de urgentes (efecto en la
  siguiente consulta). Antes de contratar solo barrio y círculo desplazado; la dirección y el destino llegan con el trabajo.
- Aceptación en una transacción con versión, `Idempotency-Key` y bloqueo del pedido: dos a la vez → un trabajo y un 409.
  El acuerdo toma la tarifa de la política aprobada y vigente (0 % en la demo); sin política, 503.
- Vencimientos con el reloj del servidor (al leer y en la purga); precio sugerido versionado que publica Operations.
- 16 pruebas de integración nuevas (31 en total). En `handyx-client-be` `47e73bc`: función de zona aproximada y permiso
  de la purga sobre `proposals`.
- Abierto: si «Terminé» cierra el trabajo o espera la confirmación del usuario (decisión de producto, para el 5.6).

## Fase 5 · Lote 5.3 (alta, verificación y privacidad, en `handyx-specialist-be`)

- API de especialista nueva (rama `claude/pensive-hypatia-jajjgm`, commit `5c1cc4b`): los endpoints del alta que usa esta
  app (`perfil`, `perfil/publico`, `alta/datos`, `documentos/{tipo}`, `rubros`, `alta/envio`, `antecedentes/turnos`,
  `antecedentes/turno`, `cuenta/baja`) con el contrato 0.9.0 copiado byte a byte.
- DNI y CUIT/CUIL cifrados con HMAC; documentos privados con URL firmada; antecedentes imposibles de subir; verificación
  solo por Operations (script privado con su rol de base); retención parametrizada (DNI 90 días, ubicación 30) y baja real.
- **Sin el 5.2 no hay sesiones**: las rutas responden 503. La app sigue usando el mock hasta conectar (5.8).
- 18 pruebas unitarias y 15 de integración contra PostgreSQL aislado; cambios del esquema en `handyx-client-be` `6bf939b`.

## Fase 5 · Lote 5.1 (modelo y migraciones, en `handyx-client-be`)

- El esquema compartido vive en `handyx-client-be` (dueño único, ADR-0001), rama `claude/pensive-hypatia-jajjgm`
  (commit `cdea35c`, sobre `fase-1-bases`). Probado contra PostgreSQL 16 local aislado; nada remoto.
- Cubre todo lo que pidió la fase 4 de esta app (obras, diario, adicionales, viaje, precio sugerido, código de email,
  Google y Apple, turnos de antecedentes, contactos y formas de cobro). Diccionario, ERD y tabla de conciliación con el
  contrato 0.9.0 de esta app: `handyx-client-be/docs/data-model.md`.
- **Para esta app**: los estados del contrato 0.9.0 se traducen a los de la base (pedido, etapa, reclamo, baja) hasta
  alinear el contrato en 5.8. Queda una decisión de producto: ¿"Terminé" cierra el trabajo o el usuario lo confirma?

**Próximo paso**: 5.2 (cuentas, sesiones y acceso), Opus 5.5 / xhigh. Necesita autorización para Google Cloud, Apple
Developer y el proveedor de emails antes de conectar los proveedores reales.

## Fase 4 · Lote 4.9 (QA premium y sí de diseño)

- **Página de flujos actualizada** (artifact "Flujos de Handyx Especialistas", privado de Ignacio): 26 recorridos con 114
  capturas, lo que hay que decidir, la calidad del lote y la lista para probar con VoiceOver y TalkBack.
- **Accesibilidad en 4 tamaños** (320, 390, 768 y 1280):
  - La auditoría suma la estructura para lectores: un h1, un main y título propio por pantalla. Encontró 4 problemas:
    - "¡Terminaste!" tenía dos h1: la celebración pasó a h2.
    - Las pantallas de error de carga no tenían h1: `ErrorCaja pantalla` hace del mensaje el título.
    - La 404 no tenía título propio.
  - A 768 px, la grilla de horarios del alta quedaba debajo del botón fijo "Guardar". Arreglado con `scroll-padding`
    para la barra superior, las pestañas y el botón fijo (el foco nunca queda tapado, WCAG 2.4.11).
  - La auditoría vuelve a medir un objetivo tapado por un elemento fijo después de llevarlo a la vista.
  - Calendario angosto: menos espacio entre días (consulta de contenedor). A 320 px pasan de 36 a 39 px de ancho.
- **Rendimiento** (Lighthouse móvil, `e2e/rendimiento.cjs` sobre el build de producción y una API ficticia local):
  - **El mapa arranca con la primera interacción** (tocar, deslizar, una tecla) o con "Ver el mapa"; antes se ve el texto
    de la zona. En camino y el pedido entrante lo cargan al aparecer (`inmediato`). Inicio: de 61 a 84–86.
  - Entrar se exporta con su contenido: solo la cabecera lee `?motivo=` (antes toda la pantalla esperaba al JS). 88 → 96.
  - Sesión y perfil se piden a la par en la guardia.
  - `preconnect` al dominio de la API cuando el origen es `http`.
  - Cuenta espera al sello, los rubros y el fee antes de mostrarse: el salto de diseño bajó de 0,31 a 0,03.
  - La imagen de la 404 ya no se precarga en todas las pantallas (su árbol viaja en cada HTML exportado).
  - Resultado: públicas 96–97; con sesión 83–90; accesibilidad 96–100.
- **Probado y descartado** (no cambian el LCP): recortar Archivo de 88 a 44 KB y cortar el prefetch de las pestañas.
  El límite es el armado en el navegador detrás de la sesión (~3,5 s en Slow 4G simulado).

### Comandos del lote 4.9 (30/10/2026, local)

| Comando | Resultado |
|---|---|
| `npm run lint` · `typecheck` | OK |
| `npm test` | 144 pruebas: 142 OK y 2 omitidas (sincronías con otros repos) |
| `npm run e2e` | 26/26 (M1 prueba "Ver el mapa"; M3 espera el texto antes de activar el mapa) |
| `npm run accesibilidad` (390, `ANCHO=320x568`, `768x1024`, `1280x800`) | 0 violaciones axe; 0 problemas de teclado, foco, zoom, movimiento y estructura |
| `npm run capturas` · `capturas:docs` | 59/59 y 118/118 |
| `node e2e/rendimiento.cjs` | Ver arriba: 5 de 14 pantallas en 90 o más |
| `build:hostinger` con API ficticia | OK, sin fixtures ni banner |

**Pendiente para cerrar la fase 4**:
1. Ignacio: sí de diseño sobre la página de flujos, y decidir si el rendimiento con sesión (83–90) alcanza para la fase 5
   o si se prerenderiza el marco de cada pantalla.
2. Prueba a mano con VoiceOver (iPhone) y TalkBack (Android), con la lista de la página de flujos.
3. Mapa base del 4.3 cuando la red permita bajar OpenStreetMap.

## Fase 4 · Lote 4.8 (agenda, mensajes, cuenta, caja y ayuda)

- **Agenda**, como la demo:
  - El mes con los días marcados (una obra aparece jornada por jornada) y la lista del día, con la hora en un mosaico.
  - Un día sin turnos muestra un Handy.
  - El **detalle del turno** se abre en una hoja, con su estado y el acceso al trabajo o a la oferta.
- **Mensajes**: avatar con iniciales, el estado del pedido, el último mensaje y los no leídos; accesos a Contactos y
  al Centro de ayuda.
- **Chat**:
  - **Respuestas rápidas** según la etapa. Completan el texto y lo mandás vos: nunca se envían solas.
  - **Agregar a contactos** y **Programar turno**: abre Tu precio y vuelve al chat; con trabajo, "Cambiar el turno".
  - `FormPropuesta` se retiró: las propuestas y contraofertas van por Tu precio.
- **Contactos**: solo los agregados desde un chat, guardados en el servidor, sin teléfonos. Sacar uno no borra la
  conversación.
- **Cuenta**:
  - Perfil con iniciales, rubros y el sello verificado solo si lo dice el servidor, y el contador del fee.
  - Filas a Datos personales (solo lectura), Rubros y zonas, Cómo te paga el cliente, Caja, Tu alta, Notificaciones,
    Centro de ayuda y Privacidad y baja.
- **Cómo te paga el cliente**: Mercado Pago, efectivo o los dos (al menos uno). La cuenta de Mercado Pago figura
  vinculada o no; vincularla es de la fase 5, con Mercado Pago, y Handyx nunca pide la contraseña.
- **Caja**:
  - Lo cobrado en el mes, con lo verificado y lo informado aparte, y los totales por estado.
  - **Filtros por estado** y movimientos con su **desglose**, que se abre con la franja gris.
- **Centro de ayuda**:
  - **Temas en pastillas** con preguntas que se abren. Las respuestas repiten reglas que la app ya cumple
    (`lib/ayuda.ts`).
  - Tus casos y "Abrir un caso".
- **Contrato 0.9.0**: contactos (`Conversacion.contactoId`) y formas de cobro.
- **Corregido en la revisión**:
  - El desglose de la Caja se veía con la franja cerrada (el `display: grid` le ganaba a `hidden`).
  - A 320 px con el texto al 200 %, una fila con una palabra larga ("Notificaciones") se salía de la pantalla: la fila
    del kit ahora la parte.
- **Pruebas**:
  - Unitarias de la caja (el mes en hora de Buenos Aires y los filtros).
  - 2 del mock: contactos y formas de cobro.
  - Recorridos B, F, I y J actualizados.
  - **Recorrido Q nuevo**: detalle del turno, chat (contacto, respuesta rápida que no se manda sola, programar turno y
    volver), contactos, formas de cobro (al menos una), caja con filtro y desglose, y centro de ayuda.
  - 5 pantallas y la hoja del turno en accesibilidad y capturas.

### Comandos del lote 4.8 (30/10/2026, local)

| Comando | Resultado |
|---|---|
| `npm run lint` · `typecheck` | OK |
| `npm test` | 144 pruebas: 142 OK y 2 omitidas (sincronías con otros repos) |
| `npm run build` | OK |
| `npm run e2e` | 26/26 recorridos (B, F, I y J actualizados; Q nuevo) |
| `npm run accesibilidad` (390, `ANCHO=320x568`, `ANCHO=1280x800`) | 0 violaciones axe; 0 problemas de teclado, foco, zoom y movimiento. A 320 px, los días de los calendarios miden 36 a 38 px de ancho, como antes (por encima de los 24 px de WCAG 2.5.8) |
| `ANCHOS=` 7 tamaños `npm run capturas` | 413/413 sin desborde y sanitizadas |
| `build:hostinger` con API ficticia | OK: 41 páginas (suma Contactos y las 4 de Cuenta), sin `/catalogo/`, fixtures ni las marcas del panel |

**Próximo paso** (del 4.8): lote 4.9, hecho (ver arriba).

## Fase 4 · Lote 4.7 (obras de varios días)

- **Resumen de la obra** (dentro del trabajo):
  - Anillo de avance (etapas hechas de las totales), la jornada de hoy o la próxima.
  - Acordado, cobrado (con lo verificado aparte) y lo que falta cobrar.
  - Accesos al plan, las jornadas, el diario y los adicionales.
- **Plan de obra**:
  - Las etapas en una línea de tiempo, cada una con sus fechas (salen de sus jornadas), su estado, su importe, lo que
    incluye, sus adicionales y su cobro.
  - **"Terminé esta etapa"** pide confirmación con el desglose. Crea el cobro de la etapa y arranca la siguiente.
  - **Cobro por etapa**: "Ya me pagó: informarlo" la deja "reportado", nunca verificado.
  - Con todas terminadas, **"Cerrar la obra"** lleva al cierre.
- **Jornadas**:
  - El calendario del mes con los días de trabajo marcados, y la lista con el estado de cada uno: hecha, hoy,
    programada, sin avance o con otro día pedido.
  - **"Pedir otro día"**: motivo, día y horario (sumé "Día completo · 9 a 17"). Es una solicitud que no mueve las demás
    jornadas y cambia cuando el cliente acepta.
- **Diario de obra**: el avance del día con una nota corta (280 caracteres) y hasta 4 fotos.
  - Las fotos se ven antes de publicar y quedan solo en memoria; nada se guarda en el navegador.
  - El cliente lo ve, y la jornada del día queda "hecha".
  - La app pide que no se vean personas, documentos ni cosas personales.
- **Adicionales por etapa**: van a la etapa en curso y se cobran con ella; los que no se respondieron se retiran al
  terminarla.
- **Cierre de la obra** (¡Terminaste la obra!):
  - Lo cobrado: verificado, informado sin verificar y lo que falta.
  - Cada etapa con sus adicionales y su cobro.
- **Agenda**: una obra aparece jornada por jornada.
- **Contrato 0.8.0**:
  - Etapas con id, lo que incluyen y su cobro.
  - Jornadas con su cambio pendiente.
  - El diario, con fotos en multipart.
  - `etapaId` en adicionales y pagos.
  - Terminar una etapa.
  - Una obra se cierra solo con todas sus etapas terminadas.
- **Datos de prueba**:
  - Obra nueva de *Cliente de prueba 11*: agendada, 3 etapas en 5 jornadas.
  - La obra de *Cliente de prueba 8*, en curso, ahora tiene jornadas, diario y la etapa 1 cobrada.
  - En el panel: el cliente acepta o rechaza el cambio de jornada.
- **Refactor**: el cobro directo pasó a un componente (`CobroDirecto`), que usan ¡Terminaste! y cada etapa del plan.
- **Pruebas**:
  - 4 unitarias: avance, próxima jornada, fechas por etapa y lo cobrado.
  - 4 del mock: etapas y cobros, cambio de jornada, diario y agenda.
  - Recorrido I actualizado.
  - **Recorrido P nuevo, el "hecho cuando" del lote**: una obra de 3 etapas en 5 jornadas, con el diario, un cambio de
    jornada, un adicional, el cobro de cada etapa y el cierre.
  - 3 pantallas y 2 hojas nuevas en accesibilidad y capturas.

### Comandos del lote 4.7 (29/10/2026, local)

| Comando | Resultado |
|---|---|
| `npm run lint` · `typecheck` | OK |
| `npm test` | 141 pruebas: 139 OK y 2 omitidas (sincronías con otros repos) |
| `npm run build` | OK |
| `npm run e2e` | 25/25 recorridos (I actualizado; P nuevo) |
| `npm run accesibilidad` (390, `ANCHO=320x568`, `ANCHO=1280x800`) | 0 violaciones axe; 0 problemas de teclado, foco, zoom y movimiento. A 320 px, los días de los calendarios (agenda, jornadas y catálogo) miden 36 a 38 px de ancho: 7 columnas no entran a 44 px en 288 px útiles. Están por encima del mínimo de 24 px de WCAG 2.5.8 |
| `ANCHOS=` 7 tamaños `npm run capturas` | 378/378 sin desborde y sanitizadas |
| `build:hostinger` con API ficticia | OK: 36 páginas (suma las 3 de la obra), sin `/catalogo/`, fixtures ni las marcas del panel |

**Siguiente**: lote 4.8 (cerrado, ver arriba).

## Fase 4 · Lote 4.6 (trabajo de punta a punta)

- **Trabajo acordado**:
  - Cliente, fecha, total vigente, dirección exacta con el mapa y "Cómo llegar".
  - Chat y **llamada por la app**: un número puente de Handyx, sin mostrar teléfonos.
  - Una acción principal por estado.
- **Salgo para allá** abre el viaje.
- **Llegada**:
  - **Automática**: el servidor la marca cuando una posición entra en 80 m del destino con precisión de 50 m o mejor
    (geocerca, con la app abierta). Avisa al cliente y la app abre el trabajo.
  - **"Ya llegué"** aparece solo con la ubicación mal (sin permiso, imprecisa, sin señal) o sin compartir, y manda el
    motivo.
- **En curso**:
  - Cronómetro.
  - **"Agregar repuestos o mano de obra"**, con "Opción personalizada" primero y lo habitual del rubro. El precio lo pone
    el especialista.
  - El cliente acepta o rechaza; mientras tanto rige el precio vigente. Se puede retirar lo que no respondió.
- **Terminar**:
  - La confirmación muestra el desglose y avisa si hay adicionales sin respuesta (se retiran y no se cobran).
  - **¡Terminaste el trabajo!**: monto que sube, desglose con la tarifa 0 %, confeti solo si se vio terminar.
  - **Informar el cobro** desde ahí: queda "reportado", nunca verificado.
- **Cambiar la fecha** (pantalla completa): motivo en chips, tira de días y franja. Queda como pedido hasta que el
  cliente acepte.
- **Cancelar**:
  - Primero las alternativas: cambiar la fecha, escribirle, pedir ayuda.
  - Después el motivo y la confirmación. "No me siento a salvo" muestra el 911.
  - Con el trabajo en curso, cancela Operations.
- **Reclamo**: desde el trabajo, como antes (Ayuda con el trabajo elegido).
- **Contrato 0.7.0**:
  - Llegada, con su modo y motivo.
  - Cancelación con motivo.
  - Adicionales y total vigente.
  - Motivo del cambio de fecha.
  - Llamada puente.
  - `eventos` queda para salir, empezar y terminar.
- **Supuestos** (en `docs/rediseno.md` §4.6):
  - Sin compartir la ubicación también hay "Ya llegué".
  - La geocerca de 80 m y 50 m es provisoria.
  - **La llamada puente necesita un proveedor de telefonía pago**: está en la lista de autorizaciones de la fase 5. Hasta
    entonces queda el chat.
- **Corregido en la revisión**:
  - Un adicional aceptado no llegaba al cobro cuando el trabajo ya tenía un cobro pendiente: ahora se actualiza al total,
    y una prueba lo fija.
  - Los errores de Cambiar la fecha y de Cancelar quedaban a la vista después de corregirlos.
  - Con el texto al 200 % a 320 px se salían el cronómetro y el bloque azul del inicio. Además, una obra en curso
    mostraba "72:00:00": el cronómetro queda para los trabajos de un día (las jornadas de obra son del 4.7).
  - "Ver la Caja" en ¡Terminaste! tenía 23 px de alto: ahora tiene el área táctil de 44 px.
  - El ícono de llamar era el de "sin teléfono".
  - "No me siento seguro" pasó a "No me siento a salvo" (texto neutro).
- **Pruebas**:
  - 4 unitarias: respaldo, cronómetro, opciones y franjas.
  - 4 del mock: llegada con motivo, adicionales, cobro por el total vigente, cancelación y llamada.
  - La geocerca, dentro de la prueba del viaje.
  - Recorridos rehechos:
    - C: "Ya llegué" sin compartir y ¡Terminaste!.
    - D: Cambiar la fecha con el foco en el error.
    - M2: llegada automática.
  - Recorrido O nuevo: respaldo con señal imprecisa, llamada, adicional aceptado, ¡Terminaste! con el total, cobro
    reportado y cancelar.
  - 4 pantallas nuevas y la hoja de la llamada en accesibilidad y capturas.

### Comandos del lote 4.6 (29/10/2026, local)

| Comando | Resultado |
|---|---|
| `npm run lint` · `typecheck` | OK |
| `npm test` | 133 pruebas: 131 OK y 2 omitidas (sincronías con otros repos) |
| `npm run build` | OK |
| `npm run e2e` | 24/24 recorridos (C, D y M2 rehechos; O nuevo) |
| `npm run accesibilidad` (390, `ANCHO=320x568`, `ANCHO=1280x800`) | 0 violaciones axe; 0 problemas de teclado, foco, zoom y movimiento; solo días del calendario (agenda y catálogo) por debajo de 44 px a 320 (≥ 30 px), como antes |
| `ANCHOS=` 7 tamaños `npm run capturas` | 357/357 sin desborde y sanitizadas |
| `build:hostinger` con API ficticia | OK: 33 páginas (suma las 4 del trabajo), sin `/catalogo/`, fixtures ni las marcas del panel |

**Siguiente**: lote 4.7 (cerrado, ver arriba).

## Fase 4 · Lote 4.5 (inicio, pedidos y propuesta)

- **Inicio sobre el mapa**:
  - Bloque azul con el saludo y el interruptor grande **"Disponible"** (urgentes ahora), que dice el estado con palabras.
  - Mapa con tus zonas y las zonas aproximadas de los pedidos abiertos.
  - Hoja con programados y obras, "Pedidos para vos", tu próximo trabajo, cobrado del mes y avisos sin leer.
- **Pedido entrante**: un urgente nuevo aparece en una hoja con rubro, zona aproximada, descripción y vigencia en texto
  neutro. "Ver y cotizar" abre el detalle; "Ahora no" deja pasar los urgentes de ese momento (en memoria, no rechaza nada).
- **Tu precio** (`/pedidos/propuesta/`, pantalla completa):
  - Cuándo podés ir: en 30 min, 1 o 2 horas (urgentes), el día que pidió (programados), lo que propuso el cliente
    (contraoferta) u otro día y horario.
  - **"Handyx sugiere $ X · Vos decidís"**, con atajos y "Recibís" con el fee 0 %. La sugerencia dice su fuente.
  - Qué incluye, con frases rápidas.
- **Estado de tu propuesta** en el detalle:
  - Esperando al cliente.
  - **¡El cliente te eligió!**: confeti solo si se vio el cambio, y abre el trabajo.
  - No te eligieron, venció o la retiraste: en gris, sin culpa.
- **Aviso "te eligieron"** (arregla el hallazgo de la fase 3): `VigiaAvisos` consulta cada 20 s y muestra la isla con
  "Ver el trabajo" en cualquier pantalla de la app.
- **Bandeja**: filtros en chips con cantidades y orden por llegada o **"Más cerca"**. Lee la ubicación una vez y calcula en el
  teléfono: no se manda.
- **Avisos**: Nuevos / Antes, deslizar a la izquierda o botón para borrar, y "Borrar todos" con confirmación.
- **Contrato 0.6.0**: `precioSugerido` y `trabajoId` en el detalle del pedido, aviso `te_eligieron` y borrar avisos (uno o
  todos). La tabla de precios del mock es de prueba; **la real la define Product**.
- **Pendiente del 4.5**: las **fotos del pedido** no están en el contrato todavía. Se agregan cuando `handyx-client-be` las
  defina (URL firmada de corta duración, como las del chat).
- **Corregido en la revisión visual**:
  - Los chips largos se salían de la pantalla con el texto al 200 %: ahora se parten en dos líneas.
  - "Ahora no" encadenaba un urgente detrás de otro.
  - El detalle con el trabajo ya acordado decía "La búsqueda terminó".
  - La primera lectura del GPS simulado llegaba en el mismo instante en que se pedía.
- **Pruebas**:
  - 3 unitarias de la propuesta (cuándo, frases).
  - 3 del mock: sugerencia y trabajo en el detalle, aviso "te eligieron" y borrar avisos.
  - Recorrido B rehecho (Disponible → pedido entrante → Tu precio → esperando).
  - Recorrido N nuevo (te eligieron, bandeja por cercanía, avisos).
  - 2 pantallas y 2 hojas nuevas en accesibilidad y capturas.
  - `verificar-bundle` suma las marcas de la tabla de prueba y del panel.

### Comandos del lote 4.5 (29/10/2026, local)

| Comando | Resultado |
|---|---|
| `npm run lint` · `typecheck` | OK |
| `npm test` | 124 pruebas: 122 OK y 2 omitidas (sincronías con otros repos) |
| `npm run build` | OK |
| `npm run e2e` | 23/23 recorridos (B rehecho, N nuevo) |
| `npm run accesibilidad` (390, `ANCHO=320x568`, `ANCHO=1280x800`) | 0 violaciones axe; 0 problemas de teclado, foco, zoom y movimiento (incluidas las hojas del pedido entrante y de borrar avisos); solo días del calendario (agenda y catálogo) por debajo de 44 px a 320 (≥ 30 px), como en el 4.4 |
| `ANCHOS=` 7 tamaños `npm run capturas` | 336/336 sin desborde y sanitizadas |
| `build:hostinger` con API ficticia | OK: 29 páginas (suma Tu precio), sin `/catalogo/`, fixtures, cámara simulada ni la tabla de precios de prueba |

**Siguiente**: lote 4.6 (cerrado, ver arriba).

## Fase 4 · Lote 4.4 (alta guiada)

- **Inicio del alta**:
  - "Completá tu alta" con anillo de progreso (N de 6 listos) y la lista de pasos.
  - Cada paso muestra "Listo", "Falta", "Corregir", "En revisión" o "Cuando quieras".
  - En corrección, lo marcado por Operations va primero, con acceso directo.
- **Pasos** (`?paso=`, pantalla completa en el grupo `(flujo)`, cada uno con su acción fija abajo):
  1. **Tus datos**: una pregunta por pantalla (7), con el teclado y el autocompletado de cada dato. Se guarda en cada
     "Siguiente"; con un error, el foco queda en el campo.
  2. **DNI y CUIT o CUIL**: los números, el DNI con **cámara y marco (frente y dorso)** y la constancia.
  3. **Tu foto**: selfie con **óvalo** y consejos de luz.
  4. **Rubros** en mosaico (Gas y aire piden matrícula).
  5. **Zonas** (en el mapa y en mosaico) y **horarios** en bloques de mañana, tarde y noche por día. No activa pedidos.
  6. **Antecedentes**: elegir día y horario en la oficina de Operations (sin archivos), y cambiar el turno.
- **Resumen**: cada paso con "Ver", "Completar" o "Corregir". Enviar queda deshabilitado mientras falte algo, y dice qué.
- **Estados**:
  - En revisión: línea de tiempo con un Handy esperando; el turno se puede elegir igual.
  - Rechazada: Handy roto, motivo y Ayuda.
  - **"¡Tu alta está habilitada!"**: celebración cuando se ve el cambio, después "Empezar" (Inicio con el modal del fee 0 %).
- **Cámara** (`components/Camara.tsx`):
  - Con la API real, cámara en vivo con `getUserMedia`; sin cámara o sin permiso, elegir una foto.
  - La foto queda solo en memoria hasta mandarla, y la cámara se apaga al salir.
  - En la vista previa el visor es **simulado** y nunca abre la cámara: no hay riesgo de capturar documentos reales.
- **Contrato 0.5.0**:
  - Turnos de antecedentes, con `citaAntecedentes` en el perfil.
  - El especialista reserva el turno; el resultado sigue siendo de Operations.
  - El DNI va con `dorso`.
  - Durante el alta se guardan zonas y franjas, pero no se activan pedidos.
- **`verificar-bundle` frenó una fuga**: el visor simulado de la cámara ("Foto de prueba") estaba en el componente que va a
  producción. Pasó al mock (`data/mock/camara.tsx`, expuesto como `camaraPrueba`, null con la API real), y se sumaron las marcas
  al control.
- **Corregido**: el resumen del alta en corrección decía "Está todo cargado" con el DNI rechazado. El escenario de prueba no
  recalculaba lo que faltaba; ahora sí, y una prueba lo fija.
- **Accesibilidad**:
  - Mosaicos con palabras largas que cortan con guion al 200 %.
  - Tabla de horarios con columnas repartidas, sin desborde a 320 px.
- **Pruebas**:
  - 7 unitarias nuevas: pasos, progreso y horarios.
  - 4 del mock: turnos, disponibilidad durante el alta y corrección.
  - Recorridos A y H rehechos: alta completa con cámara y turno hasta "Empezar"; corrección con acceso directo y reenvío; turno
    en revisión.
  - 7 pantallas nuevas en accesibilidad y capturas.

### Comandos del lote 4.4 (29/10/2026, local)

| Comando | Resultado |
|---|---|
| `npm run lint` · `typecheck` | OK |
| `npm test` | 118 pruebas: 116 OK y 2 omitidas (sincronías con otros repos) |
| `npm run build` | OK |
| `npm run e2e` | 22/22 recorridos (A y H rehechos) |
| `npm run accesibilidad` (390, `ANCHO=320x568`, `ANCHO=1280x800`) | 0 violaciones axe; 0 problemas de teclado, foco, zoom y movimiento; solo días del calendario del catálogo por debajo de 44 px (≥ 30 px) |
| `ANCHOS=` 7 tamaños `npm run capturas` | 322/322 sin desborde y sanitizadas |
| `build:hostinger` con API ficticia | OK: 28 páginas, sin `/catalogo/`, fixtures ni la cámara simulada |

**Siguiente**: lote 4.5 (cerrado, ver arriba).

## Fase 4 · Lote 4.3 (mapa, ubicación en vivo y trayectos)

Detalle completo en `docs/mapa.md`.

- **Bloqueo**:
  - La red del entorno rechaza `overpass-api.de` y `download.geofabrik.de`; la única fuente de los datos de OpenStreetMap es
    Overpass. Ignacio eligió habilitar `overpass-api.de` en la configuración del entorno.
  - Hasta entonces, el mapa se ve sin calles ("Sin calles: falta el mapa base"). El mock no tiene trayectos por calles: la app
    muestra "No pudimos calcular el trayecto" y ofrece Google Maps o Waze.
  - **No se inventaron calles ni recorridos.**
  - Para terminar: `npm run mapa:descargar && npm run mapa:generar`. Después, revisar el peso de las teselas, volver a medir los
    cuadros por segundo con el mapa base y regenerar las capturas.
- **Componente `Mapa`** (MapLibre 6.14.0, BSD-3):
  - Carga diferida: ~283 KB comprimido, y ninguna página lo precarga.
  - Estilo Handyx, con capas de cobertura, zona aproximada, trayecto, precisión, destino, tu posición, radar y barrios.
  - Atribución de OpenStreetMap visible.
  - Sin WebGL, o sin poder bajar el motor, queda la alternativa en texto. Sin teselas, avisa "Sin conexión".
  - El worker de MapLibre se copia a `public/mapa/motor/` en cada build (`scripts/mapa/preparar-motor.mjs`, sin versionar).
- **Contrato 0.4.0**:
  - `zonaMapa` en el pedido (centro corrido por el servidor y radio) y `destino` en el trabajo.
  - `Barrio`, `Posicion`, `Trayecto` y `Viaje`, con 4 endpoints (API, mock, adaptador HTTP y OpenAPI).
  - La posición va siempre en el cuerpo.
- **Pantallas**:
  - Detalle de pedido: el círculo aproximado, sin pin.
  - Detalle de trabajo: "Cómo llegar", con el pin, Google Maps, Waze y "Ver el viaje en el mapa".
  - **En camino** (`/en-camino/?id=`, nueva, a pantalla completa con la hoja arrastrable).
    - Explica para qué es antes de pedir el permiso.
    - Muestra la señal en texto, la llegada estimada, "Dejar de compartir" y "Seguir compartiendo", el aviso de trayecto
      recalculado y "Llegué", que deja de compartir.
  - "Salgo hacia el lugar" abre En camino.
- **Mock**:
  - GPS simulado controlado desde el Panel: señal normal, imprecisa, sin señal o sin permiso; desviarme; velocidad ×6.
  - El servidor emulado calcula el trayecto con la primera posición, lo recalcula después de 2 desvíos con buena precisión y
    deja de compartir al llegar o cancelar.
  - Centros de barrio aproximados y destinos sintéticos hasta tener los datos.
- **Datos**:
  - `src/mapa/osm.ts` arma las capas (incluido el mar desde las líneas de costa), los barrios y el grafo de calles con manos
    únicas.
  - `src/mapa/grafo.ts` calcula trayectos por tiempo (Dijkstra).
  - Probado con una ciudad sintética y de punta a punta con un extracto sintético, y MapLibre dibujó sus teselas.
- **Pruebas**:
  - 20 unitarias nuevas (geo, OSM y grafo, mock del viaje).
  - E2E M1–M3. C se actualizó porque ahora "Salgo hacia el lugar" abre el mapa.
  - Accesibilidad de En camino compartiendo; botones de zoom de 44 px.

### Comandos del lote 4.3 (29/10/2026, local)

| Comando | Resultado |
|---|---|
| `npm run lint` · `typecheck` | OK |
| `npm test` | 109 pruebas: 107 OK y 2 omitidas (sincronías con otros repos) |
| `npm run build` | OK, 29 páginas + `out/sw.js` |
| `npm run e2e` | 22/22 recorridos (nuevos: M1–M3) |
| `npm run accesibilidad` (390, `ANCHO=320x568`, `ANCHO=1280x800`) | 0 violaciones axe; 0 problemas de teclado, foco, zoom y movimiento; solo días del calendario del catálogo por debajo de 44 px (≥ 30 px) |
| `ANCHOS=` 7 tamaños `npm run capturas` | 273/273 sin desborde y sanitizadas |
| `build:hostinger` con API ficticia | OK: 28 páginas, sin `/catalogo/` ni fixtures; el motor del mapa no se precarga |
| Cuadros por segundo (arrastre en En camino, CPU ×4) | 57 (sin mapa base: hay que volver a medir) |

**Pendiente de autorización (fase 5)**: el motor de trayectos real (OSRM o Valhalla propio en Render, o un servicio con plan
gratis). No se contrató nada.

**Siguiente**: lote 4.4 (ver arriba). El mapa base queda para el final de la fase 4 (decisión de Ignacio).

## Fase 4 · Lote 4.2 (carga, bienvenida y cuenta)

- **Carga** (`PantallaCarga`):
  - El fondo pasa por azul, amarillo y noche hasta el hueso.
  - Los 5 Handys saltan, cae el logo de Handyx y terminan de la mano con un saltito final.
  - Dura 2,5 s y se saltea tocando o con una tecla. Con "reducir movimiento" es un cuadro quieto de 0,6 s.
  - La `Puerta` redirige cuando terminaron la carga **y** la consulta de la cuenta (`lib/destino.ts`).
- **Bienvenida**: 3 láminas ("Vos ponés tu precio", "La plata va directo a vos", "0 % de tarifa hasta el 10/12"). Se pasan con el
  dedo, las flechas, los puntos o "Siguiente". Al final: "Crear cuenta" o "Ya tengo cuenta".
- **Entrar**:
  - Google en todos los dispositivos; Apple solo en iPhone, iPad y Mac (`lib/dispositivo.ts`); o email y contraseña.
  - Con `?motivo=sesion` dice "Hola de nuevo": la hoja de sesión expirada lleva ahí.
- **Crear cuenta** en 3 pasos (email, contraseña con medidor de fuerza, aceptaciones sin tildar) → **Verificar** con un código de
  6 números → **Cuenta creada**, con celebración y el aviso del fee 0 %.
  - Verificar: vencimiento, intentos que quedan, reenvío con espera y "Cambiar el email".
  - Una cuenta nueva de Google o Apple pasa por **Un paso más** (aceptaciones).
- **Recuperar** → Revisá tu correo → Contraseña nueva → Tu contraseña cambió, o Enlace vencido. El token sale de la URL apenas se lee.
- **Contrato 0.3.0** (`docs/contracts.md`):
  - `Sesion.cuenta` suma `emailVerificado` y `terminosAceptados`.
  - 7 endpoints `/v1/auth/*` en la API, el mock, el adaptador HTTP y el OpenAPI.
  - El mock exige terminar la cuenta antes de usar el resto (403).
  - `version.ts` estaba vacío desde el lote 2.1: se restauró, y ahora una prueba lo compara con el OpenAPI.
- **Solo en la vista previa**:
  - Google y Apple muestran cuentas de prueba en una hoja.
  - El código (482913) y los enlaces de recuperación se ven en pantalla.
  - En producción (`ayudasPrueba = null`) los botones de Google y Apple no aparecen hasta el lote 5.2.
  - `verificar-bundle` controla que no se filtren los tokens ni los correos de prueba.
- **Corregido en el camino** (anterior a 4.2):
  - Una contraseña incorrecta abría "Tu sesión expiró", porque `useAccion` tomaba todo 401 como sesión vencida. Se agregó
    `useAccion({ publica: true })` y se fija en L5.
  - El id del título de `Hoja` era fijo; ahora sale de `useId`.
- **E2E**:
  - Se actualizaron A y F.
  - Recorridos nuevos:
    - L1: carga, láminas y sin Apple en Linux.
    - L2: Apple en iPhone → aceptar → alta.
    - L3: Google con una cuenta existente.
    - L4: código incorrecto.
    - L5: recuperar y contraseña nueva.
    - L6: enlace vencido.
  - `npm run accesibilidad` suma verificar y el foco al primer error del registro.

### Comandos del lote 4.2 (29/10/2026, local)

| Comando | Resultado |
|---|---|
| `npm run lint` · `typecheck` | OK |
| `npm test` | 89 pruebas: 87 OK y 2 omitidas (sincronías con otros repos) |
| `npm run build` | OK, 28 páginas + `out/sw.js` |
| `npm run e2e` | 19/19 recorridos (nuevos: L1–L6) |
| `npm run accesibilidad` (390, `ANCHO=320x568`, `ANCHO=1280x800`) | 0 violaciones axe; 0 problemas de teclado, foco, zoom y movimiento; solo días del calendario del catálogo por debajo de 44 px (≥ 30 px) |
| `ANCHOS=` 7 tamaños `npm run capturas` | 266/266 sin desborde y sanitizadas |
| `build:hostinger` con API ficticia | OK: 27 páginas, sin `/catalogo/`, fixtures, tokens ni cuentas de prueba |

**Pendiente de autorización (fase 5)**:
- Cuenta de Apple Developer (≈ USD 99 al año).
- Proyecto de Google Cloud con OAuth.
- Proveedor de email transaccional.

No se contrató nada.

**Siguiente**: lote 4.3 (ver arriba).

## Fase 4 · Lote 4.1 (marca Handyx, sistema visual v2 y kit)

- **Marca**: todos los textos visibles dicen Handyx ("Tarifa de Handyx", "Verificado por Handyx", "Handyx no te cobra tarifa…",
  "Handyx responde…"). Son 49 textos en 17 archivos, más los selectores de los E2E. Los personajes siguen siendo "los Handys". Los
  identificadores del contrato (`feeHandy`…) no cambian: son de `handyx-client-be`.
- **Kit v2** en `src/kit/`:
  - Estilos en `kit.css` (tokens v2, prefijo `hx-`) y lógica pura con 13 pruebas en `logica.ts`.
  - Barra superior con título grande que colapsa, pestañas flotantes y hoja arrastrable con 3 alturas.
  - Isla de avisos y confeti.
  - Botón fijo, mosaicos, chips, tira de días, calendario del mes y selector de hora con ruedas.
  - "Handyx sugiere · Vos decidís", monto que sube, avatar con iniciales, filas, línea de tiempo, estado vacío y tilde.
  - Handys contentos nuevos en `public/handys/`.
  - Detalle en `docs/componentes.md` y reglas en `docs/diseno.md` → "Kit Handyx v2".
- `ProveedorIsla` y `kit.css` ya están en el layout raíz. Las pantallas actuales todavía no usan el kit: se rehacen en los lotes
  4.2–4.8.
- **Catálogo** `/catalogo/`:
  - Solo existe en el mock, porque `page.mock.tsx` se vuelve página por `pageExtensions` en `next.config.ts`.
  - `verificar-bundle` agrega la marca "Catálogo del kit" y detectó una fuga real: el título del catálogo estaba en `RUTAS`, que
    entra al bundle de producción. Se sacó.
- **Corregido en el camino**:
  - Textos ocultos de la tira de días que ensanchaban la página (botón sin posicionar).
  - Error de hidratación del contador de montos.
  - Montos con decimales mientras suben.
  - El "$" que quedaba solo en una línea.
  - Mosaicos que no crecían con el texto.
- **E2E**: recorrido K (kit en el catálogo: mosaicos, precio, días, calendario, ruedas con teclado, isla, hoja, barra que
  colapsa, celebración sin confeti con "reducir movimiento"). `npm run accesibilidad` también comprueba que el confeti aparezca
  sin esa preferencia.

### Comandos del lote 4.1 (29/10/2026, local)

| Comando | Resultado |
|---|---|
| `npm run lint` · `typecheck` | OK |
| `npm test` | 79 pruebas: 77 OK y 2 omitidas (sincronías con otros repos) |
| `npm run build` | OK, 24 páginas (con `/catalogo/`) + `out/sw.js` |
| `npm run e2e` | 13/13 recorridos (nuevo: K) |
| `npm run accesibilidad` (390, `ANCHO=320x568`, `ANCHO=1280x800`) | 0 violaciones axe; 0 problemas de teclado, foco, zoom y movimiento; solo días de calendario por debajo de 44 px (≥ 30 px) |
| `ANCHOS=` 7 tamaños `npm run capturas` | 231/231 sin desborde y sanitizadas |
| `build:hostinger` con API ficticia | OK: 23 páginas, sin `/catalogo/` ni fixtures |

**Siguiente**: lote 4.2 (cerrado, ver arriba).

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
- **Sellos de habilitación**: "Verificado por Handyx" solo con `verificado` del servidor (sin cambios: se revisó).
- **Revisión de flujos** (después del lote): `CAPTURAS=/ruta npm run e2e` guarda una captura por paso (≈70, numeradas), con la
  barra fija abajo y las hojas a la vista.
  - Bug corregido: en Caja, al avanzar y al cancelar un trabajo, la hoja se cerraba antes de refrescar los datos. Ahora el refresco va
    dentro de la acción, y el recorrido C lo verifica.
  - Pendientes de producto que salieron de la revisión (sin implementar):
    - El resumen del alta en corrección se contradice.
    - Falta el aviso "Aceptaron tu propuesta" y un acceso al trabajo.
    - Faltan "contraseña nueva" y "verificar email".
    - Las pestañas de la bandeja quedan cortadas a 390 px.
    - La caja es larga y no tiene filtros.

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

**Próximo paso** (actualizado el 29/10/2026):
- Ignacio reorganizó el plan en 6 fases: **fase 4 = rediseño premium Handyx** (lotes 4.1–4.9, `docs/rediseno.md`), fase 5 =
  backend y fase 6 = deploy.
- Las decisiones del rediseño están tomadas (`docs/rediseno.md` §8):
  - Llegada automática con botón de respaldo.
  - Mapa propio con ubicación en vivo y trayectos.
  - Código de 6 dígitos para verificar el email.
  - Entrar con Google y con Apple (Apple solo en dispositivos Apple).
  - Adicionales y obras de varios días.
  - "Handyx sugiere" y marca Handyx en todos los textos.
  - Sin cupones durante el fee 0 %.
  - Pantalla de carga con los Handys de la mano.
- Empieza el lote **4.1**: marca Handyx, sistema visual v2 y kit.
- Las imágenes nuevas de los Handys se generan con `docs/handys-prompt.md`. Hasta que lleguen, se usan las actuales animadas.
- Antes de la fase 5 hace falta autorizar las cuentas y costos de §8: Apple Developer, Google Cloud, emails y motor de trayectos.


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
