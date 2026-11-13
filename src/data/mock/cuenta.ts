import {
  AvisoBandejaSchema,
  type AvisoBandeja,
  type ExportacionDatos,
  GuardarPresentacionSchema,
  type PerfilPropio,
} from '../../contracts/cuenta.ts';
import { PreferenciasSchema, type Baja, type FeeVigente } from '../../contracts/dto.ts';
import { POLITICA_FEE_DEMO } from '../../contracts/fee.ts';
import { RegistroEspecialistaSchema, type RegistroEspecialista } from '../../contracts/registro.ts';
import { CODIGOS_RESPALDO_CANTIDAD, CambioSegundaVerificacionSchema, ConfirmarTotpSchema, ReautenticacionSchema, type AltaTotp, type CodigosRespaldo, type Seguridad } from '../../contracts/seguridad.ts';
import type { Pagina } from '../api/tipos.ts';
import type { PreferenciasCuenta } from '../api/cuenta.ts';
import { FalloApi } from '../errores.ts';
import { CLAVE_TOTP_PRUEBA, CODIGO_TOTP_PRUEBA, extraCuenta } from './cuenta-estado.ts';
import { ahoraMs, fallo, iso, type EstadoMock } from './estado.ts';
import { zodAFallo } from './validacion.ts';

const HORA = 3_600_000;

/** 400 con el campo que no coincide (contrato 0.11.0: `campos: [{ campo, codigo: 'incorrecto' }]`). */
const incorrecto = (campo: 'codigo' | 'password', mensaje: string) =>
  new FalloApi('validacion', 400, { codigo: 'validacion', mensaje, requestId: 'req-prueba-0001', campos: [{ campo, codigo: 'incorrecto' }] });

const enmascararEmail = (email: string): string => {
  const [u = '', d = ''] = email.split('@');
  return `${u.slice(0, 2)}•••@${d}`;
};

/** Los cambios sensibles piden la contraseña o un código de la app autenticadora. */
function reautenticar(s: EstadoMock, r: unknown): void {
  const ok = ReautenticacionSchema.safeParse(r);
  if (!ok.success) throw zodAFallo(ok.error);
  const { password, codigo } = ok.data;
  if (password !== null) {
    if (password !== s.cuentas.get(s.cuenta.email)) throw incorrecto('password', 'La contraseña no coincide.');
    return;
  }
  const e = extraCuenta(s);
  if (!e.totp || codigo !== CODIGO_TOTP_PRUEBA) throw incorrecto('codigo', 'El código no coincide.');
}

/** Códigos de respaldo sintéticos: `AAAAA-00001`. Cada tanda es distinta (los anteriores dejan de valer). */
function codigosNuevos(tanda: number): string[] {
  return Array.from({ length: CODIGOS_RESPALDO_CANTIDAD }, (_, i) => `HX${(tanda * 7 + 10).toString(36).toUpperCase().padStart(3, '0')}-${(i + 1).toString().padStart(5, '0')}`.slice(0, 11));
}

function perfilPropio(s: EstadoMock): PerfilPropio {
  const e = extraCuenta(s);
  const nombre = [s.perfil.nombre, s.perfil.apellido].filter(Boolean).join(' ');
  const iniciales = ((s.perfil.nombre?.[0] ?? '') + (s.perfil.apellido?.[0] ?? '')).toUpperCase() || 'HX';
  const matriculas = s.perfil.rubros
    .filter((r) => r.matricula === 'verificado' || r.matricula === 'en_revision' || r.matricula === 'cargado')
    .map((r) => ({ rubro: r.rubro, estado: r.matricula === 'verificado' ? ('verificada' as const) : ('en_revision' as const), venceEn: r.matricula === 'verificado' ? '2028-03-31' : null }));
  return {
    nombrePublico: nombre || null,
    iniciales,
    foto: null, // el mock no tiene a dónde subir la foto: la pantalla muestra las iniciales
    presentacion: e.presentacion,
    rubros: s.perfil.rubros.map((r) => ({ rubro: r.rubro, habilitado: r.estado === 'habilitado' })),
    verificado: s.perfil.estadoAlta === 'habilitada',
    matriculas,
    certificadosVerificados: matriculas.filter((m) => m.estado === 'verificada').length,
    certificadosEnRevision: matriculas.filter((m) => m.estado === 'en_revision').length,
    trabajosVerificados: s.trabajos.filter((t) => t.trabajo.estado === 'finalizado').length,
    enHandyxDesde: '2026-11',
    version: e.perfilVersion,
  };
}

