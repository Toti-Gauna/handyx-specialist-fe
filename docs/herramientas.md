# Plan · Taller, Modo trabajo, Repuestos, Camino Handyx y Rediseño deluxe

Pedido y aprobado por Ignacio entre el 07 y el 08/11/2026. Es un bloque aparte de las 6 fases del producto
(`docs/plan.md`): no las reemplaza ni las reordena. Fases: **D** (rediseño deluxe), **H0** (base común y Modo trabajo),
**R** (repuestos), **G** (Camino Handyx), **H1–H6** (un oficio por fase) y **Q** (QA y demo). Un modelo y un esfuerzo
por fase. ✔ = hecho y subido.

## 1. Reglas de todo el plan

- **Útil antes que vistoso.** Cada herramienta ahorra tiempo, plata o errores y se inspira en herramientas que los
  profesionales ya usan (se nombran en cada fase), adaptadas a Argentina: pesos, normas locales, voseo, sin inglés.
- **Premium y deluxe:** kit visual nuevo (fase D) y movimiento con GSAP. 3D en cada fase: **nativo** (Three.js, hecho
  por código, sin archivos externos); **Meshy solo en la fase D**, para los Handys y los premios.
- **La gamificación no presiona:** nunca resta; sin rachas que se cortan, sin rankings, sin tasas de aceptación.
  Rechazar pedidos, apagar urgentes o tomarse vacaciones no tiene consecuencias.
- **Solo cuenta lo verificado:** trabajo confirmado por el cliente y cobro verificado, calculado por el servidor.
- **Premios sin azar:** cada hito muestra de antemano su premio. La caja de regalo es una celebración, no una lotería.
- **Plata y precios:** el pago del servicio va directo al especialista; los repuestos se pagan en el mostrador; los
  precios los ponen el profesional o la ferretería, nunca Handyx.
- **Seguridad:** los cálculos citan su referencia, avisan que no reemplazan el criterio profesional ni un certificado y
  quedan «en revisión técnica» hasta que un profesional y Legal los revisen. **El celular no detecta tensión, gas ni
  monóxido de carbono, y no lo fingimos.**
- **Reglas del proyecto:**
  - Nada en el navegador: lo que se guarda va al servidor con contrato versionado. Las calculadoras andan sin conexión.
  - Sin envíos automáticos: lo que llega al cliente o a una ferretería lo manda el profesional.
  - IA sin datos personales (§3).
  - Voseo, `$ 45.000`, «verificados», WCAG 2.2 AA, «reducir movimiento» sin animaciones.
- **Reglas del 3D:** siempre con una descripción en texto (el 3D apoya, no reemplaza); se dibuja solo cuando algo
  cambia (batería); alternativa sin WebGL; probado en gama baja (Moto E20).
- **Normas con licencia:** AEA 90364, NAG-200 de ENARGAS e IRAM tienen derechos. No se copian sus tablas: se usan
  valores revisados por un profesional y por Legal, citando la norma y la versión, o se licencian.
- **Método:** todo arranca en el mock (banner de datos de prueba), con pruebas, E2E y accesibilidad en cada lote. El
  backend de cada fase va al final, una vez validado en el mock. Nada se despliega sin el OK de Ignacio.

## 2. Qué del celular se puede usar (hoy, en una PWA)

| Capacidad | Android (Chrome) | iPhone (Safari) | Uso |
|---|---|---|---|
| Cámara | Sí | Sí | Fotos de tableros, medidores, tickets; lectura de texto en el teléfono |
| Acelerómetro y giroscopio | Sí | Sí, con permiso | Nivel, plomada, pendientes |
| Brújula | Sí | Sí | Orientación de ambientes (frigorías) |
| Micrófono | Sí | Sí | Notas de voz, dictado |
| GPS | Sí | Sí | Rutas, ferreterías cercanas |
| AR inmersiva (WebXR) | Sí | **No** | Ubicar y medir en el lugar |
| AR del sistema | Sí | Sí (Quick Look, USDZ) | Ver un equipo o un tablero en la casa del cliente |
| Linterna | Sí | **No** | Modo trabajo |
| Códigos de barras nativos | Sí | No (librería JS) | Stock y materiales |
| Bluetooth, NFC, vibración | Sí | **No** | Extras opcionales, nunca requisito |

