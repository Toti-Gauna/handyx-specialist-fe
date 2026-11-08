// Modo trabajo y cierre en el mock (lote 2.3, contrato 0.11.0): tareas que empiezan por la seguridad, cronómetro con
// tramos, fotos (sintéticas: el mock nunca lee ni guarda una imagen real), notas, antes y después, informe que se
// completa solo, conformidad y garantía, y «Pedir ayuda» con los contactos profesionales. Todo es de PRUEBA.
// El estado del lote vive en un WeakMap atado al arreglo `s.trabajos` (no al EstadoMock): así sobrevive al cambio de
// escenario del Panel de prueba, que copia los campos de un estado nuevo con Object.assign.
import type { ChatResumen } from '../../contracts/chat.ts';
import { monto } from '../../contracts/dinero.ts';
import type { LlamadaPuente } from '../../contracts/dto.ts';
import { SumarAyudaSchema, type ContactoProfesional, type InvitacionObra } from '../../contracts/equipo.ts';
import {
  CambioTareaSchema,
  EnvioInformeSchema,
  GARANTIA_DIAS_DEFECTO,
  GuardarAntesDespuesSchema,
  GuardarSeccionInformeSchema,
  MOMENTOS_FOTO,
  NuevaNotaSchema,
  NuevaTareaSchema,
  SECCIONES_INFORME,
  type AntesDespues,
  type EstadoConformidad,
  type InformeTrabajo,
  type ModoTrabajo,
  type SeccionInforme,
  type Tarea,
} from '../../contracts/modo-trabajo.ts';
import type { Rubro } from '../../contracts/rubros.ts';
import { hoyBA, sumarDias, textoFecha } from '../../ui/logicaModo.ts';
import type { MomentoFoto } from '../api/modo-trabajo.ts';
import { ahoraMs, fallo, idempotente, idFijo, idNuevo, iso, type EstadoMock, type TrabajoInterno } from './estado.ts';
import { agregarMensaje } from './propuestas.ts';
import { zodAFallo } from './validacion.ts';

const MIN = 60_000;
const HORA = 60 * MIN;

// ── Ids y datos sembrados ─────────────────────────────────────────────────────────────────────────

export const ID_MODO = {
  /** "Pierde el depósito del inodoro" de Julián Ortiz: empezó ayer y sigue hoy (Modo trabajo andando). */
  deposito: idFijo(0x23001),
  depositoPedido: idFijo(0x23002),
  depositoPropuesta: idFijo(0x23003),
  depositoChat: idFijo(0x23004),
  diego: idFijo(0x23011),
  pablo: idFijo(0x23012),
  sofia: idFijo(0x23013),
} as const;

/** Número puente de prueba: no existe en ningún país, así que no llama a nadie. */
const PUENTE_PRUEBA = '+0000000000';

// ── Fotos y PDF sintéticos ────────────────────────────────────────────────────────────────────────

