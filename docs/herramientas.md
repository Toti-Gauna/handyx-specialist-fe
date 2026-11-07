# Plan · Herramientas por oficio («Taller Handyx»)

Pedido por Ignacio el 07/11/2026: herramientas **útiles de verdad** y **premium** para cada oficio, una fase por oficio,
empezando por Electricidad. Es un bloque aparte de las 6 fases del producto (`docs/plan.md`): no las reemplaza ni las
reordena. Cada fase se trabaja con el mismo método (lotes, pruebas, docs, handoff) y nada se despliega sin el OK de Ignacio.

Las herramientas viven dentro de la PWA, en una sección nueva: **Taller**. Funcionan para cualquier especialista
habilitado en ese rubro, tengan o no un trabajo de Handyx: el objetivo es que la app sea la caja de herramientas diaria,
no solo la bandeja de pedidos.

## 1. Principios

1. **Útil antes que vistoso.** Cada herramienta resuelve una tarea que hoy el profesional hace en papel, en la cabeza, con
   otra app o con WhatsApp. Si no ahorra tiempo, plata o errores, no entra. Lo premium (GSAP, Three.js, AR) se usa para
   que se entienda mejor o se venda mejor, nunca como adorno.
2. **Basadas en herramientas que ya existen y funcionan** (se nombran en cada una), mejoradas para el profesional
   argentino: pesos, normas locales, Mar del Plata, voseo y sin inglés.
3. **Lógica pura con pruebas.** Toda cuenta (sección de cable, frigorías, materiales, plata) es una función pura con
   casos de prueba revisados por un profesional del rubro, como `src/demo/dinero.ts` en la landing.
4. **Seguridad y responsabilidad.** Los cálculos de seguridad (eléctrica, gas) muestran la referencia normativa y avisan
   que no reemplazan el criterio del profesional ni un certificado. Ninguna herramienta «aprueba» una instalación.
   Lo que el celular no puede medir, no se finge: **el celular no detecta tensión ni monóxido de carbono.**
5. **Reglas del proyecto, sin excepción.**
   - Nada en el navegador (ni `localStorage` ni IndexedDB): lo que se guarda (presupuestos, listas de precios, gastos,
     plantillas) va al backend con contrato nuevo, versionado y con dueño del esquema (`handyx-client-be`). Las
     calculadoras funcionan sin conexión porque no necesitan guardar nada.
   - Sin precios inventados: los materiales salen de **la lista de precios del propio profesional** (carga manual,
     importación de una planilla o foto de la lista del corralón con OCR). El sugerido de Handyx sigue siendo el de la
     tabla publicada por Operations.
   - Sin envíos automáticos: todo lo que va al cliente (presupuesto, informe, recordatorio) lo manda el profesional con
     un toque, por el chat de Handyx o compartiendo.
   - IA sin datos personales (ver §4).
   - Lenguaje: voseo, `$ 45.000`, «verificados» (nunca «matriculados»), nada de «inmediato».
6. **Normas con licencia.** La Reglamentación AEA 90364, la NAG-200 de ENARGAS y las normas IRAM son documentos con
   derechos. No se copian sus tablas: se usan valores revisados por un profesional y por Legal, citando la norma y su
   versión, o se licencian. Cada tabla lleva su fuente y fecha.

## 2. Qué del celular se puede usar de verdad (hoy, en una PWA)

| Capacidad | Android (Chrome) | iPhone (Safari) | Uso en el Taller |
|---|---|---|---|
| Cámara (foto y video en vivo) | Sí | Sí | Fotos de tableros, medidores, llaves; OCR; informes |
| Acelerómetro y giroscopio | Sí | Sí, con permiso explícito | Nivel, plomada, inclinómetro, pendientes |
| Brújula (orientación) | Sí | Sí (`webkitCompassHeading`) | Orientación de ambientes (frigorías), fachadas |
| Micrófono | Sí | Sí | Notas de voz, dictado de presupuestos |
| GPS | Sí | Sí | Rutas del día, kilómetros, zona |
| AR inmersiva (WebXR) | Sí | **No** | Medir y ubicar objetos en el lugar |
| AR por visor del sistema (`<model-viewer>`) | Sí (Scene Viewer) | Sí (Quick Look con USDZ) | Mostrarle al cliente un equipo o un tablero en su casa |
| VR inmersiva (WebXR) | Parcial | **No** | Solo para recorridos 3D de una obra; en iPhone, visor 360° con el giroscopio |
| Lector de códigos de barras nativo | Sí | No (se usa una librería JS) | Stock de materiales |
| Bluetooth (Web Bluetooth) | Sí | **No** | Medidores láser con BLE (experimental, solo Android) |
| NFC, vibración | Sí | No | Mejoras opcionales, nunca requisito |
| Magnetómetro crudo, luxómetro | Detrás de flags | No | **No se usan**: no son confiables en web |