Toda herramienta funciona en iPhone; si la versión premium usa algo que iPhone no tiene, hay una alternativa digna.

## 3. Inteligencia artificial

Ayuda a **leer fotos** (tableros, medidores, listas de precios, cerraduras), **ordenar lo que se dicta** en un
presupuesto y **responder dudas técnicas con fuente**. Siempre pasa por nuestro backend, con un proveedor autorizado,
sin retención del lado del proveedor y con tope de uso. **Sin datos personales:** las fotos se achican y se les quitan
los metadatos (GPS) en el teléfono, se recortan al objeto; del texto se sacan teléfonos, emails y direcciones antes de
enviarlo. Nunca nombre, dirección ni teléfono del cliente; nada a OpenAI (regla de HandIA). La IA propone y el
profesional confirma. Sin proveedor autorizado, responde 503 y la app lo dice.

## 4. Fases

### Fase D · Rediseño deluxe — Opus 5.5 / xhigh
- ✔ **D.1 Auditoría y dirección de arte** (`docs/rediseno-deluxe.md`; dirección elegida el 08/11: **la estética de hoy, mejorada**, fondo blanco y pestañas flotantes de vidrio): revisión de las 120 pantallas; moodboard y 2 o 3 direcciones visuales con 3
  pantallas clave cada una (Inicio, Tu precio, el regalo); principios de movimiento, vibración y sonido. **Pausa para
  que Ignacio elija una.**
- **D.2 Kit v3:** paleta con profundidad (superficies, sombras en capas, materiales), tipografía con números
  protagonistas, íconos propios, componentes (tarjetas, hojas, botones, campos, chips, mosaicos), biblioteca de
  movimiento con GSAP. Catálogo en `/catalogo/`.
- **D.3 Modelos 3D con Meshy:** los Handys (fieles a silueta, colores y rasgos; poses y animación en reposo) y los
  premios (gorra, campera, herramientas por oficio), retocados, livianos y con versión AR.
- **D.4 Base 3D nativa:** luces, materiales y entorno de la app; visor 3D con gestos; exportación a AR (Quick Look en
  iPhone, WebXR en Android).
- **D.5 Pantallas núcleo** (diseño completo en `docs/rediseno-deluxe.md` §8): Inicio con mapa (el único lugar con
  «Disponible» y los pedidos; solo la meta y cuánto suma el pedido al verificarse), pedido entrante, Tu precio con la
  cinta, proponer fecha en el calendario,
  trabajo, el **apartado Obras** (pestaña propia: lista en curso, próximas y terminadas, y el seguimiento día por día
  con jornadas, etapa, diario y plata de la obra), **Tus ingresos** (bruto, gastos y neto del mes) y el Taller con el
  kit v3. Pestañas: Inicio · Obras · Agenda · Mensajes · Cuenta.
- **D.6 El resto de la app:** bienvenida con la ciudad en SVG propio (edificios, grúa, Handys en las terrazas), acceso
  y registro paso a paso (fase V), mensajes, agenda con el **mes completo en pantalla entera** (y meses pasados),
  **cuenta premium con los azules de la marca**, **ayuda premium** (buscador, temas en mosaicos, respuestas
  desplegables, soporte a mano), avisos, vacíos y **errores con ilustraciones SVG propias** (sin conexión, error del
  servidor).
- **D.7 Movimiento entre pantallas:** View Transitions, esqueletos con brillo, celebraciones coreografiadas, vibración
  en Android, sonido opcional apagado.
- **Decisiones de Ignacio:** revisar las reglas actuales (sin gradientes ni efecto vidrio, `docs/diseno.md`); capa propia
  de la app o actualizar también la landing (los tokens son copia de la landing); plan de Meshy.

### Fase H0 · Base común y Modo trabajo — Opus 5.5 / xhigh
- ✔ **H0.1 Base del Taller:** grilla por oficio, motor de calculadoras, nivel con el giroscopio.
- **H0.2 Presupuestador y lista de precios** (Jobber, Housecall Pro, presupuestadores de corralones): mano de obra,
  materiales y margen; plantillas, versiones y vigencia; lo del Taller pasa con un toque; se manda por el chat. Precios
  a mano, por planilla o con foto de la lista del corralón (lectura en el teléfono), con fecha visible.