/** La canilla (o el arreglo) antes y después, dibujada: nunca es una foto real. */
function fotoPrueba(momento: MomentoFoto): string {
  const despues = momento === 'despues';
  const cuerpo = despues ? '#1F57A8' : '#9AA3B2';
  const fondo = despues ? '#E8F0FB' : '#D6DAE1';
  const gotas = despues ? '' : [128, 150, 172].map((y) => `<path d="M98 ${y} q4 7 0 10 q-4 -3 0 -10z" fill="#5E8FD6"/>`).join('');
  const marca = despues ? '<path d="M126 150 l8 8 16 -18" stroke="#1E9E57" stroke-width="7" fill="none" stroke-linecap="round" stroke-linejoin="round"/>' : '<circle cx="80" cy="74" r="5" fill="#B58A5A"/><circle cx="118" cy="66" r="4" fill="#B58A5A"/>';
  const durante = momento === 'durante' ? '<rect x="120" y="20" width="36" height="14" rx="4" fill="#F5F59A"/>' : '';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="170" height="200" viewBox="0 0 170 200"><rect width="170" height="200" fill="${fondo}"/><rect y="160" width="170" height="40" fill="${despues ? '#C9D6EC' : '#BFC5CF'}"/><rect x="40" y="40" width="22" height="70" rx="6" fill="${cuerpo}"/><path d="M50 52 h40 a16 16 0 0 1 16 16 v40" stroke="${cuerpo}" stroke-width="16" fill="none" stroke-linecap="round"/><rect x="80" y="24" width="44" height="12" rx="6" fill="${cuerpo}"/>${gotas}${marca}${durante}</svg>`;
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
}

/** Un PDF de una página con un texto de prueba (sin datos del cliente). */
function pdfPrueba(lineas: readonly string[]): string {
  const ascii = (t: string) => t.normalize('NFD').replace(/[^\x20-\x7e]/g, '').replace(/[()\\]/g, '');
  const flujo = `BT /F1 14 Tf 50 780 Td 18 TL ${lineas.map((l) => `(${ascii(l)}) Tj T*`).join(' ')} ET`;
  const objetos = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>',
    `<< /Length ${flujo.length} >>\nstream\n${flujo}\nendstream`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
  ];
  let pdf = '%PDF-1.4\n';
  const offsets: number[] = [];
  objetos.forEach((o, i) => {
    offsets.push(pdf.length);
    pdf += `${i + 1} 0 obj\n${o}\nendobj\n`;
  });
  const xref = pdf.length;
  pdf += `xref\n0 ${objetos.length + 1}\n0000000000 65535 f \n${offsets.map((n) => `${String(n).padStart(10, '0')} 00000 n \n`).join('')}`;
  pdf += `trailer\n<< /Size ${objetos.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return `data:application/pdf;base64,${btoa(pdf)}`;
}

// ── Estado del lote ───────────────────────────────────────────────────────────────────────────────

interface InformeInterno {
  textos: Partial<Record<SeccionInforme, string>>;
  enviadoEn: number | null;
  garantiaDias: number | null;
  recordatorio: string | null;
  conformidad: EstadoConformidad;
  conformidadEn: number | null;
  version: number;
}

interface ModoInterno {
  estado: ModoTrabajo['estado'];
  tramos: ModoTrabajo['tramos'];
  tareas: Tarea[];
  fotos: ModoTrabajo['fotos'];
  notas: ModoTrabajo['notas'];
  version: number;
  ad: { antes: string | null; despues: string | null; cambios: AntesDespues['cambios']; version: number };
  informe: InformeInterno;
}

interface ExtraModo {
  modos: Map<string, ModoInterno>;
  contactos: ContactoProfesional[];
  invitaciones: InvitacionObra[];
}

const extras = new WeakMap<object, ExtraModo>();
function extra(s: EstadoMock): ExtraModo {
  let e = extras.get(s.trabajos);
  if (!e) {
    e = { modos: new Map(), contactos: contactosPrueba(s), invitaciones: [] };
    extras.set(s.trabajos, e);
  }
  return e;
}

function contactosPrueba(s: EstadoMock): ContactoProfesional[] {
  const pro = (n: number, nombre: string, iniciales: string, rubros: Rubro[]) => ({ id: idFijo(n), nombre, iniciales, rubros, verificado: true });
  const hoy19 = Date.parse(`${hoyBA(new Date(ahoraMs(s)))}T22:00:00.000Z`); // 19:00 en Buenos Aires
  return [
    { id: ID_MODO.diego, profesional: pro(0x23021, 'Diego Herrera', 'DH', ['electricidad']), estado: 'disponible', ocupadoHasta: null, chatId: null },
    { id: ID_MODO.pablo, profesional: pro(0x23022, 'Pablo Vega', 'PV', ['gas']), estado: 'ocupado', ocupadoHasta: iso(hoy19), chatId: null },
    { id: ID_MODO.sofia, profesional: pro(0x23023, 'Sofía Ruiz', 'SR', ['albanileria']), estado: 'en_obra', ocupadoHasta: null, chatId: null },
  ];
}

/** Tareas de cada rubro, con la seguridad primero (en producción las arma el servidor con el alcance acordado). */
const TAREAS_RUBRO: Record<Rubro, Array<[texto: string, seguridad: boolean, material: string | null]>> = {
  plomeria: [
    ['Cerrar la llave y descargar presión', true, null],
    ['Sacar el cartucho viejo', false, null],
    ['Colocar el cartucho nuevo', false, 'cartucho cerámico 35 mm'],
    ['Probar sin pérdidas 10 minutos', true, null],
  ],
  electricidad: [
    ['Cortar la luz y comprobar que no hay tensión', true, null],
    ['Revisar el circuito', false, null],
    ['Cambiar lo que esté dañado', false, null],
    ['Probar el disyuntor y la puesta a tierra', true, null],
  ],
  gas: [
    ['Cerrar la llave de paso y ventilar', true, null],
    ['Revisar la instalación', false, null],
    ['Hacer el arreglo', false, null],
    ['Probar la hermeticidad con agua jabonosa', true, null],
  ],
  cerrajeria: [
    ['Avisar que se va a abrir la cerradura', true, null],
    ['Desarmar la cerradura', false, null],
    ['Colocar la cerradura nueva', false, null],
    ['Probar todas las llaves', true, null],
  ],
  albanileria: [
    ['Despejar y proteger la zona', true, null],
    ['Picar lo dañado', false, null],
    ['Revocar y emparejar', false, null],
    ['Probar que quede firme y limpio', true, null],
  ],
  aire_acondicionado: [
    ['Cortar la luz del equipo', true, null],
    ['Limpiar filtros y serpentina', false, null],
    ['Revisar la carga y las conexiones', false, null],
    ['Probar el equipo 15 minutos', true, null],
  ],
};

function tareasIniciales(s: EstadoMock, rubro: Rubro): Tarea[] {
  return TAREAS_RUBRO[rubro].map(([texto, seguridad, material], i) => ({
    id: idNuevo(s),
    orden: i + 1,
    texto,
    seguridad,
    estado: i === 0 ? 'en_curso' : 'pendiente',
    material,
    jornadaId: null,
    asignadaA: null,
    necesitaMaterial: material !== null,
    conFoto: false,
    hechaEn: null,
    version: 0,
  }));
}

const informeVacio = (): InformeInterno => ({ textos: {}, enviadoEn: null, garantiaDias: null, recordatorio: null, conformidad: 'sin_enviar', conformidadEn: null, version: 0 });

function buscarTrabajo(s: EstadoMock, id: string): TrabajoInterno {
  const t = s.trabajos.find((x) => x.trabajo.id === id);
  if (!t) throw fallo('no_encontrado', 404, 'no_encontrado', 'No encontramos ese trabajo.');
  return t;
}

/** El Modo trabajo de un trabajo (se crea al empezar). Antes de empezar no existe: 409. */
function modoDe(s: EstadoMock, trabajoId: string, { escribir = false } = {}): { t: TrabajoInterno; m: ModoInterno } {
  const t = buscarTrabajo(s, trabajoId);
  const ex = extra(s);
  let m = ex.modos.get(trabajoId);
  if (!m) {
    if (!['en_curso', 'finalizado'].includes(t.trabajo.estado)) throw fallo('conflicto', 409, 'transicion_invalida', 'El Modo trabajo se abre cuando empezás el trabajo.');
    const desde = [...t.eventos].reverse().find((e) => e.estado === 'en_curso')?.en ?? iso(ahoraMs(s));
    m = { estado: 'en_curso', tramos: [{ desde, hasta: null }], tareas: tareasIniciales(s, t.trabajo.rubro), fotos: [], notas: [], version: 0, ad: { antes: null, despues: null, cambios: [], version: 0 }, informe: informeVacio() };
    ex.modos.set(trabajoId, m);
  }
  // Al terminar el trabajo, el cronómetro se cierra y el modo queda de solo lectura.
  if (t.trabajo.estado !== 'en_curso' && m.estado !== 'terminado') {
    const fin = [...t.eventos].reverse().find((e) => e.estado === 'finalizado')?.en ?? iso(ahoraMs(s));
    m.tramos = m.tramos.map((x) => (x.hasta === null ? { ...x, hasta: fin } : x));
    m.estado = 'terminado';
    m.version += 1;
  }
  if (escribir && m.estado === 'terminado') throw fallo('conflicto', 409, 'transicion_invalida', 'Este trabajo ya terminó.');
  return { t, m };
}

const ordenadas = (m: ModoInterno) => [...m.tareas].sort((a, b) => a.orden - b.orden);

function aModo(trabajoId: string, m: ModoInterno): ModoTrabajo {
  const actual = ordenadas(m).find((x) => x.estado === 'en_curso') ?? ordenadas(m).find((x) => x.estado !== 'hecha') ?? null;
  return { trabajoId, estado: m.estado, tramos: m.tramos, tareaActualId: actual?.id ?? null, tareas: ordenadas(m), fotos: m.fotos, notas: m.notas, version: m.version };
}

/** Deja una sola tarea «en curso»: la primera sin hacer. */
function moverActual(m: ModoInterno): void {
  let marcada = false;
  for (const x of ordenadas(m)) {
    if (x.estado === 'hecha') continue;
    const estado = marcada ? 'pendiente' : 'en_curso';
    marcada = true;
    if (x.estado !== estado) {
      x.estado = estado;
      x.version += 1;
    }
  }
}

// ── Antes y después ───────────────────────────────────────────────────────────────────────────────

const ultimaFoto = (m: ModoInterno, momento: MomentoFoto) => m.fotos.filter((f) => f.momento === momento).at(-1) ?? null;

function aAntesDespues(m: ModoInterno): AntesDespues {
  // Sin elegir, va la última de cada momento.
  const antes = (m.ad.antes ? m.fotos.find((f) => f.id === m.ad.antes) : null) ?? ultimaFoto(m, 'antes');
  const despues = (m.ad.despues ? m.fotos.find((f) => f.id === m.ad.despues) : null) ?? ultimaFoto(m, 'despues');
  return {
    antes: antes ? { id: antes.id, url: antes.url, en: antes.en } : null,
    despues: despues ? { id: despues.id, url: despues.url, en: despues.en } : null,
    cambios: m.ad.cambios,
    version: m.ad.version,
  };
}

// ── Informe ───────────────────────────────────────────────────────────────────────────────────────

function garantiaDiasDe(s: EstadoMock, t: TrabajoInterno, inf: InformeInterno): number {
  if (inf.garantiaDias) return inf.garantiaDias;
  return s.propuestas.find((p) => p.id === t.trabajo.propuestaAceptadaId)?.garantiaDias ?? GARANTIA_DIAS_DEFECTO;
}

function aInforme(s: EstadoMock, t: TrabajoInterno, m: ModoInterno): InformeTrabajo {
  const inf = m.informe;
  const hoy = hoyBA(new Date(ahoraMs(s)));
  const ad = aAntesDespues(m);
  const dias = garantiaDiasDe(s, t, inf);
  const desde = inf.enviadoEn ? hoyBA(new Date(inf.enviadoEn)) : null;
  const garantia = desde ? { dias, desde, hasta: sumarDias(desde, dias), estado: sumarDias(desde, dias) < hoy ? ('vencida' as const) : ('activa' as const) } : null;
  const prop = s.propuestas.find((p) => p.id === t.trabajo.propuestaAceptadaId);
  const aceptados = t.adicionales.filter((a) => a.estado === 'aceptado').map((a) => a.descripcion);

  const auto: Record<SeccionInforme, string | null> = {
    causa: null,
    antes_despues: (() => {
      const fotos = ad.antes && ad.despues ? '1 par de fotos' : ad.antes || ad.despues ? null : '';
      if (fotos === null) return null; // falta una de las dos fotos
      const cambios = ad.cambios.length ? `${ad.cambios.length} ${ad.cambios.length === 1 ? 'cambio escrito' : 'cambios escritos'}` : '';
      const texto = [fotos, cambios].filter(Boolean).join(' · ');
      return texto || null;
    })(),
    pruebas: m.tareas.filter((x) => x.seguridad && x.estado === 'hecha' && /^prob/i.test(x.texto)).map((x) => x.texto).join(' · ') || null,
    materiales_garantia: [prop?.incluyeMateriales ? 'Materiales incluidos' : null, ...aceptados, `garantía de ${dias} días${garantia ? `, hasta el ${textoFecha(garantia.hasta, hoy)}` : ''}`].filter(Boolean).join(' · '),
    recomendaciones: null,
  };
  const secciones = SECCIONES_INFORME.map((seccion) => {
    const escrito = inf.textos[seccion];
    if (escrito) return { seccion, estado: 'lista' as const, texto: escrito };
    const a = auto[seccion];
    return a ? { seccion, estado: 'automatica' as const, texto: a } : { seccion, estado: 'falta' as const, texto: null };
  });
  return {
    trabajoId: t.trabajo.id,
    secciones,
    completas: secciones.filter((x) => x.estado !== 'falta').length,
    garantia,
    recordatorioMantenimiento: inf.recordatorio,
    enviadoEn: inf.enviadoEn ? iso(inf.enviadoEn) : null,
    conformidad: { estado: inf.conformidad, en: inf.conformidadEn ? iso(inf.conformidadEn) : null },
    pdf: inf.enviadoEn ? { url: pdfPrueba(['Handyx - Informe del trabajo (PRUEBA)', ...secciones.filter((x) => x.texto).map((x) => `${x.seccion}: ${x.texto}`)]), venceEn: iso(ahoraMs(s) + 15 * MIN) } : null,
    version: inf.version,
  };
}

// ── Siembra ───────────────────────────────────────────────────────────────────────────────────────

/**
 * Siembra el lote: un trabajo en curso desde ayer con el Modo trabajo andando (fotos, cambios y la causa escrita), un
 * informe ya mandado esperando la conformidad (`enviado`) y otro listo para mandar (`porMandar`). Se llama una vez desde
 * fixtures.ts en el escenario habilitado; los ids de los otros dos los pasa fixtures (sin importarlo desde acá).
 */
export function sembrarModoTrabajo(s: EstadoMock, T0: number, otros: { enviado: string; porMandar: string }): void {
  const ayer17 = Date.parse('2026-11-16T20:00:00.000Z'); // lunes 16/11, 17:00 en Buenos Aires
  const hoy = T0 - 24 * MIN; // retomado hoy hace 24 minutos
  s.trabajos.push({
    trabajo: {
      id: ID_MODO.deposito,
      pedidoId: ID_MODO.depositoPedido,
      propuestaAceptadaId: ID_MODO.depositoPropuesta,
      rubro: 'plomeria',
      tipo: 'programado',
      acuerdo: { monto: monto(3_800_000), alcance: 'Cambio del mecanismo del depósito del inodoro y de los flexibles. Incluye materiales.', horario: { inicio: iso(ayer17), fin: iso(ayer17 + 2 * HORA) } },
      direccion: 'Calle De Prueba 789, La Perla (ficticia)',
      destino: { lat: -37.9902, lng: -57.5503 },
      estado: 'en_curso',
      llegada: { modo: 'automatica', motivo: null, en: iso(ayer17) },
      conversacionId: ID_MODO.depositoChat,
      version: 1,
    },
    contraparte: 'Julián Ortiz',
    eventos: [
      { estado: 'agendado', en: iso(ayer17 - 30 * HORA), actor: 'sistema' },
      { estado: 'en_camino', en: iso(ayer17 - 20 * MIN), actor: 'especialista' },
      { estado: 'en_sitio', en: iso(ayer17), actor: 'especialista' },
      { estado: 'en_curso', en: iso(ayer17 + 5 * MIN), actor: 'especialista' },
    ],
    etapas: [],
    cambioPendienteId: null,
    pagoId: null,
    metodoPago: 'efectivo',
    adicionales: [],
    jornadas: [],
    diario: [],
  });
  s.propuestas.push({
    id: ID_MODO.depositoPropuesta,
    pedidoId: ID_MODO.depositoPedido,
    autorRol: 'especialista',
    monto: monto(3_800_000),
    alcance: 'Cambio del mecanismo del depósito del inodoro y de los flexibles. Incluye materiales.',
    horario: { inicio: iso(ayer17), fin: iso(ayer17 + 2 * HORA) },
    venceEn: iso(ayer17 - 28 * HORA),
    estado: 'aceptada',
    reemplazaA: null,
    version: 1,
    incluyeMateriales: true,
    garantiaDias: 30,
  });
  s.conversaciones.push({ id: ID_MODO.depositoChat, pedidoId: ID_MODO.depositoPedido, trabajoId: ID_MODO.deposito, contraparte: 'Julián Ortiz', etapa: 'trabajo', ultimoMensaje: 'Mañana seguís, ¿no? Gracias.', noLeidos: 0, actualizadoEn: iso(ayer17 + 2 * HORA), contactoId: null });
  s.mensajes[ID_MODO.depositoChat] = [
    { id: idFijo(0x23031), conversacionId: ID_MODO.depositoChat, autorRol: 'usuario', tipo: 'texto', texto: 'Mañana seguís, ¿no? Gracias.', mediaUrl: null, propuestaId: null, enviadoEn: iso(ayer17 + 2 * HORA) },
  ];

  const ex = extra(s);
  const foto = (n: number, momento: MomentoFoto, en: number) => ({ id: idFijo(n), url: fotoPrueba(momento), momento, tareaId: null, en: iso(en) });
  const textos = ['Cerrar la llave de paso y vaciar el depósito', 'Sacar el mecanismo viejo', 'Colocar el mecanismo nuevo', 'Probar sin pérdidas 10 minutos'];
  const tareas = tareasIniciales(s, 'plomeria').map((x, i) => ({
    ...x,
    texto: textos[i] ?? x.texto,
    material: i === 2 ? 'mecanismo de descarga universal' : null,
    estado: i < 2 ? ('hecha' as const) : i === 2 ? ('en_curso' as const) : ('pendiente' as const),
    hechaEn: i < 2 ? iso(ayer17 + (i === 0 ? 15 : 70) * MIN) : null,
    version: i < 3 ? 1 : 0,
  }));
  ex.modos.set(ID_MODO.deposito, {
    estado: 'en_curso',
    tramos: [
      { desde: iso(ayer17 + 5 * MIN), hasta: iso(ayer17 + 2 * HORA) },
      { desde: iso(hoy), hasta: null },
    ],
    tareas,
    fotos: [foto(0x23041, 'antes', ayer17 + 6 * MIN), foto(0x23042, 'despues', T0 - 5 * MIN)],
    notas: [{ id: idFijo(0x23051), texto: 'Falta el flexible de la izquierda: lo traje hoy.', en: iso(ayer17 + 110 * MIN) }],
    version: 3,
    ad: {
      antes: null,
      despues: null,
      cambios: [
        { titulo: 'Mecanismo nuevo', detalle: 'Universal; el viejo tenía la goma del flotante gastada' },
        { titulo: 'Flexibles nuevos', detalle: 'Los dos estaban resecos' },
      ],
      version: 1,
    },
    informe: { ...informeVacio(), textos: { causa: 'La goma del flotante estaba gastada y el agua seguía corriendo.' }, version: 1 },
  });

  // Los otros dos ya terminados: uno con el informe mandado (esperando la conformidad) y otro listo para mandar.
  for (const id of [otros.enviado, otros.porMandar]) {
    const t = s.trabajos.find((x) => x.trabajo.id === id);
    if (!t) continue;
    const fin = Date.parse([...t.eventos].reverse().find((e) => e.estado === 'finalizado')?.en ?? iso(T0 - HORA));
    const enviado = id === otros.enviado;
    ex.modos.set(id, {
      estado: 'terminado',
      tramos: [{ desde: iso(fin - HORA), hasta: iso(fin) }],
      tareas: tareasIniciales(s, t.trabajo.rubro).map((x) => ({ ...x, estado: 'hecha', hechaEn: iso(fin - 10 * MIN), version: 1 })),
      fotos: [foto(enviado ? 0x23043 : 0x23045, 'antes', fin - HORA), foto(enviado ? 0x23044 : 0x23046, 'despues', fin - 5 * MIN)],
      notas: [],
      version: 2,
      ad: { antes: null, despues: null, cambios: [{ titulo: enviado ? 'Cañería destapada' : 'Tablero ordenado', detalle: null }], version: 1 },
      informe: {
        ...informeVacio(),
        textos: { causa: enviado ? 'Restos de grasa en la cañería de la cocina.' : 'Térmicas viejas que saltaban con el horno.' },
        enviadoEn: enviado ? fin + 20 * MIN : null,
        garantiaDias: enviado ? 30 : null,
        recordatorio: enviado ? sumarDias(hoyBA(new Date(fin)), 182) : null,
        conformidad: enviado ? 'esperando' : 'sin_enviar',
        version: enviado ? 2 : 1,
      },
    });
  }
}

// ── Panel de prueba: el cliente responde el informe ───────────────────────────────────────────────

export function accionesModoTrabajo(s: EstadoMock): Array<{ id: string; etiqueta: string }> {
  const hay = [...extra(s).modos.values()].some((m) => m.informe.conformidad === 'esperando' || m.informe.conformidad === 'con_observaciones');
  return hay
    ? [
        { id: 'modo_conformidad', etiqueta: 'Da su conformidad con el último informe' },
        { id: 'modo_observaciones', etiqueta: 'Responde el último informe con observaciones' },
      ]
    : [];
}

export function ejecutarModoTrabajo(s: EstadoMock, id: string): boolean {
  if (id !== 'modo_conformidad' && id !== 'modo_observaciones') return false;
  const lista = [...extra(s).modos.entries()].filter(([, m]) => m.informe.enviadoEn !== null && m.informe.conformidad !== 'dada').sort(([, a], [, b]) => (b.informe.enviadoEn ?? 0) - (a.informe.enviadoEn ?? 0));
  const elegido = lista.find(([, m]) => (id === 'modo_conformidad' ? true : m.informe.conformidad === 'esperando'));
  if (!elegido) {
    s.nota = 'No hay un informe esperando respuesta.';
    return true;
  }
  const [trabajoId, m] = elegido;
  m.informe.conformidad = id === 'modo_conformidad' ? 'dada' : 'con_observaciones';
  m.informe.conformidadEn = ahoraMs(s);
  m.informe.version += 1;
  const t = s.trabajos.find((x) => x.trabajo.id === trabajoId);
  if (t) agregarMensaje(s, t.trabajo.conversacionId, { autorRol: 'usuario', tipo: 'texto', texto: id === 'modo_conformidad' ? 'Di mi conformidad con el trabajo. ¡Gracias!' : 'Tengo una observación sobre el informe.' });
  s.nota = id === 'modo_conformidad' ? 'El cliente dio su conformidad: la garantía sigue activa.' : 'El cliente respondió con observaciones: se abre un caso de soporte.';
  return true;
}

// ── Métodos del dominio ───────────────────────────────────────────────────────────────────────────

export const modoTrabajo = (s: EstadoMock) => ({
  modoTrabajo: (trabajoId: string): ModoTrabajo => aModo(trabajoId, modoDe(s, trabajoId).m),

  pausarModo(trabajoId: string, version: number): ModoTrabajo {
    const { m } = modoDe(s, trabajoId, { escribir: true });
    if (m.version !== version) throw fallo('conflicto', 409, 'conflicto_version', 'El Modo trabajo cambió. Volvé a abrirlo.');
    if (m.estado !== 'en_curso') throw fallo('conflicto', 409, 'transicion_invalida', 'El cronómetro ya está en pausa.');
    m.tramos = m.tramos.map((x) => (x.hasta === null ? { ...x, hasta: iso(ahoraMs(s)) } : x));
    m.estado = 'en_pausa';
    m.version += 1;
    return aModo(trabajoId, m);
  },

  reanudarModo(trabajoId: string, version: number): ModoTrabajo {
    const { m } = modoDe(s, trabajoId, { escribir: true });
    if (m.version !== version) throw fallo('conflicto', 409, 'conflicto_version', 'El Modo trabajo cambió. Volvé a abrirlo.');
    if (m.estado !== 'en_pausa') throw fallo('conflicto', 409, 'transicion_invalida', 'El cronómetro ya está andando.');
    m.tramos = [...m.tramos, { desde: iso(ahoraMs(s)), hasta: null }];
    m.estado = 'en_curso';
    m.version += 1;
    return aModo(trabajoId, m);
  },

  crearTarea(trabajoId: string, cuerpo: unknown): Tarea {
    const ok = NuevaTareaSchema.safeParse(cuerpo);
    if (!ok.success) throw zodAFallo(ok.error);
    const { m } = modoDe(s, trabajoId, { escribir: true });
    if (ok.data.asignadaA !== null || ok.data.jornadaId !== null) throw fallo('validacion', 400, 'validacion', 'En un trabajo las tareas son tuyas: sin jornada ni persona asignada.');
    const tarea: Tarea = { id: idNuevo(s), orden: m.tareas.length + 1, texto: ok.data.texto, seguridad: ok.data.seguridad, estado: 'pendiente', material: null, jornadaId: null, asignadaA: null, necesitaMaterial: ok.data.necesitaMaterial, conFoto: ok.data.conFoto, hechaEn: null, version: 0 };
    m.tareas.push(tarea);
    moverActual(m);
    m.version += 1;
    return structuredClone(tarea);
  },

  cambiarTarea(trabajoId: string, tareaId: string, cuerpo: unknown): Tarea {
    const ok = CambioTareaSchema.safeParse(cuerpo);
    if (!ok.success) throw zodAFallo(ok.error);
    const { m } = modoDe(s, trabajoId, { escribir: true });
    const x = m.tareas.find((y) => y.id === tareaId);
    if (!x) throw fallo('no_encontrado', 404, 'no_encontrado', 'No encontramos esa tarea.');
    if (x.version !== ok.data.version) throw fallo('conflicto', 409, 'conflicto_version', 'La tarea cambió. Volvé a abrir el Modo trabajo.');
    if (ok.data.texto !== undefined) x.texto = ok.data.texto;
    if (ok.data.estado !== undefined && ok.data.estado !== x.estado) {
      x.estado = ok.data.estado;
      x.hechaEn = ok.data.estado === 'hecha' ? iso(ahoraMs(s)) : null;
    }
    if (ok.data.orden !== undefined) {
      const resto = ordenadas(m).filter((y) => y.id !== x.id);
      resto.splice(Math.min(ok.data.orden, resto.length + 1) - 1, 0, x);
      resto.forEach((y, i) => (y.orden = i + 1));
    }
    x.version += 1;
    moverActual(m);
    m.version += 1;
    return structuredClone(x);
  },

  quitarTarea(trabajoId: string, tareaId: string): void {
    const { m } = modoDe(s, trabajoId, { escribir: true });
    if (!m.tareas.some((x) => x.id === tareaId)) return;
    m.tareas = ordenadas(m).filter((x) => x.id !== tareaId);
    m.tareas.forEach((x, i) => (x.orden = i + 1));
    moverActual(m);
    m.version += 1;
  },

  subirFotoTrabajo(trabajoId: string, _foto: Blob | null, momento: string, clave: string, tareaId?: string): ModoTrabajo {
    return idempotente(s, `foto-trabajo:${clave}`, () => {
      if (!(MOMENTOS_FOTO as readonly string[]).includes(momento)) throw fallo('validacion', 400, 'validacion', 'Elegí si la foto es del antes, de durante o del después.');
      const { m } = modoDe(s, trabajoId, { escribir: true });
      if (tareaId && !m.tareas.some((x) => x.id === tareaId)) throw fallo('validacion', 400, 'validacion', 'Esa tarea no es de este trabajo.');
      m.fotos.push({ id: idNuevo(s), url: fotoPrueba(momento as MomentoFoto), momento: momento as MomentoFoto, tareaId: tareaId ?? null, en: iso(ahoraMs(s)) });
      m.version += 1;
      return aModo(trabajoId, m);
    });
  },

  guardarNota(trabajoId: string, texto: string, clave: string): ModoTrabajo {
    return idempotente(s, `nota-trabajo:${clave}`, () => {
      const ok = NuevaNotaSchema.safeParse({ texto });
      if (!ok.success) throw zodAFallo(ok.error);
      const { m } = modoDe(s, trabajoId, { escribir: true });
      m.notas.push({ id: idNuevo(s), texto: ok.data.texto, en: iso(ahoraMs(s)) });
      m.version += 1;
      return aModo(trabajoId, m);
    });
  },

  antesDespues: (trabajoId: string): AntesDespues => aAntesDespues(modoDe(s, trabajoId).m),

  guardarAntesDespues(trabajoId: string, cuerpo: unknown): AntesDespues {
    const ok = GuardarAntesDespuesSchema.safeParse(cuerpo);
    if (!ok.success) throw zodAFallo(ok.error);
    const { m } = modoDe(s, trabajoId);
    if (m.informe.enviadoEn !== null) throw fallo('conflicto', 409, 'transicion_invalida', 'El informe ya se mandó: no se puede cambiar.');
    if (ok.data.version !== m.ad.version) throw fallo('conflicto', 409, 'conflicto_version', 'Las fotos cambiaron. Volvé a abrir el antes y después.');
    const es = (id: string | null, momento: MomentoFoto) => id === null || m.fotos.some((f) => f.id === id && f.momento === momento);
    if (!es(ok.data.antesFotoId, 'antes') || !es(ok.data.despuesFotoId, 'despues')) throw fallo('validacion', 400, 'validacion', 'Esa foto no es de este trabajo.');
    m.ad = { antes: ok.data.antesFotoId, despues: ok.data.despuesFotoId, cambios: ok.data.cambios, version: m.ad.version + 1 };
    m.informe.version += 1;
    return aAntesDespues(m);
  },

  informeTrabajo(trabajoId: string): InformeTrabajo {
    const { t, m } = modoDe(s, trabajoId);
    return aInforme(s, t, m);
  },

  guardarSeccionInforme(trabajoId: string, seccion: string, cuerpo: unknown): InformeTrabajo {
    if (!(SECCIONES_INFORME as readonly string[]).includes(seccion)) throw fallo('no_encontrado', 404, 'no_encontrado', 'Esa sección no existe.');
    const ok = GuardarSeccionInformeSchema.safeParse(cuerpo);
    if (!ok.success) throw zodAFallo(ok.error);
    const { t, m } = modoDe(s, trabajoId);
    if (m.informe.enviadoEn !== null) throw fallo('conflicto', 409, 'transicion_invalida', 'El informe ya se mandó: no se puede cambiar.');
    if (ok.data.version !== m.informe.version) throw fallo('conflicto', 409, 'conflicto_version', 'El informe cambió. Volvé a abrirlo.');
    m.informe.textos[seccion as SeccionInforme] = ok.data.texto;
    m.informe.version += 1;
    return aInforme(s, t, m);
  },

  enviarInforme(trabajoId: string, cuerpo: unknown, clave: string): InformeTrabajo {
    return idempotente(s, `informe-trabajo:${clave}`, () => {
      const ok = EnvioInformeSchema.safeParse(cuerpo);
      if (!ok.success) throw zodAFallo(ok.error);
      const { t, m } = modoDe(s, trabajoId);
      if (t.trabajo.estado !== 'finalizado') throw fallo('conflicto', 409, 'transicion_invalida', 'El informe se manda cuando terminás el trabajo.');
      if (m.informe.enviadoEn !== null) throw fallo('conflicto', 409, 'transicion_invalida', 'Este informe ya se mandó.');
      if (ok.data.version !== m.informe.version) throw fallo('conflicto', 409, 'conflicto_version', 'El informe cambió. Volvé a abrirlo.');
      const hoy = hoyBA(new Date(ahoraMs(s)));
      if (ok.data.recordatorioMantenimiento !== null && ok.data.recordatorioMantenimiento <= hoy) throw fallo('validacion', 400, 'validacion', 'El recordatorio tiene que ser una fecha futura.');
      m.informe.enviadoEn = ahoraMs(s);
      m.informe.garantiaDias = ok.data.garantiaDias ?? garantiaDiasDe(s, t, m.informe);
      m.informe.recordatorio = ok.data.recordatorioMantenimiento;
      m.informe.conformidad = 'esperando';
      m.informe.version += 1;
      agregarMensaje(s, t.trabajo.conversacionId, { autorRol: 'especialista', tipo: 'texto', texto: `Te mandé el informe del trabajo (garantía de ${m.informe.garantiaDias} días). Cuando puedas, dame tu conformidad desde la app.` });
      return aInforme(s, t, m);
    });
  },

  contactosProfesionales: (): ContactoProfesional[] => extra(s).contactos,

  abrirChatContacto(contactoId: string): ChatResumen {
    const c = extra(s).contactos.find((x) => x.id === contactoId);
    if (!c) throw fallo('no_encontrado', 404, 'no_encontrado', 'No encontramos ese contacto.');
    c.chatId ??= idNuevo(s);
    return {
      id: c.chatId,
      tipo: 'equipo',
      titulo: c.profesional.nombre,
      subtitulo: 'Contacto profesional',
      avatares: [c.profesional.iniciales],
      miembros: 2,
      ultimoMensaje: null,
      noLeidos: 0,
      silenciadoHasta: null,
      pedidoId: null,
      trabajoId: null,
      obraId: null,
      conversacionId: null,
      actualizadoEn: iso(ahoraMs(s)),
    };
  },

  sumarAyuda(trabajoId: string, cuerpo: unknown): InvitacionObra {
    const ok = SumarAyudaSchema.safeParse(cuerpo);
    if (!ok.success) throw zodAFallo(ok.error);
    const t = buscarTrabajo(s, trabajoId);
    if (!['en_sitio', 'en_curso'].includes(t.trabajo.estado)) throw fallo('conflicto', 409, 'transicion_invalida', 'Podés sumar a alguien mientras hacés el trabajo.');
    const ex = extra(s);
    const c = ex.contactos.find((x) => x.id === ok.data.contactoId);
    if (!c) throw fallo('no_encontrado', 404, 'no_encontrado', 'No encontramos ese contacto.');
    // Invitarlo dos veces devuelve la misma invitación pendiente.
    const previa = ex.invitaciones.find((i) => i.obraId === trabajoId && i.profesional?.id === c.profesional.id && i.estado === 'pendiente');
    if (previa) return previa;
    const inv: InvitacionObra = { id: idNuevo(s), obraId: trabajoId, profesional: c.profesional, rubro: ok.data.rubro, jornadas: [], codigo: null, enlace: null, venceEn: iso(ahoraMs(s) + 48 * HORA), estado: 'pendiente' };
    ex.invitaciones.push(inv);
    return inv;
  },

  llamadaContacto(contactoId: string): LlamadaPuente {
    if (!extra(s).contactos.some((x) => x.id === contactoId)) throw fallo('no_encontrado', 404, 'no_encontrado', 'No encontramos ese contacto.');
    return { telefono: PUENTE_PRUEBA, venceEn: iso(ahoraMs(s) + 10 * MIN) };
  },
});