Regla: **toda herramienta tiene que funcionar en iPhone.** Si la versión premium depende de algo que iPhone no tiene
(AR inmersiva, Bluetooth), hay una alternativa digna (entrada manual guiada, foto con referencia, visor 3D).

## 3. Stack premium

- **GSAP** para el movimiento (gratuito con todos sus plugins): transiciones entre pasos, números que cuentan, el
  tablero que se arma, siempre con `prefers-reduced-motion`.
- **Three.js** para 3D en la app: tablero DIN, isométricos de cañerías, unidades de aire, muros y cerámicos.
- **`<model-viewer>`** para AR en los dos sistemas (USDZ para iPhone, GLB para Android).
- **Meshy** para crear los modelos 3D de catálogo (térmicas, disyuntores, splits, calefones, cerraduras, ladrillos),
  revisados y optimizados a mano (polígonos y texturas livianas para gama baja). Se generan una vez como recursos de
  la app; nunca en tiempo real ni con fotos de clientes. Requiere plan pago de Meshy con uso comercial.
- **Kit v2** (`src/kit/`) y la estética de la app: mosaicos, botones con base que se hunde, Archivo + DM Sans y los
  Handys como guías de cada herramienta (el foco en Electricidad, el grifo en Plomería, etc.).

## 4. Inteligencia artificial

Dónde ayuda de verdad: **leer fotos** (un tablero, un medidor, una lista de precios, una llave), **convertir lo que el
profesional dice en voz en un presupuesto ordenado** y **responder dudas técnicas con fuente**.

Reglas:
- Pasa siempre por **nuestro backend**, nunca directo desde el celular, con un proveedor autorizado por Ignacio, sin
  retención de datos del lado del proveedor y con un tope de uso por especialista.
- **Sin datos personales:** a la IA solo le llega lo que la herramienta necesita. Las fotos se recortan al objeto (el
  tablero, el display del medidor) y se descartan caras, direcciones y documentos. Nunca se mandan nombre, dirección
  ni teléfono del cliente. La regla de HandIA sigue vigente: nada de datos personales a OpenAI.
- Lo que se pueda hacer en el teléfono, se hace en el teléfono (OCR de números, nivel, cuentas).
- La IA **propone y el profesional confirma**: nunca manda nada ni cambia un precio sola.

## 5. Fase H0 · Base común del Taller — Opus 5.5 / xhigh

Lo que usan todos los oficios. Sin esta fase, cada rubro reinventaría lo mismo.

- **Sección Taller** en la app: grilla de herramientas del rubro del especialista (mosaicos, buscador y favoritos
  guardados en el servidor).
- **Motor de calculadoras:** unidades y conversiones, redondeos por material, validación de entradas, resultados con
  «por qué» (la fórmula y la fuente a la vista), compartir resultado como imagen.
- **Presupuestador profesional** (inspirado en Jobber, Housecall Pro y los presupuestadores de los corralones):
  - Ítems de mano de obra y materiales, con la lista de precios propia, margen y redondeo.
  - Plantillas por tipo de trabajo, versiones del presupuesto y vigencia.
  - Se manda por el chat de Handyx o como enlace o imagen (no PDF con datos del cliente fuera de la app).
  - Los presupuestos de cada oficio (H1–H6) alimentan este presupuestador.
- **Mi lista de precios:** carga manual, importación de planilla y **foto de la lista del corralón → OCR** (en el
  teléfono) con revisión renglón por renglón. Fecha de actualización visible («precios de hace 40 días»).
