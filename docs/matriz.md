# Matriz pantalla · API · permiso · QA (lote 1.3)

Columna **Estado**: decidido · mock · conectado · probado · desplegado. Al cierre de la fase 1 todo está a lo sumo en
"decidido", salvo lo marcado como mock (adaptador en `src/data/mock`).

| Pantalla | Endpoints (v1) | Permiso | QA obligatorio | Estado |
|---|---|---|---|---|
| Puerta `/` | `GET /auth/sesion`, `GET /especialista/perfil` | sesión | sin sesión → acceso; alta no habilitada → alta; red caída → error + reintentar (sin fixtures) | mock |
| Acceso / registro / recuperar | `POST /auth/*` | público | respuesta neutra, bloqueo por intentos, términos versionados sin tildar | decidido |
| Alta (B1–B7) | `GET/PATCH /especialista/perfil`, `POST /especialista/documentos/{tipo}`, `POST /especialista/alta/envio` | especialista | cargado ≠ verificado; `verificado:true` rechazado; upload de antecedentes rechazado; corrección vuelve a enviada | decidido (contrato probado) |
| Modal fee / post-registro / contador | `GET /fee/vigente`, `POST /fee/aviso` | especialista | 0 bps; contador en días de Buenos Aires; terminada sin tarifa inferida | mock (contrato probado) |
| Inicio | perfil, disponibilidad, pedidos, trabajos, caja (resumen) | especialista | sin métricas de aceptación/puntualidad; estados vacío/carga/error | decidido |
| Disponibilidad | `GET/PUT /especialista/disponibilidad` | especialista | opt-out urgente deja de ofrecer urgencias; conflicto de versión | mock (probado en mock) |
| Bandeja | `GET /especialista/pedidos` | especialista habilitado | sin alta → vacía; rubro sin matrícula → no ve el pedido; solo datos mínimos; orden de llegada | mock (probado en mock) |
| Avisos | `GET /especialista/avisos` | especialista | urgente vs programado; abrir no acepta | decidido |
| Detalle + propuesta | `GET /especialista/pedidos/{id}`, `POST /especialista/propuestas`, `.../respuesta`, `.../retiro` | especialista elegible / contraparte | doble aceptación → 409; vencida no se contrata; reintento idempotente; id ajeno → 404 | decidido (reglas probadas) |
| Mensajes / hilo | `GET/POST /conversaciones/{id}/mensajes`, media firmada | participante | chat antes de contratar; reintento sin duplicar; foto ajena → 404 | decidido |
| Mis trabajos / detalle | `GET /especialista/trabajos`, `POST .../{id}/eventos` | parte del trabajo | transiciones válidas; "Llegué" explícito; acuerdo inmutable | decidido (máquina probada) |
| Agenda | `GET /especialista/agenda?desde&hasta` | especialista | zona horaria; fecha alternativa pendiente no reemplaza la vigente | decidido |
| Caja | `GET /especialista/caja`, `POST /especialista/pagos/{id}/reporte` | beneficiario | reportado ≠ verificado; sin saldo de Handy; fee 0 en demo | decidido (máquina probada) |
| Soporte | `GET/POST /soporte/casos`, `.../{id}/mensajes` | propio | caso ajeno → 404; adjuntos limitados | decidido |
| Cuenta / baja | `POST /cuenta/baja`, `GET /cuenta/baja` | especialista | revoca sesiones; estado honesto | decidido |

Transversal: sesión expirada (401 → acceso), sin permiso (403), sin red/timeout (reintentar), contrato roto (error,
nunca datos de muestra), `prefers-reduced-motion`, teclado/foco, 320–480 px y iPad.
