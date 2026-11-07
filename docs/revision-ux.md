# Revisión UX/UI del diseño completo (08/11/2026)

Revisión de las 156 pantallas, 16 recorridos con pantallas y 17 flujos del lienzo (fuente en `design/deluxe/`). Se hizo en el navegador, pantalla por
pantalla, con tres chequeos automáticos (`design/deluxe/gen/revisar.cjs`) y revisión a ojo de las capturas.

| Chequeo                                                      | Resultado final           |
| ------------------------------------------------------------ | ------------------------- |
| axe-core, reglas WCAG 2 A y AA                               | 0 errores en 190 tableros |
| Botones, enlaces, pestañas e interruptores de menos de 44 px | 0                         |
| Textos de menos de 11 px                                     | 0                         |
| Contenido tapado por los botones fijos de abajo              | 0 (`medir.cjs`)           |

## Qué se corrigió

- Contraste: días pasados del calendario, franjas ocupadas, textos celestes sobre azul y botones sobre fotos ahora
  cumplen 4,5 : 1.
- Interruptores: toda la fila es el control (`role="switch"`) y tiene nombre para el lector de pantalla.
- Pestañas de la obra, segmentos, avisos amarillos y enlaces de texto con área táctil de 44 px.
- Etiquetas de 9 y 10 px subidas a 11 px (tira de días, calendario, flujos, avatares).
- ARIA: chips que no son pestañas sin `tablist`; botones dibujados con `role="button"`; colores de la remera con
  nombre; el punto rojo de «faltan comprar» con `role="img"`.
- Sexta vuelta: textos y montos que se salían de sus tarjetas (corte de palabras y espacios duros), contraste
  de las ruedas de hora y de los mosaicos sobre azul, listas de opciones con nombre y enlaces de las miniaturas de
  los recorridos de 44 px.
- Nombres del chat grupal legibles; tarjetas del tablero del ferretero sin cortes; camino de trabajos y QR sin
  superposiciones.

## Reglas del sistema (para el kit v3 de D.2)

- Cabecera azul en Inicio, Cuenta, Ayuda y Camino; barra compacta con «volver» en el resto.
- Pestañas flotantes de vidrio solo en las cinco pantallas raíz (Inicio · Obras · Agenda · Mensajes · Cuenta).
- Una acción principal por pantalla, fija abajo, con base que se hunde; la secundaria en contorno azul.
- Tarjetas blancas con borde fino, sombra en capas y franja gris «Ver …»; mosaicos grises para datos y Handys.
- Estados con ícono y texto; montos en Archivo ensanchado con cifras tabulares.
- Una palabra con marcador amarillo por título. Fondos oscuros solo en cámara, nivel, QR y escaneo.
- Datos de prueba siempre: nombres ficticios, `*@example.test`, «Calle De Prueba», ferreterías «Simulación».

## Para el desarrollo

- Movimiento con View Transitions y celebraciones; todo se apaga con «reducir movimiento».
- Esqueletos de carga, vacíos y errores en cada pantalla que trae datos.
- Texto al 200 % y 320 px de ancho en el código real (el lienzo se diseñó a 390 × 844).
- Prueba a mano con VoiceOver y TalkBack; AR en un Android y un iPhone.
- Decisiones abiertas: tokens de la app o también la landing; Meshy; proveedor de SMS; catálogo real de ferreterías;
  revisión legal de antecedentes y premios; condiciones comerciales con ferreterías; kit de bienvenida.
