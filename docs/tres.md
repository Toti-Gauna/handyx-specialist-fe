# Base 3D nativa (`src/tres/`, lote 0.3 · D.4)

Piezas 3D comunes de la PWA del especialista: un visor con gestos y botones, la alternativa sin WebGL, la AR (WebXR en
Android, Quick Look en iPhone), un presupuesto de rendimiento para gama baja y primitivas listas (regalo, camino,
objeto escaneado con cotas y un arreglo que se construye). Todo hecho por código con Three.js: sin archivos de modelos.
Lo usan el escaneo y el modelo 3D (lote 2.4), el regalo y el camino (lote 3.4) y, más adelante, el Taller.

## Reglas (docs/herramientas.md)

1. **Siempre con descripción en texto.** `Visor3D` exige `descripcion`: el 3D apoya, no reemplaza. La pantalla dice lo
   importante al lado (medidas, estado del camino, el premio). Con la descripción ya visible en la pantalla, usá
   `descripcionVisible={false}` (queda para lectores de pantalla).
2. **Render solo cuando algo cambia.** No hay bucle en reposo: se dibuja con un gesto, mientras la cámara se acomoda
   (amortiguación) o mientras corre una animación registrada con `ctx.animar`. Pestaña oculta o visor fuera de la
   pantalla: pausa.
3. **Alternativa sin WebGL.** Si el teléfono no tiene WebGL (o el sistema se queda con la GPU), se suelta todo y queda
   `alternativa` (o un aviso corto) más la descripción.
4. **Reducir movimiento:** sin giro automático ni animaciones; las primitivas se muestran terminadas (caja abierta,
   arreglo armado).
5. **Gama baja (Moto E20)** como referencia: ver Presupuesto.
6. **Todo gesto tiene botón** (WCAG 2.5.7): Izquierda, Derecha, Acercar, Alejar y Centrar, de 52 px, con ícono y palabra.

## Archivos

| Archivo                                | Qué tiene                                                                                         | Pruebas                 |
| -------------------------------------- | ------------------------------------------------------------------------------------------------- | ----------------------- |
| `Visor3D.tsx`                          | Componente del visor (figura + lienzo + botones + descripción).                                   | (E2E en el cierre)      |
| `motor.ts`                             | Renderer, escena, cámara orbital, gestos, bucle bajo demanda, pausa y `liberar`.                  | —                       |
| `orbita.ts`                            | Cámara orbital pura: girar, acercar, amortiguar, encuadre, vistas tres cuartos e isométrica.       | `orbita.test.ts`        |
| `gestos.ts`                            | Un dedo gira, dos pellizcan, doble toque centra, rueda.                                           | `gestos.test.ts`        |
| `presupuesto.ts`                       | Nivel del equipo (bajo, medio, alto) y sus topes.                                                 | `presupuesto.test.ts`   |
| `capacidades.ts`                       | ¿Hay WebGL?, datos del equipo, qué AR hay.                                                        | `presupuesto.test.ts`   |
| `marca.ts`                             | Paleta 3D, materiales comunes, luces, entorno, sombra de contacto, etiquetas.                     | `primitivas.test.ts`    |
| `limpieza.ts`                          | `liberar` (geometrías, materiales, texturas), conteo de triángulos, esfera para encuadrar.        | `primitivas.test.ts`    |
| `cotas.ts` · `primitivas/cotas3d.ts`   | Formato de medidas («85 cm», «Ø 45 cm», «1,20 m») y trazado de cotas en 3D.                       | `cotas.test.ts`         |
| `escaneo.ts` · `primitivas/escaneo3d.ts` | Anillo de 30 tomas, avance «18 de 30 fotos», termotanque de ejemplo con cotas.                 | `cotas.test.ts`         |
| `regalo.ts` · `primitivas/regalo3d.ts` | Caja que baja, tiembla y se abre (sin azar).                                                      | `regalo.test.ts`        |
| `sendero.ts` · `primitivas/sendero3d.ts` | Camino con estaciones (lograda, actual, próxima) y faro al final.                               | `regalo.test.ts`        |
| `arreglo.ts` · `primitivas/arreglo3d.ts` | Rincón isométrico con el objeto del rubro que se arma pieza por pieza.                          | `arreglo.test.ts`       |
| `escenas.ts`                           | `montar` listos: `escenaArreglo`, `escenaRegalo`, `escenaSendero`, `escenaEscaneado`.             | `primitivas.test.ts`    |
| `ar.ts` · `BotonAr.tsx`                | AR común (generaliza la del Taller, H1.4).                                                        | `ar.test.ts`            |
| `tres.css`                             | Estilos `tr-*` del visor y la AR.                                                                 | —                       |

La lógica pura no importa Three.js; las primitivas sí, pero no necesitan navegador (las pruebas las arman en Node).

## Uso

```tsx
import { useMemo, useRef } from 'react';
import { Visor3D, type ManejoVisor } from '../tres/Visor3D.tsx';
import { escenaArreglo } from '../tres/escenas.ts';
import { describirArreglo } from '../tres/arreglo.ts';

const vista = useRef<ManejoVisor>(null);
const montar = useMemo(() => escenaArreglo('plomeria'), []); // estable: si cambia, la escena se rearma
<Visor3D ref={vista} montar={montar} vista="isometrica" descripcion={describirArreglo('plomeria')} descripcionVisible={false} controles={false} ayuda={null} />;
```

