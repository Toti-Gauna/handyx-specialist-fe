# Catálogo de componentes · PWA Especialista (lote 3.3)

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
| `Cargando` | Primera carga | Esqueleto gris que late (quieto con "reducir movimiento") | — |
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

**Sello "Verificado por Handy"**: solo con `verificado` del perfil público que manda el servidor (`Cuenta.tsx`). La app no lo
deduce de documentos cargados ni de ningún estado local.
