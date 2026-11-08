# Mapa de pantallas, estados y requisitos · Especialista (lote 1.2)

Fuente: Bloque 4 (prompt maestro Especialista), TECH-03, PROD-21 (mapa de flujo), PROD-06/11 (herramientas y chat),
demo de la landing (`Handy-landing-page-fe/src/render/demo/especialista.ts`, 25 pantallas `e-*`) y decisiones de
Ignacio del 29/10/2026. Mapa **inicial** (fase 1). La fase 2 lo materializó con datos de prueba: la columna *Fase 2* dice qué pantalla existe y cómo probarla; la fase 3 la refina.

Regla de cierre del lote: **documento cargado ≠ verificado** y **ningún antecedente se acepta como upload**.

## 1. Recorrido

```
cuenta → alta (borrador) → enviada → en revisión ⇄ requiere corrección → habilitada | rechazada
   │                                     ▲ Operations revisa documentos y hace la verificación presencial
   └─ modal fee 0 % (post-registro)
habilitada → disponibilidad declarada (urgentes "Ahora" opt-in, programados, franjas, zonas)
   → pedido elegible (servidor filtra) → propuesta / contrapropuesta → aceptación de la contraparte
   → trabajo (agendado → en camino → Llegué → en curso → finalizado) + chat + agenda
   → pago directo (MP o efectivo: pendiente → reportado → verificado) → caja/historial → soporte/reclamo
```

## 2. Pantallas

