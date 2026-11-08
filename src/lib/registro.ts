// Lógica pura del registro por pasos y el onboarding (lote 1.2, contrato 0.11 `registro.ts`). Lo que decide el
// servidor (qué falta, qué se verificó, en qué paso se retoma) llega en `RegistroEspecialista`; acá solo se ordena y se
// pone en palabras simples para mostrarlo. Pruebas en registro.test.ts.
import type { EstadoAlta, EstadoDocumento } from '../contracts/maquinas.ts';
import { PASOS_REGISTRO, type Certificado, type Facturacion, type PasoRegistro, type PrimerPaso, type RegistroEspecialista } from '../contracts/registro.ts';
import { NOMBRE_RUBRO, requiereMatricula, type Rubro } from '../contracts/rubros.ts';
import type { NombreIconoUi } from '../ui/atomos/Icono.tsx';
import type { TonoChip } from '../ui/atomos/Texto.tsx';

export const TOTAL_PASOS = PASOS_REGISTRO.length;

/** Nombre corto de cada paso, el que va en «Paso N de 10 · …». */
export const NOMBRE_PASO: Record<PasoRegistro, string> = {
  datos: 'Tus datos',
  domicilio: 'Domicilio',
  rubros: 'Rubros',
  zonas: 'Zonas',
  selfie: 'Selfie',
  dni: 'DNI',
  cuit_cuil: 'CUIT o CUIL',
  certificados: 'Certificados',
  antecedentes: 'Antecedentes',
  revision: 'Revisar',
};

export const numeroPaso = (p: PasoRegistro): number => PASOS_REGISTRO.indexOf(p) + 1;
export const pasoAnterior = (p: PasoRegistro): PasoRegistro | null => PASOS_REGISTRO[PASOS_REGISTRO.indexOf(p) - 1] ?? null;
export const pasoSiguiente = (p: PasoRegistro): PasoRegistro | null => PASOS_REGISTRO[PASOS_REGISTRO.indexOf(p) + 1] ?? null;
export const esPasoRegistro = (v: string | null): v is PasoRegistro => v !== null && (PASOS_REGISTRO as readonly string[]).includes(v);

/** El alta se edita en borrador o cuando Operations pidió una corrección. */
export const registroEditable = (e: EstadoAlta): boolean => e === 'borrador' || e === 'requiere_correccion';

/**
 * Qué paso se muestra: el que pidió la persona (`?paso=`) si existe y no está más adelante que el primero sin completar
 * (no se saltean pasos); si no, el que dice el servidor (`pasoActual`): así el registro se retoma donde quedó.
 */
export function pasoAMostrar(r: Pick<RegistroEspecialista, 'pasoActual'>, pedido: string | null): PasoRegistro {
  if (esPasoRegistro(pedido) && numeroPaso(pedido) <= numeroPaso(r.pasoActual)) return pedido;
  return r.pasoActual;
}

// ── Datos de la cuenta ───────────────────────────────────────────────────────────────────────────
/**
 * Celular argentino en E.164 (+549 + característica + número, 10 dígitos). Acepta cómo lo escribe la gente:
 * "223 555-4521", "0223 15 555-4521", "+54 9 223 555 4521". Devuelve null si no se puede interpretar.
 */
export function normalizarTelefono(texto: string): string | null {
  let d = texto.replace(/\D/g, '');
  if (d.startsWith('549')) d = d.slice(3);
  else if (d.startsWith('54')) d = d.slice(2);
  if (d.startsWith('0')) d = d.slice(1);
  // "15" después de la característica (2 a 4 dígitos): se saca.
  if (d.length === 12) {
    for (const largo of [2, 3, 4]) {
      if (d.slice(largo, largo + 2) === '15') {
        d = d.slice(0, largo) + d.slice(largo + 2);
        break;
      }
    }
  }
  return /^\d{10}$/.test(d) && !d.startsWith('0') ? `+549${d}` : null;
}

