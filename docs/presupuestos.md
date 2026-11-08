# Presupuestos y lista de precios (lote 2.2, H0.2)

Pantallas del lienzo H0-Presupuesto, H0-AgregarMaterial, H0-MaterialOpciones, H0-MaterialNuevo, H0-AgregarLista,
H0-Precios, H0-PreciosFoto, H0-PreciosRevisar, H0-PrecioItem y H0-ManoObra. Recorrido `RC-Presupuesto`
(`e2e/recorridos/RC-Presupuesto.cjs`). Contrato 0.11 (`src/contracts/presupuestos.ts`, sin cambios); el servidor lo
implementa el lote 2.5.

## Rutas (`src/app/rutas/presupuestos.ts`, grupo `src/app/(presupuestos)/`)

| Ruta                                   | Pantalla                          | Parámetros                                                                     |
| -------------------------------------- | --------------------------------- | ------------------------------------------------------------------------------ |
| `/presupuestos/`                       | H0-Presupuesto                    | `?id=` (presupuesto) · `?trabajo=` o `?pedido=` (abre el borrador o lo empieza) |
| `/presupuestos/material/`              | H0-AgregarMaterial (+ Opciones)   | `?id=` del presupuesto                                                         |
| `/presupuestos/material-nuevo/`        | H0-MaterialNuevo                  | `?id=` (opcional: también lo agrega) · `?nombre=` lo buscado                    |
| `/presupuestos/varios/`                | H0-AgregarLista                   | `?id=`                                                                         |
| `/precios/`                            | H0-Precios                        | `?guardados=N` / `?nuevo=1` muestran el aviso de lo guardado                   |
| `/precios/foto/`                       | H0-PreciosFoto → H0-PreciosRevisar | Tres pasos en la misma pantalla (foto, lo leído, revisar)                      |
| `/precios/detalle/`                    | H0-PrecioItem                     | `?id=` del precio                                                              |
| `/precios/mano-de-obra/`               | H0-ManoObra                       | —                                                                              |

Entradas desde otras pantallas (las conecta el cierre de la ola 2): F-Trabajo y F-Pedido → `/presupuestos/?trabajo=`
o `?pedido=`; pestaña Taller (lote 2.1) → `/precios/` y `/presupuestos/`; Modo trabajo «Repuestos» (lote 2.3) →
`/presupuestos/material/`; T-Tablero «pasar al presupuestador» (lote 2.4).

## Reglas

- **Los precios los pone el especialista.** Handyx solo sugiere en cada pedido; la mano de obra y el margen los decide él.
- **Fijo o que se actualiza.** Cada material entra con precio fijo (se congela ese día) o que sigue la lista. En un
  borrador, los que se actualizan toman el precio de la lista; en uno mandado no cambian solos: si la lista cambia, el
  ítem trae `precioNuevo`, el presupuesto avisa (`actualizacionPendiente`) y se ofrece **armar una versión nueva** (que
  toma los precios de hoy y deja congelados los fijos). Al mandarla, la anterior queda `reemplazado`.
- **Opciones resumidas.** Cobrárselo al cliente, anotarlo como gasto (con el ticket al comprarlo) y congelar el precio
  se ven como un resumen con «Cambiar»; lo elegido queda guardado en el servidor como tu forma de agregar
  (`/presupuestos/preferencias`). En el presupuesto, cada material se puede cambiar o quitar en una hoja.
- **Al cliente solo se le suma lo que se le cobra.** Un material «gasto tuyo» queda en el presupuesto con su chip pero
  no suma al total.
- **Directo por el chat.** «Mandar a Lucía por el chat» lo manda sin pantalla extra y abre la conversación, donde llega
  como tarjeta. Si el cliente acepta, el total del trabajo pasa a ser el del presupuesto (lo hace el servidor).
- **Material nuevo.** Si no está en tu lista, se carga con lo mínimo (nombre, categoría, precio y unidad). El **nombre**
  se propone al catálogo de Handyx (lo revisa el equipo antes de que lo vean otros); **el precio nunca** sale de tu
  lista. Si el nombre ya está en el catálogo, se ofrece usarlo.
- **Kits.** Los de Handyx traen nombres y cantidades, nunca precios: el precio sale de tu lista. Lo que no está en tu
  lista no se puede marcar; los precios viejos arrancan sin marcar.
- **Foto de la lista del corralón, leída en el teléfono.** `src/presupuestos/lector.ts` usa el detector de texto del
  navegador (`TextDetector`); la foto no sale del teléfono ni se guarda, y al servidor van solo las filas
  (`LecturaLista`). `src/presupuestos/lectura.ts` arma las filas (nombre, unidad, precio) y marca «Revisá» lo que no se
  entendió, que no se guarda hasta corregirlo a mano. Revisar compara con tu lista y **no guarda nada**; el servidor
  también pide revisar un cambio de más de la mitad (número probablemente mal leído). Si el teléfono no tiene detector,
  se ofrece cargar a mano. En la vista previa el lector es simulado (`src/data/mock/lector-lista.ts`, exportado como
  `lectorListaPrueba` por `@handyx/origen-datos`; en producción es `null`).
- **Precio viejo.** Pasados `DIAS_PRECIO_VIEJO` (30) o los días del aviso de ese precio, se marca «Hace N días».

## Datos

- Puerto `src/data/api/presupuestos.ts`, mock `src/data/mock/presupuestos.ts` (estado propio en un WeakMap; reglas de
  arriba con pruebas en `presupuestos.test.ts`) y adaptador HTTP `src/data/http/presupuestos.ts` (rutas de
  `docs/api/openapi.yaml`).
- Panel de prueba: «Acepta tu último presupuesto», «Pide cambios en tu último presupuesto» (usuario del hogar) y «El
  corralón sube el cartucho 10 %» (lista de precios).
- Mock: el trabajo de hoy de Lucía Ferreyra («Pierde la canilla») trae la versión 1 vista y la 2 en borrador
  ($ 47.000); lista con 15 precios de prueba («Corralón Simulación»), mano de obra y dos kits.

## Piezas del kit (nuevas, `src/ui/`)

`FilaEleccion`, `FilaCasilla`, `FilaAgregar`, `ResumenHechos`, `MosaicoCifra`, `CifraCambio`, `CabeceraSeccion` y
`AccionTexto` (`moleculas/Materiales.tsx`, `moleculas/materiales.css`); `BarrasHistorial` (`organismos/Historial.tsx`);
ilustración `ListaPrecios` (`ilustraciones/ListaPrecios.tsx`). Ver `docs/componentes.md`.

## Pendientes para el cierre y el lote 2.5

- Conectar las entradas (F-Trabajo, F-Pedido, pestaña Taller, mosaico «Presupuestos» de F-Cuenta, Modo trabajo).
- La tarjeta del presupuesto en el chat nuevo (F-Chat, ola 3): el mock deja un mensaje de texto en el chat viejo.
- `GET /presupuestos` no filtra por trabajo o pedido: la pantalla busca en la primera página. Sugerencia para 2.5:
  `?trabajoId=` / `?pedidoId=`.
- Lector de texto en el teléfono: `TextDetector` no está en todos los navegadores (en esos se carga a mano). Si se
  quiere lectura en todos, evaluar un motor propio que corra en el teléfono (sin mandar la foto).
- Plantillas de presupuesto (`/presupuestos/plantillas`): están en el contrato pero no en estas pantallas del lienzo.
- «Buscarlo en una ferretería adherida» y «Catálogo de ferreterías» se muestran como «Pronto» (ola 4).