| # | Pantalla | Ruta | Lote | Estados que muestra | Reglas |
|---|---|---|---|---|---|
| Z1 | Sin conexión | `/sin-conexion/` | 3.3 | sin red y pantalla no guardada | HTML estático del service worker, sin datos de la cuenta (`docs/pwa.md`) |
| A0 | Carga y bienvenida (D6-Bienvenida) | `/` · `/bienvenida/` | 4.2 · 1.1 | carga animada; Mar del Plata isométrica que se arma (quieta con "reducir movimiento"); crear cuenta o «Ya tengo cuenta» | Sin láminas ni el 0 % de la demo: Handyx no cobra comisión al especialista |
| A1 | Entrar (D6-Login) | `/acceso/` (`?motivo=sesion`: "Hola de nuevo") | 4.2 · 1.1 | vacío (foco al primer error), datos incorrectos, bloqueo por intentos, sin red; email **o teléfono**; «Recordar este teléfono» (sin tildar); Google; Apple solo en dispositivos Apple | Mensaje genérico (no dice si la cuenta existe) y sin el aviso de sesión vencida |
| A1b | Segunda verificación (D6-Login2FA) | `/acceso/verificacion/` | 1.1 | código de la app (preferido), por SMS o email (con espera para pedir otro), código de respaldo; intentos que quedan; vencido o recargado → volver a entrar | El desafío vive solo en memoria; «Paso 2 de 2» |
| A1c | Entrar con un código (D6-Acceso · D6-Codigo) | `/acceso/codigo/` · `/acceso/codigo/verificar/` | 1.1 | email o SMS; SMS sin proveedor (503) ofrece el email; código incorrecto, agotado, pedir otro tras la espera o por el otro camino; sin pedido → pedir uno | Respuesta neutra: el destino enmascarado sale de lo escrito |
| A2 | Crear cuenta | `/registro/` | 4.2 | 3 pasos (email, contraseña con medidor, aceptaciones); cuenta existente (respuesta neutra) | Términos y privacidad versionados con aceptación explícita (sin tildar) |
| A2b | Verificar el email | `/verificar/` | 4.2 | código incorrecto (intentos que quedan), vencido, bloqueado, reenvío con espera, cambiar el email; cuenta creada | Código de 6 dígitos que no viaja al cliente; hasta verificar no se usa el resto |
| A2c | Un paso más | `/registro/aceptar/` | 4.2 | cuenta nueva de Google o Apple | Email ya verificado por el proveedor; aceptaciones sin tildar |
| A3 | Recuperar la contraseña (D6-Recuperar) | `/recuperar/` · `/recuperar/nueva/?token=` | 4.2 · 1.1 | con email o teléfono; enviado (respuesta neutra), contraseña nueva con medidor (mínimo 12), cambiada, enlace vencido o usado | No revela si la cuenta existe; el enlace va al email de la cuenta; el token sale de la URL al leerlo |
| A4 | Fee 0 % post-registro | (paso de `/registro/`) | 2.1 | antes / vigente / último día | "Handyx no te cobra tarifa hasta el 10/12/2026". No es descuento sobre tu precio |
| B0 | Alta · inicio | `/alta/` | 4.4 | anillo de progreso (N de 6 listos); cada paso con "Listo", "Falta", "Corregir", "En revisión" o "Cuando quieras"; corrección con acceso directo a lo marcado | Lo que falta lo decide el servidor (`faltantesEnvio`). Pantalla completa, con Ayuda y Cuenta arriba |
| B1 | Alta · tus datos | `/alta/?paso=datos` | 4.4 | una pregunta por pantalla (7), error y foco en el campo, guardado en cada "Siguiente" | Nombre, apellido, fecha de nacimiento, nacionalidad, género (PROD-15), ciudad y barrio opcional. Sin dirección |
| B2 | Alta · DNI y CUIT o CUIL | `/alta/?paso=identidad` | 4.4 | números; DNI con cámara y marco (frente y dorso); constancia de CUIT o CUIL; rechazado con motivo | La foto vive solo en memoria hasta que se manda. En la vista previa la cámara es simulada. CUIL no equivale a habilitación fiscal |
| B3 | Alta · tu foto | `/alta/?paso=selfie` | 4.4 | cámara con óvalo y consejos de luz; vista previa con "Repetir"; en revisión, verificada, rechazada | Privada; se ve en el perfil solo si Operations la verificó |
| B4 | Alta · rubros | `/alta/?paso=rubros` | 4.4 | 6 rubros en mosaico; Gas y aire piden matrícula; matrícula cargada, en revisión, rechazada | Una foto no autoverifica |
| B5 | Alta · zonas y horarios | `/alta/?paso=zonas` | 4.4 | barrios en el mapa y en mosaico; horarios en bloques (mañana, tarde, noche por día) | Opcional para enviar. Durante el alta no se activan pedidos (solo zonas y franjas) |
| B6 | Alta · antecedentes | `/alta/?paso=antecedentes` | 4.4 | elegir día y horario; ocupado; turno reservado con lugar; cambiar el turno; resultado | **Sin upload**: el certificado se muestra en persona. Se puede elegir también con el alta en revisión |
| B7 | Alta · resumen | `/alta/?paso=resumen` | 4.4 | cada paso con "Ver", "Completar" o "Corregir"; qué falta para enviar; enviar o volver a enviar | El botón queda deshabilitado hasta que no falte nada (se arregló la contradicción del resumen en corrección) |
| B8 | Alta en revisión, rechazada y habilitada | `/alta/` | 4.4 | línea de tiempo con un Handy esperando; rechazada con motivo y Ayuda; "¡Tu alta está habilitada!" con celebración al verse el cambio y "Empezar" | Sello "verificado" solo si el servidor lo dice. Después de habilitada: Inicio con el modal del fee 0 % |
| C1 | Inicio (F-Inicio y F-InicioDia) | `/inicio/` | 1.3 | sin alta habilitada; cabecera azul con el **único** Disponible; **mapa de arreglos** detrás (marcadores-ilustración tocables, zonas aproximadas, «Me voy hasta…», vista Lista); **pedidos que llegan flotando** («Pedido 1 de 2», la ilustración arma el arreglo); hoja de **pedidos cercanos** estilo «Choose a ride» con «Ver pedido»; detalle en una hoja (F-Pedido); con trabajos hoy, **tu día** (tira de paradas, la próxima con escribirle, avisar demora y «Salir ahora») | **Nunca** tasa de aceptación, tiempos de respuesta ni puntualidad. Nada se acepta desde el mapa. Distancias solo si la persona pide medir desde donde está (`docs/nucleo.md`) |
| C2 | Disponibilidad | (hoja desde Inicio y Cuenta) | 2.2 | urgentes "Ahora" on/off, programados on/off, franjas, zonas | Opt-in revocable al instante; revocar no penaliza. No se deduce de tener la app abierta |
| C3 | ~~Bandeja de pedidos~~ | ~~`/pedidos/`~~ | 1.3 | **Se quitó en el lote 1.3**: la reemplazan los pedidos cercanos y la vista Lista del Inicio | — |
| C4 | Avisos | `/notificaciones/` | 2.2 · 4.5 | agrupados en Nuevos / Antes, urgente vs programado, ¡te eligieron!, deslizar o botón para borrar, "Borrar todos" con confirmación, vacío | El aviso abre el detalle; **nunca acepta**. Push opcional; sin prometer sonido de llamada en web |
| D1 | Pedido (F-Pedido) | `/pedidos/detalle/?id=` | 1.3 | hoja sobre el mapa con la zona aproximada (círculo, sin pin); urgente con lo que queda; +1 al camino; lo que cuenta el cliente y sus fotos; Handyx sugiere; **Cotizar**, **Otra fecha** y «Ahora no» (sin consecuencias); propuestas del pedido (esperando al cliente, te eligió, la del cliente, contraofertar) | Desde un aviso o el chat. En el Inicio el mismo detalle va en una hoja |
| D1b | Tu precio (F-Precio → F-Enviada) | `/pedidos/propuesta/?id=` (`&base=`, `&paso=fecha`, `&chat=`) | 1.3 | paso 1 de 2: **cinta** (slider), atajos, **teclado** en una hoja, incluye materiales, garantía, «Recibís el 100 %»; paso 2 de 2: el horario que pidió el cliente o el calendario con franjas (pasadas u ocupadas apagadas) y el **horario a medida** (franja u hora exacta) en una hoja; **revisar** en una hoja; **propuesta enviada** con «Escribile si querés» | Handyx sugiere, vos decidís. Enviar no compromete a nadie |
| D2 | Mensajes | `/mensajes/` | 2.3 · 4.8 | vacío, sin leer; avatar con iniciales, estado del pedido (cotizando, trabajo agendado, cerrada), acceso a Contactos y al Centro de ayuda | Un hilo por pedido desde la primera cotización; continúa en el trabajo |
| D3 | Conversación | `/mensajes/hilo/?id=` | 2.3 · 4.8 | enviando, enviado, error con reintentar (sin duplicar), foto, presupuesto en el hilo; **respuestas rápidas** que completan el texto (nunca se mandan solas); **Agregar a contactos**; **Programar turno** (Tu precio, que vuelve al chat) o Cambiar el turno | Texto y fotos; presupuesto con monto/alcance/condiciones/horario y aceptación explícita de la otra parte. Sin teléfono del usuario (LEG-46) |
| E1 | Mis trabajos | `/trabajos/` | 2.4 | activos, historial, vacío | Junta trabajos e historial (PROD-06) |
| E2 | Trabajo (F-Trabajo) | `/trabajos/detalle/?id=` | 1.3 | los cuatro pasos (acordado, salir, llegué, terminé); dirección (solo porque el cliente aceptó); lo acordado y cómo te paga; Mensaje, Cambiar fecha, Modo trabajo (lote 2.3); en curso con cronómetro y adicionales; cambio pendiente; obra con su resumen; llamar por la app, ayuda y cancelar; **una** acción principal por estado; «Terminé» con confirmación → TR-Cobro | Acuerdo = snapshot; cambiarlo exige nueva propuesta aceptada |
| E2b | En camino (TR-EnCamino) | `/en-camino/?id=` | 1.3 | rumbo y destino arriba; llegada estimada tuya; «Lucía ve que vas en camino» solo durante el viaje; señal en texto; avisar demora (15 o 30 min, por el chat); dejar de compartir; **«Ya llegué»** solo con la ubicación mal o sin compartir; Google Maps y Waze | La llegada se marca sola al estar en la puerta (geocerca) |
| C1b | Tu recorrido (F-InicioRuta) | `/inicio/recorrido/` | 1.3 | paradas de hoy en orden con hora, tramo y desvío; subir y bajar con botones; «Salir para la parada N»; terminás a las… y los km del día y del mes | Reordenar no cambia el horario de ningún cliente; los tiempos son orientativos |
| E2c | ¿Cómo te pagó? (TR-Cobro) | `/trabajos/cobro/?id=` | 1.3 | efectivo, Mercado Pago o transferencia; todo o una parte; informado por vos ≠ verificado | El pago va directo al especialista; Handyx no cobra comisión |
| E2g | Modo trabajo (H0-Modo, H0-ModoHerramientas) | `/trabajos/modo/?id=` (`&hoja=herramientas`) | 2.3 | se abre al empezar; cronómetro con pausa (lo lleva el servidor con tramos); tareas grandes que empiezan por la seguridad, «Tarea lista», sumar una; Foto, Repuestos, Pedir ayuda, Agenda; herramientas a mano en una hoja; nota escrita o dictada; «Terminé el trabajo» con confirmación | Botones de 56 px o más para usar con guantes; sin cola offline |
| E2h | Pedir ayuda (H0-ModoAyuda) | `/trabajos/modo/ayuda/?id=` | 2.3 | contactos con su estado escrito (si lo comparten), escribirle, llamar por número puente, sumarlo al trabajo (invitación), buscar uno nuevo | Nadie ve el teléfono del otro; el reparto se acuerda aparte |
| E2i | Tu agenda desde el trabajo (H0-ModoAgenda) | `/trabajos/modo/agenda/?id=` | 2.3 | lo que sigue; «va N minutos más de lo previsto»; avisar 15 o 30 min de demora al próximo cliente; proponer otro horario | El aviso lo manda el especialista por el chat; nada se manda solo |
| E2j | Antes y después (H0-AntesDespues, H0-AntesLado) | `/trabajos/antes-despues/?id=` (`&vista=lado`) | 2.3 | deslizar (manija, teclado y botones) o lado a lado; sacar la foto del antes y del después; «qué cambiaste» escrito o dictado | Las fotos se achican y pierden la ubicación en el teléfono |
| E2k | Informe del trabajo (H0-Informe) | `/trabajos/informe/?id=` | 2.3 | secciones que se completan solas (causa, antes y después, pruebas, materiales y garantía, recomendaciones) y se corrigen; mandarlo con confirmación y recordatorio | Se manda al terminar; después no se cambia |
| E2l | Trabajo terminado (H0-InformeEnviado) | `/trabajos/informe/enviado/?id=` | 2.3 | conformidad (esperando, dada, con observaciones), garantía activa, recordatorio para vos, cobro informado o verificado, PDF y chat | La conformidad la da solo el cliente |
| E2c | Agregar al trabajo | `/trabajos/adicional/?id=` | 4.6 | "Opción personalizada" primero y lo habitual del rubro; tipo, qué es y precio; "hoy rige" y "si lo acepta"; errores con foco | Solo con el trabajo en curso. Lo acepta o rechaza el cliente; mientras tanto rige el precio vigente. Si no responde, al terminar se retira y no se cobra |
| E2d | Cambiar la fecha | `/trabajos/cambio/?id=` | 4.6 | motivo en chips, tira de días y franja; resumen; ya hay un cambio pendiente | Queda como pedido: el acuerdo no cambia hasta que el cliente acepte. El motivo lo ve el cliente |
| E2e | Cancelar el trabajo | `/trabajos/cancelar/?id=` | 4.6 | alternativas (cambiar la fecha, escribirle, pedir ayuda); motivo; "no me siento a salvo" con el 911; confirmación; en curso (lo cancela Operations) | Sin penalización automática |
| E2f | ¡Terminaste! | `/trabajos/terminado/?id=` | 4.6 · 4.7 | en una obra, **cierre**: lo cobrado (verificado, informado, falta) y cada etapa con sus adicionales y su cobro; monto que sube y confeti (solo si se vio terminar), desglose con adicionales y tarifa 0 %, cobro pendiente o reportado | Informar el cobro lo deja "reportado", nunca verificado. El pago va directo al especialista |
| E5 | Resumen de la obra | (dentro de `/trabajos/detalle/?id=` de una obra) | 4.7 | sin empezar, etapa en curso, todas terminadas; jornada de hoy o próxima; acordado, cobrado (verificado) y falta cobrar | Accesos al plan, las jornadas, el diario y los adicionales. Una obra se cierra desde el plan |
| E5a | Plan de obra | `/trabajos/obra/plan/?id=` | 4.7 | etapas en línea de tiempo (pendiente, en curso, terminada) con fechas de sus jornadas, importe, lo que incluye, adicionales y cobro; terminar una etapa (confirmación con desglose); cerrar la obra | Cada etapa se cobra por separado; informarlo la deja "reportado", nunca verificado |
| E5b | Jornadas | `/trabajos/obra/jornadas/?id=` | 4.7 | calendario del mes con los días marcados; jornadas hechas, de hoy, programadas, sin avance y con otro día pedido; hoja "Pedir otro día" (motivo, día y horario) | Es una solicitud: no cambia hasta que el cliente acepta y no mueve las demás |
| E5c | Diario de obra | `/trabajos/obra/diario/?id=` | 4.7 | avance de hoy (nota de 280 y hasta 4 fotos con vista previa local); avances anteriores con fotos; sin empezar | Lo ve el cliente de esa obra. Fotos del trabajo, sin personas ni documentos; nada queda en el navegador |
| D4 | Contactos | `/mensajes/contactos/` | 4.8 | vacío, con contactos; escribirle, sacarlo | Solo los agregados desde un chat (en el servidor, nada en el navegador). Sin números de teléfono; sacar uno no borra la conversación |
| E3 | Agenda | `/agenda/` | 2.4 · 4.8 | mes con marcas (una obra, jornada por jornada), lista del día, día vacío con un Handy, superposición con una oferta, cambio pendiente; **hoja con el detalle del turno** | Calendario propio; nada es turno confirmado sin aceptación de la otra parte |
| E4 | Centro de ayuda | `/soporte/` | 2.4 · 4.8 | **temas en pastillas con preguntas que se abren**; casos: abierto, en curso, esperando tu respuesta, resuelto, cerrado | Abrir desde el trabajo; adjuntos permitidos; sin plazos comerciales inventados |
| F1 | Caja | `/caja/` | 2.5 · 4.8 | **cobrado del mes** (verificado e informado aparte), totales por estado, **filtros por estado**, movimientos con **desglose que se abre**; pendiente, reportado, verificado, fallido, en discrepancia | Dinero del servicio va directo al especialista (MP o efectivo). **Sin saldo "disponible para retirar de Handy"** |
| F2 | Escenario post-demo (mock) | (en `/caja/`, rotulado) | 2.5 | deuda de comisión por efectivo, saldado | Solo escenario rotulado "política futura, no vigente"; nunca se cobra en el piloto |
| G1 | Cuenta | `/cuenta/` | 2.1 · 2.5 · 4.8 | perfil con iniciales y **sello verificado solo si lo dice el servidor**, rubros, **contador fee 0 % hasta el 10/12**, filas a datos, rubros y zonas, cobros, caja, alta, notificaciones, ayuda y privacidad; cerrar sesión |
| G1a | Datos personales | `/cuenta/datos/` | 4.8 | de solo lectura; DNI y CUIT con los últimos números; corregir solo con el alta en borrador o corrección | Un dato verificado se cambia con Operations para no perder la verificación |
| G1b | Cómo te paga el cliente | `/cuenta/cobros/` | 4.8 | Mercado Pago y efectivo (al menos uno); cuenta de Mercado Pago vinculada o no | El pago va directo al especialista. La vinculación es con Mercado Pago (fase 5): Handyx nunca pide la contraseña |
| G1c | Notificaciones | `/cuenta/notificaciones/` | 4.8 | urgentes, programados, mensajes y pagos; avisos del dispositivo (sin pedir, activados, rechazados, no disponibles) | La entrega del dispositivo no está garantizada; todo queda en Avisos |
| G1d | Privacidad y baja | `/cuenta/privacidad/` | 4.8 | quién ve qué, documentos, políticas, eliminar la cuenta | La baja es real (G2) | El contador es informativo: no anuncia tarifa posterior |
| G2 | Baja de cuenta | (desde Cuenta) | 2.1 | solicitada, en proceso, completada, completada con retención | Eliminación real con estado honesto; no es cerrar sesión |
| G3 | Modal fee de primer ingreso | (sobre Inicio) | 2.1 | vigente / último día | Se muestra hasta que el servidor registra el aviso aceptado (`fee_acceptances`) |
| Z1 | Sesión expirada / sin permiso / error | (transversal) | 2.x | 401 → volver a entrar; 403 sin detalle; red/timeout con reintentar | Nunca muestra datos de muestra en lugar de un error |

