# Capturas sanitizadas · PWA Especialista (lote 3.3)

Generadas con `npm run build && npm run capturas:docs` (`scripts/capturas-docs.sh`). Datos **sintéticos** del mock, nunca de
producción. `e2e/capturas.cjs` rechaza la captura si aparece un email que no sea `@example.test`, un DNI/CUIT que no sea de
prueba, un teléfono o si falta el banner "Datos de prueba" (salvo en las dos pantallas sin datos de la cuenta).

Celular 390×844 en `390x844/` (las 32) y escritorio 1280×800 en `1280x800/` (inicio, pedido, trabajo, agenda, caja y cuenta).

| Pantalla | Ruta | Escenario |
|---|---|---|
| [acceso](390x844/acceso.webp) | `/acceso/` | `nuevo` |
| [registro](390x844/registro.webp) | `/registro/` | `nuevo` |
| [recuperar](390x844/recuperar.webp) | `/recuperar/` | `nuevo` |
| [alta-borrador](390x844/alta-borrador.webp) | `/alta/` | `incompleto` |
| [alta-en-revision](390x844/alta-en-revision.webp) | `/alta/` | `en_revision` |
| [alta-correccion](390x844/alta-correccion.webp) | `/alta/` | `correccion` |
| [alta-rechazada](390x844/alta-rechazada.webp) | `/alta/` | `rechazado` |
| [alta-habilitada](390x844/alta-habilitada.webp) | `/alta/` | `habilitado` |
| [inicio-sin-habilitar](390x844/inicio-sin-habilitar.webp) | `/inicio/` | `en_revision` |
| [inicio](390x844/inicio.webp) | `/inicio/` | `habilitado` |
| [disponibilidad](390x844/disponibilidad.webp) | `/disponibilidad/` | `habilitado` |
| [pedidos](390x844/pedidos.webp) | `/pedidos/` | `habilitado` |
| [avisos](390x844/avisos.webp) | `/notificaciones/` | `habilitado` |
| [mensajes](390x844/mensajes.webp) | `/mensajes/` | `habilitado` |
| [trabajos](390x844/trabajos.webp) | `/trabajos/` | `habilitado` |
| [agenda](390x844/agenda.webp) | `/agenda/` | `habilitado` |
| [caja](390x844/caja.webp) | `/caja/` | `habilitado` |
| [soporte](390x844/soporte.webp) | `/soporte/` | `habilitado` |
| [cuenta](390x844/cuenta.webp) | `/cuenta/` | `habilitado` |
| [baja](390x844/baja.webp) | `/baja/` | `baja` |
| [error-red](390x844/error-red.webp) | `/pedidos/?falla=red` | `habilitado` |
| [error-servidor](390x844/error-servidor.webp) | `/caja/?falla=servidor` | `habilitado` |
| [sin-conexion](390x844/sin-conexion.webp) | `/sin-conexion/` | `habilitado` |
| [no-encontrada](390x844/no-encontrada.webp) | `/no-existe/` | `habilitado` |
