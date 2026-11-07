# Rediseño deluxe · D.1 Auditoría y direcciones de arte

Fase D del bloque Taller (`docs/herramientas.md`). Este documento cierra el lote D.1 y se pausa hasta que Ignacio elija
una dirección. D.2 a D.7 no empiezan sin esa elección.

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
