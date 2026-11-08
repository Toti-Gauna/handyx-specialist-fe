// Registro por pasos que se retoma, estado del alta y onboarding (contrato 0.11.0, fases V.2–V.4; pantallas RG-1 a
// RG-10, D6-Alta, OB-Aprobado, OB-Permisos, OB-Tour y OB-PrimerosPasos). Lo implementa el lote 1.5.
// Reemplaza el alta guiada de 0.2–0.5 (`/alta/datos`, `/documentos/{tipo}`, `/antecedentes/turno`, `/alta/envio`), que
// queda hasta 1.0.0 por compatibilidad.
// - Cada paso se guarda en el servidor apenas se completa; la app retoma en `pasoActual`. Nada queda en el navegador.
// - Domicilio, DNI, CUIT/CUIL, selfie y antecedentes van cifrados. Las respuestas nunca devuelven el domicilio ni los
//   números completos (solo el barrio y los últimos dígitos) ni la URL de un archivo sensible: esos archivos los ve
//   solo Operations, con URL firmada corta, y nunca van a una IA.
// - Cargar ≠ verificar: solo Operations pasa un documento a `verificado`.
// - Antecedentes penales por foto o PDF (decisión de Ignacio del 08/11/2026): el archivo se BORRA al verificarlo (queda
//   la constancia: estado, fecha y quién). Requiere revisión legal antes de producción.
// - Matrícula obligatoria en Gas y Aire acondicionado (`requiereMatricula`): sin la matrícula verificada, ese rubro no
//   se habilita. El resto de los certificados es opcional y, verificado, suma al perfil que ven los clientes.
import { z } from 'zod';
import { FechaSchema } from './comun.ts';
import { IdSchema, InstanteSchema, PuntoSchema, REGLAS_CLAVE } from './dto.ts';
import { ESTADOS_ALTA, ESTADOS_DOCUMENTO, type EstadoDocumento } from './maquinas.ts';
import { RUBROS, requiereMatricula, type Rubro } from './rubros.ts';
import { TelefonoSchema } from './seguridad.ts';

// ── Paso 1: la cuenta (RG-1) ──────────────────────────────────────────────────────────────────────
/** Crea la cuenta con lo mínimo. Respuesta neutra (202) exista o no; sigue con el código al email (`/v1/auth/verificacion`). */
export const RegistroCuentaSchema = z.strictObject({
  nombre: z.string().trim().min(1).max(60),
  apellido: z.string().trim().min(1).max(60),
  telefono: TelefonoSchema,
  email: z.email().max(254),
  password: z.string().min(REGLAS_CLAVE.minimo).max(REGLAS_CLAVE.maximo),
  /** Ids de las versiones aceptadas (casillas sin tildar por defecto). */
  terminos: z.string(),
  privacidad: z.string(),
});
export type RegistroCuenta = z.infer<typeof RegistroCuentaSchema>;

// ── Pasos ─────────────────────────────────────────────────────────────────────────────────────────
export const PASOS_REGISTRO = [
  'datos',
  'domicilio',
  'rubros',
  'zonas',
  'selfie',
  'dni',
  'cuit_cuil',
  'certificados',
  'antecedentes',
  'revision',
] as const;
export type PasoRegistro = (typeof PASOS_REGISTRO)[number];

/** `a_corregir`: Operations pidió corregir ese paso (con `motivo`). */
export const ESTADOS_PASO = ['pendiente', 'completo', 'en_revision', 'verificado', 'a_corregir'] as const;
export type EstadoPaso = (typeof ESTADOS_PASO)[number];

/** Cómo factura (RG-7). "Todavía no" es válido: no impide trabajar en la demo. */
export const FACTURACIONES = ['monotributo', 'responsable_inscripto', 'todavia_no'] as const;
export type Facturacion = (typeof FACTURACIONES)[number];

export const TIPOS_CERTIFICADO = ['matricula', 'curso', 'seguro', 'otro'] as const;
export type TipoCertificado = (typeof TIPOS_CERTIFICADO)[number];

export const FORMATOS_ARCHIVO = ['foto', 'pdf'] as const;

/** Qué falta para poder mandar el alta (los antecedentes se pueden cargar después: hasta entonces no hay pedidos). */
export const FALTANTES_REGISTRO = ['datos', 'domicilio', 'rubros', 'zonas', 'selfie', 'dni', 'cuit_cuil', 'matricula', 'textos'] as const;
export type FaltanteRegistro = (typeof FALTANTES_REGISTRO)[number];

/** Qué falta VERIFICAR para habilitar (lo calcula el servidor con `faltantesHabilitacion`). */
export const FALTANTES_HABILITACION = ['selfie', 'dni', 'cuit_cuil', 'antecedentes', 'rubro'] as const;
export type FaltanteHabilitacion = (typeof FALTANTES_HABILITACION)[number];

