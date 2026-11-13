# Plan por olas · desarrollo del diseño completo (bloque Taller)

Propuesto el 08/11/2026 para el OK de Ignacio. Reemplaza el **orden** de `docs/herramientas.md` §5 (H1 ✔ → D → V → H0
→ O → R → G → Q → deploy) por **olas**: cada ola agrupa lotes que se pueden desarrollar **al mismo tiempo**, en sesiones
separadas, porque no se pisan. Las fases y su contenido siguen en `docs/herramientas.md`; el diseño, en el lienzo
privado (fuente en `design/deluxe/`, decisiones en `docs/rediseno-deluxe.md`). Nada se desarrolla hasta el OK.

## 1. Cómo funciona una ola

- **Lote = una sesión de Claude Code = un repo principal.** Dentro de una ola, los lotes corren a la vez; la ola
  termina con un **lote de cierre** que integra, prueba todo junto y deja la documentación al día.
- **El contrato se define antes, una sola vez.** La ola 0 escribe el contrato completo del bloque en
  `handyx-client-be` (dueño único), así las olas siguientes trabajan en paralelo sin cambiarlo. Si un lote necesita un
  cambio de contrato, lo anota en su informe y lo aplica **solo** el lote de backend de esa ola (un único escritor);
  sube la versión y lo copia a `handyx-specialist-be` y a la PWA.
- **Archivos sin dueño compartido.** La ola 0 parte la PWA por dominio (`data/api/<dominio>.ts`,
  `data/mock/<dominio>.ts`, `data/http/<dominio>.ts`, `app/rutas/<dominio>.ts`, una prueba E2E por recorrido), para
  que cada lote toque solo lo suyo. Lo común (kit, barra, cabecera, contratos) cambia únicamente en la ola 0 o en un
  cierre.
- **Ramas:** cada lote en `ola-<n>/<lote>` desde la rama de la ola; el cierre fusiona en
  `claude/pensive-hypatia-jajjgm`. Hoy las sesiones solo pueden subir a su rama asignada: **necesita tu OK** (§7).
- **Mock primero, backend en paralelo.** Las pantallas arrancan en el mock (banner «Datos de prueba» y Panel de prueba
  que hace de cliente, de ferretería y de Operations) mientras el backend de la misma ola implementa el contrato. El
  cierre conecta el adaptador `http` y corre los E2E contra la API local.
- **Terminado** significa, en cada lote: pruebas unitarias, el E2E de sus recorridos (los `RC-*` del lienzo pasan a
  ser pruebas), axe en 0, áreas táctiles ≥ 44 px, **sin textos fuera de su caja con las fuentes reales** (los chequeos
  `revisar`, `medir` y `quiebres` del lienzo pasan al CI en la ola 0), `lint`, `typecheck`, `build`, docs (TECH-12) y
  la revisión contra las pantallas del lienzo.
- **Reglas de siempre:** datos sintéticos, nada en el navegador, nada remoto ni pago sin autorización, voseo y
  `$ 45.000`, sin comisión al especialista, reportado ≠ verificado, cargar ≠ verificar.

## 2. Punto de partida (lo que ya existe)

- **PWA del especialista** (`handyx-specialist-fe`): 38 pantallas de las fases 2 a 4 con el kit v2 (`src/kit/`),
  mapa y viaje, alta guiada, pedidos y propuestas, trabajo, obras (plan, jornadas, diario), chat, caja, cuenta y el
  Taller de Electricidad completo (H1). Contrato **0.10.0**.
- **Backend** (fase 5 ✔): `handyx-client-be` (esquema, 50 modelos, contrato v1) y `handyx-specialist-be` (acceso con
  Google/Apple y código, alta, pedidos, viaje, trabajos y obras, chat con archivos privados, caja, avisos). Nada
  desplegado.