- **H0.3 Ingresos y gastos** (apps de monotributistas, QuickBooks Self-Employed): para que el especialista sepa su
  **bruto y su neto**. Bruto: lo cobrado en Handyx (verificado e informado, por separado) y por fuera. Gastos:
  materiales (con la foto del ticket o desde el presupuesto, el pedido de repuestos y el Modo trabajo), combustible y
  viáticos, herramientas. Neto = bruto − gastos − tarifa de Handyx (0 % en la demo). Ganancia por trabajo, por obra (con
  sus etapas) y por mes; metas; exportar el mes; ayuda de monotributo orientativa (tabla vigente de ARCA). Los gastos
  son del especialista y no se le muestran al cliente.
- **H0.4 Modo trabajo** (se abre al pasar a «en curso»; botones grandes para usar con guantes): cronómetro por tarea;
  checklist que empieza por la seguridad; fotos con anotaciones y comparador antes/después; materiales con código de
  barras que pasan a adicional (lo acepta el cliente); notas de voz; hoja de herramientas a mano (calculadoras, nivel,
  linterna, lupa); pedir repuesto; informe automático para el cliente al cerrar. Lo que se guarda necesita conexión (sin
  cola offline); si no hay red, se avisa.
- **H0.5 Rutas y stock:** orden de visitas con el OSRM propio; kilómetros del mes; stock de la camioneta; lista de
  compras.
- **H0.6 Backend:** contrato, esquema en `handyx-client-be`, endpoints y pruebas en `handyx-specialist-be`.
- **3D nativo:** caja de herramientas que se abre en la portada del Taller; stock de la camioneta en 3D (estantes con
  cajones que muestran lo que queda).

### Fase V · Acceso, registro y verificación — Opus 5.5 / xhigh
Pedido de Ignacio del 08/11/2026. Diseño en la fila «Acceso y seguridad» y «Registro paso a paso» del lienzo.
- **V.1 Acceso:** código por email o **SMS**, Google y Apple; **segunda verificación opcional (MFA)**: app
  autenticadora (TOTP, recomendada), SMS o email, con códigos de respaldo y lista de dispositivos. El secreto TOTP vive
  cifrado en el backend; nada en el navegador. SMS necesita proveedor autorizado.
- **V.2 Registro paso a paso** (10 pasos con barra de avance): datos, **domicilio** (cifrado, nunca se muestra), rubros,
  zonas en el mapa, **selfie** con óvalo guía, **DNI** frente y dorso con marco, CUIT/CUIL y cómo factura,
  certificados, antecedentes, revisión y envío; después, el estado del alta. Se puede retomar donde quedó.
- **V.3 Certificados y matrículas:** **obligatoria la matrícula en Gas y en Aire acondicionado** (sin ella no se
  habilita ese rubro); el resto (cursos, seguro, otros) es **opcional y suma al perfil** que ven los clientes al
  elegir. Solo cuenta lo que verifica Operations. En los textos: «matrícula verificada», nunca «matriculado» como
  promesa de marketing.
- **V.4 Antecedentes penales por foto o PDF** (decisión de Ignacio del 08/11/2026, reemplaza la regla anterior de no
  guardar archivos): dato sensible, cifrado, URL firmada de corta duración, **solo lo ve Operations**, nunca a IA, y
  **se borra al verificar** (queda solo la constancia de verificación). Requiere revisión legal (LEG) del aviso de
  privacidad y del plazo. Más adelante, con inversión, se suma la validación con escribano: el documento para el
  escribano lo arman los agentes por separado; la app ya deja el archivo y el estado listos.
- **V.5 Backend:** contrato, esquema en `handyx-client-be`, endpoints en `handyx-specialist-be`, retención y pruebas.

### Fase O · Obras en equipo, mensajes y cuenta — Opus 5.5 / xhigh
Pedido de Ignacio del 08/11/2026. Diseño en las filas «Obras», «Obras en equipo» y «Mensajes» del lienzo.
- **O.1 Obra de varios días:** resumen compacto arriba (días en obra, total gastado, falta cobrar, avance) que no tapa
  la lista; **días en lista** con su estado; detalle de cada jornada (tareas, quién va, fotos, nota, materiales).
