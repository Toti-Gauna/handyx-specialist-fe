// Mock del registro por pasos, el estado del alta y el onboarding (lote 1.2, contrato 0.11 `registro.ts`). Emula las
// reglas del servidor: cada paso se guarda apenas se completa y la app retoma en `pasoActual`; nunca devuelve el
// domicilio ni los números completos; cargar no es verificar (solo Operations, desde el Panel de prueba); los
// antecedentes se borran al verificarlos; Gas y Aire acondicionado piden matrícula. El mock nunca recibe archivos.
// El estado del registro vive al lado del EstadoMock (sin tocar su forma) y se refleja en `s.perfil`, que siguen
// leyendo la guardia, el Inicio y la Cuenta.
import { RegistroCuentaSchema, CamposCertificadoSchema, EnvioRegistroSchema, GuardarCuitSchema, GuardarDatosRegistroSchema, GuardarDomicilioSchema, GuardarRubrosRegistroSchema, GuardarZonasSchema, MarcarOnboardingSchema, CamposDniSchema, PASOS_REGISTRO, faltantesHabilitacion, rubrosHabilitables, type Certificado, type EstadoPaso, type FaltanteRegistro, type Onboarding, type PasoRegistro, type PrimerPaso, type RegistroEspecialista } from '../../contracts/registro.ts';
import type { z } from 'zod';
import type { EstadoDocumento } from '../../contracts/maquinas.ts';
import { RUBROS, requiereMatricula, type Rubro, NOMBRE_RUBRO } from '../../contracts/rubros.ts';
import { FalloApi } from '../errores.ts';
import { enmascararEmail } from './acceso.ts';
import { ahoraMs, CODIGO_PRUEBA, fallo, idNuevo, iso, MINUTO, type EstadoMock } from './estado.ts';
import { barriosPrueba } from './mapa.ts';
import { zodAFallo } from './validacion.ts';

interface RegistroInterno {
  telefono: string | null;
  domicilio: { barrio: string } | null;
  zonas: string[];
  selfie: EstadoDocumento;
  dni: { frente: EstadoDocumento; dorso: EstadoDocumento; ultimos: string | null };
  cuit: RegistroEspecialista['cuitCuil'];
  certificados: Certificado[];
  antecedentes: RegistroEspecialista['antecedentes'];
  /** Pasos que Operations pidió corregir, con el motivo. */
  correcciones: Map<PasoRegistro, string>;
  onboarding: { bienvenidaVista: boolean; hechos: Set<PrimerPaso>; version: number };
  version: number;
}

const REGISTROS = new WeakMap<EstadoMock, RegistroInterno>();
const COMPLETOS = new Set(['en_revision', 'correccion', 'rechazado', 'habilitado', 'baja']);

function crearRegistro(s: EstadoMock): RegistroInterno {
  const completo = COMPLETOS.has(s.escenario);
  const doc = s.perfil.documentos;
  const verificado = s.perfil.estadoAlta === 'habilitada';
  const r: RegistroInterno = {
    telefono: s.perfil.nombre ? '+5492235554521' : null,
    domicilio: completo || s.escenario === 'incompleto' ? { barrio: 'La Perla' } : null,
    zonas: completo ? (s.disponibilidad.zonas.length ? [...s.disponibilidad.zonas] : ['Centro', 'La Perla', 'Playa Grande', 'Güemes']) : [],
    selfie: doc.fotoCara,
    dni: { frente: doc.dni, dorso: doc.dni, ultimos: s.alta.dni ? s.alta.dni.slice(-3) : null },
    cuit: { estado: doc.cuitCuil, ultimos: s.alta.cuitCuil ? s.alta.cuitCuil.slice(-4) : null, facturacion: completo ? 'monotributo' : null },
    certificados: [],
    antecedentes: { estado: 'faltante', formato: null, cargadoEn: null, verificadoEn: null, archivoBorrado: false },
    correcciones: new Map(),
    onboarding: { bienvenidaVista: verificado, hechos: new Set(verificado ? (['perfil', 'zonas_horarios'] as const) : []), version: 0 },
    version: 1,
  };
  for (const x of s.perfil.rubros) {
    if (!requiereMatricula(x.rubro) || x.matricula === null || x.matricula === 'faltante') continue;
    r.certificados.push(nuevoCertificado(s, { tipo: 'matricula', rubro: x.rubro, nombre: `Matrícula de ${NOMBRE_RUBRO[x.rubro]}`, formato: 'pdf', estado: x.matricula }));
  }
  if (completo) {
    const hace = iso(ahoraMs(s) - 2 * 24 * 60 * MINUTO);
    r.antecedentes = verificado
      ? { estado: 'verificado', formato: 'pdf', cargadoEn: hace, verificadoEn: hace, archivoBorrado: true }
      : { estado: s.escenario === 'rechazado' ? 'verificado' : 'en_revision', formato: 'pdf', cargadoEn: hace, verificadoEn: null, archivoBorrado: false };
    if (s.escenario === 'rechazado') r.antecedentes = { ...r.antecedentes, verificadoEn: hace, archivoBorrado: true };
  }
  if (s.escenario === 'correccion') r.correcciones.set('dni', s.perfil.motivoRevision ?? 'Volvé a sacar la foto del DNI.');
  return r;
}

