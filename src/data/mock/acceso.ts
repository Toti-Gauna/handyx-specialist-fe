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
import {
  CodigoIngresoSchema,
  EnvioDesafioSchema,
  IngresoClaveSchema,
  PedidoCodigoIngresoSchema,
  RecuperacionSchema,
  ResolverDesafioSchema,
  type CanalCodigo,
  type CodigoEnviado,
  type MetodoDesafio,
  type ResultadoIngreso,
} from '../../contracts/seguridad.ts';
import { ahoraMs, CODIGO_PRUEBA, CREDENCIALES_PRUEBA, CUENTAS_PROVEEDOR_PRUEBA, fallo, iso, MINUTO, TOKEN_RECUPERACION_PRUEBA, TOKEN_VENCIDO_PRUEBA, type EstadoMock } from './estado.ts';
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
  ...accesoV11(s),
});

// ── Contrato 0.11.0 (lote 1.1): email o teléfono, código por email o SMS y segunda verificación ─────────────────────
// Todo es del mock: en producción el código llega por email o SMS y la app autenticadora lo genera en el teléfono.

/** Métodos que no exigen sesión (el adaptador los deja pasar como a `ingresar`). */
export const PUBLICOS_ACCESO = ['ingresarConClave', 'pedirCodigoIngreso', 'ingresarConCodigo', 'resolverSegundaVerificacion', 'enviarCodigoSegundaVerificacion', 'pedirRecuperacion'] as const;

/** Cuenta de prueba con la segunda verificación activa (app autenticadora): misma contraseña que la de siempre. */
export const CUENTA_SEGUNDA_VERIFICACION_PRUEBA = 'especialista.2fa@example.test';
/** Teléfono de la cuenta de prueba ("termina en 4521"). */
export const TELEFONO_PRUEBA = '+5492235554521';
/** Códigos de respaldo de la cuenta con segunda verificación (cada uno sirve una vez). */
export const CODIGOS_RESPALDO_PRUEBA = ['HX7KP-2M9QD', 'R4TWN-8BC3F'] as const;

const VIGENCIA_DESAFIO = 5 * MINUTO;
const MAX_INTENTOS_DESAFIO = 5;

interface Solicitud {
  email: string | null;
  canal: CanalCodigo;
  venceMs: number;
  intentos: number;
}
interface Desafio {
  email: string;
  venceMs: number;
  intentos: number;
  /** El código enviado por SMS o email (la app autenticadora usa siempre el de prueba). */
  enviado: boolean;
}
interface EstadoAcceso {
  cuentasRef: EstadoMock['cuentas'];
  solicitudes: Map<string, Solicitud>;
  desafios: Map<string, Desafio>;
  /** Cuentas con la segunda verificación activa. */
  conSegunda: Set<string>;
  /** "Recordar este teléfono": no pide la segunda verificación otra vez. */
  recordados: Set<string>;
  respaldoUsados: Set<string>;
  telefonos: Map<string, string>;
  n: number;
}

// Estado propio del dominio, al lado del EstadoMock (sin tocar el común). Cambiar de escenario reemplaza `cuentas` y
// así este estado también vuelve al principio.
const estados = new WeakMap<EstadoMock, EstadoAcceso>();
function estadoAcceso(s: EstadoMock): EstadoAcceso {
  let e = estados.get(s);
  if (!e || e.cuentasRef !== s.cuentas) {
    if (!s.cuentas.has(CUENTA_SEGUNDA_VERIFICACION_PRUEBA)) {
      const clave = s.cuentas.get(CREDENCIALES_PRUEBA.email) ?? CREDENCIALES_PRUEBA.password;
      s.cuentas.set(CUENTA_SEGUNDA_VERIFICACION_PRUEBA, clave);
      s.verificados.add(CUENTA_SEGUNDA_VERIFICACION_PRUEBA);
      s.aceptaron.add(CUENTA_SEGUNDA_VERIFICACION_PRUEBA);
    }
    e = {
      cuentasRef: s.cuentas,
      solicitudes: new Map(),
      desafios: new Map(),
      conSegunda: new Set([CUENTA_SEGUNDA_VERIFICACION_PRUEBA]),
      recordados: new Set(),
      respaldoUsados: new Set(),
      telefonos: new Map([
        [TELEFONO_PRUEBA, CREDENCIALES_PRUEBA.email],
        ['+5492235559876', CUENTA_SEGUNDA_VERIFICACION_PRUEBA],
      ]),
      n: 0,
    };
    estados.set(s, e);
  }
  return e;
}

