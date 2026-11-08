// Dominio acceso: sesión, registro, verificación del email, proveedores y recuperación (contrato 0.3.0, lote 4.2), y
// desde el contrato 0.11.0 (lote 1.1, fase V.1): entrar con email o teléfono, con un código por email o SMS, y la
// segunda verificación al entrar (D6-Login, D6-Login2FA, D6-Acceso, D6-Codigo, D6-Recuperar).
import type { Aceptaciones, CodigoEmail, EstadoToken, Ingreso, IngresoProveedor, Registro, Restablecer, ResultadoProveedor, Sesion, VerificacionEmail } from '../../contracts/dto.ts';
import type { CodigoEnviado, CodigoIngreso, EnvioDesafio, IngresoClave, PedidoCodigoIngreso, Recuperacion, ResolverDesafio, ResultadoIngreso } from '../../contracts/seguridad.ts';

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

  // ── Contrato 0.11.0 (lote 1.1) ──
  /** Email o teléfono y contraseña: la sesión, o el paso 2 de 2 si la segunda verificación está activa. */
  ingresarConClave(datos: IngresoClave): Promise<ResultadoIngreso>;
  /** Entrar sin contraseña: manda un código por email o SMS. Respuesta neutra (igual exista o no la cuenta). SMS sin proveedor: 503. */
  pedirCodigoIngreso(datos: PedidoCodigoIngreso): Promise<CodigoEnviado>;
  /** El código de 6 números que llegó: la sesión, o el paso 2 de 2. */
  ingresarConCodigo(datos: CodigoIngreso): Promise<ResultadoIngreso>;
  /** Paso 2 de 2: código de la app autenticadora, del SMS, del email o uno de respaldo. */
  resolverSegundaVerificacion(datos: ResolverDesafio): Promise<Sesion>;
  /** Manda el código de la segunda verificación por SMS o email. */
  enviarCodigoSegundaVerificacion(datos: EnvioDesafio): Promise<CodigoEnviado>;
  /** Recuperar la contraseña con email o teléfono: el enlace va siempre al email de la cuenta. Respuesta neutra. */
  pedirRecuperacion(datos: Recuperacion): Promise<void>;
}
