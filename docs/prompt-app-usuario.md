# Prompt: llevar la experiencia de diseño de Handyx a la app del usuario

Pegar en una sesión nueva de Claude Code con los repos `handyx-client-fe`, `handyx-client-be` y `handyx-specialist-fe`.

---

Sos el responsable de diseño de producto de **Handyx** (Mar del Plata), que conecta vecinos con especialistas del hogar
verificados. Ya diseñamos completa la **app del especialista** con una experiencia premium. Ahora quiero **la misma
calidad, el mismo sistema visual y la misma forma de trabajar para la app del usuario** (el cliente que pide el
servicio). **Primero el diseño completo, sin desarrollar nada**, hasta que yo dé el OK.

## Qué leer antes de empezar

1. En `handyx-specialist-fe` (rama `claude/pensive-hypatia-jajjgm`): `docs/rediseno-deluxe.md` (todas las decisiones,
   §6 a §12), `docs/revision-ux.md` (reglas del sistema y revisión) y `design/deluxe/` (fuente del lienzo: pantallas
   `.dc.html`, `canvas.json` y los generadores de `gen/`, que se pueden reutilizar tal cual: piezas comunes, flujos y
   los chequeos `revisar.cjs` y `medir.cjs`).
2. En `handyx-client-fe`: la rama más nueva (`handia-premium`, con HandIA, el asistente) y su `docs/handoff.md`,
   `docs/plan.md`, `docs/diseno.md` y `CLAUDE.md`. Respetá lo que ya existe y mejoralo; no lo tires.
3. En `handyx-client-be`: `CLAUDE.md` y el contrato `src/contracts/v1/` (qué datos existen hoy).

## Sistema visual (el mismo del especialista)

Fondo blanco; cabecera azul `#1F57A8` redondeada solo en las pantallas principales; barra compacta con «volver» en el
resto; **barra de pestañas flotante, redondeada y de vidrio esmerilado** (con fondo sólido de respaldo); mosaicos
grises; tarjetas blancas con borde fino, sombra en capas y franja gris «Ver …»; botones azules con base que se hunde;
una acción principal fija abajo; chips de estado con ícono y texto; montos en Archivo 900 ensanchado; una palabra con
marcador amarillo `#F5F59A` por título; los Handys en vacíos, éxitos y errores; ilustraciones SVG propias
(ciudad, errores). Personas con **iniciales y nombres ficticios**, nunca personajes en lugar de personas.

## Qué diseñar para el usuario (pensalo como producto completo, no como MVP)

- **Acceso y alta:** bienvenida con la ciudad en SVG, código por email o SMS, Google y Apple, segunda verificación
  opcional; datos mínimos; la dirección exacta solo se comparte cuando acepta una propuesta.
- **Pedir un servicio:** los seis rubros en mosaicos, HandIA para describir el problema, fotos con anotaciones,
  **medir con la cámara** («el hueco mide…»), fecha y franja en el calendario, zona aproximada.
- **Recibir y comparar propuestas:** precio que pone cada especialista (Handyx sugiere, nunca impone), fecha
  propuesta, perfil verificado y certificados verificados; aceptar, pedir cambios o elegir otro horario.
- **Seguimiento:** el especialista en camino (en vivo solo durante el viaje), llegada, avance, **antes y después**
  (deslizar y lado a lado), informe con garantía, **conformidad con un toque**, cobro directo (Mercado Pago o efectivo;
  reportado ≠ verificado; Handyx no recibe ni reparte la plata).
- **Obras de varios días:** aprobar la propuesta de obra (etapas y montos), ver los días, aprobar repuestos y cambios
  de fecha desde el chat, **chat grupal con el equipo de profesionales**, pagos por etapa a quien corresponda según el
  reparto, total gastado.
- **Mensajes con tarjetas:** presupuestos, propuestas de obra, repuestos para aprobar y cambios de fecha que se
  aceptan o se responden ahí mismo.
- **Mi hogar:** ficha de la casa (ambientes y equipos: termotanque, aire, tablero), historial de trabajos, informes y
  garantías, **recordatorios de mantenimiento** y los modelos 3D o medidas que le compartió el especialista; ver en
  AR un equipo propuesto antes de aceptarlo.
- **Herramientas que comparten ambos lados:** medir con la cámara, nivel, linterna y lupa, foto con anotaciones,
  escanear un objeto en 3D para mostrarlo, ver en AR; todo termina en el chat o en el pedido.
- **Gamificación para el usuario** (pensala de cero, sin copiar la del especialista): por ejemplo un «camino del
  hogar» por cuidar la casa (mantenimientos hechos a tiempo, conformidades dadas, informes leídos, ficha del hogar
  completa), insignias y beneficios sin azar. **Sin presión para contratar más, sin rankings, sin envíos automáticos
  a contactos** y con montos y premios marcados como borrador para Legal.
- **Cuenta, ayuda y errores** premium como en el especialista.

## Reglas que no se negocian

Español rioplatense con voseo; montos `$ 45.000`; «verificados» sí, «matriculados» y «despachamos» no; sin
«inmediato» ni «al instante». Datos de prueba sintéticos (`*@example.test`, nombres ficticios, «Calle De Prueba»). Nada
en `localStorage`, `sessionStorage`, IndexedDB ni `document.cookie`. HandIA y cualquier IA sin datos personales.
Respetá las reglas de tarifa y de pago de `handyx-client-be` (`CLAUDE.md`). Nada remoto, ni compras, ni deploy sin
autorización.

## Cómo entregarlo

1. Un lienzo de diseño (artifact de tipo Design) con: arriba un tablero de **revisión UX/UI**; después los **flujos
   completos** (empezando por «Mapa de la app»), con cada pantalla tocable, los pasos del especialista, de Handyx y de
   Operations; y abajo todas las pantallas de 390 × 844, una fila por fase.
2. La fuente del lienzo en `handyx-client-fe/design/` (para pasarla a Figma) y las decisiones en un documento de
   `docs/`, más las fases nuevas en el plan, con modelo y esfuerzo por fase.
3. Corré los chequeos en todas las pantallas (axe en 0, áreas táctiles de 44 px, textos de 11 px o más, nada tapado
   por los botones fijos) y corregí antes de mostrarme.
4. Avisame cuando termines y **esperá mi OK antes de desarrollar**.
