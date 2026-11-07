# Rediseño deluxe · D.1 Auditoría y direcciones de arte

Fase D del bloque Taller (`docs/herramientas.md`). Este documento cierra el lote D.1. La dirección
elegida es **«Handyx de hoy, mejorada»** (§7, 08/11/2026). D.2 empieza con el OK de Ignacio.

- Lienzo con las 3 direcciones (9 pantallas de 390 × 844, navegables entre sí): artifact privado «Handyx Deluxe ·
  Direcciones de arte», enlazado en el handoff de la sesión. Es una maqueta: los textos y montos son los de la demo,
  con datos de prueba.
- Las 3 pantallas clave son las mismas en cada dirección: **Inicio**, **Tu precio** y **el regalo** del Camino Handyx.

## 1. Auditoría de la app actual

Revisión de las capturas sanitizadas (`docs/capturas/`, 118 pantallas en 12 etapas) y del kit v2 (`src/kit/`).

| Hallazgo                                               | Dónde se ve                             | Qué cambia en el rediseño                                              |
| ------------------------------------------------------ | --------------------------------------- | ---------------------------------------------------------------------- |
| Tarjetas blancas iguales una tras otra; poca jerarquía | Inicio, Trabajos, Cuenta, Ayuda         | Una superficie protagonista por pantalla; el resto, secundaria         |
| Íconos de línea finos y genéricos                      | Barra inferior, filas de Cuenta, avisos | Íconos propios con trazo grueso y piezas de herramienta                |
| Superficies planas, sin materia                        | Todo menos el Taller                    | Sombras en capas, relieve y un material propio por dirección           |
| Los montos no son protagonistas fuera del Taller       | Pedido, Caja, Tu precio                 | Números de instrumento: Archivo 900 ensanchado y cifras tabulares      |
| Celebraciones chicas (isla y confeti)                  | Propuesta enviada, trabajo terminado    | Momentos con coreografía: regalo, luz, Handy y vibración               |
| El banner de «Datos de prueba» domina en el mock       | Todas las pantallas del mock            | Banner más bajo y compacto, que siga siendo visible (regla de datos)   |
| Los Handys aparecen poco y planos                      | Vacíos, errores, bienvenida             | Handys en 3D (Meshy en D.3) en los vacíos, en el regalo y en el Inicio |

Se conservan sin cambios: la una acción primaria por pantalla, aceptar en verde y rechazar en contorno rojo, estados
con ícono **y** texto, áreas táctiles de 44 px o más, foco visible y texto al 200 %.

## 2. Las tres direcciones

### A · Taller de obra

Claro y material, como una caja de herramientas premium. Fondo cal `#F3F0E8`, tarjetas tipo placa con tornillos en las
esquinas, cinta de seguridad amarilla y azul noche para lo importante, botones azules con base que se hunde y números
grandes de instrumento. El precio vive en una placa oscura.

- A favor: es la continuación natural de la landing y de la demo; **respeta todas las reglas actuales** (sin gradientes
  ni vidrio); se lee bien al sol, que es donde se usa en obra.
- En contra: es la menos sorprendente; la cinta de seguridad hay que dosificarla para que no canse.
- Reglas: ninguna cambia. La cinta es un patrón de franjas, no un gradiente de color.

### B · Noche de obra

Oscura y de lujo, como el tablero de un auto o una linterna en obra. Azul noche `#0B1424`, superficies `#13213A` con un
filo de luz arriba, el amarillo `#F5F59A` como luz y acción principal, Handys iluminados. El regalo aparece en un
escenario oscuro bajo un haz de luz.

- A favor: la más «deluxe» y distinta del resto del rubro; ahorra batería en pantallas OLED; los montos brillan.
- En contra: peor lectura a pleno sol; obliga a un modo claro igual de cuidado (doble trabajo en D.2 a D.6); el
  amarillo sobre oscuro hay que medirlo para que el contraste no canse.
- Reglas: **cambia la regla de gradientes** (halos radiales suaves y el haz del regalo); el verde de «Recibís» pasa a
  un tono claro `#7BE3A6` para el contraste sobre oscuro.

### C · Costa de Mar del Plata

Luminosa y editorial, con el mar y la arena de la ciudad. Mucho aire, títulos enormes, celeste `#CFE3F7`, arena
`#F2E6CF`, azul mar `#1F57A8` y tarjetas blancas flotantes con sombras largas y suaves. Las pantallas clave llevan un
horizonte (cielo, mar, arena) y el regalo sale del mar con el sol detrás.