/** Teléfono argentino escrito de cualquier forma ("223 555-4521", "+54 9 223…") a E.164; null si no parece uno. */
export function normalizarTelefono(texto: string): string | null {
  let d = texto.replace(/\D/g, '');
  if (d.startsWith('549')) d = d.slice(3);
  else if (d.startsWith('54')) d = d.slice(2);
  if (d.startsWith('0')) d = d.slice(1);
  return d.length === 10 ? `+549${d}` : null;
}

/** El email de la cuenta a la que apunta lo escrito (email o teléfono), o null si no hay. */
function resolverCuenta(s: EstadoMock, identificador: string): string | null {
  estadoAcceso(s);
  const t = identificador.trim().toLowerCase();
  if (t.includes('@')) return s.cuentas.has(t) ? t : null;
  const tel = normalizarTelefono(t);
  return tel ? (estadoAcceso(s).telefonos.get(tel) ?? null) : null;
}

const finTelefono = (tel: string) => `el teléfono que termina en ${tel.slice(-4)}`;
function telefonoDe(s: EstadoMock, email: string): string | null {
  for (const [tel, e] of estadoAcceso(s).telefonos) if (e === email) return tel;
  return null;
}

function opaco(s: EstadoMock, tipo: string): string {
  const e = estadoAcceso(s);
  e.n += 1;
  return `${tipo}-prueba-${e.n.toString().padStart(12, '0')}`;
}

/** Abre la sesión, o devuelve el paso 2 si la cuenta tiene la segunda verificación y este teléfono no está recordado. */
function terminarIngreso(s: EstadoMock, email: string): ResultadoIngreso {
  const e = estadoAcceso(s);
  if (e.conSegunda.has(email) && !e.recordados.has(email)) {
    const desafio = opaco(s, 'desafio');
    const venceMs = ahoraMs(s) + VIGENCIA_DESAFIO;
    e.desafios.set(desafio, { email, venceMs, intentos: 0, enviado: false });
    const tel = telefonoDe(s, email);
    return {
      estado: 'segunda_verificacion',
      desafio: {
        desafio,
        metodos: ['totp', 'sms', 'email', 'respaldo'] satisfies MetodoDesafio[],
        preferido: 'totp',
        telefonoEnmascarado: tel ? `termina en ${tel.slice(-4)}` : null,
        emailEnmascarado: enmascararEmail(email),
        venceEn: iso(venceMs),
      },
    };
  }
  abrirSesion(s, email);
  return { estado: 'sesion', sesion: sesionActual(s) as Sesion };
}

function errorCodigo(quedan: number) {
  if (quedan <= 0) return fallo('limite', 429, 'limite', 'Probaste demasiadas veces. Pedí un código nuevo.');
  return fallo('validacion', 400, 'validacion', `El código no es correcto. ${quedan === 1 ? 'Te queda 1 intento' : `Te quedan ${quedan} intentos`}.`);
}

