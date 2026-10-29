# Autenticación y permisos · Especialista (diseño fase 1)

Estado: **decidido para implementar en 4.2**. Nada implementado en backend.

## Cuentas y sesión

- Identidad compartida con la app Usuario (`accounts` + `account_roles`): una persona puede tener los dos roles sin
  duplicar cuenta. Credenciales separadas del perfil.
- Login con email (o WhatsApp normalizado, a confirmar con Legal y Product) y contraseña **Argon2id**, como el
  backend de captación. Sin OTP/SMS contratado y sin proveedores pagos nuevos.
- Sesión: cookie **host-only, HttpOnly, Secure, SameSite=Lax** emitida por `api-especialista`; registro en
  `sessions` (expirable y revocable, token guardado como hash). Refresh rotativo con detección de reutilización.
- **CSRF**: token en el cuerpo de `GET /v1/auth/sesion`, guardado solo en memoria; `X-CSRF-Token` en toda mutación.
  `Origin` exacto + CORS con la lista cerrada de orígenes de la PWA.
- Nada en `localStorage`, `sessionStorage`, IndexedDB ni en la URL. Nada de JWT en JSON.
- Baja de cuenta o revocación → se revocan todas las sesiones.
- Rate limit y bloqueo progresivo en login y recuperación; respuestas neutras.
- Personal interno: el mecanismo admin vigente (`ADMIN_ACCOUNTS_JSON`); no se registra como especialista.

## Reglas de autorización (servidor)

1. **Rol**: toda ruta `/v1/especialista/*` exige el rol `especialista`.
2. **Propiedad**: cada recurso se busca con el especialista de la sesión en el `WHERE`
   (`... AND specialist_id = :sesion`). Un id ajeno responde `404 no_encontrado`, igual que uno inexistente.
3. **Estado del alta**: sin `habilitada`, la bandeja está vacía y no se pueden enviar propuestas
   (`403 sin_permiso`).
4. **Elegibilidad**: rubro habilitado (matrícula verificada cuando aplica), zona cubierta, `urgentesAhora` para
   urgentes, `programados` para programados/obras, y no haber dejado pasar ese pedido antes.
5. **Contraparte**: aceptar o rechazar solo propuestas cuyo autor es el usuario del pedido; retirar solo las propias.
6. **Etapa**: dirección exacta y nombre del usuario solo con trabajo acordado y solo para esas partes.
7. **Campos de servidor**: `verificado`, `estadoAlta`, `venceEn`, fee y montos derivados nunca se aceptan del cliente
   (los esquemas estrictos rechazan campos extra con `400 validacion`).
8. **Uploads**: tipos y tamaños limitados (imágenes); cualquier tipo "antecedentes" o PDF de antecedentes →
   `415/400 tipo_archivo_prohibido`.

## Matriz de permisos por endpoint

| Endpoint (v1) | Rol | Condición adicional |
|---|---|---|
| `POST /auth/registro`, `/auth/ingreso`, `/auth/recuperar` | público | rate limit, respuesta neutra |
| `GET /auth/sesion` | cualquiera | 401 → sin sesión |
| `POST /auth/salida` | sesión | CSRF |
| `GET/PATCH /especialista/perfil` | especialista | solo el propio; PATCH no toca estados |
| `POST /especialista/documentos/{tipo}` | especialista | tipo ∈ dni, cuit_cuil, foto_cara, matricula; nunca antecedentes |
| `POST /especialista/alta/envio` | especialista | `borrador | requiere_correccion` |
| `GET/PUT /especialista/disponibilidad` | especialista | `version` vigente |
| `GET /especialista/pedidos`, `GET /especialista/pedidos/{id}` | especialista | habilitada + elegible |
| `POST /especialista/propuestas` | especialista | elegible, pedido `buscando`, Idempotency-Key |
| `POST /especialista/propuestas/{id}/respuesta` | especialista | contraparte, pendiente, vigente, `version` |
| `POST /especialista/propuestas/{id}/retiro` | especialista | autor, pendiente |
| `GET /especialista/trabajos`, `GET .../{id}`, `POST .../{id}/eventos` | especialista | parte del trabajo; transición válida |
| `GET/POST /conversaciones/{id}/mensajes` | especialista | participante |
| `GET /especialista/caja`, `POST /especialista/pagos/{id}/reporte` | especialista | beneficiario del pago |
| `GET/POST /soporte/casos` | especialista | propios |
| `GET /fee/vigente`, `POST /fee/aviso` | especialista | — |
| `POST /cuenta/baja` | especialista | CSRF + reautenticación |

Contrato detallado: `docs/api/openapi.yaml`.