- **Diseño** (D.1 ✔): 150 pantallas del lienzo, 16 recorridos y 17 flujos. Todas están asignadas a un lote (§5).
- **Pendientes viejos:** mapa base OSM (4.3) y revisión del 4.9; se cierran en el lote 1.3 si se destraban.

## 3. Resumen

| Ola                                      | Objetivo                                                                   | Lotes en paralelo             | Depende de |
| ---------------------------------------- | -------------------------------------------------------------------------- | ----------------------------- | ---------- |
| **0 · Cimientos**                        | Contrato del bloque, kit v3, PWA partida por dominio, base 3D              | 0.1 · 0.2 · 0.3 (+ cierre)    | —          |
| **1 · Entrar y trabajar**                | Acceso, registro, onboarding, Inicio y el flujo del pedido, cuenta         | 1.1 a 1.5 (+ cierre)          | Ola 0      |
| **2 · El taller del día a día**          | Pestaña Taller, agenda, ingresos, presupuestos, Modo trabajo, equipamiento | 2.1 a 2.5 (+ cierre)          | Ola 1      |
| **3 · Obras, equipo, mensajes y camino** | Obras completas, equipo y búsquedas, chat nuevo, Camino Handyx             | 3.1 a 3.6 (+ cierre)          | Ola 2      |
| **4 · Ferretería**                       | Ferretería en la app, panel web y app del ferretero, su backend            | 4.1 a 4.3 (+ cierre)          | Ola 2 (\*) |
| **5 · Pulido y QA**                      | Movimiento, modelos Meshy, QA del bloque, revisión técnica, demo           | 5.1 a 5.4                     | Olas 3 y 4 |
| **6 · Deploy**                           | Fase 6 de `docs/plan.md`, con go/no-go                                     | 6.1 a 6.3 (secuencial)        | Ola 5      |
| **Después del deploy · Oficios**         | H2 a H6, de a dos oficios por ola                                          | 7.1 · 7.2, después 7.3 · 7.4… | Ola 6      |

(\*) La ola 4 puede correr **a la vez que la 3** si querés más velocidad: solo necesita el contrato (ola 0) y los
materiales y precios (lote 2.2). Las dos tocan la pantalla de repuestos de la obra; lo ordena el cierre de la 3.

Sesiones simultáneas por ola: 3, 5, 5, 6 y 3 (o 9 si la 3 y la 4 van juntas), más el cierre de cada una.

## 4. Las olas en detalle

Modelo y esfuerzo por lote. Criterio: **Opus 5.5** para arquitectura, seguridad, 3D/AR y pantallas con lógica;
**Sonnet 5.5** para pantallas sobre el kit ya hecho, integración y QA; **Haiku 5.5** solo para tareas mecánicas
(copiar contratos, capturas, sincronizar docs) dentro de un lote.

### Ola 0 · Cimientos