- A favor: identidad local fuerte (Mar del Plata es la ciudad del lanzamiento); muy aireada y amable para el cliente
  que vea capturas; la que mejor diferencia a Handyx de las apps de reparto.
- En contra: el horizonte ocupa alto útil en pantallas chicas (320 × 568); al crecer a otras ciudades habría que
  cambiar el motivo; menos «herramienta», más «marca».
- Reglas: **cambia la regla de gradientes** (el cielo usa un degradé vertical); las sombras largas se acercan al límite
  de «manchas», hay que fijar un máximo.

## 3. Principios de movimiento, vibración y sonido (valen para cualquier dirección)

- **Movimiento con propósito:** entra lo que cambió, nunca todo. Duraciones de 160 a 320 ms en la interfaz y hasta
  1,2 s solo en celebraciones. GSAP y View Transitions; todo se apaga con `prefers-reduced-motion` (la pantalla queda
  en su estado final, sin perder información).
- **Números que cuentan:** los montos cambian contando (como `m.contar` de la demo), con cifras tabulares para que no
  salten.
- **Celebraciones con medida:** solo por logros reales del especialista (propuesta enviada, trabajo terminado, estación
  del camino). Nunca por aceptar más, nunca con presión ni comparaciones.
- **Vibración:** solo en Android (`navigator.vibrate`), corta (10 a 30 ms) al confirmar y un patrón breve en el regalo.
  Nunca en avisos que no pidió.
- **Sonido:** opcional y **apagado por defecto**; un juego de 3 sonidos cortos (confirmar, error, regalo). Nunca suena
  si el teléfono está en silencio o con «reducir movimiento».
- **El regalo:** sin azar. La caja se abre siempre con el premio que se ganó y se dice antes qué hay en la próxima
  estación.

## 4. Decisiones que necesita tomar Ignacio

1. **Dirección:** A, B o C (o una mezcla con base en una, por ejemplo C para la marca con placas de A en el Taller).
2. **Regla de gradientes y vidrio** (`docs/diseno.md`): se mantiene (solo A entra) o se habilitan halos y cielos con
   un límite escrito. El vidrio esmerilado queda fuera en las tres.
3. **Capa propia o landing:** los tokens de la app son copia byte a byte de la landing. Opciones: tokens nuevos solo de
   la app (prefijo `--hx-*`, la landing no cambia) o actualizar también la landing con la misma dirección (otro bloque,
   con su OK por la regla de la landing).
4. **Plan de Meshy (D.3):** qué se modela (los Handys y los premios), cuántas variantes y quién compra los créditos. No
   se contrata ni se compra nada desde las sesiones.

## 5. Cómo sigue

Con la elección, D.2 arma el kit v3 en `src/kit/` (tokens, componentes y biblioteca de movimiento) y lo muestra en
`/catalogo/`; D.3 a D.7 siguen el plan de `docs/herramientas.md`. Después: H0, R, G, Q y la fase 6 (deploy).

## 6. Primera elección: C · Costa de Mar del Plata (08/11/2026, después descartada, ver §7)

Ignacio eligió C con estos ajustes, ya dibujados en la fila C del lienzo (Inicio con mapa, Tus obras, Obra día por
día, Tus ingresos, Tu precio y el regalo):

1. **Disponible y los pedidos viven solo en el Inicio con mapa.** El Inicio sigue siendo el mapa de la app actual
   (barrios, la costa y el Mar Argentino a la derecha, zona aproximada del pedido y la posición del especialista) con el
   interruptor «Disponible» flotante y la hoja de «Pedidos para vos». Ninguna otra pantalla deja ponerse disponible ni
   aceptar o cotizar. Debajo de los pedidos, dos accesos chicos: el neto del mes y Tu camino.
2. **Apartado Obras.** Hoy las obras (lote 4.7: plan, jornadas, diario y cobro por etapas) están adentro del detalle de
   cada trabajo y no tienen un lugar propio. Pasan a una **pestaña Obras**: lista con «En curso», «Próximas» y
   «Terminadas», cada una con el anillo de etapas y la tira de jornadas; y el seguimiento **día por día** (las jornadas
   en una tira con hechas, hoy y las que vienen; la etapa en curso; el último avance del diario con fotos; acordado,
   cobrado, materiales y lo que falta cobrar) con una sola acción principal: «Cargar el avance de hoy». Pestañas:
   Inicio · Obras · Agenda · Mensajes · Cuenta.