/** Solo los dígitos del CUIT o CUIL, si son 11 y el dígito verificador es correcto. */
export function cuitValido(texto: string): string | null {
  const d = texto.replace(/\D/g, '');
  if (!/^\d{11}$/.test(d)) return null;
  const pesos = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
  const suma = pesos.reduce((s, p, i) => s + p * Number(d[i]), 0);
  const resto = 11 - (suma % 11);
  const verificador = resto === 11 ? 0 : resto === 10 ? 9 : resto;
  return verificador === Number(d[10]) ? d : null;
}

export const dniValido = (texto: string): string | null => {
  const d = texto.replace(/\D/g, '');
  return /^\d{7,8}$/.test(d) ? d : null;
};

export const NOMBRE_FACTURACION: Record<Facturacion, string> = {
  monotributo: 'Monotributo',
  responsable_inscripto: 'Responsable inscripto',
  todavia_no: 'Todavía no facturo',
};

// ── Estados en palabras ──────────────────────────────────────────────────────────────────────────
export interface EtiquetaEstado {
  texto: string;
  icono: NombreIconoUi;
  tono: TonoChip;
}

/** Estado de un documento. Cargado no es verificado: se dice siempre. */
export const ESTADO_DOCUMENTO: Record<EstadoDocumento, EtiquetaEstado> = {
  faltante: { texto: 'Falta', icono: 'alerta', tono: 'error' },
  cargado: { texto: 'Cargado · falta revisar', icono: 'reloj', tono: 'amarillo' },
  en_revision: { texto: 'En revisión', icono: 'reloj', tono: 'amarillo' },
  verificado: { texto: 'Verificado', icono: 'check', tono: 'exito' },
  rechazado: { texto: 'Hay que corregirlo', icono: 'alerta', tono: 'error' },
  vencido: { texto: 'Vencido', icono: 'alerta', tono: 'error' },
};

export const ESTADO_ALTA: Record<EstadoAlta, { etiqueta: string; titulo: string; texto: string }> = {
  borrador: { etiqueta: 'SIN ENVIAR', titulo: 'Tu alta está a medias', texto: 'Seguí donde quedaste: lo que cargaste ya está guardado.' },
  enviada: { etiqueta: 'ENVIADO · EN EVALUACIÓN', titulo: 'Estamos evaluando tu perfil', texto: 'Revisamos si estás apto para trabajar con Handyx. Cargar un documento todavía no es estar verificado.' },
  en_revision: { etiqueta: 'ENVIADO · EN EVALUACIÓN', titulo: 'Estamos evaluando tu perfil', texto: 'Revisamos si estás apto para trabajar con Handyx. Cargar un documento todavía no es estar verificado.' },
  requiere_correccion: { etiqueta: 'HAY QUE CORREGIR ALGO', titulo: 'Te pedimos un cambio', texto: 'Corregí lo marcado y volvé a mandar tu alta.' },
  habilitada: { etiqueta: 'VERIFICADO POR HANDYX', titulo: 'Tu alta está aprobada', texto: 'Ya podés recibir pedidos de tus rubros habilitados.' },
  rechazada: { etiqueta: 'REVISAMOS TU ALTA', titulo: 'No pudimos habilitarte', texto: 'Si creés que es un error, escribinos desde Ayuda.' },
  suspendida: { etiqueta: 'CUENTA EN PAUSA', titulo: 'Tu cuenta está en pausa', texto: 'Escribinos desde Ayuda para saber cómo seguir.' },
};

// ── Resumen del alta (D6-Alta y RG-10) ───────────────────────────────────────────────────────────
export type EstadoGrupo = 'listo' | 'revision' | 'falta' | 'corregir' | 'opcional';

export const ETIQUETA_GRUPO: Record<EstadoGrupo, EtiquetaEstado> = {
  listo: { texto: 'Listo', icono: 'check', tono: 'exito' },
  revision: { texto: 'En revisión', icono: 'reloj', tono: 'amarillo' },
  falta: { texto: 'Falta', icono: 'alerta', tono: 'error' },
  corregir: { texto: 'Corregir', icono: 'alerta', tono: 'error' },
  opcional: { texto: 'Opcional', icono: 'estrella', tono: 'tinte' },
};

export interface GrupoAlta {
  id: 'datos' | 'trabajo' | 'identidad' | 'cuit' | 'antecedentes' | 'certificados';
  icono: NombreIconoUi;
  titulo: string;
  detalle: string;
  estado: EstadoGrupo;
  /** Paso donde se carga o corrige. */
  paso: PasoRegistro;
}