export function registroDe(s: EstadoMock): RegistroInterno {
  let r = REGISTROS.get(s);
  if (!r) {
    r = crearRegistro(s);
    REGISTROS.set(s, r);
  }
  return r;
}

function nuevoCertificado(s: EstadoMock, d: { tipo: Certificado['tipo']; rubro?: Rubro | null; nombre: string; formato: Certificado['formato']; estado?: EstadoDocumento; venceEn?: string | null }): Certificado {
  const rubro = d.rubro ?? null;
  return {
    id: idNuevo(s),
    tipo: d.tipo,
    rubro,
    nombre: d.nombre,
    obligatorio: d.tipo === 'matricula' && rubro !== null && requiereMatricula(rubro),
    formato: d.formato,
    estado: d.estado ?? 'cargado',
    motivo: null,
    venceEn: d.venceEn ?? null,
    verificadoEn: d.estado === 'verificado' ? iso(ahoraMs(s)) : null,
    enPerfil: d.estado === 'verificado' && d.tipo !== 'matricula',
  };
}

// ── Vista que devuelve el servidor ───────────────────────────────────────────────────────────────
const MAL = new Set<EstadoDocumento>(['faltante', 'rechazado', 'vencido']);

function estadoDoc(...e: EstadoDocumento[]): EstadoPaso {
  if (e.some((x) => x === 'rechazado' || x === 'vencido')) return 'a_corregir';
  if (e.some((x) => x === 'faltante')) return 'pendiente';
  if (e.every((x) => x === 'verificado')) return 'verificado';
  if (e.some((x) => x === 'en_revision')) return 'en_revision';
  return 'completo';
}

function matriculas(s: EstadoMock, r: RegistroInterno): EstadoDocumento[] {
  return s.perfil.rubros.filter((x) => requiereMatricula(x.rubro)).map((x) => r.certificados.find((c) => c.tipo === 'matricula' && c.rubro === x.rubro)?.estado ?? 'faltante');
}

function estadosPasos(s: EstadoMock, r: RegistroInterno): Record<PasoRegistro, EstadoPaso> {
  const hecho = (v: boolean): EstadoPaso => (v ? 'completo' : 'pendiente');
  const e: Record<PasoRegistro, EstadoPaso> = {
    datos: hecho(Boolean(s.alta.datos.nombre && s.alta.datos.apellido)),
    domicilio: hecho(r.domicilio !== null),
    rubros: hecho(s.perfil.rubros.length > 0),
    zonas: hecho(r.zonas.length > 0),
    selfie: estadoDoc(r.selfie),
    dni: estadoDoc(r.dni.frente, r.dni.dorso),
    cuit_cuil: estadoDoc(r.cuit.estado),
    certificados: matriculas(s, r).length ? estadoDoc(...matriculas(s, r)) : 'completo',
    antecedentes: estadoDoc(r.antecedentes.estado),
    revision: s.perfil.estadoAlta === 'borrador' ? 'pendiente' : s.perfil.estadoAlta === 'requiere_correccion' ? 'a_corregir' : 'completo',
  };
  for (const p of r.correcciones.keys()) e[p] = 'a_corregir';
  return e;
}