3. **Tus ingresos: bruto y neto.** La caja pasa a ser «Tus ingresos» por mes: el **neto** (lo que le queda) como cifra
   protagonista, el **bruto** cobrado (en Handyx, con lo verificado aparte, y por fuera), los **gastos** (materiales,
   combustible y viáticos) restados, la tarifa de Handyx (0 % en la demo), una barra que reparte el bruto, la ganancia
   por trabajo y «Cargar un gasto con la foto del ticket». Lo informado sin verificar se sigue diciendo como tal. El
   diseño se arma en D.5 y la carga de gastos llega con H0.3; hasta entonces el neto dice «sin gastos cargados».
4. **Sin gradientes.** Cielo, mar y arena se dibujan como bandas planas, así que la regla de `docs/diseno.md` (sin
   gradientes ni vidrio) se mantiene. El anillo de avance usa cortes netos, no un degradé.

Siguen pendientes: capa propia de la app o también la landing (§4.3) y el plan de Meshy (§4.4).

## 7. Dirección elegida: Handyx de hoy, mejorada (08/11/2026)

Después de ver C, Ignacio pidió volver a la estética que ya tiene la app (la de la demo de la landing) con mejores
componentes. Es la fila «Elegida» del lienzo, arriba de todo (Inicio con mapa, Tus obras, Obra día por día, Tus ingresos,
Tu precio y el regalo). La fila C queda como descartada.

- **Fondo blanco** y sin la costa ni bandas de cielo, mar o arena. El mapa del Inicio sigue siendo el mapa real.
- **Cabecera como ahora:** bloque azul redondeado abajo con «Handyx» y «Soluciones, no problemas», y los botones
  cuadrados de avisos y zonas, solo en el Inicio. En el resto, la barra compacta con el botón de volver y el título.
- **Barra de pestañas flotante, redondeada y de vidrio esmerilado** (`backdrop-filter: blur() saturate()`, blanco
  translúcido, borde claro y sombra en capas); la pestaña activa es un botón azul con base que se hunde. Pestañas:
  Inicio · Obras · Agenda · Mensajes · Cuenta. Es la **única excepción** a la regla de «sin vidrio» y solo en la app (la
  landing no cambia). Accesibilidad: fondo blanco sólido si no hay `backdrop-filter` o con
  `prefers-reduced-transparency: reduce`, y contraste AA medido sobre el peor fondo (el mapa y las tarjetas).
- **Componentes mejores con el lenguaje actual:** mosaicos grises, tarjetas blancas con borde fino, sombra en capas y la
  franja gris de «Ver …», botones azules con base, etiquetas en mayúsculas espaciadas, marcador amarillo en una palabra
  del título, pastillas de estado con ícono y texto, anillo de etapas, tira de jornadas y los Handys en mosaicos.
- **Se mantienen las ideas de contenido del §6:** Disponible y los pedidos solo en el Inicio con mapa, el apartado
  Obras con seguimiento día por día y Tus ingresos con bruto, gastos y neto.
- Sin gradientes: el anillo usa cortes netos y el marcador amarillo es una sombra interna.

## 8. Diseño completo de todas las fases (08/11/2026)

Pedido de Ignacio: «armame todo el diseño de todo lo que queremos armar en todas las fases». El lienzo quedó con una
fila por fase (50 pantallas) y las exploraciones de D.1 abajo, como descartadas. Ajustes de esta vuelta:

- **Inicio:** solo la meta (Tu camino) y cuánto suma el pedido **cuando el trabajo se verifique** (un tramo amarillo en
  la barra). El neto del mes se fue a **Tus ingresos**. Sin presión: nada baja si no lo toma, «Ahora no» no tiene
  consecuencias y no hay cuentas regresivas del camino.
- **Recibir un trabajo:** el aviso (isla) abre el **pedido entrante** como hoja sobre el mapa: zona aproximada y
  distancia, horario pedido por el cliente, lo que cuenta, el sugerido y tres salidas: «Cotizar», «Otra fecha» y «Ahora
  no». Nunca acepta solo.
