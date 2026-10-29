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
| A1 | Entrar | `/acceso/` | 2.1 | vacío, error de credenciales, bloqueo por intentos, sin red | Sin OTP/SMS. Mensaje genérico ante credenciales inválidas |
| A2 | Crear cuenta | `/registro/` | 2.1 | validación de campos, cuenta existente (respuesta neutra) | Términos y privacidad versionados con aceptación explícita (sin tildar) |
| A3 | Recuperar acceso | `/recuperar/` | 2.1 | enviado (respuesta neutra), token vencido | No revela si la cuenta existe |
| A4 | Fee 0 % post-registro | (paso de `/registro/`) | 2.1 | antes / vigente / último día | "Handy no te cobra tarifa hasta el 10/12/2026". No es descuento sobre tu precio |
| B1 | Alta · datos base | `/alta/?paso=datos` | 2.1 | incompleto, guardado, error | Nombre, apellido, fecha de nacimiento, nacionalidad, ubicación real, género (PROD-15). Sin campos comerciales obligatorios |
| B2 | Alta · identidad | `/alta/?paso=identidad` | 2.1 | faltante, cargado, en revisión, rechazado con motivo | DNI y CUIT/CUIL. CUIL no equivale a habilitación fiscal: queda capturado pero no habilita si Legal exige CUIT |
| B3 | Alta · rubros y matrícula | `/alta/?paso=rubros` | 2.1 | por rubro: habilitado, requiere matrícula, en revisión, no habilitado | Gas y aire acondicionado exigen matrícula/certificación revisada. Una foto no autoverifica |
| B4 | Alta · foto de cara | `/alta/?paso=foto` | 2.1 | faltante, cargada, en revisión, rechazada | Almacenamiento privado; solo staff autorizado |
| B5 | Alta · antecedentes | `/alta/?paso=antecedentes` | 2.1 | pendiente de cita, cita coordinada, aprobada, no aprobada, no asistió | **Sin upload**: se explica que se verifican en persona con Operations y cómo coordinar. No hay input de archivo |
| B6 | Alta · resumen y envío | `/alta/?paso=resumen` | 2.1 | qué falta (sin exponer el contenido del documento), enviado | Enviar pasa `borrador → enviada`. Guardar y reanudar |
| B7 | Estado de revisión | `/alta/` (con alta enviada) | 2.1 | enviada, en revisión, requiere corrección (motivo seguro), rechazada, habilitada | Próximos pasos reales; sello "verificado" solo si el servidor lo dice |
| C1 | Inicio | `/inicio/` | 2.2 | sin alta habilitada, disponible/no disponible, ofertas abiertas, próximo trabajo, cobrado del mes y trabajos cobrados | **Nunca** tasa de aceptación, tiempos de respuesta ni puntualidad (PROD-06 §3). Inicio ≠ Mis trabajos |
| C2 | Disponibilidad | (hoja desde Inicio y Cuenta) | 2.2 | urgentes "Ahora" on/off, programados on/off, franjas, zonas | Opt-in revocable al instante; revocar no penaliza. No se deduce de tener la app abierta |
| C3 | Bandeja de pedidos | `/pedidos/` | 2.2 | vacía, urgentes vs programados/obra, con mi propuesta enviada, vencidos | Orden de llegada. Datos mínimos: rubro, tipo, descripción, barrio/zona aproximada y **cuánto cobra Handy** (0 % en demo, LEG-43). Sin nombre ni dirección exacta |
| C4 | Avisos | `/notificaciones/` | 2.2 | urgente vs programado (distinto visual y texto), leído/no leído | El aviso abre el detalle; **nunca acepta**. Push opcional; sin prometer sonido de llamada en web |
| D1 | Detalle de pedido y propuesta | `/pedidos/detalle/?id=` | 2.3 | buscando, ventana restante (del servidor), mi propuesta pendiente/vencida/rechazada/reemplazada, aceptada | Ofrecer precio/horario/alcance, contraofertar, retirar o no responder. Vigencia 5 min en urgentes ≠ ventana 20 min |
| D2 | Mensajes | `/mensajes/` | 2.3 | vacío, sin leer | Un hilo por pedido desde la primera cotización; continúa en el trabajo |
| D3 | Conversación | `/mensajes/hilo/?id=` | 2.3 | enviando, enviado, error con reintentar (sin duplicar), foto, presupuesto estructurado | Texto y fotos; presupuesto con monto/alcance/condiciones/horario y aceptación explícita de la otra parte. Sin teléfono del usuario (LEG-46) |
| E1 | Mis trabajos | `/trabajos/` | 2.4 | activos, historial, vacío | Junta trabajos e historial (PROD-06) |
| E2 | Detalle del trabajo | `/trabajos/detalle/?id=` | 2.4 | agendado, en camino, en sitio ("Llegué"), en curso, finalizado, cancelado; cambio de acuerdo pendiente | Acuerdo = snapshot; cambiarlo exige nueva propuesta aceptada. Dirección exacta solo acá y solo para las partes |
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
| B1–B7 Alta por pasos y estados de revisión | `src/pantallas/Alta.tsx`, `components/Documento.tsx` | mock |
| C1 Inicio · C2 Disponibilidad · C3 Bandeja · C4 Avisos | `Inicio`, `Disponibilidad`, `Pedidos`, `Avisos` | mock |
| D1 Detalle de pedido y propuestas · D2 Mensajes · D3 Conversación | `PedidoDetalle`, `Mensajes`, `Hilo`, `TarjetaPropuesta`, `FormPropuesta` | mock |
| E1 Mis trabajos · E2 Detalle · E3 Agenda · E4 Ayuda y reclamos | `Trabajos`, `TrabajoDetalle`, `Agenda`, `Soporte`, `CasoDetalle`, `AccionTrabajo`, `FormCambio` | mock |
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
