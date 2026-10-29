# Sistema visual, jerarquía de acción y accesibilidad · PWA Especialista (lotes 3.1 y 3.2)

Fuente única: la demo de la app de la landing (`Handy-landing-page-fe/src/styles/demo-app.css`) y sus tokens de marca
(`src/brand/tokens.ts`, copia byte a byte). Implementación: `src/app/globals.css` (capa `--hd-*`) y los componentes de
`src/components/`. Esta página dice **cómo** se decide la forma de una pantalla; el catálogo final de componentes y
las capturas por estado son del lote 3.3.

## Tokens

| Grupo | Tokens | Uso |
|---|---|---|
| Marca | `--hd-azul`, `--hd-azul-hondo`, `--hd-azul-tinte`, `--hd-noche`, `--hd-amarillo` | Mismos nombres y valores que la demo de la landing |
| Texto | `--hd-tinta` (títulos), `--hd-texto`, `--hd-suave` | Suave solo para datos secundarios, nunca para lo que hay que decidir |
| Superficies | `#fff` + `--hd-sombra-1`, `--hd-fondo-2` (tarjeta gris), `--hd-mosaico` | Tarjetas blancas con sombra suave; mosaicos grises para lo secundario |
| Estados | `--hd-exito` / `-tinte`, `--hd-aviso` / `-tinte`, `--hd-error-texto` / `-tinte` | Siempre acompañados de ícono y texto |
| Escala | `--esp-1…6` (4–28 px), `--radio-tarjeta` 20 px, `--toque-min` 44 px | Un solo sistema de espacios |

Tipografía: títulos en Archivo 900 ensanchado (`font-stretch: 125%`, `text-wrap: balance`), h2/h3 en Archivo 800, texto en
DM Sans. **Montos** con `.monto`: Archivo, cifras tabulares, sin cortes de línea. Rótulos chicos en mayúsculas: `.sobre`.

## Tipo y estado no se confunden

| Qué | Componente | Forma |
|---|---|---|
| **Tipo** de pedido o trabajo | `ChipTipo` | Urgente = chip oscuro (`noche`) con rayo; Programado = neutro con calendario; Obra = neutro con ladrillos |
| **Estado** (alta, documento, propuesta, trabajo, pago, caso) | `Chip` con `lib/etiquetas.ts` | Tinte de color + ícono + texto. Ningún estado usa `noche` |

Así "Programado" (tipo) y "Agendado" (estado) ya no se ven iguales, y la urgencia se reconoce sin colores de alarma.

## Jerarquía de acción

1. **Una sola acción primaria por pantalla o tarjeta.** Es la próxima acción del flujo: "Salgo hacia el lugar", "Guardar y
   seguir", "Enviar mi alta a revisión".
2. **Decisiones distinguibles por texto, ícono y forma, no solo por color:**

   | Acción | Botón | Ícono |
   |---|---|---|
   | Aceptar un acuerdo, terminar un trabajo | `boton--exito` (verde relleno) | tilde |
   | Enviar, guardar, avanzar | `boton` (azul relleno) | según la acción |
   | Contraofertar, navegar, secundarias | `boton--claro` (gris) | — |
   | Rechazar, cancelar, dar de baja | `boton--peligro` (contorno rojo, **nunca relleno**) | cruz / tacho |

3. **Aceptar, rechazar, terminar y cancelar piden confirmación** en una hoja con el resumen (importe, fecha y qué pasa
   después). La confirmación repite el verbo ("Sí, aceptar") y ofrece "Volver".
4. **Sin primarios que compitan.** Con una propuesta del usuario vigente, el detalle del pedido ofrece aceptar,
   contraofertar o rechazar, y esconde "Enviar una propuesta" (que sería una propuesta paralela). En el alta, "Atrás" y
   "Siguiente" son secundarios: el primario es la acción del paso.
5. **Avisos y bandeja nunca deciden.** Toda tarjeta de pedido o aviso es un enlace al detalle.

## Urgencia sin dark patterns

- El tiempo restante se informa con texto neutro y una frase completa ("La búsqueda cierra en 8 h 59 min", "Vence en 4:59").
  Sin rojo, ni parpadeo, ni signos de exclamación, ni "¡apurate!".
- En la bandeja, un programado muestra la hora de cierre ("Búsqueda abierta hasta las 21:00"), no una cuenta regresiva.
- Al vencer se lee "La propuesta venció" o "La búsqueda terminó", en gris: vencer no es un error.
- La pantalla vuelve a pedir el estado al servidor cuando la cuenta llega a cero. Nunca decide sola que algo venció.
- Nada de "quedan pocos lugares", contadores de interesados, rankings ni tasas de aceptación (PROD-06 §3).

