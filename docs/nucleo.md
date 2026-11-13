# Núcleo del especialista: el pedido y el mapa de arreglos (lote 1.3, D.5)

Ola 1 del plan por olas (`docs/plan-olas.md`). Pantallas del lienzo `design/deluxe/`: F-Inicio, F-InicioDia,
F-InicioRuta, F-Pedido, F-Precio, F-PrecioTeclado, F-Fecha, F-FechaHora, F-Revisar, F-Enviada, F-Trabajo, TR-EnCamino y
TR-Cobro. Recorridos `RC-Pedido` y `RC-Dia` (hasta la llegada y el cobro) en `e2e/recorridos/`.

## Pantallas y rutas

| Lienzo                | Ruta                                                                       | Archivo                                                       |
| --------------------- | -------------------------------------------------------------------------- | ------------------------------------------------------------- |
| F-Inicio, F-InicioDia | `/inicio/`                                                                 | `src/pantallas/Inicio.tsx` (+ `nucleo/TarjetaDia.tsx`)        |
| F-InicioRuta          | `/inicio/recorrido/`                                                       | `src/pantallas/Recorrido.tsx`                                 |
| F-Pedido              | hoja del Inicio y `/pedidos/detalle/?id=`                                  | `nucleo/DetallePedido.tsx`, `src/pantallas/PedidoDetalle.tsx` |
| F-Precio … F-Enviada  | `/pedidos/propuesta/?id=` (`&base=` contraoferta, `&paso=fecha`, `&chat=`) | `src/pantallas/TuPrecio.tsx`                                  |
| F-Trabajo             | `/trabajos/detalle/?id=`                                                   | `src/pantallas/TrabajoDetalle.tsx`                            |
| TR-EnCamino           | `/en-camino/?id=`                                                          | `src/pantallas/EnCamino.tsx`                                  |
| TR-Cobro              | `/trabajos/cobro/?id=`                                                     | `src/pantallas/CobroTrabajo.tsx`                              |

Van en el grupo de rutas `src/app/(nucleo)/` (sin la cabecera vieja de la app): cada pantalla trae su cabecera del kit v3
y solo el Inicio lleva la barra de pestañas.
La bandeja vieja `/pedidos/` se quitó: la reemplazan los pedidos cercanos y la vista Lista del Inicio.

## Qué hace cada una (y lo que no)

- **Inicio**: el mapa de arreglos (`MapaArreglos`) siempre detrás; Disponible solo en la `CabeceraAzul`. Los urgentes que
  ya estaban al abrir y todo pedido nuevo **llegan flotando** (`PedidoFlotante`, con la ilustración que arma el arreglo y
  «Pedido 1 de 2»). Abajo, los **pedidos cercanos** (`HojaCercanos`, estilo «Choose a ride»: rubro, zona aproximada,
  precio sugerido y distancia; el elegido resaltado y una sola acción, «Ver pedido»). Con paradas hoy, abajo va **tu día**
  (`TarjetaDia`) y un botón para ver los pedidos. Tocar un pedido (marcador, hoja o flotante) abre el **detalle en una
  hoja**: nada se acepta desde el mapa. Las distancias aparecen solo si la persona toca «Medir distancias desde donde
  estoy» (una lectura del GPS que va en el cuerpo del pedido y no se guarda).
- **Llegada automática**: con la API real, `GET /mapa/eventos` (SSE con la cookie de sesión, `nucleo/hooks.ts`) avisa y el
  Inicio vuelve a pedir el mapa; además consulta cada 20 s. Con el mock, el Panel de prueba («Entra un pedido urgente
  nuevo») refresca la pantalla.
- **Tu precio**: paso 1 de 2 con la `CintaPrecio` (slider de verdad: flechas ± $ 500, Re Pág/Av Pág ± $ 5.000, Inicio
  vuelve al sugerido), atajos y el teclado en una hoja; «Recibís el 100 %: Handyx no te cobra comisión». Paso 2 de 2: el
  horario que pidió el cliente o el calendario con franjas (las pasadas y las que se superponen con lo agendado se apagan
  y lo dicen en texto) y el horario a medida (franja u hora exacta, con ruedas y atajos). Revisar en una hoja y enviar.
  El «qué incluye» se arma solo con lo que contó el cliente, los materiales y la garantía (el lienzo no tiene campo de
  texto). `incluyeMateriales` y `garantiaDias` van en la propuesta (contrato 0.11.0).