- **Mis ingresos y gastos** (inspirado en apps de finanzas para monotributistas y en QuickBooks Self-Employed):
  - Lo cobrado en Handyx (reportado y verificado) más lo cobrado por fuera, que carga el profesional.
  - Gastos: materiales, combustible, herramientas; foto del ticket con OCR.
  - Ganancia real por trabajo y por mes, metas y gráfico claro.
  - Ayuda de monotributo: cuánto le falta para el tope de su categoría, con la tabla vigente de ARCA cargada por
    Operations con su fecha. Es orientación, no asesoramiento contable.
- **Rutas del día:** las visitas agendadas en el orden que menos maneja, con nuestro motor de trayectos (OSRM propio)
  y kilómetros del mes para los gastos.
- **Notas de voz → tareas:** dictás en el trabajo («falta un disyuntor de 40») y queda como tarea o ítem del
  presupuesto. Transcripción por el backend sin datos personales, o escrita si no hay permiso.
- **Stock de la camioneta:** materiales y herramientas con código de barras (lector nativo en Android, librería en
  iPhone), avisos de faltantes y lista de compras.
- **Informe de trabajo para el cliente:** fotos antes y después, qué se hizo, mediciones cargadas a mano, garantía que
  da el profesional y recomendaciones. Se ve en la app del cliente. No es un certificado.
- **Infraestructura:** contrato y esquema nuevos (presupuestos, listas de precios, gastos, stock, plantillas), métricas
  sin datos personales por herramienta, permisos de sensores con pantallas propias que explican para qué, y modo sin
  conexión para las calculadoras.
- **Validación:** 5 profesionales de Mar del Plata por rubro prueban cada herramienta en un trabajo real antes de
  cerrar la fase.

## 6. Fase H1 · Electricidad — Opus 5.5 / high

Referentes: Ugly's Electrical References, Electrical Calc Elite, Southwire (caída de tensión), Fluke Connect
(informes), los configuradores de tableros de ABB, Schneider y Hager, Jobber.

Núcleo (lo que más se usa):
1. **Sección de conductores y caída de tensión.** Corriente o potencia, longitud, monofásico o trifásico, forma de
   instalación y temperatura → sección mínima, caída de tensión en % con semáforo y la protección que corresponde.
   Con la referencia AEA 90364 citada.
2. **Planificador de circuitos de vivienda.** Metros cuadrados y ambientes → grado de electrificación (mínima, media,
   elevada, superior), cantidad mínima de circuitos y de bocas por ambiente. Es la base del presupuesto de una
   instalación nueva o de una reforma.
3. **Armador de tablero en 3D.** Arrastrás térmicas, disyuntores diferenciales y protectores sobre el riel DIN; calcula
   módulos, propone el gabinete, arma la lista de materiales y la hoja de etiquetas. GSAP para encastrar cada
   dispositivo y Three.js para girar el tablero. Se le muestra al cliente cómo va a quedar.
4. **Cómputo de materiales eléctricos.** Desde el planificador: metros de cable por sección y color, caños, cajas,
   tomas, llaves y fichas → lista con los precios propios → presupuestador.
5. **Calculadora de iluminación.** Ambiente y uso → lúmenes necesarios, cantidad de luminarias y equivalencia LED.
6. **Consumo y ahorro para el cliente.** Artefactos y horas → kWh y costo con la tarifa que carga el profesional (por
   ejemplo, EDEA). Sirve para vender un cambio a LED o una mejora.
7. **Referencias sin conexión.** Ley de Ohm y potencia, colores de conductores (fases marrón, negro y rojo; neutro
   celeste; tierra verde y amarillo), tabla de secciones y protecciones, y lista de seguridad antes de trabajar (corte,
   bloqueo, señalización, verificación de ausencia de tensión **con instrumento**).

Premium:
8. **Etiquetado de tablero con IA.** Foto del tablero → la IA detecta cada dispositivo y propone el circuito; el
   profesional corrige y sale la hoja de etiquetas para imprimir.