| Lote                                   | Repo                          | Modelo / esfuerzo | Alcance                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| -------------------------------------- | ----------------------------- | ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **0.1 Contrato 0.11 del bloque**       | `handyx-client-be` (+ copias) | Opus 5.5 / xhigh  | DTO, estados y endpoints de todo lo que se ve en el lienzo: segunda verificación (TOTP, códigos de respaldo, dispositivos), registro por pasos que se retoma (domicilio, selfie, DNI, CUIT, certificados por rubro con matrícula obligatoria en Gas y Aire, antecedentes por archivo), presupuestos con versiones, lista de precios y catálogo de nombres, ingresos y gastos, equipamiento (detalle, préstamos, baja), Modo trabajo (tareas, informe, conformidad), obra nueva y jornadas (tareas, avance, horario), repuestos con origen, equipo (invitaciones, búsquedas, postulaciones, reparto), chat (reacciones, edición, borrado lógico, fotos y videos, grupos y miembros), ferreterías (catálogo, pedido, estados, QR de retiro firmado) y Camino (progreso, hitos, canje). **Sin comisión al especialista, nunca** (`feeHandy`). OpenAPI regenerado, diseño del esquema nuevo (ERD) y matriz de permisos, sin migraciones todavía. Copia byte a byte a la PWA y a `handyx-specialist-be`. |
| **0.2 Kit v3 y PWA por dominio (D.2)** | `handyx-specialist-fe`        | Opus 5.5 / high   | Tokens y piezas del lienzo: cabecera azul con Disponible, barra de vidrio de 5 pestañas (**Taller** en lugar de Agenda), tarjeta con franja, mosaicos, chips, botón con base, hoja con la pantalla detrás, burbuja de chat y avatar de grupo, línea de tiempo, ruedas de hora, teclado de precio, stepper, cifras con ancho normal en mosaicos chicos, vacíos y errores con SVG propios (ciudad, escudo verificado, remera, desenchufado). Catálogo en `/catalogo/`. Pantallas **D6-Error, D6-Fallo y X-Escritorio** (solo celular). Quitar el modal y el contador del «0 % durante la demo». Partir `data/api`, mock, adaptador, rutas y OpenAPI por dominio. Llevar los chequeos de desbordes con fuentes reales al CI.                                                                                                                                                                                                                                                                           |
| **0.3 Base 3D nativa (D.4)**           | `handyx-specialist-fe`        | Opus 5.5 / high   | Visor 3D con gestos, luces y materiales comunes, alternativa sin WebGL, AR común (generaliza `BotonAr` de H1.4) y presupuesto de rendimiento para gama baja (Moto E20). Lo usan el escaneo 3D (2.4), el regalo y el camino (3.4).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| **0.Z Cierre**                         | los tres                      | Sonnet 5.5 / high | Integrar 0.2 y 0.3, verificar copias del contrato, CI verde, guía para los lotes de la ola 1.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |

0.2 y 0.3 tocan el mismo repo pero carpetas distintas (`src/kit`, `src/data` y `src/app` contra `src/tres`); si
preferís menos riesgo, 0.3 arranca cuando termina 0.2.

### Ola 1 · Entrar y trabajar

| Lote                                            | Repo                                        | Modelo / esfuerzo | Alcance (pantallas del lienzo)                                                                                                                                                                                                                                                                                                                                       |
| ----------------------------------------------- | ------------------------------------------- | ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **1.1 Acceso (V.1)**                            | PWA                                         | Opus 5.5 / high   | Bienvenida con la ciudad, iniciar sesión (email o teléfono y contraseña, Google, Apple, código), segunda verificación al entrar, recuperar la contraseña, código. Recorrido `RC-Login`.                                                                                                                                                                              |
| **1.2 Registro y onboarding (V.2–V.4)**         | PWA                                         | Opus 5.5 / high   | Registro en 10 pasos con barra y retomar, estado del alta («estamos evaluando tu perfil…»), habilitado, permisos, cómo funciona, primeros pasos. Recorrido `RC-Onboarding`.                                                                                                                                                                                          |
| **1.3 Núcleo: el pedido (D.5)**                 | PWA                                         | Opus 5.5 / high   | Inicio con mapa y Disponible en la cabecera, Inicio con tu día, tu recorrido, pedido flotante, detalle, tu precio con la cinta y el teclado, fecha y horario a medida, revisar y enviar, propuesta enviada, trabajo, en camino, informar el cobro. Mapa base OSM si se destraba. Recorridos `RC-Pedido` y `RC-Dia` (parte de llegada).                               |
| **1.4 Cuenta, seguridad, avisos y ayuda (D.6)** | PWA                                         | Sonnet 5.5 / high | Cuenta completa y sus seis secciones, seguridad, app autenticadora, avisos, ayuda. Recorrido `RC-Cuenta`.                                                                                                                                                                                                                                                            |
| **1.5 Backend de acceso y registro (V.5)**      | `handyx-client-be` + `handyx-specialist-be` | Opus 5.5 / xhigh  | Migraciones de cuentas y registro; TOTP con secreto cifrado, códigos de respaldo y dispositivos; SMS detrás de un adaptador que falla cerrado (503) sin proveedor; pasos del registro que se retoman; archivos sensibles (antecedentes cifrados, solo verificación, nunca a IA, **se borran al verificar**), matrícula obligatoria por rubro, scripts de Operations. |
| **1.Z Cierre**                                  | todos                                       | Sonnet 5.5 / high | Adaptador `http` de lo nuevo, E2E contra la API local, **revisión de seguridad** del diff de acceso y archivos sensibles (perfil `cybersecurity-arquitect`, Opus 5.5 / high), docs y handoff.                                                                                                                                                                        |