## 3. Datos del perfil y sensibilidad

| Dato | Para qué | Quién lo ve | Notas |
|---|---|---|---|
| Nombre y apellido | Identidad y perfil público (nombre público) | Usuario del hogar (nombre público, después de elegir), staff | |
| Fecha de nacimiento, nacionalidad, género | Perfil (PROD-15) | Solo staff autorizado | Base/finalidad a validar con el aviso aprobado antes de producción |
| Ubicación real | Cobertura | Solo servidor/staff | Al usuario solo barrio/zona |
| DNI | Identidad | Staff autorizado | Cifrado; retención LEG-39 (90 días cuando corresponda) |
| CUIT/CUIL | Requisito de alta | Staff autorizado | Cifrado. Capturar no habilita fiscalmente |
| Foto de cara | Verificación y perfil | Staff; usuario según perfil público aprobado | Almacenamiento privado, URL firmada |
| Matrícula/certificación | Gas y aire acondicionado | Staff | Estado de revisión; vencimiento |
| Antecedentes | Verificación presencial | — (solo el resultado) | **Ningún archivo.** Estado, fecha, método presencial y operador |

## 4. Escenarios de mock obligatorios (fase 2)

Registro incompleto · documento faltante · rubro habilitado vs no habilitado · verificación pendiente/corrección ·
antecedentes presenciales pendientes · disponible/revocado · pedido urgente con opt-in apagado · propuesta
vencida/rechazada · contrapropuesta · acuerdo · mensaje fallido · doble aceptación · programado/obra · reporte de
efectivo · pago MP pendiente/verificado/fallido · reclamo · baja · sesión expirada.