9. **Presupuesto dictado.** «Cambio de tablero de 6 circuitos con disyuntor, más 4 tomas en la cocina» → la IA arma
   ítems y materiales editables en el presupuestador.
10. **Vista AR para el cliente.** El tablero armado o una luminaria en su pared, con `<model-viewer>` (iPhone y
    Android), con modelos hechos con Meshy.
11. **Informe eléctrico.** Mediciones cargadas a mano (resistencia de puesta a tierra, prueba del disyuntor),
    fotos y estado del tablero → informe para el cliente dentro de Handyx. No reemplaza un certificado oficial.

Experimental (solo si las pruebas lo justifican):
12. **Medición de recorridos con AR** en Android (WebXR) para estimar metros de cable; en iPhone, ingreso guiado.

Fuera de alcance: «detector de tensión» o de cables con el celular. No es posible y sería peligroso.

## 7. Fase H2 · Aire acondicionado — Opus 5.5 / high

Va segunda por la temporada: el verano es el pico de instalaciones y conecta con la campaña «Verano».
Referentes: las calculadoras de frigorías de los fabricantes, apps de códigos de error, Testo Smart y Fieldpiece Job
Link (registro de mediciones), ServiceTitan (mantenimientos).

1. **Calculadora de frigorías.** Metros cuadrados, altura, orientación (con la brújula del celular), ventanas, techo,
   personas y equipos → frigorías y la potencia comercial que conviene.
2. **Carga adicional de refrigerante.** Metros de cañería y modelo del equipo → gramos a agregar, según los datos del
   fabricante que carga el profesional (R410A, R32).
3. **Instalación paso a paso con cronómetro.** Prueba de estanqueidad con nitrógeno, vacío y su tiempo de
   mantenimiento, con las lecturas que carga el profesional y fotos del manómetro (OCR en el teléfono).
4. **Códigos de error por marca.** Base propia y curada, revisada por técnicos. No se copian manuales.
5. **Ubicación en AR para el cliente.** La unidad interior en su pared y la exterior en el balcón, con modelos de Meshy.
6. **Ahorro inverter frente a on/off.** Consumo estimado y costo con la tarifa cargada.
7. **Mantenimientos.** Historial por equipo y sugerencia de mantenimiento antes del verano. El profesional decide si se
   lo manda al cliente por el chat.

## 8. Fase H3 · Plomería — Opus 5.5 / high

Referentes: calculadoras de los fabricantes de termofusión, apps de nivel, magicplan, Jobber.

1. **Pendiente de desagües con el celular.** Apoyás el teléfono sobre el caño y te dice la pendiente en % y si llega al
   mínimo recomendado, con calibración. Usa el giroscopio de verdad.
2. **Diámetros de cañerías.** Artefactos de la casa → diámetros de alimentación y de desagüe.
3. **Cómputo de termofusión.** Recorridos → metros de caño por diámetro, codos, tees, uniones y llaves.
4. **Termotanque o calefón.** Personas y uso → litros o litros por minuto recomendados.
5. **Detector de pérdidas por el medidor.** Foto del medidor de agua, 30 minutos sin consumo, otra foto → OCR en el
   teléfono y caudal de pérdida estimado.
6. **Isométrico 3D** de la instalación para mostrar al cliente y para el presupuesto.
7. **Presupuesto dictado con IA**, como en Electricidad.

Experimental: escucha de pérdidas con el micrófono. Solo si las pruebas muestran que sirve.

## 9. Fase H4 · Gas — Opus 5.5 / xhigh

El rubro más regulado (NAG-200 de ENARGAS, distribuidora Camuzzi en Mar del Plata). Todo pasa por revisión técnica y
legal antes de salir. Referentes: calculadoras de cañerías de gas de los fabricantes, apps de registro de pruebas.

1. **Cálculo de cañerías.** Artefactos (kcal/h → m³/h) y longitudes → diámetros por tramo, con la tabla revisada y su
   fuente.
2. **Ventilación de ambientes.** Artefactos y ambiente → rejillas y conductos necesarios.
3. **Prueba de hermeticidad con registro.** Cronómetro, foto del manómetro al inicio y al final con hora, y resultado
   cargado por el profesional. Queda en el informe.