const FALTA = new Set<EstadoDocumento>(['faltante']);
const MAL = new Set<EstadoDocumento>(['rechazado', 'vencido']);

/** Junta varios documentos en un estado: alcanza uno mal para corregir; listo solo si todos están verificados. */
export function estadoDeDocumentos(estados: readonly EstadoDocumento[]): EstadoGrupo {
  if (estados.some((e) => MAL.has(e))) return 'corregir';
  if (estados.some((e) => FALTA.has(e))) return 'falta';
  if (estados.every((e) => e === 'verificado')) return 'listo';
  return 'revision';
}

export const nombresRubros = (rubros: readonly Rubro[]): string => {
  const n = rubros.map((r) => NOMBRE_RUBRO[r]);
  return n.length <= 1 ? (n[0] ?? '') : `${n.slice(0, -1).join(', ')} y ${n.at(-1)}`;
};

export const plural = (n: number, uno: string, varios: string): string => `${n} ${n === 1 ? uno : varios}`;

/** Matrículas obligatorias por rubro elegido (Gas, Aire acondicionado), con la cargada si hay. */
export function matriculasPedidas(r: Pick<RegistroEspecialista, 'rubros' | 'certificados'>): Array<{ rubro: Rubro; certificado: Certificado | null }> {
  return r.rubros
    .filter((x) => requiereMatricula(x.rubro))
    .map((x) => ({ rubro: x.rubro, certificado: r.certificados.find((c) => c.tipo === 'matricula' && c.rubro === x.rubro) ?? null }));
}

export function gruposAlta(r: RegistroEspecialista): GrupoAlta[] {
  const estadoPaso = (p: PasoRegistro) => r.pasos.find((x) => x.paso === p)?.estado ?? 'pendiente';
  const completo = (p: PasoRegistro) => estadoPaso(p) !== 'pendiente' && estadoPaso(p) !== 'a_corregir';
  const corregir = (...p: PasoRegistro[]) => p.some((x) => estadoPaso(x) === 'a_corregir');
  const rubros = r.rubros.map((x) => x.rubro);
  const matriculas = matriculasPedidas(r);
  const opcionales = r.certificados.filter((c) => !c.obligatorio);
  return [
    {
      id: 'datos',
      icono: 'cuenta',
      titulo: 'Datos y domicilio',
      detalle: r.domicilio.barrio ? `${r.domicilio.barrio} · cifrado` : 'Cifrados',
      estado: corregir('datos', 'domicilio') ? 'corregir' : completo('datos') && completo('domicilio') ? 'listo' : 'falta',
      paso: completo('datos') ? 'domicilio' : 'datos',
    },
    {
      id: 'trabajo',
      icono: 'herramienta',
      titulo: 'Rubros y zonas',
      detalle: rubros.length ? `${nombresRubros(rubros)} · ${plural(r.zonas.length, 'barrio', 'barrios')}` : 'Elegí en qué trabajás',
      estado: corregir('rubros', 'zonas') ? 'corregir' : completo('rubros') && completo('zonas') ? 'listo' : 'falta',
      paso: completo('rubros') ? 'zonas' : 'rubros',
    },
    {
      id: 'identidad',
      icono: 'cara',
      titulo: 'Selfie y DNI',
      detalle: r.dni.ultimos ? `DNI terminado en ${r.dni.ultimos} · lo comparamos con tu selfie` : 'Lo comparamos con tu selfie',
      estado: estadoDeDocumentos([r.selfie, r.dni.frente, r.dni.dorso]),
      paso: r.selfie === 'faltante' || MAL.has(r.selfie) ? 'selfie' : 'dni',
    },
    {
      id: 'cuit',
      icono: 'documento',
      titulo: matriculas.length ? `CUIT y ${matriculas.length === 1 && matriculas[0] ? `matrícula de ${NOMBRE_RUBRO[matriculas[0].rubro]}` : 'matrículas'}` : 'CUIT o CUIL',
      detalle: matriculas.length ? `Obligatoria para ${nombresRubros(matriculas.map((m) => m.rubro))}` : r.cuitCuil.ultimos ? `Terminado en ${r.cuitCuil.ultimos}` : 'Para tu perfil y tus facturas',
      estado: estadoDeDocumentos([r.cuitCuil.estado, ...matriculas.map((m) => m.certificado?.estado ?? 'faltante')]),
      paso: r.cuitCuil.estado === 'faltante' || MAL.has(r.cuitCuil.estado) ? 'cuit_cuil' : 'certificados',
    },
    {
      id: 'antecedentes',
      icono: 'escudo',
      titulo: 'Antecedentes penales',
      detalle: r.antecedentes.archivoBorrado
        ? 'Verificados · el archivo ya se borró'
        : r.antecedentes.estado === 'faltante'
          ? 'Sin cargar: hasta que lo cargues no recibís pedidos'
          : `${r.antecedentes.formato === 'pdf' ? 'PDF' : 'Foto'} cargada · se borra al verificarte`,
      estado: estadoDeDocumentos([r.antecedentes.estado]),
      paso: 'antecedentes',
    },
    {
      id: 'certificados',
      icono: 'estrella',
      titulo: 'Certificados opcionales',
      detalle: opcionales.length ? `${plural(opcionales.length, 'cargado', 'cargados')} · ${plural(opcionales.filter((c) => c.estado === 'verificado').length, 'verificado', 'verificados')}` : 'Sumá los tuyos: los ven los clientes',
      estado: opcionales.length === 0 ? 'opcional' : estadoDeDocumentos(opcionales.map((c) => c.estado)),
      paso: 'certificados',
    },
  ];
}