- **O.2 Repuestos de la obra:** cargar repuestos **a comprar a futuro** por jornada; el cliente los **aprueba** en el
  chat (esperando aprobación → aprobado → comprado); **aviso el día anterior si falta comprar** y de lo que se va a
  comprar; se conectan con la fase R y con los gastos (H0.3).
- **O.3 Cambios de fecha:** mover una jornada o esta y las que siguen; el cliente acepta; hasta entonces, siguen las
  fechas de ahora; se avisa al equipo.
- **O.4 Equipo de obra:** se suman profesionales **solo por invitación** (contactos de Handyx o enlace con código que
  vence), verificados; **chat grupal** con el cliente; cada uno ve los días, el chat y su parte (los gastos del
  titular, solo él).
- **O.5 Reparto del pago:** cuánto le toca a cada uno (monto o %), cómo cobra (cada uno su parte, o el titular y
  reparte por fuera) y aceptación de cada miembro. **Handyx no recibe ni reparte la plata**: registra lo acordado.
- **O.6 Mensajes:** personas con **iniciales y nombre** (no personajes), filtros (pedidos, obras, equipo, soporte);
  cada chat atado a un pedido, una obra o el equipo, y accesible desde la obra; **mandar por el chat** presupuestos,
  **propuestas de obra** (etapas, jornadas y montos), repuestos para aprobar, cambios de fecha, fotos e informes, como
  tarjetas que el cliente responde ahí mismo.
- **O.7 Backend:** contrato, esquema (miembros de obra, invitaciones, reparto, repuestos con estado, adjuntos tipados
  del chat), endpoints, avisos y pruebas.

### Fase R · Repuestos y ferreterías — Opus 5.5 / high
- **R.1 Flujo simulado:** pedido desde el presupuesto, el tablero, el Modo trabajo o a mano; mapa de ferreterías
  ficticias (marcadas «Simulación») con horario y distancia; estados enviado → confirmado con precios → listo para
  retirar → retirado (o cancelado); reemplazos sugeridos; código QR de retiro; el gasto queda registrado y, si
  corresponde, como adicional del trabajo. El Panel de prueba hace de ferretería.
- **R.2 Panel de ferretería y backend:** pantalla en el portal interno (ver pedidos, confirmar precios, marcar
  «listo»); contrato, esquema y endpoints.
- **R.3 Piloto real** con ferreterías aliadas de Mar del Plata.
- **3D nativo:** bolsa o caja que se llena con cada ítem confirmado; ticket de retiro que se da vuelta al quedar listo.

### Fase G · Camino Handyx (gamificación) — Opus 5.5 / xhigh
- **G.1 Reglas:** progreso por trabajos verificados y monto verificado; hitos y premios por oficio; antifraude (tope por
  cliente por mes, monto mínimo, revisión de Operations antes de entregar); lógica pura con pruebas.
- **G.2 El camino** (estilo Duolingo): sendero por estaciones, los Handys acompañan, barra «te faltan N trabajos
  para…», tarjeta en Inicio con anillo de progreso; insignias por usar la app (sin premio físico).
- **G.3 El regalo:** la caja baja, tiembla y se abre con luz y papelitos; el premio gira en 3D; la tarjeta se da vuelta;
  vibración en Android; con «reducir movimiento», tarjeta directa; vitrina de premios.
- **G.4 Canje:** talle y color; retiro en un punto Handyx o en una ferretería aliada, o envío con la dirección cifrada;
  estados disponible → pedido → preparando → listo/enviado → entregado; script de Operations; backend.
- **Escalera (borrador; Ignacio define cantidades y montos):**

  | Hito | Requisito | Premio |
  |---|---|---|
  | 1 | Primer trabajo verificado | Insignia y kit chico: tornillos, tarugos y cinta |
  | 2 | 5 trabajos | Kit de consumibles del oficio |
  | 3 | 10 trabajos | Gorra Handyx |
  | 4 | 25 trabajos + monto PENDIENTE | Herramienta del oficio |
  | 5 | 50 trabajos + monto PENDIENTE | Campera Handyx |
  | 6 | 100 trabajos + monto PENDIENTE | Herramienta premium |

