# Catálogo de componentes · PWA Especialista (lotes 3.3, 4.1, 4.2 y 4.3)

Componentes de `src/components/`. Reglas de forma: `docs/diseno.md`. Cada fila dice dónde verlo en
`docs/capturas/390x844/` (todas con datos sintéticos; ver `docs/capturas/README.md`).

## Base (`ui.tsx`, `Icono.tsx`, `Handy.tsx`)

| Componente | Para qué | Variantes y estados | Accesibilidad | Captura |
|---|---|---|---|---|
| `Chip` / `ChipTexto` | Estado (alta, documento, propuesta, trabajo, pago, caso) | Tonos `exito`, `aviso`, `error`, `azul`, `neutro`; siempre con ícono y texto (`lib/etiquetas.ts`) | El texto dice el estado; el color es apoyo | `trabajos`, `caja` |
| `ChipTipo` | Tipo de pedido o trabajo | Urgente (oscuro con rayo), programado y obra (neutros) | Nunca se confunde con un estado | `pedidos` |
| `Aviso` | Mensaje en la pantalla | Tonos de estado, título opcional, `role="alert"` o `status` | Anunciado por lector de pantalla según el rol | `alta-correccion` |
| `Campo`, `AreaTexto`, `Seleccion`, `Casilla` | Formularios | Ayuda y error por campo | `label` asociado, `aria-invalid`, `aria-describedby`; foco al primer error (`lib/foco.ts`) | `registro`, `alta-borrador` |
| `Interruptor` | Encender o apagar (Ahora, programados, preferencias) | Activo, inactivo, deshabilitado | `role="switch"` con "Sí"/"No" visible | `disponibilidad` |
| `Pasos` | Progreso del alta | "Paso N de 6 · X" + barra segmentada | El texto se anuncia; la barra es decorativa | `alta-borrador` |
| `Seccion`, `Tarjeta`, `Dato`, `Cabecera` | Estructura | Tarjeta blanca, gris, azul, noche o amarilla | Títulos h1/h2 en orden | todas |
| `Icono` | Íconos de línea de la landing | 44 nombres | Decorativos (`aria-hidden`) | todas |
| `Handy` | Personajes de marca | `grupo`, `lamparita`, `lamparita-rota`, `engranaje-roto`, `llave-rota`, `cano-roto`; `handy--tambalea` | Siempre decorativo (`alt=""`): el texto de al lado dice lo que pasa | `acceso`, `error-red`, `sin-conexion` |

## Estados de pantalla (`Estados.tsx`, `SinConexion.tsx`)

| Componente | Cuándo | Qué muestra | Captura |
|---|---|---|---|
| `Cargando` | Primera carga | Esqueleto gris que late (quieto con "reducir movimiento"). Aparece recién si la espera pasa de 0,5 s: las cargas cortas (y el paso de la pantalla de carga a la app) no muestran bloques | El aviso "Cargando…" para lectores de pantalla está desde el principio |
| `ErrorCaja` | Una consulta falló | Handy roto según la falla (lamparita: red; llave: no encontrado o permiso; engranaje: el resto), mensaje seguro, referencia y "Reintentar". Conserva lo ya cargado. **Nunca cae a datos de prueba** | `error-red`, `error-servidor` |
| `Vacio` | No hay nada que mostrar | Ícono de línea + título + ayuda | `inicio-sin-habilitar` |
| `AvisoSinConexion` | El teléfono no tiene red | Franja oscura con la lamparita rota bajo la cabecera | recorrido J (`npm run e2e`) |
| `/sin-conexion/` | Sin red y la pantalla no está guardada | Caño roto, "Probar de nuevo"; HTML estático sin datos | `sin-conexion` |
| `not-found` | Ruta inexistente | Llave rota y "Volver al inicio" | `no-encontrada` |

## Marco y navegación

| Componente | Qué hace |
|---|---|
| `MarcoApp` | Cabecera con logo y avisos, franja sin conexión, contenido y navegación (barra inferior; riel lateral desde 1100 px) |
| `GuardiaApp` / `Puerta` | Llevan a acceso o al alta según la sesión y el estado del alta (los decide el servidor) |
| `BannerPrueba` | Banner amarillo "Datos de prueba" + Panel de prueba. **Solo en el mock**: no entra en `build:hostinger` |
| `Volver` | Enlace de regreso con área táctil de 44 px |
| `RegistrarSw` | Registra el service worker en un build (no en `next dev`) |

