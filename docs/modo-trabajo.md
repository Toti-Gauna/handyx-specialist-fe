# Modo trabajo y cierre del trabajo (lote 2.3, fases H0.4 y H0.4b)

Ola 2 del plan por olas (`docs/plan-olas.md`). Pantallas del lienzo `design/deluxe/` (`gen/fila_h0b.py` y
`gen/fila_h0c.py`): H0-Modo, H0-ModoHerramientas, H0-ModoAyuda, H0-ModoAgenda, H0-AntesDespues, H0-AntesLado,
H0-Informe y H0-InformeEnviado. Recorrido `RC-Dia` completo (cierre) en `e2e/recorridos/RC-Dia.cjs`.

## Pantallas y rutas

Grupo de rutas `src/app/(modo)/` (sin barra de pestañas), rutas en `src/app/rutas/modo.ts`, pantallas en
`src/pantallas/modo/`, estilos de las pantallas en `src/pantallas/modo/modo.css` (clases `mt-*`).

| Lienzo                          | Ruta                                                 | Archivo              |
| ------------------------------- | ---------------------------------------------------- | -------------------- |
| H0-Modo, H0-ModoHerramientas    | `/trabajos/modo/?id=` (`&hoja=herramientas` la abre) | `ModoTrabajo.tsx`    |
| H0-ModoAyuda                    | `/trabajos/modo/ayuda/?id=`                          | `PedirAyuda.tsx`     |
| H0-ModoAgenda                   | `/trabajos/modo/agenda/?id=`                         | `AgendaTrabajo.tsx`  |
| H0-AntesDespues, H0-AntesLado   | `/trabajos/antes-despues/?id=` (`&vista=lado`)       | `AntesDespues.tsx`   |
| H0-Informe                      | `/trabajos/informe/?id=`                             | `InformeTrabajo.tsx` |
| H0-InformeEnviado               | `/trabajos/informe/enviado/?id=`                     | `InformeEnviado.tsx` |

Entradas desde lo que ya existía: «Empezar el trabajo» en F-Trabajo abre el Modo trabajo (y, en curso, su acción
principal es «Volver al Modo trabajo»; el mosaico lleva al Modo o, terminado, al informe); en TR-Cobro, después de
informar el cobro, la acción es «Armar el informe».

## Reglas

- **Se abre al empezar** (`en_curso`); antes, el servidor responde 409 y la pantalla lo dice. Terminado, queda de solo
  lectura. El cronómetro lo lleva el servidor con **tramos** (inicio y pausa); la app solo suma y muestra. Es solo para
  el especialista: no mide puntualidad ni se le muestra a nadie.
- **Tareas** grandes (fila de 60 px, casilla real) que empiezan por la seguridad (escudo y «Seguridad» escrito). «Tarea
  lista» marca la de ahora; tocar una hecha la vuelve a abrir (deshacer). Se puede sumar una tarea (y marcarla de
  seguridad). Mientras se guarda, la casilla muestra lo tocado; si falla, vuelve a como estaba.
- **Una acción principal**: «Tarea lista» (o «Terminé el trabajo» cuando están todas). «Pausar» al lado, en amarillo.
  «Terminé» pide confirmación en una hoja con las tareas hechas y el total; después se informa el cobro (directo al
  especialista, informado ≠ verificado) y se arma el informe.
- **Pedir ayuda**: el estado de un contacto solo si lo comparte, siempre escrito, nunca su ubicación. Llamar es por
  número puente (nadie ve el teléfono del otro); sumarlo al trabajo es una invitación (el reparto se acuerda aparte; Handyx
  no toca la plata). «Buscar un profesional nuevo» lleva por ahora a Obras: la búsqueda (F-ObraBuscar) es de la ola 3.
- **Agenda desde el trabajo**: lo que sigue (agenda de 3 días, sin ofertas) y avisar 15 o 30 minutos de demora al próximo
  cliente, que se manda por el chat de su trabajo **solo cuando el especialista toca el botón**. «Va N minutos más de lo
  previsto» solo si se pasó del horario de hoy (hasta 4 horas); un trabajo que sigue otro día no «va tarde».