- **3D:** el camino nativo por paisajes de Mar del Plata (rambla, puerto, faro) y la caja de regalo nativa; adentro,
  el premio y el Handy que festeja con los modelos de Meshy (fase D).

### Fase H1 · Electricidad — Opus 5.5 / high ✔ (08/11/2026; falta la revisión técnica y la prueba de AR en dispositivos reales)
Referentes: Ugly's Electrical References, Electrical Calc Elite, Southwire, Fluke Connect, configuradores de ABB,
Schneider y Hager.
- ✔ **H1.1 Calculadoras:** sección y caída de tensión, planificador de vivienda, iluminación, consumo y ahorro, Ohm y
  referencias.
- ✔ **H1.2 Tablero 3D:** riel DIN, gabinete, materiales, etiquetas, compartir, AR en iPhone.
- ✔ **H1.3 IA** (08/11/2026; contrato 0.10.0, `handyx-specialist-be` `7dc3e2d`): **Etiquetas con IA** (`/taller/etiquetas/`:
  la foto se achica y pierde los metadatos en el teléfono; la IA propone cada protección con su confianza; se corrige,
  se imprimen las etiquetas o se abre en el armador 3D) y **Presupuesto dictado** (`/taller/dictado/`: se quitan
  teléfonos, emails, documentos y direcciones antes de enviar, y se muestra qué se quitó; tareas y materiales sin
  precios). Sin proveedor autorizado la API responde 503: la foto lo avisa y el dictado usa reglas del teléfono. En
  el mock el resultado es simulado y se dice.
- ✔ **H1.4 Informe eléctrico y AR** (08/11/2026): `/taller/informe/` con mediciones de los instrumentos (puesta a tierra,
  disparo del diferencial, aislación, tensión) y semáforo, estado del tablero, fotos (achicadas y sin metadatos),
  observaciones y recomendaciones automáticas; imprimir o guardar en PDF y compartir. Sin datos del cliente; no es un
  certificado; guardarlo en el trabajo llega con H0.6. **AR:** botón común (`BotonAr`) que usa WebXR con detección de
  superficies en Android y AR Quick Look en iPhone: el tablero en la pared (tamaño real) y la luminaria en el techo
  (plafón o panel, modelos nativos en `src/taller/modelos3d.ts`). Sin ninguno de los dos, no aparece. **Falta probarlo
  en un Android y un iPhone reales** (fase 6.2).
- ✔ **H1.5 Recorrido, checklists, materiales y premios** (08/11/2026): **Recorrido de caños** (`/taller/canalizacion/`:
  ambiente en 3D nativo con bocas, tablero y un caño por circuito que se dibuja con GSAP; metros de caño, cable por
  sección, cajas y curvas); **Checklists** (`/taller/checklists/`: cinco tipos de trabajo, siempre con la seguridad
  primero, con anillo de progreso); catálogo de materiales eléctricos (`src/taller/materiales.ts`, para la fase R);
  premios del oficio en borrador (`src/taller/premios.ts`, para la fase G) y **`docs/revision-tecnica-electricidad.md`**
  con todos los valores que tiene que revisar un profesional y Legal.
- **3D nativo:** ✔ tablero; ✔ ambiente con bocas y el recorrido de caños y cables (alimenta el cómputo); ✔ luminarias
  (plafón y panel) para AR.
- Fuera de alcance: «detector de tensión» con el celular.

### Después del deploy (con el tiempo, un oficio por vez)

### Fase H2 · Aire acondicionado — Opus 5.5 / high
- **H2.1 Cálculos:** frigorías con la brújula, carga adicional de refrigerante, ahorro inverter.
- **H2.2 Instalación y errores:** paso a paso con cronómetro (nitrógeno y vacío), fotos del manómetro, códigos de
  error por marca (base propia).
- **H2.3 AR y mantenimientos:** la unidad en la casa del cliente; historial y recordatorios que manda el profesional.
- **3D nativo:** split interior y exterior para AR; ambiente con el sol que se mueve según la orientación.