### Ola 2 · El taller del día a día (H0)

| Lote                                                           | Repo           | Modelo / esfuerzo | Alcance (pantallas del lienzo)                                                                                                                                                                                                                                                                                |
| -------------------------------------------------------------- | -------------- | ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **2.1 Pestaña Taller, agenda e ingresos (H0.3)**               | PWA            | Sonnet 5.5 / high | Pestaña Taller con sus accesos, agenda (pasadas, hoy, futuras y el mes), ingresos y gastos, cargar un gasto. Recorrido `RC-Agenda`.                                                                                                                                                                           |
| **2.2 Presupuestos y lista de precios (H0.2)**                 | PWA            | Opus 5.5 / high   | Presupuestador, agregar un material en un paso con opciones resumidas y material nuevo, agregar varios, lista de precios, foto del corralón leída **en el teléfono** (sin enviar la foto), revisar lo leído, detalle e historial, mano de obra. Recorrido `RC-Presupuesto`.                                   |
| **2.3 Modo trabajo y cierre (H0.4, H0.4b)**                    | PWA            | Opus 5.5 / high   | Modo trabajo, herramientas a mano con «Pedir ayuda», pedir ayuda (y buscar un profesional nuevo), agenda desde el trabajo, antes y después (deslizar y lado a lado), informe que se completa solo, conformidad y garantía. Recorrido `RC-Dia` (cierre).                                                       |
| **2.4 Equipamiento y herramientas del teléfono (H0.5, H0.1b)** | PWA            | Opus 5.5 / xhigh  | Tu equipamiento, categoría, agregar con foto o código de barras, detalle con historial, prestar, mover, «ya no la tengo»; herramientas para todos: medir con la cámara (AR), escanear en 3D, modelo 3D, nivel y plomada, linterna, lupa, conversor. Recorridos `RC-Equipamiento` y `RC-Taller` (parte común). |
| **2.5 Backend de H0 (H0.6)**                                   | ambos backends | Opus 5.5 / high   | Presupuestos y versiones (precio fijo o que se actualiza y aviso), lista de precios y catálogo de nombres sin precios, gastos e ingresos, equipamiento, tareas del Modo trabajo, informe, conformidad y garantía; lado del usuario (aceptar el presupuesto, dar conformidad) en `handyx-client-be`.           |
| **2.Z Cierre**                                                 | todos          | Sonnet 5.5 / high | Integración, E2E, revisión de la pestaña Taller completa, docs.                                                                                                                                                                                                                                               |

Decisión antes de 2.4: dónde se procesa el escaneo 3D (en el teléfono o, con permiso, en el servidor de Handyx).

### Ola 3 · Obras, equipo, mensajes y Camino