function faltantesEnvio(s: EstadoMock, r: RegistroInterno): FaltanteRegistro[] {
  const f: FaltanteRegistro[] = [];
  const e = estadosPasos(s, r);
  for (const p of ['datos', 'domicilio', 'rubros', 'zonas'] as const) if (e[p] === 'pendiente' || e[p] === 'a_corregir') f.push(p);
  if (MAL.has(r.selfie) || r.correcciones.has('selfie')) f.push('selfie');
  if (MAL.has(r.dni.frente) || MAL.has(r.dni.dorso) || r.correcciones.has('dni')) f.push('dni');
  if (MAL.has(r.cuit.estado) || r.correcciones.has('cuit_cuil')) f.push('cuit_cuil');
  if (matriculas(s, r).some((m) => MAL.has(m))) f.push('matricula');
  return f;
}

function requisitos(s: EstadoMock, r: RegistroInterno) {
  return {
    selfie: r.selfie,
    dniFrente: r.dni.frente,
    dniDorso: r.dni.dorso,
    cuitCuil: r.cuit.estado,
    antecedentes: r.antecedentes.estado,
    rubros: s.perfil.rubros.map((x) => ({ rubro: x.rubro, matricula: requiereMatricula(x.rubro) ? (r.certificados.find((c) => c.tipo === 'matricula' && c.rubro === x.rubro)?.estado ?? null) : null })),
  };
}

/** Antecedentes y certificados sin matrícula no frenan: se pueden cargar después (hasta entonces no hay pedidos). */
const NO_FRENAN = new Set<PasoRegistro>(['antecedentes', 'revision']);

export function vistaRegistro(s: EstadoMock): RegistroEspecialista {
  const r = registroDe(s);
  const e = estadosPasos(s, r);
  const pasoActual = PASOS_REGISTRO.find((p) => !NO_FRENAN.has(p) && (e[p] === 'pendiente' || e[p] === 'a_corregir')) ?? 'revision';
  const tel = r.telefono;
  return {
    estadoAlta: s.perfil.estadoAlta,
    pasoActual,
    pasos: PASOS_REGISTRO.map((paso) => ({ paso, estado: e[paso], motivo: r.correcciones.get(paso) ?? null })),
    datos: {
      nombre: s.alta.datos.nombre,
      apellido: s.alta.datos.apellido,
      telefonoEnmascarado: tel ? `${tel.slice(4, 7)} •••-${tel.slice(-4)}` : null,
      emailEnmascarado: enmascararEmail(s.cuenta.email),
    },
    domicilio: { cargado: r.domicilio !== null, barrio: r.domicilio?.barrio ?? null },
    rubros: s.perfil.rubros.map((x) => ({ rubro: x.rubro, estado: x.estado, requiereMatricula: requiereMatricula(x.rubro) })),
    zonas: [...r.zonas],
    selfie: r.selfie,
    dni: { ...r.dni },
    cuitCuil: { ...r.cuit },
    certificados: r.certificados.map((c) => ({ ...c })),
    antecedentes: { ...r.antecedentes },
    faltantesEnvio: faltantesEnvio(s, r),
    faltantesHabilitacion: faltantesHabilitacion(requisitos(s, r)),
    motivoRevision: s.perfil.motivoRevision,
    version: r.version,
  };
}

/** Lo que leen la guardia, el Inicio y la Cuenta (PerfilEspecialista) sigue al registro. */
function reflejar(s: EstadoMock, r: RegistroInterno): void {
  const peor = (a: EstadoDocumento, b: EstadoDocumento): EstadoDocumento => (MAL.has(a) ? a : MAL.has(b) ? b : a === 'verificado' ? b : a);
  s.perfil.documentos = { dni: peor(r.dni.frente, r.dni.dorso), cuitCuil: r.cuit.estado, fotoCara: r.selfie };
  s.perfil.antecedentes = r.antecedentes.estado === 'verificado' ? 'aprobada' : 'pendiente_cita';
  for (const x of s.perfil.rubros) {
    if (!requiereMatricula(x.rubro)) continue;
    x.matricula = r.certificados.find((c) => c.tipo === 'matricula' && c.rubro === x.rubro)?.estado ?? 'faltante';
  }
  s.perfil.nombre = s.alta.datos.nombre;
  s.perfil.apellido = s.alta.datos.apellido;
  s.perfil.version += 1;
  r.version += 1;
}

