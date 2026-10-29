import {
  AceptacionesSchema,
  CodigoEmailSchema,
  IngresoProveedorSchema,
  IngresoSchema,
  RegistroSchema,
  RestablecerSchema,
  type EstadoToken,
  type ResultadoProveedor,
  type Sesion,
  type VerificacionEmail,
} from '../../contracts/dto.ts';
import { ahoraMs, CODIGO_PRUEBA, CUENTAS_PROVEEDOR_PRUEBA, fallo, iso, MINUTO, TOKEN_RECUPERACION_PRUEBA, TOKEN_VENCIDO_PRUEBA, type EstadoMock } from './estado.ts';
import { zodAFallo } from './validacion.ts';

const MAX_INTENTOS = 5;
/** Intentos del código de 6 dígitos antes de bloquearlo (hay que pedir otro). */
export const MAX_INTENTOS_CODIGO = 5;
const VIGENCIA_CODIGO = 10 * MINUTO;
const ESPERA_REENVIO = MINUTO;
const VIGENCIA_ENLACE = 30 * MINUTO;

export function sesionActual(s: EstadoMock): Sesion | null {
  if (!s.sesionActiva || s.sesionExpirada) {
    s.sesionActiva = false;
    return null;
  }
  return {
    cuenta: {
      id: s.cuenta.id,
      roles: ['especialista'],
      emailVerificado: s.verificados.has(s.cuenta.email),
      terminosAceptados: s.aceptaron.has(s.cuenta.email),
    },
    csrfToken: 'mock-csrf-solo-en-memoria',
    expiraEn: new Date(Date.now() + 3_600_000).toISOString(),
  };
}

/** La cuenta con sesión ya puede usar el resto de la API (email verificado y términos aceptados). */
export function cuentaLista(s: EstadoMock): boolean {
  return s.verificados.has(s.cuenta.email) && s.aceptaron.has(s.cuenta.email);
}

/** "ma•••@example.test": suficiente para reconocer el email sin mostrarlo entero. */
export function enmascararEmail(email: string): string {
  const [usuario = '', dominio = ''] = email.split('@');
  return `${usuario.slice(0, 2)}•••@${dominio}`;
}

function abrirSesion(s: EstadoMock, email: string): void {
  s.intentosFallidos = 0;
  s.sesionActiva = true;
  s.sesionExpirada = false;
  s.cuenta.email = email;
  s.perfil.email = email;
}

function nuevoCodigo(s: EstadoMock): void {
  const ahora = ahoraMs(s);
  s.codigoEmail = { codigo: CODIGO_PRUEBA, venceMs: ahora + VIGENCIA_CODIGO, reenviarDesdeMs: ahora + ESPERA_REENVIO, intentos: 0 };
}

function estadoCodigo(s: EstadoMock): VerificacionEmail {
  if (s.verificados.has(s.cuenta.email)) throw fallo('conflicto', 409, 'transicion_invalida', 'Tu email ya está verificado.');
  if (!s.codigoEmail) nuevoCodigo(s);
  const c = s.codigoEmail as NonNullable<EstadoMock['codigoEmail']>;
  return {
    emailEnmascarado: enmascararEmail(s.cuenta.email),
    venceEn: iso(c.venceMs),
    reenviarDesde: iso(c.reenviarDesdeMs),
    intentosRestantes: Math.max(0, MAX_INTENTOS_CODIGO - c.intentos),
  };
}

