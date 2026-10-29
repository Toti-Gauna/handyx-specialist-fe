# Mapa, ubicación en vivo y trayectos (lote 4.3)

Estado al 29/10/2026: **componente, contrato 0.4.0, mock, pantallas y pruebas listos. Falta el mapa base de Mar del Plata.**
La red de este entorno bloquea `overpass-api.de` (y `download.geofabrik.de`). Ignacio decidió habilitarlo. Hasta entonces:
- El mapa se dibuja sin calles, con el aviso "Sin calles: falta el mapa base".
- El mock no tiene trayectos por calles: la app muestra "No pudimos calcular el trayecto" y ofrece Google Maps o Waze.

No se inventó ningún dato del mapa.

## Piezas

| Pieza | Archivo | Qué hace |
|---|---|---|
| `Mapa` | `src/mapa/Mapa.tsx` | Componente React. Baja el motor con carga diferida y muestra la `alternativa` en texto si el mapa no puede cargar |
| Motor | `src/mapa/motor.ts` | Todo lo que toca MapLibre 6.14.0 (BSD-3). Capas: cobertura, zona aproximada, trayecto y precisión. Marcadores HTML: destino, tu posición, radar y barrios |
| Estilo Handyx | `src/mapa/estilo.ts` | Manzanas en gris mosaico, calles blancas, avenidas en azul pálido y mar azul. Sin textos en las teselas |
| Lógica pura | `src/lib/geo.ts` (+ pruebas) | Distancias, proyección sobre el trayecto, lo que falta, desvío, señal del GPS, cuándo enviar, textos y enlaces a Google Maps o Waze |
| Ubicación | `src/lib/ubicacion.ts` | `FuenteUbicacion`: la del navegador (`watchPosition`) en producción, y un GPS simulado en el mock (`src/data/mock/gps.ts`) |
| Compartir | `src/hooks/useCompartirUbicacion.ts` | Lee el GPS solo después de que la persona lo pide. Envía como mucho una posición cada 5 s (o cada 10 s quieto), sin cola, y suelta el GPS al salir |
| Datos de OpenStreetMap | `src/mapa/osm.ts` (+ pruebas) | Arma las capas, el mar desde las líneas de costa, los barrios y el grafo de calles (manos únicas incluidas) |
| Trayectos del mock | `src/mapa/grafo.ts` | Dijkstra por tiempo sobre el grafo. En producción los calcula el motor del servidor (fase 5) |
| Pantallas | `PedidoDetalle`, `TrabajoDetalle`, `EnCamino` (`/en-camino/?id=`), catálogo | Ver "Dónde aparece" |

## Dónde aparece

| Pantalla | Qué muestra | Privacidad |
|---|---|---|
| Detalle de pedido | Círculo de la zona aproximada (`zonaMapa`: el servidor ya corre el centro hasta 350 m; radio de 700 m en el mock) | Nunca un punto exacto antes del acuerdo, ni pin de destino |
| Detalle de trabajo | Pin del destino, atajos a Google Maps y Waze, y "Ver el viaje en el mapa" cuando está en camino | Destino exacto solo con trabajo acordado y para sus partes |
| En camino | Mapa a pantalla completa con destino, tu posición, el trayecto que falta, la llegada estimada, la señal en texto y "Llegué" | Ver abajo |
| Catálogo (mock) | Las capas en uso, con un trayecto de muestra en línea recta (rotulado) | — |

## Compartir la ubicación

Antes de pedirle el permiso al navegador, la pantalla explica para qué es:
- El cliente ve que vas en camino y Handyx te dibuja el trayecto.
- Solo mientras la pantalla esté abierta y hasta que llegues.
- Lo ve solo ese cliente, solo en ese trabajo, y se puede dejar de compartir cuando quieras.

Reglas:
- Solo con el trabajo **en camino**: el servidor rechaza posiciones en cualquier otro estado (409).
- Al marcar "Llegué", empezar, terminar o cancelar, el servidor deja de compartir. La app también suelta el GPS.
- La posición va **en el cuerpo** del pedido, nunca en la URL.
- Retención: 30 días (lote 5.3).
- Señal en texto, nunca solo con color:
  - "Ubicación precisa".
  - "Ubicación imprecisa (± N m)", con una precisión peor que 100 m.
  - "Sin señal de ubicación", después de 30 s sin una lectura nueva o con un timeout.
  - "Sin permiso de ubicación".
  - "Tu teléfono no da la ubicación".
- Sin permiso o sin señal se puede seguir igual: Google Maps o Waze y "Llegué" (la llegada automática es del lote 4.6).
- Desvío: con 2 posiciones seguidas a más de 60 m del trayecto (y precisión ≤ 100 m), el servidor lo recalcula, sube
  `trayecto.version` y la isla avisa "Recalculamos el trayecto".
- En una PWA, la ubicación se comparte solo con la app abierta y la pantalla encendida. iPhone y Android cortan el GPS de una
  web en segundo plano.