export const CertificadoSchema = z.strictObject({
  id: IdSchema,
  tipo: z.enum(TIPOS_CERTIFICADO),
  /** Solo para la matrícula (y opcional en los demás). */
  rubro: z.enum(RUBROS).nullable(),
  /** "Matrícula de gasista", "Curso de termofusión", "Seguro de responsabilidad civil". */
  nombre: z.string().min(1).max(80),
  /** Matrícula de Gas o de Aire: sin ella ese rubro no se habilita. */
  obligatorio: z.boolean(),
  formato: z.enum(FORMATOS_ARCHIVO),
  estado: z.enum(ESTADOS_DOCUMENTO),
  /** Motivo seguro si se rechazó (sin datos sensibles). */
  motivo: z.string().max(200).nullable(),
  venceEn: FechaSchema.nullable(),
  verificadoEn: InstanteSchema.nullable(),
  /** Verificado y vigente: aparece en el perfil que ven los clientes. Cargado no alcanza. */
  enPerfil: z.boolean(),
});
export type Certificado = z.infer<typeof CertificadoSchema>;

export const RubroRegistroSchema = z.strictObject({
  rubro: z.enum(RUBROS),
  /** Mismo vocabulario que `PerfilEspecialista.rubros[].estado`. */
  estado: z.enum(['elegido', 'habilitado', 'requiere_matricula', 'en_revision', 'no_habilitado']),
  requiereMatricula: z.boolean(),
});

export const RegistroEspecialistaSchema = z.strictObject({
  estadoAlta: z.enum(ESTADOS_ALTA),
  /** El primer paso sin completar (o `revision`): ahí se retoma. */
  pasoActual: z.enum(PASOS_REGISTRO),
  pasos: z.array(
    z.strictObject({
      paso: z.enum(PASOS_REGISTRO),
      estado: z.enum(ESTADOS_PASO),
      /** Qué corregir, en palabras simples (solo con `a_corregir`). */
      motivo: z.string().max(200).nullable(),
    }),
  ),
  datos: z.strictObject({
    nombre: z.string().nullable(),
    apellido: z.string().nullable(),
    /** "223 •••-4521". */
    telefonoEnmascarado: z.string().nullable(),
    emailEnmascarado: z.string(),
  }),
  /** Nunca la dirección: solo si está cargado y el barrio (para mostrar "La Perla · cifrado"). */
  domicilio: z.strictObject({ cargado: z.boolean(), barrio: z.string().nullable() }),
  rubros: z.array(RubroRegistroSchema),
  /** Barrios donde quiere trabajar (ids de `/mapa/barrios`). */
  zonas: z.array(z.string()),
  selfie: z.enum(ESTADOS_DOCUMENTO),
  dni: z.strictObject({
    frente: z.enum(ESTADOS_DOCUMENTO),
    dorso: z.enum(ESTADOS_DOCUMENTO),
    ultimos: z.string().max(4).nullable(),
  }),
  cuitCuil: z.strictObject({
    estado: z.enum(ESTADOS_DOCUMENTO),
    ultimos: z.string().max(4).nullable(),
    facturacion: z.enum(FACTURACIONES).nullable(),
  }),
  certificados: z.array(CertificadoSchema),
  antecedentes: z.strictObject({
    estado: z.enum(ESTADOS_DOCUMENTO),
    formato: z.enum(FORMATOS_ARCHIVO).nullable(),
    cargadoEn: InstanteSchema.nullable(),
    verificadoEn: InstanteSchema.nullable(),
    /** true después de verificarlo: el archivo ya no existe, queda la constancia. */
    archivoBorrado: z.boolean(),
  }),
  faltantesEnvio: z.array(z.enum(FALTANTES_REGISTRO)),
  faltantesHabilitacion: z.array(z.enum(FALTANTES_HABILITACION)),
  /** Motivo seguro cuando `requiere_correccion` o `rechazada`. */
  motivoRevision: z.string().nullable(),
  version: z.int().nonnegative(),
});
export type RegistroEspecialista = z.infer<typeof RegistroEspecialistaSchema>;

// ── Lo que se manda en cada paso (todos con `version`; responden RegistroEspecialista) ─────────────
export const GuardarDatosRegistroSchema = z.strictObject({
  nombre: z.string().trim().min(1).max(60),
  apellido: z.string().trim().min(1).max(60),
  version: z.int().nonnegative(),
});
export type GuardarDatosRegistro = z.infer<typeof GuardarDatosRegistroSchema>;

/** Domicilio (RG-2): se guarda cifrado como un solo valor y nunca se le muestra a nadie. */
export const GuardarDomicilioSchema = z.strictObject({
  calle: z.string().trim().min(2).max(80),
  numero: z.string().trim().min(1).max(10),
  pisoDepto: z.string().trim().max(20).nullable(),
  /** Id del barrio si está en la lista; si no, el texto. */
  barrioId: z.string().nullable(),
  barrio: z.string().trim().min(2).max(80),
  ciudad: z.string().trim().min(2).max(80),
  /** El punto que ajustó en el mapa (opcional). Cifrado, solo para calcular distancias. */
  punto: PuntoSchema.nullable(),
  version: z.int().nonnegative(),
});
export type GuardarDomicilio = z.infer<typeof GuardarDomicilioSchema>;