/** `GET /registro` derivado del perfil del mock: estados y últimos dígitos, nunca el domicilio ni los números completos. */
function registro(s: EstadoMock): RegistroEspecialista {
  const p = s.perfil;
  const antecedentes = p.antecedentes === 'aprobada' ? 'verificado' : p.antecedentes === 'cita_coordinada' ? 'cargado' : 'faltante';
  const ultimos = (v: string | null) => (v ? v.slice(-3) : null);
  const r: RegistroEspecialista = {
    estadoAlta: p.estadoAlta,
    pasoActual: 'revision',
    pasos: (['datos', 'domicilio', 'rubros', 'zonas', 'selfie', 'dni', 'cuit_cuil', 'certificados', 'antecedentes', 'revision'] as const).map((paso) => ({ paso, estado: 'completo' as const, motivo: null })),
    datos: { nombre: p.nombre, apellido: p.apellido, telefonoEnmascarado: '223 •••-4521', emailEnmascarado: enmascararEmail(p.email) },
    domicilio: { cargado: s.alta.datos.barrio !== null, barrio: s.alta.datos.barrio },
    rubros: p.rubros.map((x) => ({ rubro: x.rubro, estado: x.estado, requiereMatricula: x.rubro === 'gas' || x.rubro === 'aire_acondicionado' })),
    zonas: s.disponibilidad.zonas,
    selfie: p.documentos.fotoCara,
    dni: { frente: p.documentos.dni, dorso: p.documentos.dni, ultimos: ultimos(s.alta.dni) },
    cuitCuil: { estado: p.documentos.cuitCuil, ultimos: ultimos(s.alta.cuitCuil), facturacion: null },
    certificados: p.rubros
      .filter((x) => x.matricula && x.matricula !== 'faltante')
      .map((x, i) => ({
        id: `00000000-0000-4000-8000-0000000c0${i + 1}${i}`,
        tipo: 'matricula' as const,
        rubro: x.rubro,
        nombre: x.rubro === 'gas' ? 'Matrícula de gasista' : 'Matrícula',
        obligatorio: x.rubro === 'gas' || x.rubro === 'aire_acondicionado',
        formato: 'pdf' as const,
        estado: x.matricula ?? 'cargado',
        motivo: null,
        venceEn: null,
        verificadoEn: x.matricula === 'verificado' ? iso(ahoraMs(s) - 7 * 24 * HORA) : null,
        enPerfil: x.matricula === 'verificado',
      })),
    antecedentes: {
      estado: antecedentes,
      formato: antecedentes === 'faltante' ? null : 'pdf',
      cargadoEn: antecedentes === 'faltante' ? null : iso(ahoraMs(s) - 8 * 24 * HORA),
      verificadoEn: antecedentes === 'verificado' ? iso(ahoraMs(s) - 7 * 24 * HORA) : null,
      // Verificado, el archivo se borra: queda la constancia (estado, fecha y quién).
      archivoBorrado: antecedentes === 'verificado',
    },
    faltantesEnvio: [],
    faltantesHabilitacion: [],
    motivoRevision: p.motivoRevision,
    version: p.version,
  };
  return RegistroEspecialistaSchema.parse(r);
}

function seguridad(s: EstadoMock): Seguridad {
  const e = extraCuenta(s);
  return {
    segundaVerificacion: {
      activa: e.totp || e.email2fa,
      preferido: e.totp ? 'totp' : e.email2fa ? 'email' : null,
      metodos: [
        { metodo: 'totp', activo: e.totp, detalle: 'Google Authenticator, Microsoft o la que uses', disponible: true },
        // Sin proveedor de SMS autorizado, el método no se puede activar (el servidor responde 503).
        { metodo: 'sms', activo: false, detalle: 'Al que termina en 4521', disponible: false },
        { metodo: 'email', activo: e.email2fa, detalle: `A ${enmascararEmail(s.cuenta.email)}`, disponible: true },
      ],
    },
    codigosRespaldo: { restantes: e.respaldo.restantes, generadosEn: e.respaldo.generadosEn },
    telefono: { enmascarado: '223 •••-4521', verificado: true },
    claveCambiadaEn: null,
    dispositivos: e.dispositivos,
    version: e.seguridadVersion,
  };
}

/** El campo solo viaja cuando está encendida (es opcional en el contrato hasta 1.0.0). */
const conLetra = (s: EstadoMock): PreferenciasCuenta => ({ ...s.preferencias, ...(extraCuenta(s).letraGrande ? { letraGrande: true } : {}) });

