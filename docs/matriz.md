# Matriz pantalla · API · permiso · QA (lote 1.3)

Columna **Estado**: decidido · mock · conectado · probado · desplegado. **Al cierre de la fase 2 las pantallas están en "mock" y
probadas con pruebas del mock y recorridos E2E (`docs/qa.md`); nada está conectado ni desplegado.** Las rutas de la API son las de
`docs/api/openapi.yaml` v0.2.0.

| Pantalla | Endpoints (v1) | Permiso | QA obligatorio | Estado |
|---|---|---|---|---|
| Puerta `/` | `GET /auth/sesion`, `GET /especialista/perfil` | sesión | sin sesión → acceso; alta no habilitada → alta; red caída → error + reintentar (sin fixtures) | mock + E2E |
| Acceso / registro / recuperar | `POST /auth/*` | público | respuesta neutra, bloqueo por intentos, términos versionados sin tildar | mock + E2E |
| Alta (B1–B7) | `GET /especialista/perfil`, `GET/PUT /especialista/alta/datos`, `PUT /especialista/rubros`, `POST /especialista/documentos/{tipo}`, `POST /especialista/alta/envio` | especialista | cargado ≠ verificado; `verificado:true` rechazado; upload de antecedentes rechazado; corrección vuelve a enviada | mock + E2E |
| Modal fee / post-registro / contador | `GET /fee/vigente`, `POST /fee/aviso` | especialista | 0 bps; contador en días de Buenos Aires; terminada sin tarifa inferida | mock + E2E |
| Inicio | `GET /especialista/inicio`, disponibilidad, pedidos | especialista | sin métricas de aceptación/puntualidad; estados vacío/carga/error | mock + E2E |
| Disponibilidad | `GET/PUT /especialista/disponibilidad` | especialista | opt-out urgente deja de ofrecer urgencias; conflicto de versión | mock + E2E |
| Bandeja | `GET /especialista/pedidos` | especialista habilitado | sin alta → vacía; rubro sin matrícula → no ve el pedido; solo datos mínimos; orden de llegada | mock + E2E |
| Avisos | `GET /especialista/avisos` | especialista | urgente vs programado; abrir no acepta | mock + E2E |
| Detalle + propuesta | `GET /especialista/pedidos/{id}`, `POST /especialista/propuestas`, `.../respuesta`, `.../retiro` | especialista elegible / contraparte | doble aceptación → 409; vencida no se contrata; reintento idempotente; id ajeno → 404 | mock + E2E |
| Mensajes / hilo | `GET /conversaciones`, `POST /especialista/pedidos/{id}/conversacion`, `GET/POST /conversaciones/{id}/mensajes`, `GET /conversaciones/{id}/propuestas`, media firmada | participante | chat antes de contratar; reintento sin duplicar; foto ajena → 404 | mock + E2E |
| Mis trabajos / detalle | `GET /especialista/trabajos`, `GET .../{id}`, `POST .../{id}/eventos`, `POST .../{id}/cambio` | parte del trabajo | transiciones válidas; "Llegué" explícito; acuerdo inmutable | mock + E2E |
| Agenda | `GET /especialista/agenda?desde&hasta` | especialista | zona horaria; fecha alternativa pendiente no reemplaza la vigente | mock + E2E |
| Caja | `GET /especialista/caja[/resumen]`, `POST /especialista/pagos/{id}/reporte` y `/discrepancia` | beneficiario | reportado ≠ verificado; sin saldo de Handy; fee 0 en demo | mock + E2E |
| Soporte | `GET/POST /soporte/casos`, `GET /soporte/casos/{id}`, `POST .../{id}/mensajes` | propio | caso ajeno → 404; adjuntos limitados | mock + E2E |
| Cuenta / baja | `POST/GET/DELETE /cuenta/baja`, `GET/PUT /cuenta/preferencias`, `POST /cuenta/push` | especialista | revoca sesiones; estado honesto | mock + E2E |

Transversal: sesión expirada (401 → acceso), sin permiso (403), sin red/timeout (reintentar), contrato roto (error,
nunca datos de muestra), `prefers-reduced-motion`, teclado/foco, 320–480 px y iPad.