/** Los obligatorios para habilitar que ya están listos (el sexto, certificados opcionales, no cuenta). */
export function avanceAlta(grupos: readonly GrupoAlta[]): { listos: number; total: number } {
  const oblig = grupos.filter((g) => g.id !== 'certificados');
  return { listos: oblig.filter((g) => g.estado === 'listo').length, total: oblig.length };
}

// ── Textos legales del registro (provisorios: los aprueba Legal antes de producción) ──────────────
export const TERMINOS_ESPECIALISTA_VERSION = 'esp-terminos-especialista-2026-11-08-prov';
export const PRIVACIDAD_ESPECIALISTA_VERSION = 'esp-privacidad-especialista-2026-11-08-prov';

export const RESUMEN_TERMINOS = [
  'Sos independiente: no trabajás para Handyx. Vos ponés tu precio y no estás obligado a aceptar ningún pedido.',
  'El cliente te paga directo a vos (Mercado Pago o efectivo). Handyx no te cobra comisión, nunca.',
  'Para habilitarte revisamos tu identidad, tus antecedentes y, en Gas y Aire acondicionado, tu matrícula.',
];

export const RESUMEN_PRIVACIDAD = [
  'Tu domicilio, tu DNI, tu CUIT o CUIL y tu selfie se guardan cifrados. Los clientes ven solo tu nombre, tu foto y tus rubros.',
  'El certificado de antecedentes lo ve solo el equipo de verificación de Handyx, nunca va a una inteligencia artificial y se borra al verificarte.',
  'Podés pedir la baja de tu cuenta y de tus datos desde la app.',
];

// ── Onboarding ───────────────────────────────────────────────────────────────────────────────────
export const PRIMER_PASO: Record<PrimerPaso, { icono: NombreIconoUi; titulo: string; detalle: string }> = {
  perfil: { icono: 'cuenta', titulo: 'Completá tu perfil', detalle: 'Foto y una presentación corta' },
  zonas_horarios: { icono: 'pin', titulo: 'Revisá zonas y horarios', detalle: 'Cuándo y dónde trabajás' },
  cobros: { icono: 'billete', titulo: 'Cargá cómo cobrás', detalle: 'Mercado Pago o efectivo' },
  lista_precios: { icono: 'ticket', titulo: 'Armá tu lista de precios', detalle: 'Con una foto del corralón' },
  equipamiento: { icono: 'caja', titulo: 'Sumá tu equipamiento', detalle: 'Herramientas y consumibles' },
  manual: { icono: 'libro', titulo: 'Leé el manual', detalle: 'Capítulos cortos' },
};