- **Antes y después**: la foto se achica y pierde la ubicación en el teléfono (`taller/privacidad.ts`) antes de subir.
  El comparador se mueve deslizando sobre la foto, con el teclado (es un control deslizante real) y con tres botones:
  ningún gesto es la única forma. «Qué cambiaste» se escribe o se dicta con el micrófono del teclado (el texto lo
  arma el teléfono). Cada cambio se puede quitar.
- **Informe**: cinco secciones que se completan solas y no se repiten (`automatica`), se corrigen tocándolas (`lista`) o
  faltan (`falta`, con un ejemplo). Se manda **solo con el trabajo terminado**, con confirmación: lo que falta no sale.
  Al mandarlo empieza la garantía (la acordada), se pide la conformidad y queda el PDF. El recordatorio de mantenimiento
  es para el especialista; al cliente no le llega nada solo. Mandado, no se cambia.
- **Conformidad**: la da solo el cliente desde su app (en el mock, el Panel de prueba: «Da su conformidad…» o «Responde…
  con observaciones»). La ilustración de «Trabajo terminado» arma el arreglo del rubro (decorativa; con «reducir
  movimiento», armada).

## Datos

Puerto `src/data/api/modo-trabajo.ts` (contrato 0.11.0, tag `modo-trabajo` y `equipo` del OpenAPI), mock
`src/data/mock/modo-trabajo.ts` (con sus pruebas) y HTTP `src/data/http/modo-trabajo.ts`. El mock guarda lo del lote en un
`WeakMap` atado al arreglo `s.trabajos`, así sobrevive al cambio de escenario del Panel. Siembra: «Pierde el depósito
del inodoro» de Julián Ortiz (`00000000-0000-4000-8000-000000023001`, en curso desde ayer, con fotos, cambios y la
causa), el informe mandado del trabajo `…c2` (esperando la conformidad) y el del `…c3` listo para mandar. Fotos y PDF
son sintéticos (SVG dibujado y un PDF de una página): el mock nunca lee ni guarda una imagen real.

**Pendiente de contrato** (pedido al lote 2.5 / cierre de la ola 2): `POST /v1/especialista/contactos-profesionales/{id}/llamada`
→ `LlamadaPuente` (el mismo número puente que `/trabajos/{id}/llamada`), que usa «Llamar a…» en Pedir ayuda. Está en el
puerto, el mock y el adaptador HTTP; hasta que entre al contrato, la API real responde 404 y la hoja muestra el error.

## Piezas nuevas del kit v3

En archivos propios, con su CSS en `src/ui/trabajo.css` y la lógica pura en `src/ui/logicaModo.ts` (con pruebas):
`CabeceraTrabajo` (organismo), `ListaTareas`, `AccesoRapido` + `GrillaAccesos`, `Comparador` + `FotosLado`,
`FilaContacto` y `BotonFoto` (moléculas). Detalle en `docs/componentes.md`.

## Pendientes para el cierre de la ola 2

- Linterna, lupa y medir de la hoja de herramientas llevan al Taller (`/taller/`): apuntarlas a las del lote 2.4.
- «Repuestos» y «Código de barras» llevan a «Agregar al trabajo» (`/trabajos/adicional/`): apuntarlos a
  H0-AgregarMaterial del lote 2.2 (`/presupuestos/material/`).
- «Ver toda la agenda» lleva a `/agenda/`: apuntarlo a F-AgendaMes (lote 2.1) si cambia de ruta.
- «Escribirle» abre el chat de equipo y, sin conversación 0.2.0, lleva a Mensajes: la ola 3.3 lo lleva al chat nuevo.
- El título de la cabecera sale de lo acordado (no hay título del pedido en `Trabajo`); si el contrato suma uno, usarlo.