// ── Reglas de escritura ──────────────────────────────────────────────────────────────────────────
const editable = (s: EstadoMock) => s.perfil.estadoAlta === 'borrador' || s.perfil.estadoAlta === 'requiere_correccion';

function exigirEditable(s: EstadoMock): void {
  if (!editable(s)) throw fallo('conflicto', 409, 'transicion_invalida', 'Tu alta ya está enviada: mientras la evaluamos no se puede cambiar.');
}

function exigirVersion(r: RegistroInterno, version: number): void {
  if (version !== r.version) throw fallo('conflicto', 409, 'conflicto_version', 'Tu registro cambió desde otra pantalla. Volvé a cargarlo.');
}

function validar<S extends z.ZodType>(schema: S, datos: unknown): z.infer<S> {
  const ok = schema.safeParse(datos);
  if (!ok.success) throw zodAFallo(ok.error);
  return ok.data;
}

function noEnRevision(estado: EstadoDocumento, que: string): void {
  if (estado === 'en_revision' || estado === 'verificado') throw fallo('conflicto', 409, 'transicion_invalida', `${que} ya está ${estado === 'verificado' ? 'verificado' : 'en revisión'}: no hace falta cargarlo de nuevo.`);
}

function guardar(s: EstadoMock, version: number, hacer: (r: RegistroInterno) => void, { siempre = false } = {}): RegistroEspecialista {
  if (!siempre) exigirEditable(s);
  const r = registroDe(s);
  exigirVersion(r, version);
  hacer(r);
  reflejar(s, r);
  return vistaRegistro(s);
}

