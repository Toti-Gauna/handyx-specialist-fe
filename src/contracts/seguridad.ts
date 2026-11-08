// Acceso y segunda verificación (contrato 0.11.0, fase V.1; pantallas D6-Login, D6-Login2FA, D6-Acceso, D6-Codigo,
// D6-Recuperar, D6-Seguridad y D6-TOTP). Lo implementa el lote 1.5.
// - Se entra con email o teléfono y contraseña, con Google o Apple (`/v1/auth/proveedor`) o con un código por email o
//   SMS. Las respuestas a pedidos de código y de recuperación son neutras: no revelan si la cuenta existe.
// - Segunda verificación opcional: app autenticadora (TOTP, recomendada), SMS o email, con 10 códigos de respaldo de un
//   solo uso. El secreto TOTP vive cifrado en el servidor; la clave se muestra UNA vez para escanearla y nunca se guarda
//   en el navegador. Los códigos de respaldo se guardan como hash y se muestran una sola vez.
// - SMS necesita un proveedor autorizado: sin él, todo lo de SMS responde 503 `servicio_no_disponible` (falla cerrada).
// - "Recordar este teléfono" deja un dispositivo de confianza (30 días): no pide la segunda verificación ahí.
import { z } from 'zod';
import { CodigoSeisSchema } from './comun.ts';
import { IdSchema, InstanteSchema, REGLAS_CLAVE, SesionSchema } from './dto.ts';

export const METODOS_SEGUNDA_VERIFICACION = ['totp', 'sms', 'email'] as const;
export type MetodoSegundaVerificacion = (typeof METODOS_SEGUNDA_VERIFICACION)[number];
/** Al entrar también vale un código de respaldo. */
export const METODOS_DESAFIO = ['totp', 'sms', 'email', 'respaldo'] as const;
export type MetodoDesafio = (typeof METODOS_DESAFIO)[number];
export const CANALES_CODIGO = ['email', 'sms'] as const;
export type CanalCodigo = (typeof CANALES_CODIGO)[number];

export const CODIGOS_RESPALDO_CANTIDAD = 10;
export const TOTP = { digitos: 6, periodoS: 30, algoritmo: 'SHA1' } as const;
/** Cuánto dura "Recordar este teléfono" (días). PENDIENTE de confirmar con Legal. */
export const DIAS_DISPOSITIVO_RECORDADO = 30;
/** Vigencia del enlace para elegir otra contraseña (D6-Recuperar: 30 minutos, un solo uso). */
export const VIGENCIA_RECUPERACION_MS = 30 * 60_000;

/** Teléfono celular argentino en formato E.164 (+549…). Se guarda cifrado; vuelve enmascarado. */
export const TelefonoSchema = z.string().regex(/^\+549\d{10}$/);
/** Email o teléfono, tal como lo escribe la persona; el servidor lo normaliza. */
export const IdentificadorSchema = z.string().trim().min(6).max(254);

// ── Ingreso con contraseña ────────────────────────────────────────────────────────────────────────
export const IngresoClaveSchema = z.strictObject({
  identificador: IdentificadorSchema,
  password: z.string().min(1).max(REGLAS_CLAVE.maximo),
  /** "Recordar este teléfono": con la segunda verificación activa, no la vuelve a pedir en este dispositivo. */
  recordarDispositivo: z.boolean(),
});
export type IngresoClave = z.infer<typeof IngresoClaveSchema>;

/** Desafío de la segunda verificación: opaco, de corta duración y atado al intento de ingreso. */
export const DesafioSegundaVerificacionSchema = z.strictObject({
  desafio: z.string().min(16),
  metodos: z.array(z.enum(METODOS_DESAFIO)).min(1),
  preferido: z.enum(METODOS_SEGUNDA_VERIFICACION),
  /** "Al teléfono que termina en 4521". */
  telefonoEnmascarado: z.string().nullable(),
  emailEnmascarado: z.string().nullable(),
  venceEn: InstanteSchema,
});
export type DesafioSegundaVerificacion = z.infer<typeof DesafioSegundaVerificacionSchema>;

/** Resultado de un ingreso: la sesión, o el paso 2 de 2 si la segunda verificación está activa. */
export const ResultadoIngresoSchema = z.discriminatedUnion('estado', [
  z.strictObject({ estado: z.literal('sesion'), sesion: SesionSchema }),
  z.strictObject({ estado: z.literal('segunda_verificacion'), desafio: DesafioSegundaVerificacionSchema }),
]);
export type ResultadoIngreso = z.infer<typeof ResultadoIngresoSchema>;

export const ResolverDesafioSchema = z.strictObject({
  desafio: z.string().min(16),
  metodo: z.enum(METODOS_DESAFIO),
  /** 6 dígitos, o un código de respaldo (10 letras y números, con o sin guion). */
  codigo: z.string().regex(/^(\d{6}|[A-Z0-9]{5}-?[A-Z0-9]{5})$/),
  recordarDispositivo: z.boolean(),
});
export type ResolverDesafio = z.infer<typeof ResolverDesafioSchema>;

export const EnvioDesafioSchema = z.strictObject({
  desafio: z.string().min(16),
  canal: z.enum(CANALES_CODIGO),
});
export type EnvioDesafio = z.infer<typeof EnvioDesafioSchema>;

// ── Entrar sin contraseña, con un código ─────────────────────────────────────────────────────────
export const PedidoCodigoIngresoSchema = z.strictObject({
  identificador: IdentificadorSchema,
  canal: z.enum(CANALES_CODIGO),
});
export type PedidoCodigoIngreso = z.infer<typeof PedidoCodigoIngresoSchema>;