const aBandeja = (s: EstadoMock): AvisoBandeja[] =>
  s.avisos
    .map((a) =>
      AvisoBandejaSchema.parse({
        id: a.id,
        tipo: a.tipo,
        titulo: a.titulo.slice(0, 80),
        cuerpo: a.cuerpo.slice(0, 140),
        iniciales: null,
        creadoEn: a.creadoEn,
        leido: a.leido,
        destino: { ruta: a.destino.ruta === 'hilo' ? 'chat' : a.destino.ruta === 'caja' ? 'cobros' : a.destino.ruta === 'alta' ? 'registro' : a.destino.ruta, id: a.destino.id },
      }),
    )
    .sort((x, y) => Date.parse(y.creadoEn) - Date.parse(x.creadoEn));

export const cuenta = (s: EstadoMock) => ({
  feeVigente: (): FeeVigente => ({ politica: POLITICA_FEE_DEMO, avisoAceptadoEn: s.feeAvisoEn }),
  aceptarAvisoFee(politicaId: string, version: number): FeeVigente {
    if (politicaId !== POLITICA_FEE_DEMO.id || version !== POLITICA_FEE_DEMO.version) {
      throw fallo('conflicto', 409, 'conflicto_version', 'El aviso cambió. Volvé a abrirlo.');
    }
    s.feeAvisoEn ??= iso(ahoraMs(s));
    return { politica: POLITICA_FEE_DEMO, avisoAceptadoEn: s.feeAvisoEn };
  },

  preferencias: (): PreferenciasCuenta => (conLetra(s)),
  guardarPreferencias(p: unknown): PreferenciasCuenta {
    // `letraGrande` se suma al contrato en 0.11.x (lote 1.5): hasta entonces se valida acá aparte.
    const { letraGrande, ...resto } = (p ?? {}) as Record<string, unknown>;
    if (letraGrande !== undefined && typeof letraGrande !== 'boolean') throw fallo('validacion', 400, 'validacion', 'Revisá los datos ingresados.');
    const ok = PreferenciasSchema.omit({ push: true }).safeParse(resto);
    if (!ok.success) throw zodAFallo(ok.error);
    s.preferencias = { ...s.preferencias, ...ok.data };
    if (typeof letraGrande === 'boolean') extraCuenta(s).letraGrande = letraGrande;
    return conLetra(s);
  },
  // Opt-in contextual: el permiso del dispositivo puede ser rechazado y la entrega nunca está garantizada.
  activarPush(): PreferenciasCuenta {
    s.preferencias.push = s.pushRechazado ? 'rechazado' : 'activado';
    return conLetra(s);
  },

  baja: (): Baja | null => s.baja,
  solicitarBaja(): Baja {
    if (s.baja && s.baja.estado !== 'cancelada') throw fallo('conflicto', 409, 'transicion_invalida', 'Ya tenés una solicitud de baja.');
    s.baja = {
      estado: 'solicitada',
      solicitadaEn: iso(ahoraMs(s)),
      mensaje: 'Recibimos tu solicitud. Todavía no se borró nada: podés cancelarla mientras esté en este estado. Cerramos tus sesiones y no vas a recibir pedidos.',
    };
    s.perfil.baja = 'solicitada';
    s.sesionActiva = false; // la baja bloquea las sesiones
    return s.baja;
  },
  cancelarBaja(): void {
    if (!s.baja || s.baja.estado !== 'solicitada') throw fallo('conflicto', 409, 'transicion_invalida', 'Esta solicitud ya no se puede cancelar.');
    s.baja = null;
    s.perfil.baja = null;
  },

  // ── Perfil propio ──
  perfilPropio: (): PerfilPropio => perfilPropio(s),
  guardarPresentacion(g: unknown): PerfilPropio {
    const ok = GuardarPresentacionSchema.safeParse(g);
    if (!ok.success) throw zodAFallo(ok.error);
    const e = extraCuenta(s);
    if (ok.data.version !== e.perfilVersion) throw fallo('conflicto', 409, 'conflicto_version', 'Tu perfil cambió. Volvé a abrirlo.');
    e.presentacion = ok.data.presentacion && ok.data.presentacion.length > 0 ? ok.data.presentacion : null;
    e.perfilVersion += 1;
    return perfilPropio(s);
  },
  cambiarFotoPerfil(): PerfilPropio {
    const e = extraCuenta(s);
    e.fotoCambiada = true;
    e.perfilVersion += 1;
    return perfilPropio(s);
  },

  datosYVerificacion: (): RegistroEspecialista => registro(s),

  // ── Seguridad ──
  seguridad: (): Seguridad => seguridad(s),
  iniciarTotp(r: unknown): AltaTotp {
    reautenticar(s, r);
    const e = extraCuenta(s);
    if (e.totp) throw fallo('conflicto', 409, 'transicion_invalida', 'La app autenticadora ya está activa.');
    e.altaTotp = { alta: `alta-prueba-${e.seguridadVersion}-0000000`, venceMs: ahoraMs(s) + 10 * 60_000 };
    return {
      alta: e.altaTotp.alta,
      otpauthUri: `otpauth://totp/Handyx:${encodeURIComponent(s.cuenta.email)}?secret=${CLAVE_TOTP_PRUEBA.replaceAll(' ', '')}&issuer=Handyx`,
      claveTexto: CLAVE_TOTP_PRUEBA,
      venceEn: iso(e.altaTotp.venceMs),
    };
  },
  confirmarTotp(c: unknown): CodigosRespaldo {
    const ok = ConfirmarTotpSchema.safeParse(c);
    if (!ok.success) throw zodAFallo(ok.error);
    const e = extraCuenta(s);
    if (!e.altaTotp || e.altaTotp.alta !== ok.data.alta || e.altaTotp.venceMs < ahoraMs(s)) {
      throw fallo('conflicto', 409, 'transicion_invalida', 'La clave venció. Empezá de nuevo para ver otra.');
    }
    if (ok.data.codigo !== CODIGO_TOTP_PRUEBA) throw incorrecto('codigo', 'Ese código no coincide. Escribí el que muestra la app ahora.');
    e.totp = true;
    e.altaTotp = null;
    e.seguridadVersion += 1;
    e.respaldo = { restantes: CODIGOS_RESPALDO_CANTIDAD, generadosEn: iso(ahoraMs(s)) };
    return { codigos: codigosNuevos(e.seguridadVersion), generadosEn: iso(ahoraMs(s)) };
  },
  cambiarSegundaVerificacion(c: unknown): Seguridad {
    const ok = CambioSegundaVerificacionSchema.safeParse(c);
    if (!ok.success) throw zodAFallo(ok.error);
    reautenticar(s, ok.data.reautenticacion);
    const e = extraCuenta(s);
    if (ok.data.version !== e.seguridadVersion) throw fallo('conflicto', 409, 'conflicto_version', 'Tu seguridad cambió. Volvé a abrirla.');
    if (ok.data.metodo === 'sms') throw fallo('servidor', 503, 'servicio_no_disponible', 'Los códigos por SMS todavía no están disponibles.');
    if (ok.data.metodo === 'totp') {
      if (ok.data.activo) throw fallo('conflicto', 409, 'transicion_invalida', 'Para activar la app autenticadora escaneá la clave y confirmá con un código.');
      e.totp = false;
    } else {
      e.email2fa = ok.data.activo;
    }
    if (!e.totp && !e.email2fa) e.respaldo = { restantes: 0, generadosEn: null };
    e.seguridadVersion += 1;
    return seguridad(s);
  },
  generarCodigosRespaldo(r: unknown): CodigosRespaldo {
    reautenticar(s, r);
    const e = extraCuenta(s);
    if (!e.totp && !e.email2fa) throw fallo('conflicto', 409, 'transicion_invalida', 'Activá la segunda verificación para tener códigos de respaldo.');
    e.seguridadVersion += 1;
    e.respaldo = { restantes: CODIGOS_RESPALDO_CANTIDAD, generadosEn: iso(ahoraMs(s)) };
    return { codigos: codigosNuevos(e.seguridadVersion), generadosEn: iso(ahoraMs(s)) };
  },
  // Uno ajeno, inexistente o el de este teléfono responde igual: no se revela nada.
  cerrarDispositivo(id: string): void {
    const e = extraCuenta(s);
    e.dispositivos = e.dispositivos.filter((d) => d.id !== id || d.esEste);
  },

  // ── Bandeja de avisos: una vista de los avisos del mock (los mismos que ve la vigía) ──
  bandeja(): Pagina<AvisoBandeja> {
    return { items: aBandeja(s), siguienteCursor: null };
  },
  marcarLeidoEnBandeja(id: string): void {
    const a = s.avisos.find((x) => x.id === id);
    if (a) a.leido = true;
  },
  borrarDeBandeja(id: string): void {
    s.avisos = s.avisos.filter((x) => x.id !== id);
  },
  vaciarBandeja(): void {
    s.avisos = [];
  },

  // ── Descargar mis datos ──
  exportacionDatos: (): ExportacionDatos | null => extraCuenta(s).exportacion,
  pedirExportacionDatos(r: unknown): ExportacionDatos {
    reautenticar(s, r);
    const e = extraCuenta(s);
    if (e.exportacion && e.exportacion.estado !== 'vencida') throw fallo('conflicto', 409, 'transicion_invalida', 'Ya pediste tus datos. Te avisamos cuando estén.');
    const ahora = ahoraMs(s);
    e.exportacion = { estado: 'pedida', pedidaEn: iso(ahora), listaAntesDe: iso(ahora + 48 * HORA), descarga: null };
    return e.exportacion;
  },
});