export const registroMock = (s: EstadoMock) => ({
  // RG-1: respuesta neutra. Solo una cuenta nueva queda con sesión abierta (y con el código enviado al email).
  crearCuenta(datos: unknown): void {
    const d = validar(RegistroCuentaSchema, datos);
    const email = d.email.toLowerCase();
    if (s.cuentas.has(email)) return;
    s.cuentas.set(email, d.password);
    s.aceptaron.add(email);
    s.intentosFallidos = 0;
    s.sesionActiva = true;
    s.sesionExpirada = false;
    s.cuenta.email = email;
    s.perfil.email = email;
    s.alta.datos = { ...s.alta.datos, nombre: d.nombre, apellido: d.apellido };
    const r = registroDe(s);
    r.telefono = d.telefono;
    reflejar(s, r);
    const ahora = ahoraMs(s);
    s.codigoEmail = { codigo: CODIGO_PRUEBA, venceMs: ahora + 10 * MINUTO, reenviarDesdeMs: ahora + MINUTO, intentos: 0 };
  },
  registro: (): RegistroEspecialista => vistaRegistro(s),
  guardarDatosRegistro(datos: unknown): RegistroEspecialista {
    const d = validar(GuardarDatosRegistroSchema, datos);
    return guardar(s, d.version, (r) => {
      s.alta.datos = { ...s.alta.datos, nombre: d.nombre, apellido: d.apellido };
      r.correcciones.delete('datos');
    });
  },
  guardarDomicilio(datos: unknown): RegistroEspecialista {
    const d = validar(GuardarDomicilioSchema, datos);
    // Se guarda cifrado como un solo valor: el mock se queda solo con el barrio (lo único que vuelve).
    return guardar(s, d.version, (r) => {
      r.domicilio = { barrio: d.barrio };
      s.alta.datos = { ...s.alta.datos, barrio: d.barrio, ciudad: d.ciudad };
      r.correcciones.delete('domicilio');
    });
  },
  guardarRubrosRegistro(datos: unknown): RegistroEspecialista {
    const d = validar(GuardarRubrosRegistroSchema, datos);
    return guardar(s, d.version, (r) => {
      const unicos = RUBROS.filter((x) => d.rubros.includes(x));
      s.perfil.rubros = unicos.map((rubro) => s.perfil.rubros.find((x) => x.rubro === rubro) ?? (requiereMatricula(rubro) ? { rubro, estado: 'requiere_matricula' as const, matricula: 'faltante' as const } : { rubro, estado: 'elegido' as const, matricula: null }));
      r.correcciones.delete('rubros');
    });
  },
  guardarZonas(datos: unknown): RegistroEspecialista {
    const d = validar(GuardarZonasSchema, datos);
    const validos = new Set(barriosPrueba().map((b) => b.id));
    if (d.barrios.some((b) => !validos.has(b))) throw fallo('validacion', 400, 'validacion', 'Hay un barrio que no conocemos.');
    return guardar(s, d.version, (r) => {
      r.zonas = [...new Set(d.barrios)];
      s.disponibilidad = { ...s.disponibilidad, zonas: [...r.zonas], version: s.disponibilidad.version + 1 };
      r.correcciones.delete('zonas');
    });
  },
  cargarSelfie(_foto: Blob | null, version: number): RegistroEspecialista {
    return guardar(s, version, (r) => {
      noEnRevision(r.selfie, 'Tu selfie');
      r.selfie = 'cargado';
      r.correcciones.delete('selfie');
    });
  },
  cargarDni(datos: { frente: Blob | null; dorso: Blob | null; numero: string; version: number }): RegistroEspecialista {
    const d = validar(CamposDniSchema, { numero: datos.numero, version: datos.version });
    return guardar(s, d.version, (r) => {
      noEnRevision(r.dni.frente, 'Tu DNI');
      r.dni = { frente: 'cargado', dorso: 'cargado', ultimos: d.numero.slice(-3) };
      s.alta.dni = d.numero;
      r.correcciones.delete('dni');
    });
  },
  guardarCuit(datos: unknown): RegistroEspecialista {
    const d = validar(GuardarCuitSchema, datos);
    return guardar(s, d.version, (r) => {
      noEnRevision(r.cuit.estado, 'Tu CUIT o CUIL');
      r.cuit = { estado: 'cargado', ultimos: d.cuitCuil.slice(-4), facturacion: d.facturacion };
      s.alta.cuitCuil = d.cuitCuil;
      r.correcciones.delete('cuit_cuil');
    });
  },
  // Un certificado opcional se puede sumar también con el alta en evaluación (D6-Alta → «Sumar un certificado»).
  cargarCertificado(datos: unknown, archivo: { formato: 'foto' | 'pdf' }): Certificado {
    const d = validar(CamposCertificadoSchema, datos);
    if (s.perfil.estadoAlta === 'rechazada' || s.perfil.estadoAlta === 'suspendida') throw fallo('conflicto', 409, 'transicion_invalida', 'No se pueden sumar certificados en este momento.');
    if (archivo.formato !== 'foto' && archivo.formato !== 'pdf') throw new FalloApi('validacion', 415, { codigo: 'tipo_archivo_prohibido', mensaje: 'Ese tipo de archivo no se acepta: usá una foto o un PDF.', requestId: 'req-prueba-0001' });
    const r = registroDe(s);
    if (d.tipo === 'matricula') {
      if (!d.rubro || !s.perfil.rubros.some((x) => x.rubro === d.rubro)) throw fallo('validacion', 400, 'validacion', 'Elegí el rubro de la matrícula.');
      const previa = r.certificados.find((c) => c.tipo === 'matricula' && c.rubro === d.rubro);
      if (previa) {
        noEnRevision(previa.estado, 'Esa matrícula');
        r.certificados = r.certificados.filter((c) => c !== previa);
      }
    }
    const c = nuevoCertificado(s, { tipo: d.tipo, rubro: d.rubro ?? null, nombre: d.nombre, formato: archivo.formato, venceEn: d.venceEn ?? null });
    r.certificados.push(c);
    r.correcciones.delete('certificados');
    reflejar(s, r);
    return { ...c };
  },
  quitarCertificado(id: string): void {
    const r = registroDe(s);
    const c = r.certificados.find((x) => x.id === id);
    if (!c) throw fallo('no_encontrado', 404, 'no_encontrado', 'No encontramos ese certificado.');
    if (c.estado === 'verificado' || c.estado === 'en_revision') throw fallo('conflicto', 409, 'transicion_invalida', 'Ese certificado ya está en revisión o verificado: no se quita desde la app.');
    r.certificados = r.certificados.filter((x) => x !== c);
    reflejar(s, r);
  },
  // Se pueden cargar después de enviar el alta (hasta entonces no hay pedidos).
  cargarAntecedentes(archivo: { formato: 'foto' | 'pdf' }): RegistroEspecialista {
    const r = registroDe(s);
    if (!editable(s) && !(s.perfil.estadoAlta === 'enviada' || s.perfil.estadoAlta === 'en_revision')) exigirEditable(s);
    noEnRevision(r.antecedentes.estado, 'Tu certificado de antecedentes');
    if (archivo.formato !== 'foto' && archivo.formato !== 'pdf') throw new FalloApi('validacion', 415, { codigo: 'tipo_archivo_prohibido', mensaje: 'Ese tipo de archivo no se acepta: usá una foto o un PDF.', requestId: 'req-prueba-0001' });
    r.antecedentes = { estado: 'cargado', formato: archivo.formato, cargadoEn: iso(ahoraMs(s)), verificadoEn: null, archivoBorrado: false };
    r.correcciones.delete('antecedentes');
    reflejar(s, r);
    return vistaRegistro(s);
  },
  enviarRegistro(datos: unknown): RegistroEspecialista {
    const d = validar(EnvioRegistroSchema, datos);
    exigirEditable(s);
    const r = registroDe(s);
    exigirVersion(r, d.version);
    const faltan = faltantesEnvio(s, r);
    if (faltan.length > 0) {
      throw new FalloApi('validacion', 400, { codigo: 'validacion', mensaje: 'Todavía faltan datos para mandar tu alta.', requestId: 'req-prueba-0001', campos: faltan.map((campo) => ({ campo, codigo: 'faltante' })) });
    }
    if (!d.terminosEspecialista || !d.privacidadEspecialista) throw fallo('validacion', 400, 'validacion', 'Para mandar tu alta tenés que aceptar los textos.');
    s.perfil.estadoAlta = 'enviada';
    s.perfil.motivoRevision = null;
    s.perfil.rubros = s.perfil.rubros.map((x) => ({ ...x, estado: 'en_revision' as const }));
    r.correcciones.clear();
    s.avisos.unshift({ id: idNuevo(s), tipo: 'cuenta', titulo: 'Recibimos tu alta', cuerpo: 'Estamos evaluando tu perfil. Te avisamos apenas tengamos una respuesta.', creadoEn: iso(ahoraMs(s)), leido: false, destino: { ruta: 'alta', id: null } });
    reflejar(s, r);
    return vistaRegistro(s);
  },
  onboarding: (): Onboarding => vistaOnboarding(s),
  marcarOnboarding(datos: unknown): Onboarding {
    const d = validar(MarcarOnboardingSchema, datos);
    if (s.perfil.estadoAlta !== 'habilitada') throw fallo('conflicto', 409, 'transicion_invalida', 'Todavía no estás habilitado.');
    const o = registroDe(s).onboarding;
    if (d.version !== o.version) throw fallo('conflicto', 409, 'conflicto_version', 'Tus primeros pasos cambiaron desde otra pantalla.');
    if (d.bienvenidaVista) o.bienvenidaVista = true;
    if (d.pasoHecho) o.hechos.add(d.pasoHecho);
    o.version += 1;
    return vistaOnboarding(s);
  },
});