4. **Consumo de artefactos.** Conversión de potencias y consumo estimado.
5. **Protocolo de emergencia.** Qué hacer ante olor a gas, pantalla grande y simple, con los teléfonos oficiales de
   emergencia verificados.
6. **Informe para el cliente** de la revisión. No reemplaza la documentación oficial ante la distribuidora.

Fuera de alcance: detectar gas o monóxido con el celular. No es posible.

## 10. Fase H5 · Albañilería — Opus 5.5 / high

Referentes: Construction Master Pro, las calculadoras de materiales de los fabricantes, magicplan, Leica DISTO Plan.

1. **Cómputo de materiales.** Muros (ladrillo o bloque), revoques, contrapisos y hormigón → cantidades con desperdicio:
   ladrillos, bolsas de cemento y de cal, arena, piedra, hierro, según la dosificación elegida.
2. **Planificador de cerámicos en 3D.** Medidas del ambiente y de la pieza → cantidad de cajas, cortes y desperdicio,
   con la vista del patrón (recto, trabado, diagonal). Three.js.
3. **Nivel, plomada y escuadra** con el giroscopio, con calibración.
4. **Pendientes de techos y contrapisos.**
5. **Superficies por foto o con AR** (AR en Android, foto con una referencia de medida en iPhone).
6. **Clima para la obra.** Lluvia y temperatura de los próximos días para hormigonar o impermeabilizar. Necesita un
   proveedor de pronóstico autorizado.
7. **Avance de obra.** Integrado con las obras por etapas y jornadas que ya existen: fotos con la misma toma día a día
   y un time-lapse para el cliente.
8. **Recorrido 3D de la reforma** (premium): un modelo simple del ambiente para mostrarle al cliente. VR solo en
   Android y visores; en iPhone, visor 360° con el giroscopio.

Experimental: medidores láser con Bluetooth (solo Android).

## 11. Fase H6 · Cerrajería — Opus 5.5 / high

Referentes: catálogos de fabricantes de cerraduras y cilindros, apps de inventario con código de barras, Jobber.

1. **Identificación de cerraduras con IA.** Foto de la cerradura o del cilindro → marca y modelo probables, con los
   repuestos compatibles. **No** se decodifican llaves desde una foto: es un riesgo de seguridad.
2. **Medición de puertas y cerraduras.** Espesor, distancia al eje y mano de la puerta, con guía de fotos.
3. **Constancia de autorización para aperturas.** Antes de abrir una puerta, la persona confirma en la app que es
   titular o que está autorizada. No se guardan fotos del DNI.
4. **Recargos de urgencia** (noche, feriado) con las tarifas que define el profesional.
5. **Catálogo 3D y AR de cerraduras** para mostrarle al cliente opciones de mayor seguridad, con modelos de Meshy.
6. **Stock de llaves vírgenes y cilindros** con código de barras y avisos de faltantes.

## 12. Orden y criterio de cierre de cada fase

- Orden propuesto: **H0 → H1 Electricidad → H2 Aire acondicionado → H3 Plomería → H4 Gas → H5 Albañilería →
  H6 Cerrajería.** H0 va primero porque presupuestos, precios, ingresos y rutas los usan todos.
- Cada fase se cierra con:
  - Pruebas de cada cálculo con casos revisados por un profesional del rubro.
  - E2E y accesibilidad (axe en 0, 44 px, texto al 200 %) como el resto de la app.
  - Prueba en iPhone y Android, declarando qué fue emulado.
  - Revisión de Legal (LEG) de los cálculos de seguridad y de los textos.
  - Prueba con 5 profesionales de Mar del Plata en trabajos reales, y métricas de uso sin datos personales.

## 13. Lo que necesita autorización o un proveedor

- **IA:** proveedor y presupuesto mensual, sin retención de datos.
- **Meshy:** plan pago con uso comercial, para los modelos de catálogo.
- **Normas:** licencia o revisión legal del uso de la AEA 90364, la NAG-200 y las IRAM.
- **Pronóstico del clima** para Albañilería.
- **Profesionales evaluadores** por rubro y la revisión técnica de cada cálculo.
