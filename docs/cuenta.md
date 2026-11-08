# Cuenta, seguridad, avisos y ayuda (lote 1.4)

Pantallas de `design/deluxe/`: F-Cuenta, CU-Perfil, CU-Datos, CU-Disponibilidad, CU-Cobros, CU-Notificaciones,
CU-Privacidad, D6-Seguridad, D6-TOTP, D6-Avisos y D6-Ayuda. Recorrido `RC-Cuenta` (`e2e/recorridos/RC-Cuenta.cjs`).
Piezas del kit en `src/ui/` (ver `docs/componentes.md`, «Cuenta, seguridad, avisos y ayuda»).

## Pantallas y rutas

| Pantalla | Ruta | Archivo | Endpoints (`/v1/especialista` salvo `/v1/…`) |
|---|---|---|---|
| F-Cuenta | `/cuenta/` | `pantallas/Cuenta.tsx` | `GET /perfil/propio` · `GET /caja/resumen` · `GET/PUT /v1/cuenta/preferencias` · `POST /v1/auth/salida` |
| CU-Perfil | `/cuenta/perfil/` | `pantallas/cuenta/PerfilCuenta.tsx` | `GET /perfil/propio` · `PUT /perfil/presentacion` · `POST /perfil/foto` |
| CU-Datos | `/cuenta/datos/` | `pantallas/cuenta/DatosPersonales.tsx` | `GET /registro` |
| CU-Disponibilidad | `/disponibilidad/` | `pantallas/Disponibilidad.tsx` | `GET/PUT /disponibilidad` |
| CU-Cobros | `/cuenta/cobros/` | `pantallas/cuenta/CobrosCuenta.tsx` | `GET/PUT /cobros` (con `transferencia`) |
| CU-Notificaciones | `/cuenta/notificaciones/` | `pantallas/cuenta/NotificacionesCuenta.tsx` | `GET/PUT /v1/cuenta/preferencias` · `POST /v1/cuenta/push` |
| CU-Privacidad | `/cuenta/privacidad/` | `pantallas/cuenta/PrivacidadCuenta.tsx` | `GET/POST /privacidad/exportacion` · `GET/POST/DELETE /v1/cuenta/baja` · `GET /seguridad` |
| D6-Seguridad | `/cuenta/seguridad/` | `pantallas/cuenta/SeguridadCuenta.tsx` | `GET /seguridad` · `PUT /seguridad/segunda-verificacion` · `POST /seguridad/codigos-respaldo` · `DELETE /seguridad/dispositivos/{id}` |
| D6-TOTP | `/cuenta/seguridad/app/` | `pantallas/cuenta/TotpCuenta.tsx` | `POST /seguridad/totp` · `POST /seguridad/totp/confirmacion` |
| D6-Avisos | `/notificaciones/` | `pantallas/Avisos.tsx` | `GET /bandeja` · `POST /bandeja/{id}/leido` · `DELETE /bandeja/{id}` · `DELETE /bandeja` |
| D6-Ayuda | `/soporte/` | `pantallas/Soporte.tsx` | `GET /v1/soporte/casos` (solo para contar los abiertos); las preguntas son contenido de la app (`lib/ayuda.ts`) |
| Tus casos | `/soporte/casos/` | `pantallas/CasosSoporte.tsx` | `GET/POST /v1/soporte/casos` · `GET /trabajos` |

Los links viejos `/soporte/?trabajo=<id>` pasan solos a `/soporte/casos/?trabajo=<id>` (abre el formulario).

## Reglas que cumplen estas pantallas

- Los datos sensibles salen solo con los últimos números (`dni.ultimos`); el domicilio ni se muestra («Solo vos»).
- El sello «Verificado por Handyx» solo con `verificado` del servidor; cargar ≠ verificar.
- Cambios sensibles (apagar la segunda verificación, códigos de respaldo nuevos, descargar los datos) piden contraseña o
  un código de la app; con `useAccion({ publica: true })` para que una contraseña equivocada (400 o 401) no abra el aviso
  de «sesión expirada».
- La clave del QR y los 10 códigos de respaldo se ven una vez y viven solo en la memoria de la pantalla (nada en
  `localStorage`, `sessionStorage`, cookies ni IndexedDB; el recorrido lo comprueba).
- SMS: `disponible: false` sin proveedor autorizado → «Todavía no disponible» (el servidor responde 503).
- Un aviso abre su detalle y nunca acepta nada; cada aviso tiene su botón «Quitar» (no hace falta deslizar) y «Borrar
  todos» pide confirmación.
- «Letra más grande»: `preferencias.letraGrande` (en el servidor). `LetraGrande` (en el layout de `(app)`) la lee al abrir
  la app y pone `data-letra="grande"` en `<html>`: la base pasa a 125 % y todo el kit, que mide en rem, la sigue.
- Handyx no le cobra comisión al especialista: «Medios de cobro» lo dice y no hay ninguna tarifa en estas pantallas.

## Pendientes para el cierre de la ola 1

- **Contrato (lote 1.5):** `letraGrande: boolean` (opcional) en `Preferencias`. Hasta entonces `data/api/cuenta.ts`
  (`PreferenciasCuenta`) y `data/http/cuenta.ts` (`.extend`) lo suman por su cuenta.
- **Layout:** `MarcoApp` (cabecera vieja) y los paddings de `.app-cuerpo` / `.fl-cuerpo` se suman a los de las plantillas del
  kit v3; las pantallas de este lote quedan con márgenes dobles hasta que el cierre unifique el marco.
- `/disponibilidad/` y `/notificaciones/` están en la pestaña Inicio de `rutas/navegacion.ts`; Cuenta enlaza a las dos.
- `VigiaAvisos` todavía usa `GET /avisos` (obsoleto hasta 1.0.0): pasarlo a la bandeja.
- F-Cuenta muestra los mosaicos de cobros y taller; ingresos, camino, presupuestos, equipamiento y ferretería llegan con
  los lotes 2.x y 3.x que traen sus datos.
- `CasoDetalle` (`/soporte/detalle/`) sigue con el kit v2.