export const GuardarRubrosRegistroSchema = z.strictObject({
  rubros: z.array(z.enum(RUBROS)).min(1).max(RUBROS.length),
  version: z.int().nonnegative(),
});
export type GuardarRubrosRegistro = z.infer<typeof GuardarRubrosRegistroSchema>;

export const GuardarZonasSchema = z.strictObject({
  barrios: z.array(z.string().min(1)).min(1).max(40),
  version: z.int().nonnegative(),
});
export type GuardarZonas = z.infer<typeof GuardarZonasSchema>;

/** CUIT/CUIL (RG-7): 11 dígitos, cifrado + HMAC; vuelven solo los últimos. */
export const GuardarCuitSchema = z.strictObject({
  cuitCuil: z.string().regex(/^\d{11}$/),
  facturacion: z.enum(FACTURACIONES),
  version: z.int().nonnegative(),
});
export type GuardarCuit = z.infer<typeof GuardarCuitSchema>;

/**
 * Campos del multipart del DNI (RG-6): `frente` y `dorso` van como archivos aparte, nunca dentro del JSON.
 * El número se escribe una vez: cifrado + HMAC, y en las pantallas solo los últimos dígitos.
 */
export const CamposDniSchema = z.strictObject({
  numero: z.string().regex(/^\d{7,8}$/),
  version: z.coerce.number().int().nonnegative(),
});

/** Campos del multipart de un certificado (RG-8). El archivo va en `archivo` (foto o PDF). */
export const CamposCertificadoSchema = z.strictObject({
  tipo: z.enum(TIPOS_CERTIFICADO),
  rubro: z.enum(RUBROS).optional(),
  nombre: z.string().trim().min(1).max(80),
  venceEn: FechaSchema.optional(),
});

/** Envío a revisión (RG-10): los textos para especialistas aceptados (sin tildar por defecto). */
export const EnvioRegistroSchema = z.strictObject({
  terminosEspecialista: z.string(),
  privacidadEspecialista: z.string(),
  version: z.int().nonnegative(),
});
export type EnvioRegistro = z.infer<typeof EnvioRegistroSchema>;

// ── Reglas puras (las aplica el servidor; la app solo las muestra) ────────────────────────────────
export interface RequisitosRegistro {
  selfie: EstadoDocumento;
  dniFrente: EstadoDocumento;
  dniDorso: EstadoDocumento;
  cuitCuil: EstadoDocumento;
  antecedentes: EstadoDocumento;
  /** Cada rubro elegido con el estado de su matrícula (null si no cargó ninguna). */
  rubros: readonly { rubro: Rubro; matricula: EstadoDocumento | null }[];
}

/** Rubros que se pueden habilitar: los que no piden matrícula, o con la matrícula verificada. */
export function rubrosHabilitables(r: RequisitosRegistro): Rubro[] {
  return r.rubros.filter((x) => !requiereMatricula(x.rubro) || x.matricula === 'verificado').map((x) => x.rubro);
}

/** Qué falta verificar para habilitar. Cargado ≠ verificado: solo cuenta `verificado`. */
export function faltantesHabilitacion(r: RequisitosRegistro): FaltanteHabilitacion[] {
  const faltan: FaltanteHabilitacion[] = [];
  if (r.selfie !== 'verificado') faltan.push('selfie');
  if (r.dniFrente !== 'verificado' || r.dniDorso !== 'verificado') faltan.push('dni');
  if (r.cuitCuil !== 'verificado') faltan.push('cuit_cuil');
  if (r.antecedentes !== 'verificado') faltan.push('antecedentes');
  if (rubrosHabilitables(r).length < 1) faltan.push('rubro');
  return faltan;
}

// ── Onboarding (OB-Aprobado, OB-Permisos, OB-Tour, OB-PrimerosPasos) ─────────────────────────────
/** Ninguno es obligatorio para recibir pedidos. */
export const PRIMEROS_PASOS = ['perfil', 'zonas_horarios', 'cobros', 'lista_precios', 'equipamiento', 'manual'] as const;
export type PrimerPaso = (typeof PRIMEROS_PASOS)[number];

export const OnboardingSchema = z.strictObject({
  /** La pantalla de "¡Estás habilitado!" ya se mostró (se muestra una vez, sola, al habilitarse). */
  bienvenidaVista: z.boolean(),
  rubrosHabilitados: z.array(z.enum(RUBROS)),
  pasos: z.array(z.strictObject({ paso: z.enum(PRIMEROS_PASOS), hecho: z.boolean() })),
  version: z.int().nonnegative(),
});
export type Onboarding = z.infer<typeof OnboardingSchema>;

export const MarcarOnboardingSchema = z.strictObject({
  bienvenidaVista: z.literal(true).optional(),
  /** Los demás pasos los marca el servidor al hacerlos de verdad (perfil completo, cobros cargados…); este se puede marcar a mano. */
  pasoHecho: z.enum(PRIMEROS_PASOS).optional(),
  version: z.int().nonnegative(),
});
export type MarcarOnboarding = z.infer<typeof MarcarOnboardingSchema>;