Props de `Visor3D`: `descripcion` (obligatoria), `montar`, `descripcionVisible`, `alternativa`, `fondo`
(`claro` · `noche` · `transparente`), `giro` (vitrina; se apaga solo a los 20 s), `controles`, `ayuda` (texto o `null`),
`limites`, `vista` (`tres-cuartos` · `isometrica`), `nivel` (forzar `bajo` para probar gama baja), `className`.
Manejo por `ref`: `centrar()`, `imagen()` (PNG de la vista, para compartir o la miniatura de Quick Look), `objeto()`
(copia de la escena para la AR) y `pedirCuadro()`.

Una escena propia es una función `(ctx) => desmontar?`: agregá lo tuyo a `ctx.raiz` con `ctx.materiales` (no los
liberes: son del visor), usá `ctx.presupuesto` para los segmentos (`segmentosPara`), animá con `ctx.animar(paso)` y,
si algo arranca fuera de su lugar (la caja que cae, las piezas que bajan), encuadrá a mano con `ctx.encuadrar`.
Lo que cuelga de `ctx.raiz` se libera solo al rearmar y al desmontar.

Vista isométrica: la cámara a 45° y desde arriba con el ángulo clásico (≈ 54,7°), con un campo visual angosto (20°)
para que casi no haya fuga: se ve como las ilustraciones de la ciudad de la landing.

## Primitivas

- **Arreglo que se construye** (opcional, complementa las ilustraciones SVG del kit, que se animan con GSAP): un rincón
  (piso de mosaico, dos paredes, ventana amarilla) y el objeto del rubro: tablero (electricidad), canilla (plomería),
  caño con llave de paso (gas), cerradura (cerrajería), pared de ladrillos con revoque (albañilería) y aire
  acondicionado. Las piezas bajan una detrás de otra y se encastran; los nombres de las piezas
  (`OBJETOS_ARREGLO`) sirven para un texto «Paso 3 de 5» con `alAvanzar`. Se anima con el bucle del visor (no con GSAP)
  para no sumar otro reloj; los tiempos son fijos.
- **Regalo:** baja con rebote, tiembla y se abre con luz. **Sin azar**: el premio se anunció antes (docs/herramientas.md
  §1). `alCambiarFase('abre')` es el momento de los papelitos (`useConfeti`) y de vibrar. El premio va en `caja.hueco`.
- **Camino:** estaciones logradas en azul, la actual en amarillo con bandera, las próximas en gris; el tramo recorrido
  en azul llega hasta el avance que **calcula el servidor** (solo trabajos verificados). `describirSendero` da el texto.
- **Objeto escaneado:** termotanque de ejemplo (85 cm, Ø 45 cm) con cotas; las medidas siempre «aprox.». El anillo de
  tomas marca en amarillo las fotos hechas (T-Escanear).

## Presupuesto (gama baja tipo Moto E20)

| Nivel   | Cuándo                                                                 | Densidad máx. | Píxeles máx. | Antialias | Triángulos | Segmentos | Entorno | Cuadros |
| ------- | ---------------------------------------------------------------------- | ------------- | ------------ | --------- | ---------- | --------- | ------- | ------- |
| `bajo`  | ≤ 2 GB, ≤ 4 núcleos, texturas < 4096, ahorro de datos                  | 1,25          | 600 000      | no        | 40 000     | 20        | no      | 30      |
| `medio` | sin dato de memoria (iPhone, Safari, Firefox) o 3–5 GB                  | 1,75          | 1 300 000    | sí        | 120 000    | 32        | sí      | 60      |
| `alto`  | 6 GB o más                                                              | 2             | 2 400 000    | sí        | 250 000    | 48        | sí      | 60      |

Ante la duda, el más bajo. Sin sombras en tiempo real (sombra de contacto con una textura hecha a mano), un solo
contexto de WebGL por visor que se suelta al desmontar (`forceContextLoss`) y `powerPreference: 'low-power'`. En
desarrollo, el motor avisa en la consola si una escena pasa los triángulos de su nivel. Cada primitiva usa menos de un
cuarto del presupuesto bajo (lo verifica `primitivas.test.ts`).

## AR

`ar.ts` y `BotonAr.tsx` generalizan la AR del Taller (H1.4): WebXR con detección de superficies en Android (retícula
amarilla, un toque ubica el objeto en tamaño real), AR Quick Look con un USDZ armado en el teléfono en iPhone y, sin
ninguno de los dos, el botón no aparece. Opciones nuevas que no cambian lo anterior: `instruccion` (texto propio) y
`escalaBuffer` (resolución de la cámara en XR; 0,75 en gama baja). El exportador USDZ se carga recién al usarlo.

**Migración del Taller (no hecha en este lote):**

1. `src/pantallas/taller/Tablero.tsx` e `Iluminacion.tsx`: importar `BotonAr` de `../../tres/BotonAr.tsx` (mismas props).
2. Importar `src/tres/tres.css` (las clases pasan de `tl-ar*` a `tr-ar*`, con los mismos estilos) y, después, borrar
   `.tl-ar*` de `taller.css`, `src/pantallas/taller/BotonAr.tsx` y `src/taller/ar.ts` (los demás imports de
   `taller/ar.ts` cambian a `tres/ar.ts`: exporta lo mismo, lo verifica `ar.test.ts`).
3. Probar en un Android y en un iPhone reales (pendiente desde H1.4).

## Integración pendiente (cierre 0.Z)

- Importar `src/tres/tres.css` en el layout (o en las pantallas que usen el visor).
- Mostrar el visor en `/catalogo/` (solo mock) con las cuatro escenas y el modo sin WebGL (`nivel="bajo"` y un
  navegador sin WebGL), y sumar un E2E: los botones mueven la vista, la descripción está, y sin WebGL queda la
  alternativa.
- Migrar el Taller a la AR común (arriba).