| Lote                                          | Repo           | Modelo / esfuerzo | Alcance (pantallas del lienzo)                                                                                                                                                                                                                                                                                                                                      |
| --------------------------------------------- | -------------- | ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **3.1 Obras (O.1–O.3, O.1b, O.2)**            | PWA            | Opus 5.5 / high   | Tus obras, obra nueva, la obra, la jornada con sus hojas (horario, tarea, avance), mover jornadas, repuestos de la obra con el origen (lo consigo yo o ferretería adherida), propuesta de obra. Recorridos `RC-Obra` y `RC-Repuestos` (parte «lo consigo yo»).                                                                                                      |
| **3.2 Equipo y búsquedas (O.4, O.5)**         | PWA            | Opus 5.5 / high   | Equipo de la obra, invitar, reparto del pago, buscar un profesional, «te buscan para una obra» en el Inicio de otro, detalle y postulación, postulantes, perfil como lo ve un cliente. Recorrido `RC-Equipo`.                                                                                                                                                       |
| **3.3 Mensajes y chat (O.6)**                 | PWA            | Opus 5.5 / high   | Lista, chat con un cliente, chat de la obra con mensajes pegados abajo, reacciones y acciones, editar, borrar para todos, seleccionar, sacar o elegir fotos y videos, mandar tarjetas, grupo y agregar personas. Recorridos `RC-Chat` y `RC-Mensajes`.                                                                                                              |
| **3.4 Camino Handyx (G.0–G.4)**               | PWA            | Opus 5.5 / high   | Tu camino, kit de bienvenida (talle y manual en la app, impreso o los dos), manual, camino de trabajos, mini caminos, el regalo (3D nativo de 0.3), canje, vitrina, insignias, áreas (concepto). Recorrido `RC-Camino`.                                                                                                                                             |
| **3.5 Backend de obras, equipo y chat (O.7)** | ambos backends | Opus 5.5 / xhigh  | Obra nueva, jornadas y tareas, repuestos con estado y origen, invitaciones con código que vence, búsquedas visibles **solo** para verificados de la zona y que cierran solas, postulaciones, reparto registrado (sin mover plata), chat con edición, reacciones, **borrado lógico con retención**, videos privados, grupos; lado del usuario en `handyx-client-be`. |
| **3.6 Backend del Camino (G.1, G.4)**         | ambos backends | Opus 5.5 / high   | Progreso calculado por el servidor solo con lo verificado, hitos y premios sin azar, antifraude (tope por cliente, monto mínimo, revisión antes de entregar), canje con dirección cifrada y script de Operations.                                                                                                                                                   |
| **3.Z Cierre**                                | todos          | Sonnet 5.5 / high | Integración, E2E, revisión de seguridad del chat y de las búsquedas (Opus 5.5 / high), docs.                                                                                                                                                                                                                                                                        |

### Ola 4 · Ferretería (R)

| Lote                                                            | Repo                                        | Modelo / esfuerzo | Alcance (pantallas del lienzo)                                                                                                                                                                                                                             |
| --------------------------------------------------------------- | ------------------------------------------- | ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **4.1 Ferretería en la app (R.0, R.0b, R.1)**                   | PWA                                         | Sonnet 5.5 / high | Catálogo por categorías, variantes, tu pedido, comparar ferreterías (precio de cada una), elegir dónde retirar, estado, QR a pantalla completa, lista para el mostrador; primero simulado. Recorridos `RC-Ferreteria` y `RC-Repuestos` (parte ferretería). |
| **4.2 Handyx Ferreterías: panel web y app del ferretero (R.2)** | repo nuevo (§7)                             | Opus 5.5 / high   | Alta, inicio por estado, pedido con stock y reemplazos, escanear, entrega, catálogo y precios, importar la lista, métricas; en el teléfono, escanear y preparar.                                                                                           |
| **4.3 Backend de ferreterías (R.2)**                            | `handyx-client-be` + API del ferretero (§7) | Opus 5.5 / xhigh  | Cuentas y roles del equipo de la ferretería, catálogo e importación, pedidos y estados, reemplazos, QR de retiro firmado y de un solo uso, gasto del profesional al retirar, métricas sin datos personales.                                                |
| **4.Z Cierre**                                                  | todos                                       | Sonnet 5.5 / high | Integración, E2E de punta a punta (profesional ↔ ferretería), revisión de seguridad, docs.                                                                                                                                                                 |

