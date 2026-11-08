// Dominio acceso: sesión, registro, verificación del email, proveedores y recuperación (contrato 0.3.0, lote 4.2).
import type { Aceptaciones, CodigoEmail, EstadoToken, Ingreso, IngresoProveedor, Registro, Restablecer, ResultadoProveedor, Sesion, VerificacionEmail } from '../../contracts/dto.ts';

export interface ApiAcceso {
  /** Sesión actual o null si no hay (401 no es un error para esta consulta). */
  sesion(): Promise<Sesion | null>;
  ingresar(datos: Ingreso): Promise<Sesion>;
  /** Respuesta neutra: es igual exista o no la cuenta. */
  registrar(datos: Registro): Promise<void>;
  /** Respuesta neutra: es igual exista o no la cuenta. */
  recuperar(email: string): Promise<void>;
  salir(): Promise<void>;

  /** Estado del código de 6 dígitos que se mandó al email de una cuenta nueva. */
  estadoVerificacion(): Promise<VerificacionEmail>;
  /** Manda otro código (el servidor exige esperar hasta `reenviarDesde`). */
  reenviarCodigo(): Promise<VerificacionEmail>;
  verificarEmail(datos: CodigoEmail): Promise<Sesion>;
  /** Google o Apple: el id_token lo valida el servidor. Una cuenta nueva vuelve con `cuentaNueva` y falta aceptar. */
  ingresarConProveedor(datos: IngresoProveedor): Promise<ResultadoProveedor>;
  aceptarTerminos(datos: Aceptaciones): Promise<void>;
  /** Estado del enlace de recuperación (uno desconocido se informa como vencido: no revela nada). */
  estadoRecuperacion(token: string): Promise<EstadoToken>;
  /** Elige la contraseña nueva con el enlace del email; cierra las sesiones abiertas. */
  restablecer(datos: Restablecer): Promise<void>;
}