export const accesoV11 = (s: EstadoMock) => ({
  ingresarConClave(datos: unknown): ResultadoIngreso {
    const ok = IngresoClaveSchema.safeParse(datos);
    if (!ok.success) throw zodAFallo(ok.error);
    if (s.intentosFallidos >= MAX_INTENTOS) throw fallo('limite', 429, 'limite', 'Hiciste demasiados intentos. Esperá unos minutos y probá de nuevo.');
    const email = resolverCuenta(s, ok.data.identificador);
    const guardada = email ? s.cuentas.get(email) : undefined;
    if (!email || !guardada || guardada !== ok.data.password) {
      s.intentosFallidos += 1;
      throw fallo('sesion', 401, 'no_autenticado', 'Los datos no son correctos.');
    }
    s.intentosFallidos = 0;
    return terminarIngreso(s, email);
  },
  // Respuesta neutra: el destino enmascarado sale de lo que escribió la persona, nunca de la cuenta (no revela si existe).
  pedirCodigoIngreso(datos: unknown): CodigoEnviado {
    const ok = PedidoCodigoIngresoSchema.safeParse(datos);
    if (!ok.success) throw zodAFallo(ok.error);
    const { identificador, canal } = ok.data;
    const escrito = identificador.trim().toLowerCase();
    const tel = escrito.includes('@') ? null : normalizarTelefono(escrito);
    const destinoEnmascarado =
      canal === 'email' ? (escrito.includes('@') ? enmascararEmail(escrito) : 'el email de tu cuenta') : tel ? finTelefono(tel) : 'el teléfono de tu cuenta';
    const solicitud = opaco(s, 'solicitud');
    const ahora = ahoraMs(s);
    estadoAcceso(s).solicitudes.set(solicitud, { email: resolverCuenta(s, identificador), canal, venceMs: ahora + VIGENCIA_CODIGO, intentos: 0 });
    return { solicitud, canal, destinoEnmascarado, venceEn: iso(ahora + VIGENCIA_CODIGO), reenviarDesde: iso(ahora + ESPERA_REENVIO) };
  },
  ingresarConCodigo(datos: unknown): ResultadoIngreso {
    const ok = CodigoIngresoSchema.safeParse(datos);
    if (!ok.success) throw fallo('validacion', 400, 'validacion', 'El código tiene 6 números.');
    const sol = estadoAcceso(s).solicitudes.get(ok.data.solicitud);
    if (!sol || ahoraMs(s) > sol.venceMs) throw fallo('validacion', 400, 'validacion', 'El código venció. Pedí uno nuevo.');
    if (sol.intentos >= MAX_INTENTOS_CODIGO) throw errorCodigo(0);
    // Una cuenta que no existe se comporta igual que un código equivocado.
    if (!sol.email || ok.data.codigo !== CODIGO_PRUEBA) {
      sol.intentos += 1;
      throw errorCodigo(MAX_INTENTOS_CODIGO - sol.intentos);
    }
    estadoAcceso(s).solicitudes.delete(ok.data.solicitud);
    const r = terminarIngreso(s, sol.email);
    // Entrar con un código del email ya prueba ese email.
    if (sol.canal === 'email') s.verificados.add(sol.email);
    return r.estado === 'sesion' ? { estado: 'sesion', sesion: sesionActual(s) as Sesion } : r;
  },
  resolverSegundaVerificacion(datos: unknown): Sesion {
    const ok = ResolverDesafioSchema.safeParse(datos);
    if (!ok.success) throw fallo('validacion', 400, 'validacion', 'Revisá el código.');
    const e = estadoAcceso(s);
    const d = e.desafios.get(ok.data.desafio);
    if (!d || ahoraMs(s) > d.venceMs) throw fallo('sesion', 401, 'no_autenticado', 'Pasó mucho tiempo. Volvé a entrar.');
    if (d.intentos >= MAX_INTENTOS_DESAFIO) throw fallo('limite', 429, 'limite', 'Probaste demasiadas veces. Volvé a entrar.');
    const codigo = ok.data.codigo.toUpperCase();
    const valido =
      ok.data.metodo === 'respaldo'
        ? (CODIGOS_RESPALDO_PRUEBA as readonly string[]).includes(codigo.replace(/^(.{5})-?(.{5})$/, '$1-$2')) && !e.respaldoUsados.has(codigo.replace('-', ''))
        : ok.data.metodo === 'totp'
          ? codigo === CODIGO_PRUEBA
          : d.enviado && codigo === CODIGO_PRUEBA;
    if (!valido) {
      d.intentos += 1;
      const quedan = MAX_INTENTOS_DESAFIO - d.intentos;
      if (quedan <= 0) throw fallo('limite', 429, 'limite', 'Probaste demasiadas veces. Volvé a entrar.');
      throw fallo('validacion', 400, 'validacion', `El código no es correcto. ${quedan === 1 ? 'Te queda 1 intento' : `Te quedan ${quedan} intentos`}.`);
    }
    if (ok.data.metodo === 'respaldo') e.respaldoUsados.add(codigo.replace('-', ''));
    if (ok.data.recordarDispositivo) e.recordados.add(d.email);
    e.desafios.delete(ok.data.desafio);
    abrirSesion(s, d.email);
    return sesionActual(s) as Sesion;
  },
  enviarCodigoSegundaVerificacion(datos: unknown): CodigoEnviado {
    const ok = EnvioDesafioSchema.safeParse(datos);
    if (!ok.success) throw zodAFallo(ok.error);
    const d = estadoAcceso(s).desafios.get(ok.data.desafio);
    if (!d || ahoraMs(s) > d.venceMs) throw fallo('sesion', 401, 'no_autenticado', 'Pasó mucho tiempo. Volvé a entrar.');
    d.enviado = true;
    const tel = telefonoDe(s, d.email);
    const ahora = ahoraMs(s);
    return {
      solicitud: ok.data.desafio,
      canal: ok.data.canal,
      destinoEnmascarado: ok.data.canal === 'sms' ? (tel ? finTelefono(tel) : 'el teléfono de tu cuenta') : enmascararEmail(d.email),
      venceEn: iso(d.venceMs),
      reenviarDesde: iso(ahora + ESPERA_REENVIO),
    };
  },
  pedirRecuperacion(datos: unknown): void {
    const ok = RecuperacionSchema.safeParse(datos);
    if (!ok.success) throw zodAFallo(ok.error);
    const email = resolverCuenta(s, ok.data.identificador);
    if (email) s.recuperacion.set(TOKEN_RECUPERACION_PRUEBA, { email, venceMs: ahoraMs(s) + VIGENCIA_ENLACE, usado: false });
  },
});