- **Cambiar el precio:** el monto grande con una **cinta métrica amarilla** que se desliza y marca el sugerido, atajos
  (Sugerido, + $ 2.000, + $ 5.000, Escribir), «Incluye materiales» y garantía como interruptores, y lo que recibe.
- **Nueva fecha:** «Voy en ese horario» o «Propongo otro»; **calendario del mes** con hoy en naranja y los días con
  jornada de obra en gris; franjas del día con las ocupadas tachadas según la agenda. Es una propuesta: el cliente la
  acepta o elige otra.
- **Revisar y enviar** en una hoja con el resumen (precio, fecha, zona) y **propuesta enviada** con el Handy.

| Fila                       | Pantallas                                                                                                                                                      |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Núcleo · recibir y cotizar | Inicio con mapa, Pedido entrante, Tu precio, Proponer fecha, Revisar y enviar, Propuesta enviada                                                               |
| Núcleo · día a día (D.5)   | Trabajo agendado, Agenda, Tus obras, Obra día por día, Tus ingresos, Mensajes, Chat del pedido, Cuenta                                                         |
| D.6 · resto                | Bienvenida, Acceso con código, Alta guiada, Avisos, Ayuda, Error con un Handy roto                                                                             |
| H0                         | Presupuestador, Presupuesto en el chat, Lista de precios, Cargar gasto, Modo trabajo, Antes y después, Informe al cliente, Ruta del día, Stock de la camioneta |
| R                          | Pedir repuestos, Ferreterías (simulación), Estado del pedido, Retiro con QR, Panel de la ferretería                                                            |
| G                          | Camino, El regalo, Vitrina de premios, Canje, Insignias                                                                                                        |
| H1                         | Portada del Taller, Cables, Tablero 3D, Informe eléctrico                                                                                                      |
| H2–H6                      | Aire acondicionado, Plomería, Gas, Albañilería, Cerrajería (después del deploy)                                                                                |

Todo con datos de prueba («Especialista De Prueba», «Cliente De Prueba», `especialista@example.test`, «Calle De Prueba
123», ferreterías «Simulación»). Las piezas comunes (cabecera azul, barra compacta, barra de pestañas de vidrio,
tarjeta con franja, mosaicos, pastillas, anillo, tira de jornadas, calendario, cinta de precio, hoja) son la base del
kit v3 de D.2.

## 9. Segunda vuelta del diseño completo (08/11/2026)

Pedidos de Ignacio sobre el lienzo, ya dibujados (85 pantallas):

- **Agenda:** sigue la tira deslizable y suma «Ver el mes»: el mes completo en pantalla entera, con flechas a los meses
  pasados y siguientes, barras de color por obra o trabajo y el detalle del día elegido.
- **Obras:** resumen compacto arriba (días en obra, gastado, falta cobrar) y los seis días a la vista en lista;
  detalle de cada jornada; repuestos a futuro con aprobación del cliente y aviso si falta comprar; cambio de fecha de
  una jornada o de todas las que siguen.
- **Obras en equipo:** invitación (contactos o enlace con código), chat grupal con el cliente y reparto del pago entre
  los profesionales; Handyx no toca la plata.
- **Mensajes:** personas con iniciales y nombres ficticios; chats atados a pedidos, obras o el equipo; botón «+» para
  mandar presupuestos, propuestas de obra, repuestos para aprobar, cambios de fecha, fotos e informes.
- **Cuenta:** cabecera azul con avatar, estadísticas y accesos en mosaicos de color; **sin ninguna mención a tarifas**
  (Handyx no le cobra comisión al especialista, nunca).
- **Acceso:** bienvenida con la ciudad en SVG propio; elegir cómo entrar (email, SMS, Google, Apple); código de 6
  dígitos; segunda verificación opcional con app autenticadora, SMS o email.
- **Registro paso a paso:** 10 pasos, de los datos y el domicilio a la selfie, el DNI, los certificados (matrícula
  obligatoria en Gas y Aire) y los antecedentes por foto o PDF.
- **Ayuda** con buscador, temas en mosaicos y respuestas desplegables; **errores** con ilustraciones SVG propias.

Todo quedó en el plan: fases **V** (acceso, registro y verificación) y **O** (obras en equipo, mensajes y cuenta) en
`docs/herramientas.md`. Nombres ficticios del lienzo: Julián Ortiz (el especialista), Martín Sosa, Lucía Ferreyra,
Carla Ibáñez (clientes), Sofía Ruiz, Diego Herrera y Pablo Vega (profesionales).

