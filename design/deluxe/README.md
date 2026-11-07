# Diseño deluxe de Handyx (fuente del lienzo)

Copia de trabajo del lienzo de diseño privado «Handyx · Diseño completo del bloque Taller» (artifact de claude.ai), para
que el diseño no dependa de una sesión y se pueda pasar a Figma. Contexto y decisiones: `docs/rediseno-deluxe.md`.

- `project/` — un archivo `.dc.html` por pantalla (390 × 844) o por flujo (`FL-*`), y `canvas.json` con la ubicación de
  cada tablero, las filas por fase y las notas. Los estilos van en línea a propósito (convención del lienzo; **no** es
  código de la app, que sigue sin estilos inline).
- `gen/` — los generadores en Python que arman las pantallas con piezas comunes (`piezas.py`, `piezas2.py`) y los
  flujos (`flujos.py`), y dos ayudas con Playwright para medir que nada quede tapado (`medir.cjs`) y sacar capturas
  (`foto.cjs`, `foto2.cjs`). Se corren desde una carpeta que tenga `gen/` y `deluxe/project/` al lado.
- Las imágenes de los Handys se sirven desde el lienzo (`/_blob/…`); fuera de él se ven vacías.
- Datos 100 % de prueba: nombres ficticios (Julián Ortiz, Lucía Ferreyra, Martín Sosa…), `*@example.test`, «Calle De
  Prueba 123», ferreterías «Simulación».

## Prefijos

| Prefijo                  | Qué es                                                             |
| ------------------------ | ------------------------------------------------------------------ |
| `FL-`                    | Flujos completos (diagramas)                                       |
| `D6-`, `RG-`             | Acceso, registro paso a paso, avisos, ayuda y errores              |
| `F-`                     | Núcleo: inicio, pedidos, agenda, obras, equipo, mensajes, cuenta   |
| `H0-`                    | Presupuestos, precios, Modo trabajo, cierre, gastos y equipamiento |
| `R-`                     | Ferretería                                                         |
| `G-`                     | Camino Handyx                                                      |
| `T-`, `OF-`              | Taller de Electricidad y oficios                                   |
| `Main`, `A-`, `B-`, `C-` | Exploraciones descartadas de D.1                                   |

## Pasar a Figma

Los tableros son HTML estático con medidas fijas, así que se pueden importar a Figma pantalla por pantalla (por ejemplo
con el conector de Figma desde una sesión de Claude, o con un plugin de HTML a Figma). Conviene armar primero en Figma
las piezas comunes (cabecera azul, barra compacta, pestañas de vidrio, tarjeta con franja, mosaicos, chips, botones con
base, hoja) como componentes, y después las pantallas por fila.
