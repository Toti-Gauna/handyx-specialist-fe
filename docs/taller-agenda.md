# Pestaña Taller: agenda, ingresos y gastos (lote 2.1, H0.3)

Ola 2 del plan por olas (`docs/plan-olas.md`). Pantallas del lienzo `design/deluxe/`: F-Herramientas, F-Agenda,
F-AgendaPasadas, F-AgendaMes, F-Ingresos y H0-Gasto. Recorrido `RC-Agenda` en `e2e/recorridos/RC-Agenda.cjs`.

## Pantallas y rutas

| Lienzo                   | Ruta                                           | Archivo                                    |
| ------------------------ | ---------------------------------------------- | ------------------------------------------ |
| F-Herramientas           | `/taller/`                                     | `src/pantallas/agenda/Herramientas.tsx`    |
| (portal del teléfono)    | `/taller/herramientas/` (antes `/taller/`)     | `src/pantallas/taller/Taller.tsx`          |
| F-Agenda, F-AgendaPasadas | `/agenda/` (`?vista=pasadas\|hoy\|futuras`)    | `src/pantallas/agenda/Agenda.tsx`          |
| F-AgendaMes              | `/agenda/mes/`                                 | `src/pantallas/agenda/AgendaMes.tsx`       |
| F-Ingresos               | `/taller/ingresos/` (`?guardado=1`)            | `src/pantallas/agenda/Ingresos.tsx`        |
| H0-Gasto                 | `/taller/ingresos/gasto/` (`?trabajo=<id>`)    | `src/pantallas/agenda/CargarGasto.tsx`     |

Van en el grupo de rutas `src/app/(taller)/` (sin la cabecera vieja de la app; Taller y Agenda llevan la barra de
pestañas, el resto la barra compacta con Volver). Las rutas de Electricidad (`/taller/conductores/`, `/taller/tablero/`…)
siguen en `(flujo)`; el portal de herramientas del teléfono pasó a `/taller/herramientas/` y lo rehace el lote 2.4 (T-Taller).
Claves en `src/app/rutas/agenda.ts` (`agendaMes`, `ingresos`, `ingresoGasto`) y `rutas/taller.ts` (`tallerHerramientas`).

## Qué hace cada una (y lo que no)

- **Taller**: la agenda de la semana (tarjeta azul, siete días con puntos por turno) y cuatro accesos con su resumen: ingresos
  y gastos (neto del mes, del servidor), presupuestos y precios, equipamiento y herramientas del teléfono; abajo, la
  ferretería. Presupuestos, equipamiento y ferretería **no muestran cifras**: sus lotes (2.2, 2.4, ola 4) las suman. Sus rutas
  (`/taller/presupuestos/`, `/taller/equipamiento/`, `/taller/ferreteria/`) están en `ACCESOS_TALLER` y el cierre de la ola las
  reemplaza por las claves de `RUTAS`.
- **Agenda**: Pasadas · Hoy · Futuras con el conteo de cada una. Hoy muestra los siete días de la semana (se elige uno; los
  botones reemplazan al deslizar). Una **oferta no es un turno**: aparece solo en Futuras, con «Oferta sin confirmar» y, si
  choca con un turno agendado, «Se superpone con un trabajo que ya tenés agendado»; no cuenta en la semana ni en el mes.
  Pasadas: cuántas, lo cobrado y verificado del mes y cada una con cómo va su cobro (**informado ≠ verificado**); «Ver más»
  pide la página siguiente. Cada turno lleva al trabajo (o a la oferta); ya no hay hoja de detalle.
- **Mes**: una barrita por obra (azul y noche), amarilla por trabajos y gris por lo hecho; cada día dice en su nombre qué
  tiene y la leyenda lo escribe. Filtro Todo/Obras/Trabajos, «Ir a hoy», mes anterior y siguiente, y los turnos del día elegido.
- **Ingresos**: neto = bruto − gastos (nunca hay tarifa de Handyx). El bruto separa lo verificado, lo informado sin verificar
  y lo cobrado por fuera. Si los gastos superan al bruto no hay neto: se dice la pérdida con palabras. Ganancia por trabajo o
  etapa y la lista de gastos del mes con **Borrar** (confirma antes; es la forma de deshacer un gasto cargado por error).
