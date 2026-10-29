# QA de la fase 2 · mockup navegable

Todo corre con datos de prueba (banner amarillo) y con el origen `mock`. **Nada está conectado a un backend real**:
estas pruebas demuestran la interfaz y las reglas emuladas del servidor, no el backend.

## Cómo se prueba

| Qué | Comando | Qué cubre |
|---|---|---|
| Unitarias y del mock | `npm test` | Contrato, máquinas de estado, fee, formato, mock con reglas de servidor (60+ pruebas) |
| Recorridos de punta a punta | `npm run build && node e2e/flujos.cjs` | 11 recorridos en Chromium (390×844) sobre `out/` |
| Catálogo de capturas | `node e2e/capturas.cjs [carpeta]` (`ANCHOS=360x740,…`) | 28 pantallas/escenarios con control de desborde horizontal |
| Capturas de recorridos | `CAPTURAS=/ruta node e2e/flujos.cjs` | Una captura por estado clave (insumo de la fase 3 y de Handy Docs, sin datos reales) |
| Recorrido manual | `npm run dev` y el **Panel de prueba** del banner amarillo | Escenarios, fallas, reloj y simulación de las otras partes |

El estado de prueba vive solo en la memoria de la pestaña: **recargar la página lo reinicia**. `?escenario=` en la URL de
entrada elige el punto de partida: `nuevo`, `incompleto`, `en_revision`, `correccion`, `rechazado`, `habilitado`, `baja`.

## Escenarios obligatorios (prompt del Bloque 4) y cómo reproducirlos

| Escenario | Cómo se ve | Cubierto por |
|---|---|---|
| Registro incompleto | Escenario *Alta incompleta*: faltan datos, CUIT/CUIL, foto y matrícula; el resumen lista qué falta | Panel · E2E A |
| Documento faltante | Cada documento muestra "Falta cargarlo"; no se puede enviar el alta | E2E A · `mock.test` |
| Rubro habilitado vs no habilitado | Gas sin matrícula verificada queda "Falta la matrícula" y no recibe pedidos; aire acondicionado no elegido no existe para vos | `mock.test` · E2E B |
| Verificación pendiente / corrección | Escenarios *En revisión* y *Requiere corrección* (solo se vuelve a cargar lo rechazado) | E2E H |
| Antecedentes presenciales pendientes | Paso "Antecedentes": sin carga de archivos; estados de cita en el panel (Operations) | E2E A |
| Disponible / revocado | Interruptores de Inicio y Disponibilidad; apagar "Ahora" corta la oferta de urgentes | E2E B |
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

## Comprobaciones de cierre por lote

| Lote | Comprobación | Resultado (29/10/2026, local) |
|---|---|---|
| 2.1 | Revisión pendiente, corrección y rechazo sin subir documentos reales | Cumplido: solo "documento de prueba"; E2E A y H |
| 2.2 | Opt-out urgente impide la oferta y la UI no obliga a aceptar | Cumplido: `mock.test` y E2E B; ningún botón de la bandeja acepta |
| 2.3 | Un acuerdo no cambia sin nueva aceptación; el chat funciona antes de contratar | Cumplido: `mock.test` (cambio de fecha) y E2E D/E |
| 2.4 | Cambios, errores y próxima acción se entienden sin backend | Cumplido en el mock; falta revisión visual (fase 3) |
| 2.5 | Sin saldo retirable de Handy ni comisión en la demo | Cumplido: caja con fee $ 0, sin retiros; simulación rotulada "no vigente" |

## Lo que esta fase NO demuestra

- Autorización real, IDOR, rate limits, CSRF, cookies y almacenamiento privado: son del backend (fase 4).
- Que el contrato HTTP funcione contra un servidor: hay pruebas con `fetch` simulado y validación Zod, no contra una API.
- Rendimiento en gama baja, instalación de la PWA, service worker y offline (fases 3 y 5).
- Accesibilidad completa y responsive 360/768/820/desktop: se revisa en la fase 3 (hoy solo se probó 390×844).