### Ola 5 · Pulido y QA

| Lote                                         | Modelo / esfuerzo   | Alcance                                                                                                                                                   |
| -------------------------------------------- | ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **5.1 Movimiento (D.7)**                     | Sonnet 5.5 / high   | View Transitions, esqueletos con brillo, celebraciones, vibración en Android, sonido opcional apagado; todo se apaga con «reducir movimiento».            |
| **5.2 Modelos con Meshy (D.3)**              | Opus 5.5 / medium   | Los Handys y los premios en 3D, livianos y con versión AR. **Bloqueado** hasta tener el plan pago (§7); mientras, quedan los modelos nativos.             |
| **5.3 QA del bloque (Q.1)**                  | Sonnet 5.5 / high   | Los 16 recorridos como E2E, accesibilidad en 320 a 1280 px, Lighthouse móvil ≥ 90, 3D en gama baja y sin WebGL, AR en un Android y un iPhone reales.      |
| **5.4 Revisión técnica, legal y demo (Q.2)** | Sonnet 5.5 / medium | Paquete para los profesionales evaluadores y Legal (cálculos, premios, antecedentes, borrado lógico); demo del mock en `specialist.handyx.pro` con tu OK. |

5.1, 5.3 y 5.4 corren a la vez; 5.2 cuando se destrabe.

### Ola 6 · Deploy

La fase 6 de `docs/plan.md` (Sonnet 5.5 / high), secuencial y con go/no-go: infraestructura con tu autorización,
migraciones con la credencial del propietario, despliegue y verificación. No arranca sin tu OK explícito.

### Después del deploy · Oficios (H2 a H6)

Un lote por oficio, **de a dos por ola** porque cada uno necesita su revisión técnica: 7.1 Aire acondicionado y 7.2
Plomería (Opus 5.5 / high), después 7.3 Gas (Opus 5.5 / xhigh) y 7.4 Albañilería (Opus 5.5 / high), y por último 7.5
Cerrajería (Opus 5.5 / high). Pantallas de partida: las cinco `OF-*` del lienzo.

## 5. Cobertura del lienzo

Cada pantalla del lienzo está en un solo lote (150 pantallas, verificado con un script contra `design/deluxe/`).