## Decisiones y negocio

| Componente | Reglas que garantiza | Captura |
|---|---|---|
| `Hoja` | Confirmación en `<dialog>` modal: foco atrapado y circular, Escape cierra si es cerrable, entra deslizando | (diálogos en `npm run accesibilidad`) |
| `TarjetaPedido` | Enlace al detalle; nunca acepta. Tipo → rubro → zona y fecha → descripción → búsqueda | `pedidos`, `inicio` |
| `TarjetaPropuesta` | Monto, horario, alcance y "Vence en" neutro; aceptar verde y rechazar en contorno rojo, con confirmación | `pedido-programado` |
| `FormPropuesta` / `FormCambio` | Montos en centavos enteros, `Idempotency-Key` estable al reintentar | (hojas) |
| `CuentaRegresiva` | Texto neutro; al llegar a cero pide el estado al servidor | `pedido-programado` |
| `AccionTrabajo` | Una acción primaria por estado ("Salgo hacia el lugar", "Llegué", "Terminé el trabajo") | `trabajo-agendado` |
| `ControlDisponibilidad` | "Ahora" y programados revocables al instante | `inicio`, `disponibilidad` |
| `Documento` | "Cargado, sin revisar" ≠ verificado; los antecedentes no tienen carga de archivo | `alta-borrador` |
| `FeeAviso`, `ContadorFee`, `ModalFee` | Fee 0 % hasta el 10/12 (modal del primer ingreso, post-registro y contador en Cuenta) | `cuenta` |

**Sello "Verificado por Handyx"**: solo con `verificado` del perfil público que manda el servidor (`Cuenta.tsx`). La app no lo
deduce de documentos cargados ni de ningún estado local.

## Kit Handyx v2 (`src/kit/`, lote 4.1)

Para las pantallas de la fase 4. Se ven en uso en `/catalogo/` (solo en la vista previa con datos de prueba). Estilos en
`src/kit/kit.css` (prefijo `hx-`) y lógica pura con pruebas en `src/kit/logica.ts`.

| Componente | Archivo | Para qué | Accesibilidad |
|---|---|---|---|
| `BarraSuperior` | `Navegacion.tsx` | Barra compacta con "atrás" y acciones; `grande` agrega el título grande que colapsa al bajar | Un solo h1 (el grande, o el de la barra) |
| `PestanasFlotantes` | `Navegacion.tsx` | Las 4 pestañas raíz, flotantes, con insignia de no leídos | `nav` con `aria-current`; la insignia se lee "sin leer" |
| `HojaArrastrable` | `HojaArrastrable.tsx` | Hoja no modal sobre el mapa con 3 alturas (34 %, 66 % y 94 %). `pedida` la mueve desde afuera (En camino la baja al compartir) y `alCambiar` avisa la altura al mapa | La manija es un botón: tocar cambia la altura y las flechas la suben o la bajan; `aria-expanded` |
| `ProveedorIsla` / `useIsla` | `Efectos.tsx` | Avisos que bajan desde arriba (te eligieron, pedido nuevo, cobro) | `role="status"`; se cierran y no se van con el foco o el dedo encima |
| `useConfeti` | `Efectos.tsx` | Confeti de mosaicos para celebrar | `aria-hidden`; nada con "reducir movimiento" |
| `BotonFijo` | `Piezas.tsx` | La acción principal fija abajo, con una nota opcional | — |
| `Mosaico` | `Piezas.tsx` | Rubros, zonas, franjas: azul con tilde cuando está elegido | `aria-pressed` |
| `ChipOpcion` | `Piezas.tsx` | Franjas, filtros y motivos; en fila o en carril con desplazamiento lateral (`hx-chips--carril`) | `aria-pressed`, 44 px de alto |
| `TiraDias` | `Fechas.tsx` | Días seguidos para elegir con el pulgar; los anteriores al mínimo, deshabilitados | El nombre completo del día ("jueves 19 de noviembre, hoy") |
| `CalendarioMes` | `Fechas.tsx` | Mes con hoy en amarillo, días con eventos (puntitos) y el elegido en azul | Cada día dice la fecha y la cantidad de eventos |
| `SelectorHora` | `Fechas.tsx` | Dos ruedas (hora y minutos cada 15) | `listbox` con flechas, Inicio y Fin |
| `PrecioStepper` | `Precio.tsx` | "Handyx sugiere · Vos decidís": − / + de a $ 500, atajos, escribir otro monto, mínimo y "Recibís" | Botones "Subir $ 500" y "Bajar $ 500"; el precio se anuncia |
| `MontoGrande` / `useContador` | `Piezas.tsx` | Monto que sube en las celebraciones | El lector lee el valor final de una vez |
| `Avatar` | `Piezas.tsx` | Iniciales con un tono fijo por nombre; tilde de verificado solo con el dato del servidor | Decorativo: el nombre está al lado |
| `Fila` | `Piezas.tsx` | Filas de lista con ícono, texto y flecha (enlace o botón) | — |
| `LineaDeTiempo` | `Piezas.tsx` | Revisión del alta, estado de un trabajo, etapas de una obra | El estado se lee ("hecho", "en curso", "pendiente"); `aria-current="step"` |
| `EstadoVacio` | `Piezas.tsx` | Un Handy contento con título, texto y acción | El Handy es decorativo |
| `Tilde` | `Piezas.tsx` | Tilde de éxito que se dibuja | Decorativo |

