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
| A0 | Carga y bienvenida | `/` · `/bienvenida/` | 4.2 | carga animada (se saltea tocando; quieta con "reducir movimiento"); 3 láminas; crear cuenta o entrar | La carga solo al abrir la app. Las láminas no prometen nada fuera de las reglas: precio propio, pago directo, fee 0 % hasta el 10/12 |
| A1 | Entrar | `/acceso/` (`?motivo=sesion`: "Hola de nuevo") | 4.2 | vacío, error de credenciales, bloqueo por intentos, sin red; Google; Apple solo en dispositivos Apple | Sin SMS. Mensaje genérico ante credenciales inválidas (y sin el aviso de sesión vencida) |
| A2 | Crear cuenta | `/registro/` | 4.2 | 3 pasos (email, contraseña con medidor, aceptaciones); cuenta existente (respuesta neutra) | Términos y privacidad versionados con aceptación explícita (sin tildar) |
| A2b | Verificar el email | `/verificar/` | 4.2 | código incorrecto (intentos que quedan), vencido, bloqueado, reenvío con espera, cambiar el email; cuenta creada | Código de 6 dígitos que no viaja al cliente; hasta verificar no se usa el resto |
| A2c | Un paso más | `/registro/aceptar/` | 4.2 | cuenta nueva de Google o Apple | Email ya verificado por el proveedor; aceptaciones sin tildar |
| A3 | Recuperar acceso | `/recuperar/` · `/recuperar/nueva/?token=` | 4.2 | enviado (respuesta neutra), contraseña nueva, cambiada, enlace vencido o usado | No revela si la cuenta existe; el token sale de la URL al leerlo |
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
| C1 | Inicio | `/inicio/` | 2.2 · 4.5 | sin alta habilitada; bloque azul con interruptor grande "Disponible" (urgentes Ahora); mapa con tus zonas y las zonas aproximadas de los pedidos abiertos; hoja con programados, "Pedidos para vos", tu próximo trabajo y cobrado del mes; **pedido entrante** (hoja con rubro, zona, descripción y vigencia neutra: "Ver y cotizar" / "Ahora no") | **Nunca** tasa de aceptación, tiempos de respuesta ni puntualidad (PROD-06 §3). Inicio ≠ Mis trabajos |
| C2 | Disponibilidad | (hoja desde Inicio y Cuenta) | 2.2 | urgentes "Ahora" on/off, programados on/off, franjas, zonas | Opt-in revocable al instante; revocar no penaliza. No se deduce de tener la app abierta |
| C3 | Bandeja de pedidos | `/pedidos/` | 2.2 · 4.5 | vacía, filtros en chips (Todos, Urgentes, Programados, Obras) con cantidades, urgentes apagados, sin zonas, con mi propuesta enviada, vencidos | Orden por llegada o "Más cerca" (una lectura de la ubicación, calculada en el teléfono y nunca enviada). Datos mínimos: rubro, tipo, descripción, barrio/zona aproximada y **cuánto cobra Handy** (0 % en demo, LEG-43). Sin nombre ni dirección exacta |
| C4 | Avisos | `/notificaciones/` | 2.2 · 4.5 | agrupados en Nuevos / Antes, urgente vs programado, ¡te eligieron!, deslizar o botón para borrar, "Borrar todos" con confirmación, vacío | El aviso abre el detalle; **nunca acepta**. Push opcional; sin prometer sonido de llamada en web |
| D1 | Detalle de pedido y propuesta | `/pedidos/detalle/?id=` | 2.3 · 4.3 · 4.5 | zona aproximada en el mapa (círculo, sin pin); buscando, ventana restante (del servidor); "Poner mi precio · Handyx sugiere"; **Esperando al cliente**; **¡El cliente te eligió!** (abre el trabajo); "Esta vez no" / venció / retirada en gris, sin culpa | Ofrecer precio/horario/alcance, contraofertar, retirar o no responder. Vigencia 5 min en urgentes ≠ ventana 20 min |
| D1b | Tu precio | `/pedidos/propuesta/?id=` (`&base=` en una contraoferta) | 4.5 | cuándo podés ir (chips u otro día y horario), stepper "Handyx sugiere $ X · Vos decidís" con atajos, qué incluye, "Recibís" con fee 0 %, errores con foco | Pantalla completa. La sugerencia es una referencia con su fuente; el precio lo pone el especialista. Nada se manda sin "Enviar propuesta" |
| D2 | Mensajes | `/mensajes/` | 2.3 | vacío, sin leer | Un hilo por pedido desde la primera cotización; continúa en el trabajo |
| D3 | Conversación | `/mensajes/hilo/?id=` | 2.3 | enviando, enviado, error con reintentar (sin duplicar), foto, presupuesto estructurado | Texto y fotos; presupuesto con monto/alcance/condiciones/horario y aceptación explícita de la otra parte. Sin teléfono del usuario (LEG-46) |
| E1 | Mis trabajos | `/trabajos/` | 2.4 | activos, historial, vacío | Junta trabajos e historial (PROD-06) |
| E2 | Trabajo acordado | `/trabajos/detalle/?id=` | 2.4 · 4.3 · 4.6 | agendado ("Salgo para allá"), en camino (abrir el viaje), en el lugar (cómo se marcó la llegada), **en curso con cronómetro y adicionales** (esperando, aceptado, no lo aceptó, retirado), finalizado, cancelado; cambio pendiente; **cómo llegar**; chat y **llamada por la app** (número puente, sin mostrar teléfonos) | Acuerdo = snapshot; cambiarlo exige nueva propuesta aceptada. Dirección y punto exactos solo acá y solo para las partes |
| E2b | En camino | `/en-camino/?id=` | 4.3 · 4.6 | todavía no saliste; explicación antes de pedir el permiso; compartiendo (señal precisa, imprecisa, sin señal); sin permiso o sin GPS; sin trayecto (Google Maps o Waze); en pausa; **llegada automática** (geocerca: abre el trabajo); **"Ya llegué"** solo con la ubicación mal o sin compartir | Pantalla completa con el mapa. La ubicación se comparte solo si la persona lo elige, con la pantalla abierta, con el cliente de ese trabajo y hasta llegar (`docs/mapa.md`) |
| E2c | Agregar al trabajo | `/trabajos/adicional/?id=` | 4.6 | "Opción personalizada" primero y lo habitual del rubro; tipo, qué es y precio; "hoy rige" y "si lo acepta"; errores con foco | Solo con el trabajo en curso. Lo acepta o rechaza el cliente; mientras tanto rige el precio vigente. Si no responde, al terminar se retira y no se cobra |
| E2d | Cambiar la fecha | `/trabajos/cambio/?id=` | 4.6 | motivo en chips, tira de días y franja; resumen; ya hay un cambio pendiente | Queda como pedido: el acuerdo no cambia hasta que el cliente acepte. El motivo lo ve el cliente |
| E2e | Cancelar el trabajo | `/trabajos/cancelar/?id=` | 4.6 | alternativas (cambiar la fecha, escribirle, pedir ayuda); motivo; "no me siento a salvo" con el 911; confirmación; en curso (lo cancela Operations) | Sin penalización automática |
| E2f | ¡Terminaste! | `/trabajos/terminado/?id=` | 4.6 | monto que sube y confeti (solo si se vio terminar), desglose con adicionales y tarifa 0 %, cobro pendiente o reportado | Informar el cobro lo deja "reportado", nunca verificado. El pago va directo al especialista |
| E3 | Agenda | `/agenda/` | 2.4 | día vacío, trabajos del día, superposición con una oferta, fecha alternativa pendiente | Calendario propio; nada es turno confirmado sin aceptación de la otra parte |
| E4 | Ayuda y reclamos | `/soporte/` | 2.4 | abierto, en curso, esperando tu respuesta, resuelto, cerrado | Abrir desde el trabajo; adjuntos permitidos; sin plazos comerciales inventados |
| F1 | Caja | `/caja/` | 2.5 | pendiente, reportado, verificado, fallido, en discrepancia; desglose con fee 0 % | Dinero del servicio va directo al especialista (MP o efectivo). **Sin saldo "disponible para retirar de Handy"** |
| F2 | Escenario post-demo (mock) | (en `/caja/`, rotulado) | 2.5 | deuda de comisión por efectivo, saldado | Solo escenario rotulado "política futura, no vigente"; nunca se cobra en el piloto |
| G1 | Cuenta | `/cuenta/` | 2.1/2.5 | estado de documentos, **contador fee 0 % hasta el 10/12**, preferencias, privacidad, sesión | El contador es informativo: no anuncia tarifa posterior |
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