## Claims

Revisado en todo `src/` (29/10/2026):

- Sin "inmediato", "al instante", "en minutos", "matriculados", "despachamos", "garantizado" ni "te asignamos".
- El sello "Verificado por Handy" aparece solo con estado `verificado`/`habilitada` del servidor. "Cargado" se lee
  "Cargado, sin revisar".
- La tarifa de Handy se muestra una sola vez por pantalla ("Tarifa de Handy: 0 % durante la demo (hasta el 10/12)") y en el
  detalle del pedido antes de ofertar (LEG-43). Sin política vigente dice "sin tarifa definida".

## Comprobación del lote 3.1

| Comprobación | Cómo se verificó |
|---|---|
| Sin dark patterns de urgencia | Revisión de las 28 capturas (`node e2e/capturas.cjs`) y de los textos en `src/` |
| Sin claims ficticios | Búsqueda de términos prohibidos en `src/` |
| Aceptar y rechazar no son ambiguos | Ver la sección "Jerarquía de acción". Recorridos C y D (`e2e/flujos.cjs`) |
| Coherente con Handyx | Tokens y piezas de la demo de la landing; capturas a 390×844 |

**Pendiente de la fase 3 (lotes 3.2 y 3.3):**

- Revisión en 360/768/820/desktop.
- Foco, lector de pantalla y contraste medido.
- Movimiento y feedback.
- Íconos, manifest y service worker.
- Catálogo final de componentes.

## Responsive y accesibilidad (lote 3.2)

### Tamaños

| Rango | Disposición |
|---|---|
| 320–767 px (celular) | Una columna, barra inferior fija, hojas inferiores. Filas de botones que pasan a una por línea si no entran |
| 768–1099 px (tablet, iPad vertical) | Columna de hasta 760 px; listas en dos columnas; hojas como diálogos centrados |
| ≥ 1100 px (iPad horizontal, escritorio) | Riel de navegación lateral; contenido en una columna legible de hasta 820 px |

Probado en 320×568, 360×740, 390×844, 768×1024, 820×1180, 1180×820 y 1280×800: 196/196 capturas, ninguna con desborde horizontal.

### Checklist (WCAG 2.2 AA)

| Criterio | Cómo se cumple | Verificación |
|---|---|---|
| Contraste (1.4.3, 1.4.11) | Tokens con contraste AA; texto claro sobre fondos oscuros | axe: 0 violaciones en 28 pantallas y 6 diálogos, en 320, 390 y 1280 px |
| Uso sin depender del color (1.4.1) | Estados con ícono y texto; el interruptor dice "Sí"/"No"; "hoy" subrayado; historial con texto oculto "(hecho)"/"(pendiente)" | Revisión de capturas |
| Nombre accesible = texto visible (2.5.3) | Logo con `alt`; los días del calendario agregan "de noviembre, 1 evento" como texto oculto | axe |
| Áreas táctiles (2.5.8) | Botones, pestañas y enlaces sueltos de al menos 44 px de alto; ninguno por debajo de 24 px (días del calendario a 320 px: 38×46) | `npm run accesibilidad` |
| Teclado y foco (2.1.1, 2.4.7) | Foco visible de 3 px en todo; las hojas atrapan y hacen circular el foco y se cierran con Escape | Recorrido con Tab en Inicio y en 6 diálogos |
| Errores de formulario (3.3.1, 3.3.3) | Mensaje por campo con ícono, asociado con `aria-describedby`; al enviar, el foco va al primer campo con error | Registro, datos del alta y caso de soporte |
| Título por pantalla (2.4.2) | `metadata.title` por ruta ("Pedido · Handyx Especialistas") | `out/*/index.html` |
| Orientación (1.3.4) | El manifest ya no fuerza vertical | `public/manifest.webmanifest` |
| Texto al 200 % y reflow (1.4.4, 1.4.10) | Corte de palabras largas solo cuando no entran; controles que bajan de línea | 28 pantallas al 200 % sin desborde (también a 320 px) |
| Movimiento (2.3.3) | `prefers-reduced-motion` anula transiciones | CSS; el movimiento se revisa en el lote 3.3 |
| Sin depender de audio | No hay sonidos; los avisos quedan en la pantalla Avisos | Diseño |

### Límites conocidos

- No se probó con lectores de pantalla reales (VoiceOver, TalkBack): axe y el teclado no lo reemplazan. Queda para la prueba en
  dispositivos (lote 5.2).
- La fecha de nacimiento usa el selector nativo del navegador: su formato depende del idioma del teléfono.