## 10. Flujos completos y H0 rehecho (08/11/2026)

- **Flujos de la app** arriba del lienzo: 10 diagramas que muestran cómo se recorre todo, con cada pantalla (se toca
  para abrirla), lo que hace el cliente, lo que hace Handyx u Operations y otro profesional: alta y verificación,
  entrar y segunda verificación, recibir un pedido y cotizar, hacer el trabajo y cobrar, presupuestos y lista de
  precios, obra de varios días, obra en equipo, mensajes y tarjetas, gastos, repuestos e ingresos, y Camino Handyx.
- **Presupuesto:** se manda directo por el chat (se quitó la vista del cliente). Materiales con precio fijo o que se
  actualiza; de a uno o varios; y las dos casillas: cobrarlo y registrarlo como gasto.
- **Lista de precios** en 6 pantallas: qué es y de dónde salen los precios, foto del corralón, revisar lo leído,
  detalle con historial, tarifas de mano de obra. El catálogo de ferreterías queda marcado «pronto».
- **Cargar gasto** también permite cobrárselo al cliente.
- **Modo trabajo** nuevo, claro: tareas, cronómetro, foto, repuestos, pedir ayuda, agenda y herramientas a un toque.

## 11. Cuarta vuelta y fuente en el repo (08/11/2026)

- **Antes y después** en dos vistas (deslizar y lado a lado), con ilustraciones propias, y «Qué cambiaste» escrito o
  dictado.
- **Informe del trabajo** por secciones que no se repiten y se completan solas (qué encontraste, antes y después,
  pruebas, materiales y garantía, qué conviene hacer después); al enviarlo: conformidad del cliente, garantía activa,
  recordatorio de mantenimiento y PDF.
- **La ruta del día pasó al Inicio:** con varios trabajos hoy, el Inicio muestra la próxima parada y el recorrido; «Ver
  todo» abre el día en el mapa con las paradas en orden.
- **Tu equipamiento** reemplaza al stock de la camioneta: herramientas eléctricas, manuales, medición, seguridad,
  consumibles y repuestos; dónde está cada una, préstamos, mantenimiento y lista de compras.
- **Ferretería** con catálogo por categorías (fijaciones y tornillería, plomería, electricidad, gas, pintura,
  albañilería, herramientas, seguridad, limpieza y adhesivos), variantes y un pedido único.
- 14 flujos en total, con los nuevos de tu día, cierre del trabajo, equipamiento y ferretería.
- **Fuente del lienzo en `design/deluxe/`** (pantallas, `canvas.json` y generadores), lista para pasar a Figma.

## 12. Quinta vuelta: ferretería completa, camino, taller y revisión UX/UI (08/11/2026)

- **Ferretería:** QR a pantalla completa (brillo al máximo) y lista grande para el mostrador o en voz alta. **Panel
  web del ferretero** completo (alta, inicio por estado, pedido con stock y reemplazos, escanear, entrega, catálogo,
  importar lista, métricas) y app del ferretero en el teléfono (escanear y preparar). Sirve para desarrollar y para el
  pitch.
- **Camino Handyx:** inicio del camino con el kit de bienvenida (remera y manual), mini caminos (trabajos, cobros
  verificados, oficio), manual de uso, mini camino por cobros con hitos y el concepto de áreas para más adelante.
- **Tu taller:** herramientas para todos (medir con AR, escanear en 3D, nivel, plomada, linterna, conversor) y aparte
  las del oficio (Electricidad con tablero 3D premium y la vista en la pared).
- **Flujos:** 17 en total, con «Mapa de la app» primero, panel del ferretero, camino y taller.
- **Revisión UX/UI** de todo (`docs/revision-ux.md`): 0 errores de accesibilidad, 0 áreas táctiles chicas, 0 textos
  chicos; el tablero «Revisión UX/UI» está arriba de todo en el lienzo.

## 13. Sexta vuelta: acceso, onboarding, cuenta, recorridos y funciones nuevas (08/11/2026)

- **Recorridos con pantallas** (16, debajo de la revisión): cada uno muestra las pantallas reales en orden, con lo que
  pasa entre ellas, para ver los caminos completos y detectar pantallas faltantes. Se agregaron las que faltaban.