| Lote | Pantallas                                                                                                                                                                   |
| ---- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0.2  | D6-Error, D6-Fallo, X-Escritorio                                                                                                                                            |
| 1.1  | D6-Bienvenida, D6-Login, D6-Login2FA, D6-Recuperar, D6-Acceso, D6-Codigo                                                                                                    |
| 1.2  | RG-1 a RG-10, D6-Alta, OB-Aprobado, OB-Permisos, OB-Tour, OB-PrimerosPasos                                                                                                  |
| 1.3  | F-Inicio, F-InicioDia, F-InicioRuta, F-Pedido, F-Precio, F-PrecioTeclado, F-Fecha, F-FechaHora, F-Revisar, F-Enviada, F-Trabajo, TR-EnCamino, TR-Cobro                      |
| 1.4  | F-Cuenta, CU-Perfil, CU-Datos, CU-Disponibilidad, CU-Cobros, CU-Notificaciones, CU-Privacidad, D6-Seguridad, D6-TOTP, D6-Avisos, D6-Ayuda                                   |
| 2.1  | F-Herramientas, F-Agenda, F-AgendaPasadas, F-AgendaMes, F-Ingresos, H0-Gasto                                                                                                |
| 2.2  | H0-Presupuesto, H0-AgregarMaterial, H0-MaterialOpciones, H0-MaterialNuevo, H0-AgregarLista, H0-Precios, H0-PreciosFoto, H0-PreciosRevisar, H0-PrecioItem, H0-ManoObra       |
| 2.3  | H0-Modo, H0-ModoHerramientas, H0-ModoAyuda, H0-ModoAgenda, H0-AntesDespues, H0-AntesLado, H0-Informe, H0-InformeEnviado                                                     |
| 2.4  | H0-Equipo, H0-EquipoCategoria, H0-EquipoAgregar, H0-EquipoDetalle, H0-EquipoBaja, T-Taller, T-Medir, T-Escanear, T-Modelo3D, T-Nivel                                        |
| 3.1  | F-Obras, F-ObraNueva, F-Obra, F-ObraDia, F-ObraDiaHorario, F-ObraDiaTarea, F-ObraDiaAvance, F-ObraFecha, F-ObraRepuestos, F-RepuestoOrigen, F-ObraRepuesto, F-PropuestaObra |
| 3.2  | F-ObraEquipo, F-Invitar, F-Reparto, F-ObraBuscar, F-InicioConvocatoria, F-ConvocatoriaDetalle, F-ObraPostulantes, F-PerfilProfesional                                       |
| 3.3  | F-Mensajes, F-Chat, F-ChatGrupo, F-ChatAcciones, F-ChatEditar, F-ChatBorrar, F-ChatSeleccion, F-ChatMedia, F-ChatAdjuntar, F-ChatGrupoInfo                                  |
| 3.4  | G-Inicio, G-Bienvenida, G-Manual, G-Camino, G-MiniCamino, F-Regalo, G-Canje, G-Vitrina, G-Insignias, G-Areas                                                                |
| 4.1  | R-Catalogo, R-Categoria, R-Pedir, R-Comparar, R-Ferreterias, R-Estado, R-Retiro, R-Mostrador                                                                                |
| 4.2  | FE-Alta, FE-Inicio, FE-Pedido, FE-Escanear, FE-Retiro, FE-Catalogo, FE-Importar, FE-Metricas, FE-Movil, FE-MovilEscanear                                                    |
| H1 ✔ | T-Electricidad, T-Tablero, T-TableroPared, T-Cables, T-Informe (ya hechas; se pasan al kit v3 en 2.4)                                                                       |
| 7.x  | OF-Aire, OF-Plomeria, OF-Gas, OF-Albanileria, OF-Cerrajeria                                                                                                                 |

## 6. La app del usuario

Muchas tarjetas las responde el cliente: aceptar un presupuesto o una propuesta de obra, aprobar repuestos, aceptar un
cambio de fecha, dar conformidad, ver el reparto. Su diseño corre en otra sesión (`handyx-client-fe`, prompt en
`docs/prompt-app-usuario.md`). Mientras no exista, el **Panel de prueba** hace de cliente en el mock y los lotes de
backend dejan listo el lado del usuario en `handyx-client-be`. Cuando esa app tenga su plan por olas, se alinean las
olas para que cada tarjeta tenga sus dos lados al mismo tiempo.

## 7. Lo que necesita tu OK o una decisión

1. **Este plan** (olas, lotes, modelo y esfuerzo).
2. **Ramas por lote** (`ola-<n>/<lote>`) para que las sesiones paralelas no se pisen; hoy solo se puede subir a
   `claude/pensive-hypatia-jajjgm`.
3. **Ola 3 y 4 a la vez** o una después de la otra.
4. **Ferreterías:** un repo nuevo para el panel web y la app del ferretero (propuesta: `handyx-ferreterias-fe`) y
   dónde vive su API (propuesta: `handyx-ferreterias-be`, con las mismas capas; el esquema sigue en
   `handyx-client-be`). Crear repos necesita tu autorización.
5. **Escaneo 3D:** en el teléfono o en el servidor de Handyx (antes del lote 2.4).
6. **Proveedores:** SMS (1.5 sin proveedor falla cerrado), IA (etiquetas, dictado, lectura de listas si no alcanza el
   teléfono), Meshy plan pago (5.2), demo publicada (5.4).
7. **Legal:** antecedentes por archivo, retención de los mensajes borrados, premios y bases sin azar, normas con
   licencia (AEA, NAG-200, IRAM).
