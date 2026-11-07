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
- **D.1 Auditoría y dirección de arte:** revisión de las 120 pantallas; moodboard y 2 o 3 direcciones visuales con 3
  pantallas clave cada una (Inicio, Tu precio, el regalo); principios de movimiento, vibración y sonido. **Pausa para
  que Ignacio elija una.**
- **D.2 Kit v3:** paleta con profundidad (superficies, sombras en capas, materiales), tipografía con números
  protagonistas, íconos propios, componentes (tarjetas, hojas, botones, campos, chips, mosaicos), biblioteca de
  movimiento con GSAP. Catálogo en `/catalogo/`.
- **D.3 Modelos 3D con Meshy:** los Handys (fieles a silueta, colores y rasgos; poses y animación en reposo) y los
  premios (gorra, campera, herramientas por oficio), retocados, livianos y con versión AR.
- **D.4 Base 3D nativa:** luces, materiales y entorno de la app; visor 3D con gestos; exportación a AR (Quick Look en
  iPhone, WebXR en Android).
- **D.5 Pantallas núcleo:** Inicio, pedidos, Tu precio, trabajo, caja y el Taller con el kit v3.
- **D.6 El resto de la app:** bienvenida, acceso y alta, mensajes, agenda, cuenta, ayuda, avisos, vacíos y errores.
- **D.7 Movimiento entre pantallas:** View Transitions, esqueletos con brillo, celebraciones coreografiadas, vibración
  en Android, sonido opcional apagado.
- **Decisiones de Ignacio:** revisar las reglas actuales (sin gradientes ni efecto vidrio, `docs/diseno.md`); capa propia
  de la app o actualizar también la landing (los tokens son copia de la landing); plan de Meshy.

### Fase H0 · Base común y Modo trabajo — Opus 5.5 / xhigh
- ✔ **H0.1 Base del Taller:** grilla por oficio, motor de calculadoras, nivel con el giroscopio.
- **H0.2 Presupuestador y lista de precios** (Jobber, Housecall Pro, presupuestadores de corralones): mano de obra,
  materiales y margen; plantillas, versiones y vigencia; lo del Taller pasa con un toque; se manda por el chat. Precios
  a mano, por planilla o con foto de la lista del corralón (lectura en el teléfono), con fecha visible.
- **H0.3 Ingresos y gastos** (apps de monotributistas, QuickBooks Self-Employed): cobrado en Handyx y por fuera;
  tickets con foto; ganancia por trabajo y por mes; metas; ayuda de monotributo orientativa (tabla vigente de ARCA).
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

### Fase H1 · Electricidad — Opus 5.5 / high
Referentes: Ugly's Electrical References, Electrical Calc Elite, Southwire, Fluke Connect, configuradores de ABB,
Schneider y Hager.
- ✔ **H1.1 Calculadoras:** sección y caída de tensión, planificador de vivienda, iluminación, consumo y ahorro, Ohm y
  referencias.
- ✔ **H1.2 Tablero 3D:** riel DIN, gabinete, materiales, etiquetas, compartir, AR en iPhone.
- **H1.3 IA:** etiquetado del tablero por foto y presupuesto dictado, sin datos personales.
- **H1.4 Informe eléctrico y AR en Android:** mediciones (puesta a tierra, disyuntor, aislación, tensión) con semáforo,
  estado del tablero, fotos y recomendaciones; tablero y luminarias en la pared con WebXR.
- **H1.5 Checklists, materiales y premios** de Electricidad, más la lista de valores para la revisión técnica.
- **3D nativo:** ✔ tablero; ambiente 3D con bocas, cajas y el recorrido de caños y cables (alimenta el cómputo);
  luminarias para AR.
- Fuera de alcance: «detector de tensión» con el celular.

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

Orden acordado con Ignacio (08/11/2026): **H1** (lo que falta de Electricidad) → **D** → **H0** → **R** → **G** → **H2** →
**H3** → **H4** → **H5** → **H6** → **Q**, y recién al final la **fase 6 · Deploy** del producto (`docs/plan.md`). En el
medio, lo pendiente de la fase 4 (mapa base del 4.3 y revisión del 4.9) se cierra cuando se destrabe.

## 6. Lo que necesita decisión o autorización de Ignacio

- **Diseño:** dirección de arte (D.1), reglas de estética, si se toca la landing.
- **Meshy:** plan pago con uso comercial.
- **Premios:** presupuesto, escalera definitiva, proveedores y logística.
- **Legal (LEG):** bases y condiciones (sin azar), impuestos de los premios, aviso de privacidad para la dirección de
  envío, que la campera con la marca no sugiera relación de empleo, uso de AEA 90364, NAG-200 e IRAM.
- **Ferreterías aliadas** para pasar Repuestos a real.
- **Proveedor de IA** (etiquetado, dictado, identificación de cerraduras) y **pronóstico del clima**.
- **Referencia de Volta** para el regalo (no se encontró el repositorio).
- **Profesionales evaluadores** por oficio y la revisión técnica de cada cálculo.