export const acceso = (s: EstadoMock) => ({
  sesion: () => sesionActual(s),
  ingresar(datos: unknown): Sesion {
    const ok = IngresoSchema.safeParse(datos);
    if (!ok.success) throw zodAFallo(ok.error);
    if (s.intentosFallidos >= MAX_INTENTOS) throw fallo('limite', 429, 'limite', 'Hiciste demasiados intentos. Esperá unos minutos y probá de nuevo.');
    const guardada = s.cuentas.get(ok.data.email.toLowerCase());
    // Una cuenta creada con Google o Apple no tiene contraseña (''): solo entra por su proveedor o con recuperación.
    if (!guardada || guardada !== ok.data.password) {
      s.intentosFallidos += 1;
      throw fallo('sesion', 401, 'no_autenticado', 'El email o la contraseña no son correctos.');
    }
    abrirSesion(s, ok.data.email.toLowerCase());
    return sesionActual(s) as Sesion;
  },
  // Respuesta neutra: igual si el email ya tenía cuenta. Solo una cuenta nueva queda con sesión abierta (y con el código enviado).
  registrar(datos: unknown): void {
    const ok = RegistroSchema.safeParse(datos);
    if (!ok.success) throw zodAFallo(ok.error);
    const email = ok.data.email.toLowerCase();
    if (s.cuentas.has(email)) return;
    s.cuentas.set(email, ok.data.password);
    s.aceptaron.add(email);
    abrirSesion(s, email);
    nuevoCodigo(s);
  },
  // Respuesta neutra: si la cuenta existe, se "manda" el enlace (el token de prueba lo muestra la ayuda del mock).
  recuperar(email: string): void {
    const e = email.trim().toLowerCase();
    if (s.cuentas.has(e)) s.recuperacion.set(TOKEN_RECUPERACION_PRUEBA, { email: e, venceMs: ahoraMs(s) + VIGENCIA_ENLACE, usado: false });
  },
  salir(): void {
    s.sesionActiva = false;
  },

  estadoVerificacion: (): VerificacionEmail => estadoCodigo(s),
  reenviarCodigo(): VerificacionEmail {
    const c = s.codigoEmail;
    if (c && ahoraMs(s) < c.reenviarDesdeMs) throw fallo('limite', 429, 'limite', 'Esperá un momento para pedir otro código.');
    if (s.verificados.has(s.cuenta.email)) throw fallo('conflicto', 409, 'transicion_invalida', 'Tu email ya está verificado.');
    nuevoCodigo(s);
    return estadoCodigo(s);
  },
  verificarEmail(datos: unknown): Sesion {
    const ok = CodigoEmailSchema.safeParse(datos);
    if (!ok.success) throw fallo('validacion', 400, 'validacion', 'El código tiene 6 números.');
    const c = s.codigoEmail;
    if (s.verificados.has(s.cuenta.email)) return sesionActual(s) as Sesion;
    if (!c || ahoraMs(s) > c.venceMs) throw fallo('validacion', 400, 'validacion', 'El código venció. Pedí uno nuevo.');
    if (c.intentos >= MAX_INTENTOS_CODIGO) throw fallo('limite', 429, 'limite', 'Probaste demasiadas veces. Pedí un código nuevo.');
    if (ok.data.codigo !== c.codigo) {
      c.intentos += 1;
      const quedan = MAX_INTENTOS_CODIGO - c.intentos;
      if (quedan <= 0) throw fallo('limite', 429, 'limite', 'Probaste demasiadas veces. Pedí un código nuevo.');
      throw fallo('validacion', 400, 'validacion', `El código no es correcto. ${quedan === 1 ? 'Te queda 1 intento' : `Te quedan ${quedan} intentos`}.`);
    }
    s.verificados.add(s.cuenta.email);
    s.codigoEmail = null;
    return sesionActual(s) as Sesion;
  },
  ingresarConProveedor(datos: unknown): ResultadoProveedor {
    const ok = IngresoProveedorSchema.safeParse(datos);
    if (!ok.success) throw zodAFallo(ok.error);
    const cuenta = (CUENTAS_PROVEEDOR_PRUEBA[ok.data.proveedor] as readonly { email: string; idToken: string }[]).find((c) => c.idToken === ok.data.idToken);
    if (!cuenta) throw fallo('sesion', 401, 'no_autenticado', 'No pudimos validar tu cuenta. Probá de nuevo.');
    const nueva = !s.cuentas.has(cuenta.email);
    if (nueva) s.cuentas.set(cuenta.email, '');
    // Google y Apple ya verificaron el email: no hace falta el código.
    s.verificados.add(cuenta.email);
    abrirSesion(s, cuenta.email);
    return { sesion: sesionActual(s) as Sesion, cuentaNueva: !s.aceptaron.has(cuenta.email) };
  },
  aceptarTerminos(datos: unknown): void {
    const ok = AceptacionesSchema.safeParse(datos);
    if (!ok.success) throw zodAFallo(ok.error);
    s.aceptaron.add(s.cuenta.email);
  },
  estadoRecuperacion(token: string): EstadoToken {
    if (token === TOKEN_VENCIDO_PRUEBA) return { estado: 'vencido' };
    const t = s.recuperacion.get(token);
    if (!t) return { estado: 'vencido' }; // un token desconocido no revela nada
    if (t.usado) return { estado: 'usado' };
    return { estado: ahoraMs(s) > t.venceMs ? 'vencido' : 'valido' };
  },
  restablecer(datos: unknown): void {
    const ok = RestablecerSchema.safeParse(datos);
    if (!ok.success) throw zodAFallo(ok.error);
    const t = s.recuperacion.get(ok.data.token);
    if (!t || t.usado || ahoraMs(s) > t.venceMs) throw fallo('conflicto', 409, 'transicion_invalida', 'El enlace venció o ya se usó. Pedí otro.');
    s.cuentas.set(t.email, ok.data.password);
    t.usado = true;
    s.intentosFallidos = 0;
    s.sesionActiva = false; // cambiar la contraseña cierra las sesiones abiertas
  },
});