### Fase H3 · Plomería — Opus 5.5 / high
- **H3.1 Cálculos y pendiente:** pendiente de desagües con el celular, diámetros, termofusión, termotanque o calefón.
- **H3.2 Pérdidas e isométrico:** dos fotos del medidor de agua → caudal de pérdida.
- **H3.3 Checklists, materiales y premios** de Plomería.
- **3D nativo:** isométrico de cañerías (codos, tees, llaves, diámetros por color); pendiente con el agua corriendo.

### Fase H4 · Gas — Opus 5.5 / xhigh
- **H4.1 Cálculos:** cañerías por tramo, ventilación, consumo de artefactos.
- **H4.2 Prueba y emergencia:** prueba de hermeticidad registrada; protocolo ante olor a gas; informe.
- **H4.3 Revisión técnica y legal**, más checklists, materiales y premios de Gas.
- **3D nativo:** cañería isométrica con tramos y diámetros; ambiente con rejillas y el aire circulando.
- Fuera de alcance: detectar gas o monóxido con el celular.

### Fase H5 · Albañilería — Opus 5.5 / high
- **H5.1 Cómputo de materiales:** muros, revoques, contrapisos y hormigón con desperdicio.
- **H5.2 Cerámicos y nivel:** patrón, cortes y cajas; nivel, plomada, escuadra, pendientes.
- **H5.3 Obra:** clima para hormigonar (proveedor autorizado), avance con time-lapse, recorrido de la reforma.
- **3D nativo:** muro que se levanta ladrillo por ladrillo; cerámicos con su patrón; recorrido de la reforma.

### Fase H6 · Cerrajería — Opus 5.5 / high
- **H6.1 Identificación y medición:** cerradura por foto con IA (nunca decodificar llaves); medidas de la puerta.
- **H6.2 Aperturas y stock:** constancia de autorización antes de abrir (sin guardar el DNI); recargos de urgencia;
  stock de llaves vírgenes.
- **H6.3 Catálogo y premios:** catálogo para el cliente; checklists, materiales y premios de Cerrajería.
- **3D nativo:** cerradura y cilindro genéricos que se despiezan para explicar la seguridad; puerta con sus medidas.

### Fase Q · QA y demo publicada — Sonnet 5.5 / high
- **Q.1 QA del bloque:** E2E, accesibilidad, Lighthouse móvil ≥ 90, rendimiento 3D en gama baja, alternativa sin
  WebGL, AR en iPhone y Android.
- **Q.2 Demo en `specialist.handyx.pro`:** paquete nuevo del mock con todo el bloque y guía de uso.

## 5. Orden

Orden acordado con Ignacio (08/11/2026): **H1** ✔ → **D** → **V** → **H0** → **O** → **R** → **G** → **Q**
→ **fase 6 · Deploy** del producto (`docs/plan.md`). **H2 a H6 quedan para después del deploy**: se desarrollan con el
tiempo, un oficio por vez. Lo pendiente de la fase 4 (mapa base del 4.3 y revisión del 4.9) se cierra cuando se destrabe.

## 6. Lo que necesita decisión o autorización de Ignacio

- **Diseño:** ✔ dirección de arte (estética de hoy mejorada, pestañas de vidrio); falta: si se toca la landing.
- **Tarifa (08/11/2026):** Handyx **no le cobra comisión al especialista, nunca** (0 % siempre): sin modal ni contador de
  «0 % durante la demo». Hay que alinear el contrato compartido (`feeHandy`) con `handyx-client-be`.
- **Antecedentes por archivo (08/11/2026):** aprobado por Ignacio con resguardos (V.4); falta la revisión legal.
- **Proveedores:** SMS (acceso y MFA).
- **Meshy:** plan pago con uso comercial.
- **Premios:** presupuesto, escalera definitiva, proveedores y logística.
- **Legal (LEG):** bases y condiciones (sin azar), impuestos de los premios, aviso de privacidad para la dirección de
  envío, que la campera con la marca no sugiera relación de empleo, uso de AEA 90364, NAG-200 e IRAM.
- **Ferreterías aliadas** para pasar Repuestos a real.
- **Proveedor de IA** (etiquetado, dictado, identificación de cerraduras) y **pronóstico del clima**.
- **Referencia de Volta** para el regalo (no se encontró el repositorio).
- **Profesionales evaluadores** por oficio y la revisión técnica de cada cálculo.