Hoy el mock cubre `habilitado`, `en_revision`, `sin_sesion`, opt-in urgente (on/off con filtro), conflicto de versión y
caída de red/servidor. El resto entra con cada lote de la fase 2.

## 5. Abiertos que afectan pantallas

1. **Precio de visita + precio del trabajo** (PROD-21 §0.3): el contrato v0.1 tiene un solo `monto` por propuesta con
   `alcance`. Si se confirman dos precios, se agrega `tipo: visita | trabajo` sin romper el contrato (minor 0.2.0).
2. **Finalización**: ¿el usuario confirma "terminado"? Hoy `en_curso → finalizado` lo hace el especialista (PENDIENTE).
3. **Reseñas y garantía de 30 días** (PROD-21): no están en el alcance explícito del Bloque 4; el reclamo sí. Se
   muestran en el perfil público si la app Usuario las implementa.
4. **"Llegué" sonoro** (PROD-11 opción A): en PWA no se garantiza sonido de llamada; queda como evento + aviso in-app
   y push opcional. Validación de Legal para urgencias (LEG-46) pendiente.
5. **Relanzamiento**: el especialista que dejó pasar un pedido no lo vuelve a recibir (PROD-21 §9, recomendado).
6. **Fin del fee 0 %**: inclusive el 10/12 (decisión de Ignacio) vs "cupones desde el 10/12". Parametrizado en `fee.ts`.

