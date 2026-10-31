# QA de la fase 2 · mockup navegable

Todo corre con datos de prueba (banner amarillo) y con el origen `mock`. **Nada está conectado a un backend real**:
estas pruebas demuestran la interfaz y las reglas emuladas del servidor, no el backend.

## Cómo se prueba

| Qué | Comando | Qué cubre |
|---|---|---|
| Unitarias y del mock | `npm test` | Contrato, máquinas de estado, fee, formato, mock con reglas de servidor (60+ pruebas) |
| Recorridos de punta a punta | `npm run build && npm run e2e` | 26 recorridos en Chromium (390×844) sobre `out/`, incluidos J (sin conexión con service worker) y M1–M3 (mapa) |
| Service worker | `npm test` (`src/pwa/politica.test.ts`) | Nunca intercepta la API, mutaciones ni otros sitios |
| Accesibilidad | `npm run accesibilidad` (`ANCHO=320x568`, `768x1024`, `1280x800`) | axe WCAG 2.2 AA en 59 pantallas, En camino compartiendo y los diálogos; áreas táctiles; teclado; foco al primer error; texto al 200 %; estructura para lectores (un h1, un main y título propio); reducir movimiento |
| Rendimiento | Build de producción apuntando a `http://localhost:4503` y `node e2e/rendimiento.cjs` (`SOLO=`, `VECES=`) | Lighthouse móvil 13.6.0 (rendimiento y accesibilidad) en 14 pantallas, con una API ficticia local que sirve los datos sintéticos del mock. Solo informa: lista lo que queda por debajo de 90 |
| Capturas | `npm run capturas -- [carpeta]` (`ANCHOS=360x740,…`) | 46 pantallas/escenarios (incluye cuenta, cada paso del alta, mapas, errores, sin conexión y 404) con control de desborde y de sanitización |
| Catálogo en `docs/capturas/` | `npm run capturas:docs` (ImageMagick) | Las 32 a 390×844 y 6 a 1280×800 en webp |
| Capturas de recorridos | `CAPTURAS=/ruta node e2e/flujos.cjs` | Una captura por estado clave (insumo de la fase 3 y de Handy Docs, sin datos reales) |
| Recorrido manual | `npm run dev` y el **Panel de prueba** del banner amarillo | Escenarios, fallas, reloj y simulación de las otras partes |

El estado de prueba vive solo en la memoria de la pestaña: **recargar la página lo reinicia**. `?escenario=` en la URL de
entrada elige el punto de partida: `nuevo`, `sin_verificar` (cuenta nueva sin el código), `sin_aceptar` (entró con Google por
primera vez), `incompleto`, `en_revision`, `correccion`, `rechazado`, `habilitado` y `baja`.

En la vista previa no se manda ningún email ni se abre Google o Apple:
- El código de prueba es **482913** y aparece en Verificar.
- Las cuentas de Google y Apple se eligen de una lista.
- El enlace de recuperación se abre desde "Revisá tu correo" ("Abrir el enlace del email" o "Probar un enlace vencido").
- Apple aparece solo con un navegador de iPhone, iPad o Mac (en el recorrido L2, el agente de usuario es de iPhone).

Mapa y viaje (lote 4.3, `docs/mapa.md`): el GPS es simulado y se controla desde el Panel → "Ubicación (GPS simulado)"
(señal normal, imprecisa, sin señal, permiso negado, desviarme del trayecto y velocidad ×6). Para probarlo: Trabajos →
el agendado → "Salgo hacia el lugar" → "Compartir mi ubicación". Hasta que se genere el mapa base, el mapa se ve sin calles y
el trayecto no se puede calcular (la app ofrece Google Maps o Waze).

## Escenarios obligatorios (prompt del Bloque 4) y cómo reproducirlos