| `CampoCodigo` | `CampoCodigo.tsx` (4.2) | Código de 6 números: un solo campo real (teclado numérico, `one-time-code`, pegar) sobre 6 casillas dibujadas | Una etiqueta y un error asociados; las casillas son `aria-hidden` |

## Cuenta (lote 4.2)

| Componente | Archivo | Para qué | Notas |
|---|---|---|---|
| `PantallaCarga` | `PantallaCarga.tsx` + `carga.css` | Carga al abrir: fondo que cambia de color, los Handys saltan, cae el logo y se dan la mano (2,5 s) | Se saltea tocando o con una tecla; con "reducir movimiento", cuadro quieto de 0,6 s. La `Puerta` redirige cuando terminan la carga y la consulta |
| `Escena` | `Cuenta.tsx` | Escena de color de arriba con Handys, logo y mosaicos de herramientas | Decorativa |
| `CampoClave` | `Cuenta.tsx` | Contraseña con "Mostrar" y, en las nuevas, medidor de fuerza en 3 tramos con texto (`lib/clave.ts`) | La fuerza se dice con palabras, no solo con color |
| `CasillasLegales` | `Cuenta.tsx` | Términos y privacidad sin tildar, con la lectura en una `Hoja` | Error por casilla |
| `CuentaCreada` | `Cuenta.tsx` | Tilde, confeti, aviso del fee 0 % y "Completar mi alta" | Celebración permitida |
| `BotonesProveedor` | `BotonesProveedor.tsx` | "Continuar con Google" siempre y "Continuar con Apple" solo en dispositivos Apple (`lib/dispositivo.ts`) | Hoy solo en el mock (cuentas de prueba en una hoja). En producción no aparecen hasta conectar los SDK (lote 5.2) |

`useAccion({ publica: true })`: en entrar y con Google o Apple, un 401 es "credenciales incorrectas", no "tu sesión expiró".

## Mapa (lote 4.3)

| Componente | Archivo | Para qué | Accesibilidad |
|---|---|---|---|
| `Mapa` | `src/mapa/Mapa.tsx` | Zona aproximada, destino, tu posición, trayecto, cobertura y radar. Alturas `chico`, `medio`, `grande` y `completo`; `interactivo`, `conCentrar` y `tapadoAbajo` (lo que tapa una hoja) | El lienzo es una región con `etiqueta`. Sin interacción, no entra en el orden de tabulación. Los marcadores son `aria-hidden`: lo importante está en texto al lado. `alternativa` en texto si no carga |
| `useCompartirUbicacion` | `src/hooks/useCompartirUbicacion.ts` | GPS solo a pedido, envíos limitados y señal (`precisa`, `imprecisa`, `sin señal`, `sin permiso`) | La señal se muestra con ícono **y** texto |

Detalle, privacidad y datos: `docs/mapa.md`.

Handys disponibles (`Handy.tsx`):
- Contentos: grupo, lamparita, llave, engranaje, caño y gota.
- Rotos: lamparita, llave, engranaje y caño.

Las poses nuevas se generan con `docs/handys-prompt.md`.