## Contrato 0.4.0

Detalle en `docs/contracts.md` y `docs/api/openapi.yaml` (tag `mapa`):
- `PedidoElegible.zonaMapa`.
- `Trabajo.destino`.
- `Barrio`, `Posicion`, `Trayecto` y `Viaje` (`ESTADOS_VIAJE`).
- `GET /v1/especialista/mapa/barrios`.
- `GET /v1/especialista/trabajos/{id}/viaje`.
- `POST` y `DELETE /v1/especialista/trabajos/{id}/viaje/posiciones`.

## Mapa base: datos y teselas

Fuente: OpenStreetMap (ODbL). La atribución "© OpenStreetMap" queda siempre visible en el mapa.

```sh
npm run mapa:descargar   # Overpass → .cache/mapa/overpass.json (fuera de Git); solo manda el recuadro de la ciudad
npm run mapa:generar     # → public/mapa/teselas/{z}/{x}/{y}.pbf + public/mapa/meta.json
                         #   + src/data/mock/mapa/barrios.json y grafo.json
```

- Recuadros en `scripts/mapa/zona.ts`:
  - Mapa: Mar del Plata y Batán.
  - Grafo del mock: de Constitución a Punta Mogotes (para que no pese de más).
- Zooms 10 a 14. Más cerca, MapLibre agranda las del 14. En los zooms bajos van solo las avenidas.
- Teselas propias en carpetas `{z}/{x}/{y}.pbf`, servidas por el mismo hosting: sin cuentas, claves ni terceros que vean qué
  zona se mira. Elegimos carpetas en lugar de un PMTiles para no depender de pedidos por rangos del hosting. Se puede cambiar
  en la fase 6 si conviene.
- Sin `meta.json`, el mapa queda solo con el fondo y las capas propias.
- El script se probó de punta a punta con un extracto **sintético** (con salidas en una carpeta temporal). MapLibre dibujó sus
  teselas con el estilo: mar, calles y atribución.
- Pendiente: correrlo con los datos reales y revisar el tamaño de las teselas (estimado: pocos MB) para decidir si se versionan
  o se generan en el deploy.

## Motor de MapLibre

- MapLibre 6 busca su worker al lado de su módulo. El build lo empaqueta en otro lado, así que
  `scripts/mapa/preparar-motor.mjs` copia `maplibre-gl-worker-<versión>.js` a `public/mapa/motor/`. Corre en
  `dev`, `build` y `build:hostinger`, y la copia no se versiona.
- `motor.ts` le indica esa ruta con `setWorkerUrl`.
- Peso: el chunk de MapLibre es de ~283 KB comprimido y ninguna página lo precarga. Se baja recién cuando aparece un mapa.
- El service worker no cambió:
  - Las teselas y `meta.json` van siempre a la red.
  - El worker (`.js`) sigue "red primero".
  - Sin conexión, el mapa avisa "Sin conexión: el mapa puede verse incompleto".
  - Si el motor no se pudo bajar, se ve la alternativa en texto.

## Vista previa (mock)

Panel de prueba → "Ubicación (GPS simulado)":

| Control | Efecto |
|---|---|
| Señal normal | Precisión de 8 a 14 m |
| Señal imprecisa (± 250 m) | La lectura salta alrededor de la posición |
| Sin señal | Timeout |
| Permiso de ubicación negado | Error de permiso |
| Desviarme del trayecto | 150 m de costado |
| GPS simulado rápido (×6) | Interruptor de velocidad |

- El GPS simulado avanza por el trayecto del viaje que se comparte. Sin trayecto, va en línea recta hacia el destino: es una
  simulación del GPS, no un recorrido.
- Los centros de barrio del mock son aproximados hasta que el script los reemplace con los de OpenStreetMap.
- Los destinos son puntos sintéticos cerca de esos centros.

## Rendimiento

Medido el 29/10/2026 con Chromium sin interfaz (WebGL por software):
- Arrastre del mapa en En camino a 412×915 con densidad 2,6: 59 cuadros/s, y 57 con la CPU frenada ×4.
- Es **sin mapa base**: hay que volver a medir con las teselas reales.
- La prueba en un Android de gama media real es de la fase 5.

## Pruebas

- `npm test`:
  - `geo.test.ts`.
  - `osm.test.ts` (ciudad sintética: mano única, entrada privada, costa y barrios).
  - Mock "mapa y viaje": la zona no expone el destino; solo se comparte en camino; se recalcula tras 2 desvíos y no con mala
    precisión.
- E2E:
  - M1: zona del pedido sin pin.
  - M2: cómo llegar, permiso, compartir, señal imprecisa, sin señal y sin permiso, dejar de compartir, seguir y "Llegué"
    deja de compartir.
  - M3: sin WebGL queda el texto.
- `npm run accesibilidad` suma En camino compartiendo.