const ORDEN_PRIMEROS: readonly PrimerPaso[] = ['perfil', 'zonas_horarios', 'cobros', 'lista_precios', 'equipamiento', 'manual'];

function vistaOnboarding(s: EstadoMock): Onboarding {
  const o = registroDe(s).onboarding;
  return {
    bienvenidaVista: o.bienvenidaVista,
    rubrosHabilitados: s.perfil.rubros.filter((x) => x.estado === 'habilitado').map((x) => x.rubro),
    pasos: ORDEN_PRIMEROS.map((paso) => ({ paso, hecho: o.hechos.has(paso) })),
    version: o.version,
  };
}

// ── Operations en el Panel de prueba ─────────────────────────────────────────────────────────────
export function accionesOpsRegistro(s: EstadoMock): Array<{ id: string; etiqueta: string }> {
  const e = s.perfil.estadoAlta;
  const a: Array<{ id: string; etiqueta: string }> = [];
  if (e === 'enviada') a.push({ id: 'ops_revision', etiqueta: 'Tomar el alta en revisión' });
  if (e === 'en_revision') {
    a.push({ id: 'ops_verificar', etiqueta: 'Verificar documentos, matrículas y antecedentes' });
    a.push({ id: 'ops_correccion', etiqueta: 'Pedir una corrección (selfie)' });
    a.push({ id: 'ops_rechazar', etiqueta: 'Rechazar el alta' });
    a.push({ id: 'ops_habilitar', etiqueta: 'Habilitar' });
  }
  return a;
}