| Escenario | Cómo se ve | Cubierto por |
|---|---|---|
| Registro incompleto | Escenario *Alta incompleta*: el anillo dice cuántos pasos están listos; el resumen lista qué falta y no deja enviar | Panel · E2E A |
| Documento faltante | Cada documento muestra "Falta cargarlo"; no se puede enviar el alta | E2E A · `mock.test` |
| Rubro habilitado vs no habilitado | Gas sin matrícula verificada queda "Falta la matrícula" y no recibe pedidos; aire acondicionado no elegido no existe para vos | `mock.test` · E2E B |
| Verificación pendiente / corrección | Escenarios *En revisión* (línea de tiempo) y *Requiere corrección* (acceso directo a lo marcado, enviar bloqueado hasta corregir) | E2E H |
| Antecedentes presenciales pendientes | Paso "Antecedentes": elegir turno, sin carga de archivos; resultado desde el panel (Operations) | E2E A · H |
| Disponible / revocado | Interruptor grande "Disponible" del inicio y Disponibilidad; prenderlo muestra el pedido entrante ("Ver y cotizar" / "Ahora no", que nunca acepta ni rechaza); apagar corta la oferta de urgentes | E2E B |
| Precio sugerido y te eligieron | "Poner mi precio": Handyx sugiere (con su fuente), el precio lo decidís vos; panel › *Acepta tu última propuesta*: aviso "¡El cliente te eligió!", isla con "Ver el trabajo" y confeti solo en la transición | E2E B · N · `mock.test` |
| Bandeja por cercanía y avisos | Bandeja › *Más cerca* (la ubicación no se manda); Avisos › borrar uno (deslizar o botón) y *Borrar todos* con confirmación | E2E N |
| Pedido urgente con opt-in apagado | Panel › *Entra un pedido urgente nuevo*: la nota aclara que no lo ves | `mock.test` |
| Propuesta vencida / rechazada | Panel › reloj (+5 min) y *Rechaza tu última propuesta*; chips "Venció" y "Rechazada" | `mock.test` |
| Contrapropuesta | *Contraofertar* en la propuesta del usuario, o el panel › *Te contraoferta* | `mock.test` |
| Acuerdo | *Aceptar propuesta* (con confirmación) crea el trabajo agendado | E2E C |
| Mensaje fallido | Panel › *Falla el próximo mensaje*: "No se envió. Reintentar" sin duplicar | E2E E |
| Doble aceptación | Panel › *Doble aceptación*: "Esta propuesta ya no está disponible" y nada se contrata | E2E D |
| Programado / obra | Bandeja con los tres tipos; obra con etapas y cobro por etapa | E2E I |
| Reporte de efectivo | Caja › *Informar cobro en efectivo*: queda "Reportado, sin verificar" | E2E C |
| Pago MP pendiente / verificado / fallido | Caja con los tres estados; panel › webhook de Mercado Pago (OK o falla) | E2E I · `mock.test` |
| Reclamo | Desde un trabajo › *Pedir ayuda o hacer un reclamo*; panel › *Handy responde* | E2E I |
| Baja | Cuenta › *Eliminar mi cuenta*: sesión cerrada, estado real y cancelación | E2E F |
| Sesión expirada | Panel › *Expirar la sesión ahora*: aviso modal con salida a Entrar | E2E F |
| Red caída / error del servidor | Panel › *Sin conexión* / *El servidor responde con error*: error con Reintentar, sin datos de muestra | E2E F |
| Llegada automática y "Ya llegué" | Compartiendo con buena señal, la llegada se marca sola al entrar en la cuadra; con señal imprecisa, sin señal, sin permiso o sin compartir aparece "Ya llegué" con el motivo | E2E M2 · C · O · `mock.test` |
| Adicionales | En curso › *Agregar repuestos o mano de obra*; panel › *Acepta / Rechaza tu último adicional*; los pendientes se retiran al terminar y el cobro va por el total vigente | E2E O · `mock.test` |
| Obra de varios días | Trabajo de *Cliente de prueba 11* (agendado) o de *Cliente de prueba 8* (en curso): resumen, plan, jornadas y diario; panel › *Acepta / Rechaza el cambio de jornada* y *Acepta tu último adicional* | E2E P · I · `mock.test` |
| Chat, contactos, cuenta, caja y ayuda | Chat › respuestas rápidas, *Agregar a contactos* y *Programar turno*; Mensajes › *Contactos*; Cuenta › *Cómo te paga el cliente*; Caja › filtros y desglose; Centro de ayuda › temas | E2E Q · `mock.test` |
| Cambiar la fecha y cancelar | Trabajo › *Cambiar la fecha* (motivo, día y franja) y *Cancelar este trabajo* (alternativas, motivo y confirmación) | E2E D · O |
| Ubicación en vivo (señal, permiso, desvío) | En camino › *Compartir mi ubicación*; panel › señal imprecisa, sin señal, permiso negado o desviarme | E2E M2 · `mock.test` |
| Mapa que no carga | Sin WebGL (o sin conexión al abrirlo): queda el texto con el barrio o el destino | E2E M3 |

## Comprobaciones de cierre por lote

| Lote | Comprobación | Resultado (29/10/2026, local) |
|---|---|---|
| 2.1 | Revisión pendiente, corrección y rechazo sin subir documentos reales | Cumplido: solo "documento de prueba"; E2E A y H |
| 2.2 | Opt-out urgente impide la oferta y la UI no obliga a aceptar | Cumplido: `mock.test` y E2E B; ningún botón de la bandeja acepta |
| 2.3 | Un acuerdo no cambia sin nueva aceptación; el chat funciona antes de contratar | Cumplido: `mock.test` (cambio de fecha) y E2E D/E |
| 2.4 | Cambios, errores y próxima acción se entienden sin backend | Cumplido en el mock; falta revisión visual (fase 3) |
| 2.5 | Sin saldo retirable de Handy ni comisión en la demo | Cumplido: caja con fee $ 0, sin retiros; simulación rotulada "no vigente" |

## Lote 4.9 · QA premium (30/10/2026)

| Control | Resultado |
|---|---|
| E2E | 26/26 |
| axe en 320, 390, 768 y 1280 | 0 violaciones; 0 problemas de teclado, foco, zoom, movimiento y estructura |
| Áreas táctiles | ≥ 44 px salvo los días del calendario a 320 px (39×44) y el catálogo del mock |
| Lighthouse accesibilidad | 96–100 (Inicio 96: el interruptor queda debajo de las pestañas en la primera vista) |
| Lighthouse rendimiento | Bienvenida 97, Entrar 96, Crear cuenta 97; con sesión 83–90 (LCP ~3,5 s con Slow 4G simulado) |
| Lectores de pantalla a mano | Pendiente: lista para VoiceOver y TalkBack en la página de flujos |

Para medir el rendimiento:

```sh
NEXT_PUBLIC_DATA_SOURCE=http NEXT_PUBLIC_API_BASE_URL=http://localhost:4503 npx next build
node e2e/rendimiento.cjs
```

Ese build es solo para medir: apunta a la API ficticia local y nunca se publica (`build:hostinger` exige https).

## Lo que esta fase NO demuestra

- Autorización real, IDOR, rate limits, CSRF, cookies y almacenamiento privado: son del backend (fase 4).
- Que el contrato HTTP funcione contra un servidor: hay pruebas con `fetch` simulado y validación Zod, no contra una API.
- Rendimiento en gama baja, instalación de la PWA, service worker y offline (fases 3 y 5).
- Accesibilidad con lectores de pantalla reales y en dispositivos físicos (lote 5.2). Responsive y WCAG 2.2 AA automático: lote 3.2.
