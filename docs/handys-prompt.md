# Prompt para las poses nuevas de los Handys

Para qué: la pantalla de carga (saltan y terminan de la mano), las celebraciones ("¡Te eligió!", "¡Terminaste!"), la espera, los
estados vacíos y la bienvenida de la fase 4. Cada imagen tiene **un solo personaje en una sola pose**, sobre **fondo verde
liso**, para recortarlo después.

## Cómo usarlo

1. **Referencias**: adjuntá al generador la imagen original del personaje que vas a pedir, de
   `Handy-landing-page-fe/assets/brand/`:

   | Personaje | Archivo |
   |---|---|
   | Gota y caño | `handy-gota-y-cano.png` |
   | Engranaje | `handy-engranaje.png` |
   | Lamparita | `handy-lamparita.png` |
   | Llave | `handy-llave.png` |

   También el grupo, `handys-grupo.png`, para la escala entre ellos.
2. Copiá el **prompt base** y reemplazá `{PERSONAJE}` por su descripción (tabla de personajes) y `{POSE}` por una de la lista
   de poses.
3. Un pedido por imagen. Si el generador lo permite, repetí la misma semilla o "estilo de referencia" para todas las poses de
   un personaje.
4. Pedí PNG cuadrado de 2048 × 2048.
5. Nombre de archivo: `handy-<personaje>-<pose>.png` (por ejemplo, `handy-llave-de-la-mano-derecha.png`).
6. Revisá que no haya verde dentro del personaje y que los bordes estén limpios. El recorte del verde y el paso a webp con
   transparencia los hago yo en la fase 4.

Los prompts están en inglés porque los generadores de imágenes responden mejor.

## Prompt base

```text
Single cartoon mascot character, full body, centered, facing the viewer, on a perfectly flat pure chroma-key green
background (#00FF00), no gradient, no floor, no shadow on the background, no other objects, no text, no watermark.
Keep about 12% empty margin on every side. Square 2048x2048.

Character: {PERSONAJE}

Pose: {POSE}

Style: exactly the same style as the attached reference image. Flat 2D kawaii illustration, simple shapes, soft
hand-drawn marker outline in a slightly darker shade of the body color (never black outlines), very slight crayon texture
on the edges, flat fills with no gradients and no 3D shading. Face: two glossy black dot eyes with a small white
highlight, tiny simple mouth, no nose. Thin stick limbs drawn as single lines in the outline color, small three-finger
"Y" hands, tiny rounded feet. Same proportions, colors and line weight as the reference. Do not use any green inside
the character. Keep the character clean and readable at small sizes.
```

**Lo que no tiene que aparecer** (si el generador acepta un prompt negativo):

```text
green on the character, black outlines, realistic, 3D render, gradient, glossy plastic, extra characters, background
scenery, drop shadow, text, logo, watermark, cropped limbs, extra fingers, different art style
```

## Personajes (`{PERSONAJE}`)

| Personaje | Descripción para el prompt |
|---|---|
| **Gota** | `a light sky-blue water drop with a slightly darker blue outline, happy face with closed smiling eyes (^ ^) and a small open smile, thin light-blue stick arms and legs added in the same style as the other mascots` |
| **Caño** | `a light gray curved water pipe shaped like an upside-down J with a thick gray outline, a blue rectangular nozzle at the top end, the bottom end standing on a blue rectangular box body; small face with black dot eyes and a tiny "w" mouth on the pipe just above the blue box; thin blue stick arms coming out of the box and two short blue legs with small square feet` |
| **Engranaje** | `a bright royal-blue gear with eight rounded teeth and a round white hole in the center, darker blue outline, big glossy black eyes and a small smile on the upper part, thin blue stick arms with three-finger "Y" hands and thin blue legs with small curled feet` |
| **Lamparita** | `a pale yellow light bulb with a slightly darker yellow outline and three short yellow light rays above it, glossy black eyes and a small open smile, a gray screw base wrapped with diagonal lines like a bandage, thin olive-yellow stick arms with three-finger hands and thin gray stick legs` |
| **Llave** | `a gray round key head as the body with a darker gray outline, the key shaft with teeth sticking up diagonally from the head like a raised antenna, happy squinting eyes (> <), a small smile and a tiny open "o" mouth, a light oval blush mark, thin gray stick arms with three-finger hands and thin gray legs` |

## Poses (`{POSE}`)

Las primeras siete son las que necesita la pantalla de carga. Pedí todas para los cinco personajes.

| # | Pose | Para qué | Texto para el prompt |
|---|---|---|---|
| 1 | Saltando | Carga | `jumping high in the air, legs tucked up, both arms raised, joyful open-mouth smile, slight upward stretch of the body` |
| 2 | Aterrizando | Carga | `just landing on the ground, body slightly squashed wider and shorter, knees bent, arms out for balance, happy face` |
| 3 | De la mano, a la derecha | Carga (extremo izquierdo de la fila) | `standing, right arm stretched straight out to the side at shoulder height with the hand open as if holding someone's hand, left arm relaxed down, happy smile, looking at the viewer` |
| 4 | De la mano, a la izquierda | Carga (extremo derecho de la fila) | `standing, left arm stretched straight out to the side at shoulder height with the hand open as if holding someone's hand, right arm relaxed down, happy smile, looking at the viewer` |
| 5 | De la mano, a los dos lados | Carga (en el medio de la fila) | `standing, both arms stretched straight out to the sides at shoulder height with open hands as if holding hands with friends on both sides, happy smile` |
| 6 | Saltito final de la mano | Carga (cierre) | `small hop off the ground with both arms stretched out to the sides at shoulder height as if holding hands, eyes closed with joy` |
| 7 | Celebrando | ¡Te eligió!, ¡Terminaste!, ¡Habilitado! | `celebrating, both arms raised high in a V, big open smile, eyes closed with joy, one foot slightly lifted` |
| 8 | Saludando | Bienvenida, "Hola de nuevo" | `waving hello with one raised hand, friendly smile, slight head tilt` |
| 9 | Esperando | Esperando al cliente, en revisión | `waiting patiently, arms crossed or one hand on the hip, tapping one foot, calm smile, looking slightly up` |
| 10 | Pensando | Cargas largas, sugerencia de precio | `thinking, one hand on the chin, eyes looking up to the side, small curious mouth` |
| 11 | Señalando | Bienvenida y consejos | `pointing to the right side with one arm extended, other hand on the hip, confident smile` |
| 12 | Caminando apurado | En camino | `walking briskly to the right in side view, one leg forward, arms swinging, determined happy face` |
| 13 | Durmiendo | Disponible apagado, sin pedidos | `sleeping peacefully while sitting, eyes closed as two gentle curved lines, head slightly tilted, relaxed arms resting` |
| 14 | Pulgar arriba | Éxito, cobro registrado | `giving a thumbs up with one hand, wink with one eye, confident smile` |
| 15 | Sorprendido | Pedido nuevo, aviso | `surprised, both hands raised near the face, eyes wide open, small round open mouth` |

## Checklist de entrega

- [ ] 5 personajes × 7 poses de la carga (35 imágenes) como mínimo; ideal 5 × 15 (75).
- [ ] En las poses 3, 4, 5 y 6 la mano extendida queda **a la misma altura** en los cinco personajes, para que se toquen al
      ponerlos en fila. Si hace falta, se corrige al recortar.
- [ ] Mismo tamaño relativo que en `handys-grupo.png` (la lamparita y el caño son los más altos; la gota, la más chica).
- [ ] Fondo verde puro y liso, sin sombras. Nada de verde dentro del personaje.