/** Ejecuta una acción de Operations sobre el alta. Devuelve false si el id no es de acá. */
export function ejecutarOpsRegistro(s: EstadoMock, id: string, alHabilitar: () => void): boolean {
  const r = registroDe(s);
  const docs = (de: EstadoDocumento, a: EstadoDocumento) => {
    const pasar = (x: EstadoDocumento) => (x === de ? a : x);
    r.selfie = pasar(r.selfie);
    r.dni = { ...r.dni, frente: pasar(r.dni.frente), dorso: pasar(r.dni.dorso) };
    r.cuit = { ...r.cuit, estado: pasar(r.cuit.estado) };
    r.certificados = r.certificados.map((c) => {
      const estado = pasar(c.estado);
      return estado === c.estado ? c : { ...c, estado, verificadoEn: estado === 'verificado' ? iso(ahoraMs(s)) : c.verificadoEn, enPerfil: estado === 'verificado' && c.tipo !== 'matricula' };
    });
    const ant = pasar(r.antecedentes.estado);
    // Verificar los antecedentes BORRA el archivo: queda la constancia (estado, fecha y quién).
    r.antecedentes = ant === 'verificado' && r.antecedentes.estado !== 'verificado' ? { ...r.antecedentes, estado: ant, verificadoEn: iso(ahoraMs(s)), archivoBorrado: true } : { ...r.antecedentes, estado: ant };
  };
  switch (id) {
    case 'ops_revision':
      s.perfil.estadoAlta = 'en_revision';
      docs('cargado', 'en_revision');
      s.nota = 'Operations tomó tu alta en revisión.';
      break;
    case 'ops_verificar':
      docs('en_revision', 'verificado');
      s.nota = r.antecedentes.archivoBorrado ? 'Operations verificó lo cargado. El archivo de antecedentes se borró al verificarlo.' : 'Operations verificó lo cargado. Faltan los antecedentes.';
      break;
    case 'ops_correccion':
      s.perfil.estadoAlta = 'requiere_correccion';
      s.perfil.motivoRevision = 'La selfie se ve oscura. Sacala de nuevo con buena luz, mirando a una ventana.';
      r.selfie = 'rechazado';
      r.correcciones.set('selfie', s.perfil.motivoRevision);
      s.avisos.unshift({ id: idNuevo(s), tipo: 'cuenta', titulo: 'Te pedimos un cambio en tu alta', cuerpo: 'Abrí tu alta para ver qué corregir.', creadoEn: iso(ahoraMs(s)), leido: false, destino: { ruta: 'alta', id: null } });
      s.nota = 'Operations pidió corregir la selfie.';
      break;
    case 'ops_rechazar':
      s.perfil.estadoAlta = 'rechazada';
      s.perfil.motivoRevision = 'No pudimos validar tu alta con la documentación presentada. Si creés que es un error, escribinos desde Ayuda.';
      s.nota = 'Operations rechazó el alta.';
      break;
    case 'ops_habilitar': {
      const faltan = faltantesHabilitacion(requisitos(s, r));
      if (faltan.length > 0) {
        s.nota = `No se puede habilitar: falta verificar ${faltan.join(', ')}. Cargado no es verificado.`;
        return true;
      }
      const ok = new Set(rubrosHabilitables(requisitos(s, r)));
      s.perfil.estadoAlta = 'habilitada';
      s.perfil.motivoRevision = null;
      s.perfil.rubros = s.perfil.rubros.map((x) => ({ ...x, estado: ok.has(x.rubro) ? ('habilitado' as const) : ('requiere_matricula' as const) }));
      r.onboarding.bienvenidaVista = false;
      alHabilitar();
      s.avisos.unshift({ id: idNuevo(s), tipo: 'cuenta', titulo: '¡Estás habilitado!', cuerpo: 'Ya podés recibir pedidos de tus rubros habilitados.', creadoEn: iso(ahoraMs(s)), leido: false, destino: { ruta: 'alta', id: null } });
      s.nota = 'Alta habilitada: aparece «¡Estás habilitado!».';
      break;
    }
    default:
      return false;
  }
  reflejar(s, r);
  return true;
}
