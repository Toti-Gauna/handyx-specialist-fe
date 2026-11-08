# Equipamiento y herramientas del teléfono (lote 2.4, fases H0.5 y H0.1b)

Rutas (`src/app/rutas/equipamiento.ts` y `herramientas.ts`, grupo `src/app/(herramientas)/`), todas con el kit v3.
Ids por query (`?id=`, `?c=`). Sin nada en el navegador: lo que se calcula vive en la memoria de la pantalla.

| Lienzo                                           | Ruta                                                              | Pantalla                                              |
| ------------------------------------------------ | ----------------------------------------------------------------- | ----------------------------------------------------- |
| H0-Equipo                                        | `/taller/equipamiento/`                                           | `pantallas/equipamiento/Equipamiento.tsx`             |
| H0-EquipoCategoria                               | `/taller/equipamiento/categoria/?c=`                              | `CategoriaEquipo.tsx`                                 |
| H0-EquipoAgregar                                 | `/taller/equipamiento/agregar/`                                   | `AgregarEquipo.tsx` (foto o código de barras)         |
| H0-EquipoDetalle, H0-EquipoBaja                  | `/taller/equipamiento/herramienta/?id=`                           | `DetalleEquipo.tsx` (prestar, mover, «Ya no la tengo») |
| T-Taller (clave `tallerHerramientas`)            | `/taller/herramientas/`                                           | `pantallas/herramientas/PortalHerramientas.tsx`       |
| T-Medir                                          | `/taller/medir/`                                                  | `Medir.tsx`                                           |
| T-Escanear                                       | `/taller/escanear/`                                               | `Escanear.tsx`                                        |
| T-Modelo3D                                       | `/taller/modelo/`                                                 | `ModeloTres.tsx`                                      |
| T-Nivel                                          | `/taller/nivel/`                                                  | `NivelTelefono.tsx`                                   |
| (linterna y lupa, conversor)                     | `/taller/linterna/`, `/taller/conversor/`                         | `LinternaLupa.tsx`, `Conversor.tsx`                   |
| T-Electricidad, T-Tablero, T-TableroPared, T-Cables, T-Informe | `/taller/electricidad/`, `/taller/tablero/`, `/taller/conductores/`, `/taller/informe/` | `Electricidad.tsx` y `pantallas/taller/*` (kit v3 y AR común de `src/tres`) |

## Decisiones

- **El escaneo 3D se procesa en el teléfono** (`src/herramientas/escaneo.ts`: casco visual por siluetas, escala con una
  tarjeta o una medida escrita). No se envía ninguna foto: si el teléfono no puede, se avisa antes o al procesar y las
  fotos se descartan. El modelo se puede compartir o guardar en un trabajo (GLB) solo si la persona lo pide.
- **Medir**: WebXR con detección de superficies en Android (`medirAr.ts`); en iPhone o sin AR, foto con una tarjeta de
  referencia de 85,6 × 54 mm (`medir.ts`). Siempre «medida aproximada: para cortar, confirmá con la cinta».
- **Código de barras** (`ui/organismos/LectorCodigo.tsx`): `BarcodeDetector` en Android; en iPhone y siempre como
  alternativa, se escriben los números. El servidor solo sugiere un nombre: sin precios.
- **Nivel** (`herramientas/nivel.ts`, `ui/organismos/Nivel.tsx`): giroscopio con permiso por toque en iPhone; sin sensor se
  dice y no se inventa una lectura. Con datos de prueba el sensor es simulado (`data/mock/sensores.tsx`).
- **Equipamiento**: el mock (`data/mock/equipamiento.ts`) emula las reglas del servidor (versión → 409, historial, baja que
  conserva el historial); el adaptador HTTP está en `data/http/equipamiento.ts`. Solo lo ve la persona dueña.

## Piezas nuevas del kit

Moléculas: `MosaicoCategoria`, `GrillaCategorias`, `FilaHerramienta`, `FranjaAviso`, `PortadaObjeto` (`Equipo.tsx`);
`AccesoHerramienta`, `GrillaHerramientas`, `BandaOficio`, `CabeceraOficio`, `ResultadoDestacado`, `ContadorSemaforo`,
`FilaMedicion`, `AvisoRevisionTecnica` (`Herramientas.tsx`); `MarcarPuntos`, `AnilloFotos`. Organismos: `PantallaCamara`,
`VideoCamara`, `Disparador`, `BotonOscuro`, `BurbujaNivel`, `LectorCodigo`. Plantilla: `PantallaOscura`. Ilustraciones:
`CajaHerramientas`, `TelefonoMide`. Estilos de nivel en `src/ui/herramientas.css`; de pantalla en
`pantallas/equipamiento/equipamiento.css`, `pantallas/herramientas/herramientas.css` y `pantallas/taller/electricidad.css`.

## Pruebas

`npm test` (`herramientas/*.test.ts`, `data/mock/equipamiento.test.ts`, `pantallas/equipamiento/vista.test.ts`); E2E
`e2e/recorridos/RC-Equipamiento.cjs` (categoría, detalle y baja; agregar y lista de compras, con axe) y
`RC-Taller.cjs` (medir, escanear y modelo; nivel, linterna y conversor). Las pantallas están en `e2e/pantallas.cjs`
(accesibilidad y desbordes).

## Pendiente

- Probar en dispositivos reales: WebXR (Android), `BarcodeDetector`, giroscopio en iPhone y el escaneo en un teléfono de
  gama baja (Moto E20; tiempo y memoria de `escaneo.ts`).
- Las tablas de Electricidad siguen «en revisión técnica» (`docs/revision-tecnica-electricidad.md`).
- Entradas desde la pestaña Taller (lote 2.1) a equipamiento y a `/taller/herramientas/`; mosaico de equipamiento de F-Cuenta.
- Adaptadores HTTP de equipamiento: unir con los clientes de `src/data/http/servidor/` del lote 2.5.