- **Gasto**: foto del ticket (se achica en el teléfono con `prepararFoto`, sale como JPEG sin metadatos, queda privada) o a
  mano; monto, trabajo, tipo, descripción y fecha. «Registrarlo como gasto» baja el neto; «Cobrárselo al cliente» crea un
  adicional que el cliente acepta en el chat y **solo se habilita con un trabajo en curso**; antes de mandarlo se pide
  confirmar en una hoja. Si no hay ninguna casilla, no guarda y lo dice.
  **La app no lee el importe de la foto**: lo escribe la persona (el lienzo decía «Leído en tu teléfono»; no hay lectura local
  todavía y no se promete).

## Datos (puerto, mock y HTTP)

`ApiAgenda` y `ApiIngresos` (`src/data/api/`), mock en `src/data/mock/agenda.ts` e `ingresos.ts`, HTTP en `src/data/http/`.

| Método                                                              | Endpoint (contrato 0.11.0)                                      |
| ------------------------------------------------------------------- | --------------------------------------------------------------- |
| `resumenAgenda()`                                                   | `GET /v1/especialista/agenda/resumen`                           |
| `turnosAgenda(vista, cursor?)`                                      | `GET /agenda/turnos?vista=&cursor=`                             |
| `agendaMes(mes, filtro?)` · `turnosDelDia(fecha)`                   | `GET /agenda/mes?mes=&filtro=` · `GET /agenda/dias/{fecha}`     |
| `resumenIngresos(mes)` · `cobrosDelMes(mes, cursor?)`               | `GET /ingresos?mes=` · `GET /ingresos/cobros?mes=`              |
| `gastos(filtro?)` · `cargarGasto(nuevo, ticket, clave)`             | `GET /gastos` · `POST /gastos` (JSON, o multipart `datos` + `ticket`) |
| `corregirGasto(id, cambio)` · `borrarGasto(id)`                     | `PATCH /gastos/{id}` · `DELETE /gastos/{id}`                    |
| `ingresosExternos(mes)` · `cargarIngresoExterno` · `borrarIngresoExterno` | `GET/POST /ingresos-externos` · `DELETE /ingresos-externos/{id}` |

Sin pantalla todavía (el lienzo no las dibuja): `cobrosDelMes`, `corregirGasto`, los ingresos externos y la exportación CSV
(`GET /ingresos/exportacion`, no está en el puerto). `GET /agenda` (0.2.0) sigue en el puerto, deprecado, hasta 1.0.0.

**El mock** arma los turnos desde los trabajos, las jornadas de obra y las propuestas pendientes del estado, y suma tres
pasadas de prueba (nombres ficticios, sin trabajo asociado) para que Pasadas e Ingresos tengan historia. Los ingresos salen
de los pagos del estado + esas pasadas + un cobro por fuera y tres gastos sembrados. «Cobrárselo al cliente» crea un
`Adicional` pendiente en el trabajo (rige la regla del mock de adicionales: trabajo en curso, etapa en curso en una obra).

## Piezas nuevas del kit v3 (CSS propio: `src/ui/taller-dia.css`)

| Pieza                                                                  | Nivel     | Para qué                                                                                       |
| ---------------------------------------------------------------------- | --------- | ---------------------------------------------------------------------------------------------- |
| `TurnoTarjeta`, `ChipDatos`, `GrupoPasadas`, `FilaPasada`, `ResumenPasadas` | molécula  | La hora con su tarjeta, una pasada con su cobro y el resumen de pasadas                        |
| `SelectorMes`, `BarraNeto`, `LineaCuenta`, `FilaGanancia`, `FilaGasto` | molécula  | Mes con botones; barra del neto en SVG dicha con palabras; línea de la cuenta; ganancia; gasto |
| `CalendarioObras`                                                      | organismo | Mes con barritas por obra, trabajos y hechos                                                   |
| `TarjetaAgendaTaller`, `AccesoAncho`                                   | organismo | Tarjeta azul con la semana y el acceso ancho amarillo del Taller                               |

Lógica pura con pruebas en `src/lib/agendaTaller.ts` (semana, rótulos de día, chips con ícono y texto, tramos de la barra).

## Accesibilidad

Texto base 17 px (lo más chico, 13 px solo en rótulos); botones de 56 px y «Borrar» de 48 px; cada estado con ícono y texto;
la semana, el mes y los gastos se manejan con botones (nada depende de arrastrar); el mes dice en el nombre de cada día qué
tiene; las hojas de confirmación atrapan el foco; el foco va al primer error del gasto; `npm run accesibilidad` y `desbordes`
incluyen las pantallas nuevas. La tira de la semana baja de renglón en vez de esconder días detrás de un deslizamiento.
