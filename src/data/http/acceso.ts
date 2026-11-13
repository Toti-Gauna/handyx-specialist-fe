import { EstadoTokenSchema, ResultadoProveedorSchema, SesionSchema, VerificacionEmailSchema } from '../../contracts/dto.ts';
import { CodigoEnviadoSchema, ResultadoIngresoSchema, type ResultadoIngreso } from '../../contracts/seguridad.ts';
import type { ApiAcceso } from '../api/acceso.ts';
import type { ClienteHttp } from './cliente.ts';
import { Nada } from './comun.ts';

// El CSRF vive solo en memoria del cliente: cada respuesta con sesión lo renueva y salir lo olvida.
export const accesoHttp = (c: ClienteHttp): ApiAcceso => ({
  async sesion() {
    const s = await c.pedir('GET', '/v1/auth/sesion', SesionSchema.nullable(), { nuloSi401: true });
    c.recordarCsrf(s?.csrfToken ?? null);
    return s;
  },
  async ingresar(datos) {
    const s = await c.pedir('POST', '/v1/auth/ingreso', SesionSchema, { cuerpo: datos });
    c.recordarCsrf(s.csrfToken);
    return s;
  },
  async registrar(datos) {
    await c.pedir('POST', '/v1/auth/registro', Nada, { cuerpo: datos });
  },
  async recuperar(email) {
    await c.pedir('POST', '/v1/auth/recuperar', Nada, { cuerpo: { email } });
  },
  async salir() {
    await c.pedir('POST', '/v1/auth/salida', Nada);
    c.recordarCsrf(null);
  },

  estadoVerificacion: () => c.pedir('GET', '/v1/auth/verificacion', VerificacionEmailSchema),
  reenviarCodigo: () => c.pedir('POST', '/v1/auth/verificacion/reenvio', VerificacionEmailSchema),
  async verificarEmail(datos) {
    const s = await c.pedir('POST', '/v1/auth/verificacion', SesionSchema, { cuerpo: datos });
    c.recordarCsrf(s.csrfToken);
    return s;
  },
  async ingresarConProveedor(datos) {
    const r = await c.pedir('POST', '/v1/auth/proveedor', ResultadoProveedorSchema, { cuerpo: datos });
    c.recordarCsrf(r.sesion.csrfToken);
    return r;
  },
  async aceptarTerminos(datos) {
    await c.pedir('POST', '/v1/auth/aceptaciones', Nada, { cuerpo: datos });
  },
  estadoRecuperacion: (token) => c.pedir('POST', '/v1/auth/recuperacion/estado', EstadoTokenSchema, { cuerpo: { token } }),
  async restablecer(datos) {
    await c.pedir('POST', '/v1/auth/recuperacion/nueva', Nada, { cuerpo: datos });
    c.recordarCsrf(null);
  },

  // ── Contrato 0.11.0 (lote 1.1) ──
  async ingresarConClave(datos) {
    return recordar(c, await c.pedir('POST', '/v1/auth/ingreso/clave', ResultadoIngresoSchema, { cuerpo: datos }));
  },
  pedirCodigoIngreso: (datos) => c.pedir('POST', '/v1/auth/ingreso/codigo', CodigoEnviadoSchema, { cuerpo: datos }),
  async ingresarConCodigo(datos) {
    return recordar(c, await c.pedir('POST', '/v1/auth/ingreso/codigo/verificacion', ResultadoIngresoSchema, { cuerpo: datos }));
  },
  async resolverSegundaVerificacion(datos) {
    const s = await c.pedir('POST', '/v1/auth/segunda-verificacion', SesionSchema, { cuerpo: datos });
    c.recordarCsrf(s.csrfToken);
    return s;
  },
  enviarCodigoSegundaVerificacion: (datos) => c.pedir('POST', '/v1/auth/segunda-verificacion/envio', CodigoEnviadoSchema, { cuerpo: datos }),
  async pedirRecuperacion(datos) {
    await c.pedir('POST', '/v1/auth/recuperacion', Nada, { cuerpo: datos });
  },
});

/** Si el ingreso ya abrió la sesión, el CSRF queda en memoria; si falta el paso 2, todavía no hay sesión. */
function recordar(c: ClienteHttp, r: ResultadoIngreso): ResultadoIngreso {
  if (r.estado === 'sesion') c.recordarCsrf(r.sesion.csrfToken);
  return r;
}