/** Respuesta neutra: igual exista o no la cuenta (la `solicitud` es opaca y el código nunca viaja al cliente). */
export const CodigoEnviadoSchema = z.strictObject({
  solicitud: z.string().min(16),
  canal: z.enum(CANALES_CODIGO),
  destinoEnmascarado: z.string(),
  venceEn: InstanteSchema,
  reenviarDesde: InstanteSchema,
});
export type CodigoEnviado = z.infer<typeof CodigoEnviadoSchema>;

export const CodigoIngresoSchema = z.strictObject({
  solicitud: z.string().min(16),
  codigo: CodigoSeisSchema,
  recordarDispositivo: z.boolean(),
});
export type CodigoIngreso = z.infer<typeof CodigoIngresoSchema>;

/** Recuperar la contraseña con email o teléfono (el enlace siempre va al email de la cuenta). Respuesta neutra. */
export const RecuperacionSchema = z.strictObject({ identificador: IdentificadorSchema });
export type Recuperacion = z.infer<typeof RecuperacionSchema>;

// ── Seguridad de la cuenta (D6-Seguridad) ─────────────────────────────────────────────────────────
export const DispositivoSchema = z.strictObject({
  id: IdSchema,
  /** Genérico, sin modelo exacto ni IP: "Android · Chrome". */
  nombre: z.string().max(60),
  esEste: z.boolean(),
  recordado: z.boolean(),
  ultimoIngreso: InstanteSchema,
});
export type Dispositivo = z.infer<typeof DispositivoSchema>;

export const SeguridadSchema = z.strictObject({
  segundaVerificacion: z.strictObject({
    activa: z.boolean(),
    preferido: z.enum(METODOS_SEGUNDA_VERIFICACION).nullable(),
    metodos: z.array(
      z.strictObject({
        metodo: z.enum(METODOS_SEGUNDA_VERIFICACION),
        activo: z.boolean(),
        /** "Al que termina en 4521", "A ma•••@example.test" o el nombre genérico de la app. */
        detalle: z.string().max(80),
        /** SMS sin proveedor autorizado: no se puede activar. */
        disponible: z.boolean(),
      }),
    ),
  }),
  codigosRespaldo: z.strictObject({
    restantes: z.int().min(0).max(CODIGOS_RESPALDO_CANTIDAD),
    generadosEn: InstanteSchema.nullable(),
  }),
  telefono: z.strictObject({ enmascarado: z.string(), verificado: z.boolean() }).nullable(),
  claveCambiadaEn: InstanteSchema.nullable(),
  dispositivos: z.array(DispositivoSchema),
  version: z.int().nonnegative(),
});
export type Seguridad = z.infer<typeof SeguridadSchema>;

/** Para los cambios sensibles (apagar la segunda verificación, ver códigos nuevos): la contraseña o un código. */
export const ReautenticacionSchema = z
  .strictObject({
    password: z.string().min(1).max(REGLAS_CLAVE.maximo).nullable(),
    codigo: z.string().regex(/^(\d{6}|[A-Z0-9]{5}-?[A-Z0-9]{5})$/).nullable(),
  })
  .refine((r) => (r.password === null) !== (r.codigo === null), 'Mandá la contraseña o un código, uno de los dos');
export type Reautenticacion = z.infer<typeof ReautenticacionSchema>;

/** Alta de la app autenticadora: la clave se muestra una vez (QR y texto) y nunca se guarda en el navegador. */
export const AltaTotpSchema = z.strictObject({
  alta: z.string().min(16),
  /** otpauth://totp/Handyx:…?secret=…&issuer=Handyx — para dibujar el QR en el teléfono, sin servicios externos. */
  otpauthUri: z.string().startsWith('otpauth://totp/'),
  /** La misma clave en grupos de 4 ("JBSW Y3DP …") para copiarla en el mismo teléfono. */
  claveTexto: z.string().regex(/^[A-Z2-7 ]{16,64}$/),
  venceEn: InstanteSchema,
});
export type AltaTotp = z.infer<typeof AltaTotpSchema>;

export const ConfirmarTotpSchema = z.strictObject({ alta: z.string().min(16), codigo: CodigoSeisSchema });
export type ConfirmarTotp = z.infer<typeof ConfirmarTotpSchema>;

/** Se muestran una sola vez; generar otros invalida los anteriores. */
export const CodigosRespaldoSchema = z.strictObject({
  codigos: z.array(z.string().regex(/^[A-Z0-9]{5}-[A-Z0-9]{5}$/)).length(CODIGOS_RESPALDO_CANTIDAD),
  generadosEn: InstanteSchema,
});
export type CodigosRespaldo = z.infer<typeof CodigosRespaldoSchema>;

export const CambioSegundaVerificacionSchema = z.strictObject({
  metodo: z.enum(METODOS_SEGUNDA_VERIFICACION),
  activo: z.boolean(),
  reautenticacion: ReautenticacionSchema,
  version: z.int().nonnegative(),
});
export type CambioSegundaVerificacion = z.infer<typeof CambioSegundaVerificacionSchema>;

export const CambioClaveSchema = z.strictObject({
  actual: z.string().min(1).max(REGLAS_CLAVE.maximo),
  nueva: z.string().min(REGLAS_CLAVE.minimo).max(REGLAS_CLAVE.maximo),
});
export type CambioClave = z.infer<typeof CambioClaveSchema>;

export const CambioTelefonoSchema = z.strictObject({ telefono: TelefonoSchema });
export type CambioTelefono = z.infer<typeof CambioTelefonoSchema>;