- **Acceso:** «Ya tengo cuenta» abre el inicio de sesión (email o teléfono y contraseña, Google, Apple o un código),
  después la segunda verificación y la recuperación de contraseña. En los textos ya no aparece «Operations»: «Estamos
  evaluando tu perfil para saber si estás apto», «el equipo de verificación de Handyx».
- **Onboarding completo** (habilitado, permisos explicados, cómo funciona, primeros pasos) y **Cuenta completa** en un
  tablero alto con todas las secciones (perfil, datos, disponibilidad, cobros, avisos, privacidad); «Próxima
  recompensa: Gorra».
- **Inicio:** barra de pestañas azul de vidrio con la pestaña activa en blanco; los pedidos son modales redondeados
  flotantes con el mapa siempre detrás. **Tu día** con paso a paso de paradas y la próxima con hora estimada.
  **Agenda** con «Pasadas · Hoy · Futuras».
- **Precio y horario:** teclado para escribir el precio; horario a medida (franja «de 6 a 8» u hora exacta, también
  a las 6 de la mañana).
- **Obra y jornada:** cabecera protagonista con avance, días como línea de tiempo; jornada con cambiar horario,
  agregar tarea y cargar avance en hojas.
- **Obras en equipo:** «Buscar uno nuevo» publica una búsqueda que ven especialistas verificados de la zona en su
  Inicio; se postulan y el titular elige (`docs/herramientas.md` O.4).
- **Chat:** reacciones, editar, borrar para todos con borrado lógico, seleccionar varios, fotos y videos, info del
  grupo y agregar personas (O.6).
- **Repuestos:** «Lo consigo yo» o «En una ferretería adherida», con la comparación de precios por ferretería (O.2).
- **Tu equipamiento:** detalle de cada herramienta y «Ya no la tengo» (H0.5). Se corrigieron las tarjetas de
  categorías que se rompían con números largos.
- **Camino:** el manual se elige en la app, impreso o los dos (G.0).
- **Textos que se salían:** regla general de corte de palabras y espacios duros en montos y unidades.
- Revisión: 190 tableros (156 pantallas, 16 recorridos, 17 flujos), axe en 0, 0 áreas táctiles chicas, 0 textos
  chicos y nada tapado por los botones fijos.

## 14. Séptima vuelta: textos sin cortes, Inicio, pestaña Taller, chats y descripciones (08/11/2026)

- **Textos:** se quitó el corte de palabras con guion («pro-puesta», «Suge-rido»); las palabras pasan enteras a la línea
  de abajo. Componentes reorganizados donde no entraban (columnas, `wrap`, anchos): reparto del pago, agenda desde el
  trabajo, tablero 3D, herramientas en dos columnas, mini caminos en lista y la semana entera en la agenda.
- **Inicio:** Disponible y los datos del día (pedidos, zonas, camino; o cobrado, recorrido y camino) en un **panel
  colgado de la cabecera**, en vez de chips sueltos sobre el mapa. Sin la tarjeta fantasma detrás del pedido.
- **Botones** largos uno arriba del otro con todo el ancho (la acción principal arriba).
- **Pestaña Taller** en lugar de Agenda (`docs/herramientas.md`).
- **Equipo:** «Ver perfil» del postulante, como lo ve un cliente.
- **Materiales:** agregar en un paso, opciones resumidas y «Material nuevo» que alimenta el catálogo.
- **Fotos y videos:** botón para sacar una foto o grabar, y pestaña de archivos.
- **Chats:** avatar pegado a su burbuja, nombre y hora adentro, reacciones apoyadas en el borde, avatar de grupo en
  mosaico (sin superposiciones) y **los mensajes pegados abajo**, arriba de la caja para escribir.
- **Hojas y modales:** detrás del velo se ve la pantalla de la que salen, no un fondo gris vacío.
- **Recorridos y flujos:** cada pantalla con una descripción de lo que se puede hacer y **«Cómo llegás»**, calculado
  desde los botones reales que llevan a ella. Se agregaron los accesos que faltaban (gasto desde ingresos, insignias
  desde la vitrina, otros oficios desde el taller).
- **Escritorio:** una pantalla de muestra de cómo se ve desde una computadora (solo celular).
- 195 tableros: 161 pantallas (una de escritorio), 16 recorridos y 17 flujos; axe en 0, 0 áreas táctiles chicas, 0
  textos chicos y nada tapado por los botones fijos (`medir.cjs` ahora se corre sobre todas las pantallas).