- **Trabajo**: los cuatro pasos con «Hecho/Ahora/Falta» en texto (`LineaTiempo`), una acción principal por estado
  (salir, abrir el viaje, empezar, «Terminé» con confirmación, informar el cobro), adicionales, cambio pendiente,
  resumen de la obra, llamar por la app, ayuda y cancelar. «Modo trabajo» lleva al Taller hasta el lote 2.3.
- **En camino**: compartir la ubicación solo después de explicar para qué; el cliente ve que vas en camino solo durante
  el viaje; avisar una demora (15 o 30 minutos) manda una tarjeta al chat; «Ya llegué» solo como respaldo cuando la
  ubicación anda mal (la llegada se marca sola en la puerta).
- **Cobro**: efectivo, Mercado Pago o transferencia; todo o una parte (nunca más que lo acordado). Queda «informado por
  vos» hasta que el cliente lo confirma o se verifica el pago.

## Datos (puerto, mock y HTTP)

| Método                                              | Endpoint (contrato 0.11.0)                                         |
| --------------------------------------------------- | ------------------------------------------------------------------ |
| `mapaDestinos()`                                    | `GET /v1/especialista/mapa/destinos`                               |
| `mapaPedidos(busqueda)`                             | `POST /v1/especialista/mapa/pedidos` (la posición va en el cuerpo) |
| `mapaPedido(id)`                                    | `GET /v1/especialista/mapa/pedidos/{id}`                           |
| `descartarPedido(id)`                               | `POST /v1/especialista/pedidos/{id}/descarte`                      |
| `dia()` · `recorridoDia(r)` · `ordenarDia(o)`       | `GET /dia` · `POST /dia/recorrido` · `PUT /dia/orden`              |
| `avisarDemora(id, a, clave)`                        | `POST /v1/especialista/trabajos/{id}/demora`                       |
| `cobro(pagoId)` · `informarCobro(pagoId, i, clave)` | `GET /pagos/{id}/cobro` · `POST /pagos/{id}/informe`               |

El mock vive en `src/data/mock/nucleo.ts` (estado propio en un `WeakMap` sobre el estado común) y siembra, en el escenario
habilitado, el trabajo de hoy de Lucía Ferreyra (18 a 20, con chat y cobro) y dos pedidos fuera de tus zonas (Batán y Los
Troncos). Reglas probadas en `nucleo.test.ts`: sin dirección en el mapa, urgentes solo con Disponible, destino fuera de
tus zonas, «Ahora no» sin consecuencias, propuesta con materiales y garantía, orden del día con versión, demora
idempotente y cobro informado ≠ verificado.

## Supuestos y pendientes (para el cierre de la ola 1)

- `MapaArreglos` filtra «Me voy hasta…» del lado del teléfono (`pedidosHacia` sobre los pedidos de tus zonas): para traer
  pedidos **fuera** de tus zonas (el de Batán) hace falta que exponga el destino elegido (`destino`/`onDestino`) y el
  Inicio pida `referencia: { tipo: 'destino' }`. El mock y el contrato ya lo soportan.
- `Hoja` del kit atrapa el foco con Tab (cerrado en el cierre de la ola 1).
- `CabeceraAzul` no tiene la línea de estado bajo Disponible del lienzo («Te llegan pedidos de tus zonas»): va en una
  tira debajo de la cabecera.
- El recorrido del día se dibuja sobre manzanas (`RutaDecorativa`): `Parada` no trae puntos (privacidad). Si el contrato
  sumara un punto aproximado por parada, se puede dibujar sobre el mapa real.
- Las piezas nuevas tienen su CSS en `src/ui/nucleo.css`; el cierre puede pasarlas a `moleculas.css`/`organismos.css`
  y sumarlas al catálogo `/catalogo/`.
- F-Enviada usa la ilustración del rubro en lugar del Handy del lienzo; F-Trabajo titula con el rubro (el trabajo no
  trae el título del pedido).