## 6. Estado al cierre de la fase 2 (mock navegable)

Todas las pantallas del mapa existen y se recorren con datos de prueba. **Ninguna está conectada a un backend.**
Escenarios y cómo reproducirlos: `docs/qa.md`.

| Pantallas | Archivo | Estado |
|---|---|---|
| A1 Entrar · A2 Crear cuenta · A3 Recuperar · A4 Fee post-registro | `src/pantallas/{Acceso,Registro,Recuperar}.tsx`, `components/FeeAvisoRegistro.tsx` | mock |
| B0–B8 Alta guiada y estados de revisión | `src/pantallas/Alta.tsx` + `src/pantallas/alta/*`, `components/{Camara,Documento}.tsx` | mock |
| C1 Inicio · C2 Disponibilidad · C3 Bandeja · C4 Avisos | `Inicio`, `Disponibilidad`, `Pedidos`, `Avisos` | mock |
| D1 Detalle de pedido y propuestas · D2 Mensajes · D3 Conversación | `PedidoDetalle`, `Mensajes`, `Hilo`, `TarjetaPropuesta`, `FormPropuesta` | mock |
| E1 Mis trabajos · E2 Detalle · E3 Agenda · E4 Ayuda y reclamos | `Trabajos`, `TrabajoDetalle`, `Agenda`, `Soporte`, `CasoDetalle`, `AccionTrabajo` (desde el 4.6 también `pantallas/trabajo/*`) | mock |
| F1 Caja · F2 Simulación post-demo | `Caja` | mock (la simulación existe solo en el mock) |
| G1 Cuenta · G2 Baja · G3 Modal del fee | `Cuenta`, `Baja`, `components/ModalFee.tsx` | mock |
| Z1 Sesión expirada, sin permiso, error | `app/contexto.tsx`, `components/Estados.tsx` | mock |

Decisiones tomadas al construirlas (todas reversibles):

- **El fee 0 % se avisa en tres lugares**: tras el registro (informativo), en el modal de primer ingreso a Inicio (se registra con
  `POST /v1/fee/aviso`) y como contador de días en Cuenta. Es la tarifa de Handy, no un descuento sobre tu precio.
- **Chat antes de contratar**: `POST /v1/especialista/pedidos/{id}/conversacion` abre el hilo sin comprometer nada.
- **Aceptar y rechazar piden confirmación** en una hoja con el resumen del acuerdo; la bandeja y los avisos solo abren el detalle.
- **"Llegué"** es un botón explícito del especialista; la ubicación del teléfono es opcional y no hay geocerca simulada.
- **Reportar un cobro** lo deja "reportado, sin verificar": solo un webhook validado u Operations lo verifica.
- **Baja**: cierra las sesiones y se ve el estado real al volver a entrar (`/baja/`); se cancela mientras esté "solicitada".
- **Cancelar un trabajo** avisa al usuario y no aplica penalización automática (PROD-21 §4, LEG-22).
