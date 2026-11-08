// Núcleo del mock (lote 1.3, contrato 0.11.0): mapa de arreglos, tu día, demoras y cobro informado. Lo usan
// `pedidos.ts` y `trabajos.ts`. Todo es de PRUEBA: nombres ficticios, puntos sintéticos y zonas aproximadas.
// El estado propio del lote vive en un WeakMap atado al EstadoMock (sin tocar el estado común de la ola).
import { DiaSchema, OrdenParadasSchema, RecorridoDiaSchema, type Dia, type Parada, type TurnoAgenda } from '../../contracts/agenda.ts';
import type { MensajeChat } from '../../contracts/chat.ts';
import { monto } from '../../contracts/dinero.ts';
import type { Pago, Punto } from '../../contracts/dto.ts';
import { InformeCobroSchema, type Cobro, type MetodoCobro } from '../../contracts/ingresos.ts';
import { BusquedaMapaSchema, REDONDEO_DISTANCIA_M, type DestinoMapa, type MapaPedidos, type PedidoEntrante, type PedidoEnMapa, type UbicacionPedido } from '../../contracts/mapa.ts';
import { AvisoDemoraSchema } from '../../contracts/modo-trabajo.ts';
import { NOMBRE_RUBRO } from '../../contracts/rubros.ts';
import { desplazar, distanciaM, rumbo } from '../../lib/geo.ts';
import { ahoraMs, fallo, idempotente, idFijo, idNuevo, iso, type EstadoMock, type PedidoInterno, type TrabajoInterno } from './estado.ts';
import { FOTO_PRUEBA } from './fotos.ts';
import { barriosPrueba, destinoPrueba, zonaPrueba } from './mapa.ts';
import { precioSugerido } from './precios.ts';
import { agregarMensaje } from './propuestas.ts';
import { aPedidoElegible, habilitada, visible } from './reglas.ts';
import { zodAFallo } from './validacion.ts';

const MIN = 60_000;
const HORA = 60 * MIN;
/** Velocidad promedio de la ciudad para estimar los tramos del día (orientativa: nunca es una promesa al cliente). */
const KMH_CIUDAD = 25;

interface ExtraNucleo {
  descartados: Set<string>;
  orden: string[] | null;
  versionDia: number;
  cobros: Map<string, { metodo: MetodoCobro; informado: number }>;
  version: Map<string, number>;
}
const extras = new WeakMap<EstadoMock, ExtraNucleo>();
export function extra(s: EstadoMock): ExtraNucleo {
  let e = extras.get(s);
  if (!e) {
    e = { descartados: new Set(), orden: null, versionDia: 0, cobros: new Map(), version: new Map() };
    extras.set(s, e);
  }
  return e;
}

// ── Ids y datos sembrados ─────────────────────────────────────────────────────────────────────────

export const ID_NUCLEO = {
  /** "Pierde la canilla" de Lucía Ferreyra, hoy de 18 a 20 (F-InicioDia, F-Trabajo, TR-EnCamino y TR-Cobro). */
  canilla: idFijo(0xc7),
  canillaPedido: idFijo(0xbd),
  canillaPropuesta: idFijo(0xf8),
  canillaChat: idFijo(0xd8),
  canillaPago: idFijo(0xe5),
  /** Pedidos fuera de tus zonas, para «Me voy hasta…» (Batán y Los Troncos, en el camino). */
  pBatan: idFijo(0xbe),
  pTroncos: idFijo(0xbf),
  /** Retiro opcional en una ferretería de prueba (la ferretería es de la ola 4). */
  retiro: idFijo(0x7c1),
} as const;

/** Lo que el cliente escribió, recortado como lo manda el servidor en el mapa. */
const TITULOS: Record<string, string> = {
  [idFijo(0xb1)]: 'Pierde la canilla de la cocina',
  [idFijo(0xb2)]: 'Cambiar el flexible del inodoro',
  [idFijo(0xb3)]: 'Revisión anual del calefón',
  [idFijo(0xb4)]: 'Revoque y pintura de una medianera',
  [idFijo(0xb5)]: 'Saltó la térmica y no sube',
  [idFijo(0xb6)]: 'Service de un split',
  [ID_NUCLEO.pBatan]: 'Enchufes que no andan en la cocina',
  [ID_NUCLEO.pTroncos]: 'Cambiar la cerradura de la puerta',
};

export function tituloPedido(p: Pick<PedidoInterno['pub'], 'id' | 'descripcion'>): string {
  const t = TITULOS[p.id];
  if (t) return t;
  const primera = p.descripcion.split(/[.:;]/)[0]?.trim() ?? p.descripcion;
  return primera.length > 60 ? `${primera.slice(0, 57).trimEnd()}…` : primera;
}

const CENTROS_LOCALIDAD: Record<string, Punto> = {
  Batán: { lat: -38.0047, lng: -57.7097 },
  'Los Troncos': { lat: -38.0228, lng: -57.5555 },
  'Sierra de los Padres': { lat: -37.9473, lng: -57.7779 },
  Chapadmalal: { lat: -38.1736, lng: -57.6559 },
  Camet: { lat: -37.9265, lng: -57.5405 },
};

/** Destinos de «Me voy hasta…»: los barrios de cobertura y localidades cercanas (centros aproximados). */
export function destinosPrueba(): DestinoMapa[] {
  const barrios = barriosPrueba().map((b) => ({ id: b.id, nombre: b.nombre, tipo: 'barrio' as const, centro: b.centro, radioM: 1500 }));
  const localidades = Object.entries(CENTROS_LOCALIDAD).map(([nombre, centro]) => ({
    id: nombre,
    nombre,
    tipo: nombre === 'Los Troncos' ? ('barrio' as const) : ('localidad' as const),
    centro,
    radioM: nombre === 'Los Troncos' ? 1500 : 4000,
  }));
  return [...barrios, ...localidades];
}

const centroDe = (zona: string): Punto => CENTROS_LOCALIDAD[zona] ?? barriosPrueba().find((b) => b.id === zona)?.centro ?? barriosPrueba()[0]!.centro;

/**
 * Siembra lo del lote en el escenario habilitado: el trabajo de hoy de Lucía Ferreyra (con su chat y su cobro) y dos
 * pedidos fuera de tus zonas para probar «Me voy hasta Batán». Se llama una vez desde fixtures.ts.
 */
export function sembrarNucleo(s: EstadoMock, T0: number): void {
  const hoy18 = Date.parse('2026-11-17T21:00:00.000Z'); // martes 17/11, 18:00 en Buenos Aires
  const destino = destinoPrueba(ID_NUCLEO.canilla, 'Centro');
  const t: TrabajoInterno = {
    trabajo: {
      id: ID_NUCLEO.canilla,
      pedidoId: ID_NUCLEO.canillaPedido,
      propuestaAceptadaId: ID_NUCLEO.canillaPropuesta,
      rubro: 'plomeria',
      tipo: 'programado',
      acuerdo: { monto: monto(4_700_000), alcance: 'Cambio del cartucho de la canilla monocomando de la cocina. Incluye materiales.', horario: { inicio: iso(hoy18), fin: iso(hoy18 + 2 * HORA) } },
      direccion: 'Calle De Prueba 123, Centro · timbre 2',
      destino,
      estado: 'agendado',
      llegada: null,
      conversacionId: ID_NUCLEO.canillaChat,
      version: 1,
    },
    contraparte: 'Lucía Ferreyra',
    eventos: [{ estado: 'agendado', en: iso(T0 - 20 * HORA), actor: 'sistema' }],
    etapas: [],
    cambioPendienteId: null,
    pagoId: ID_NUCLEO.canillaPago,
    metodoPago: 'efectivo',
    adicionales: [],
    jornadas: [],
    diario: [],
  };
  s.trabajos.push(t);
  s.propuestas.push({
    id: ID_NUCLEO.canillaPropuesta,
    pedidoId: ID_NUCLEO.canillaPedido,
    autorRol: 'especialista',
    monto: monto(4_700_000),
    alcance: t.trabajo.acuerdo.alcance,
    horario: t.trabajo.acuerdo.horario,
    venceEn: iso(T0 - 19 * HORA),
    estado: 'aceptada',
    reemplazaA: null,
    version: 1,
    incluyeMateriales: true,
    garantiaDias: 30,
  });
  s.conversaciones.push({ id: ID_NUCLEO.canillaChat, pedidoId: ID_NUCLEO.canillaPedido, trabajoId: t.trabajo.id, contraparte: 'Lucía Ferreyra', etapa: 'trabajo', ultimoMensaje: 'Te espero a la tarde, gracias.', noLeidos: 0, actualizadoEn: iso(T0 - 3 * HORA), contactoId: null });
  s.mensajes[ID_NUCLEO.canillaChat] = [
    { id: idFijo(0x9c1), conversacionId: ID_NUCLEO.canillaChat, autorRol: 'usuario', tipo: 'texto', texto: 'Te espero a la tarde, gracias.', mediaUrl: null, propuestaId: null, enviadoEn: iso(T0 - 3 * HORA) },
  ];
  const pago: Pago = {
    id: ID_NUCLEO.canillaPago,
    trabajoId: t.trabajo.id,
    etapaId: null,
    descripcion: 'Plomería · 17/11',
    feeHandy: monto(0),
    neto: monto(4_700_000),
    metodo: 'efectivo',
    monto: monto(4_700_000),
    estado: 'pendiente',
    fuenteConfirmacion: null,
    referenciaProveedor: null,
    actualizadoEn: iso(T0 - 20 * HORA),
  };
  s.pagos.push(pago);

  const lejos = (id: string, zona: string, p: Omit<PedidoInterno['pub'], 'id' | 'zonaAproximada' | 'zonaMapa' | 'ventanaHasta' | 'estado'> & { ventanaHasta?: string | null }): PedidoInterno => {
    const destinoP = desplazar(centroDe(zona), 300, 220);
    return {
      pub: { id, zonaAproximada: zona, zonaMapa: zonaPrueba(id, destinoP), ventanaHasta: p.ventanaHasta ?? iso(T0 + 10 * HORA), estado: 'buscando', ...p },
      cliente: 'Cliente de prueba 12',
      direccion: 'Calle De Prueba 456 (ficticia)',
      destino: destinoP,
      metodoPago: 'efectivo',
      conversacionId: null,
    };
  };
  s.pedidos.push(
    lejos(ID_NUCLEO.pBatan, 'Batán', { rubro: 'electricidad', tipo: 'programado', descripcion: 'Enchufes que no andan en la cocina. Hay olor a quemado en uno.', fechaSolicitada: iso(Date.parse('2026-11-18T14:00:00Z')), creadoEn: iso(T0 - 40 * MIN) }),
    lejos(ID_NUCLEO.pTroncos, 'Los Troncos', { rubro: 'plomeria', tipo: 'programado', descripcion: 'Cambiar la cerradura de la puerta del lavadero que no cierra bien.', fechaSolicitada: iso(Date.parse('2026-11-19T15:00:00Z')), creadoEn: iso(T0 - 70 * MIN) }),
  );
}

// ── Mapa de arreglos ──────────────────────────────────────────────────────────────────────────────

const redondear = (m: number): number => Math.max(REDONDEO_DISTANCIA_M, Math.round(m / REDONDEO_DISTANCIA_M) * REDONDEO_DISTANCIA_M);

/** Franja que pidió el cliente: 4 horas desde la fecha solicitada (los urgentes no piden horario). */
const horarioPedido = (p: PedidoInterno) => (p.pub.tipo === 'urgente' || !p.pub.fechaSolicitada ? null : { inicio: p.pub.fechaSolicitada, fin: iso(Date.parse(p.pub.fechaSolicitada) + 4 * HORA) });

function aPedidoEnMapa(s: EstadoMock, p: PedidoInterno, desde: Punto | null, ubicacion: UbicacionPedido): PedidoEnMapa {
  const e = aPedidoElegible(s, p);
  const zona = p.pub.zonaMapa ?? { centro: centroDe(p.pub.zonaAproximada), radioM: 700 };
  return {
    id: p.pub.id,
    rubro: p.pub.rubro,
    tipo: p.pub.tipo,
    titulo: tituloPedido(p.pub),
    barrio: p.pub.zonaAproximada,
    zona,
    distanciaM: desde ? redondear(distanciaM(desde, zona.centro)) : null,
    ubicacion,
    precioSugerido: precioSugerido(p.pub.rubro, p.pub.tipo).monto,
    horarioPedido: horarioPedido(p),
    ventanaHasta: p.pub.ventanaHasta,
    creadoEn: p.pub.creadoEn,
    sumaAlCamino: true,
    miPropuesta: e.miPropuesta,
  };
}

/** Elegible salvo la zona (un destino de «Me voy hasta…» puede quedar fuera de tus zonas). */
function elegibleFueraDeZona(s: EstadoMock, p: PedidoInterno): boolean {
  if (!habilitada(s) || p.pub.estado !== 'buscando') return false;
  if (!s.perfil.rubros.some((r) => r.rubro === p.pub.rubro && r.estado === 'habilitado')) return false;
  return p.pub.tipo === 'urgente' ? s.disponibilidad.urgentesAhora : s.disponibilidad.programados;
}

export function mapaPedidos(s: EstadoMock, busqueda: unknown): MapaPedidos {
  if (!habilitada(s)) throw fallo('permiso', 403, 'sin_permiso', 'Podés ver pedidos cuando tu alta esté habilitada.');
  const ok = BusquedaMapaSchema.safeParse(busqueda);
  if (!ok.success) throw zodAFallo(ok.error);
  const b = ok.data;
  const ex = extra(s);
  const desde = b.desde?.punto ?? null;
  const abiertos = s.pedidos.filter((p) => !ex.descartados.has(p.pub.id) && aPedidoElegible(s, p).estado === 'buscando');
  const filtrar = (lista: PedidoInterno[]) => lista.filter((p) => (!b.rubros || b.rubros.includes(p.pub.rubro)) && (!b.tipos || b.tipos.includes(p.pub.tipo)));

  let referencia: MapaPedidos['referencia'];
  let elegidos: Array<{ p: PedidoInterno; u: UbicacionPedido }>;
  if (b.referencia.tipo === 'destino') {
    const id = b.referencia.destinoId;
    const d = destinosPrueba().find((x) => x.id === id);
    if (!d) throw fallo('no_encontrado', 404, 'no_encontrado', 'No encontramos ese destino.');
    referencia = { nombre: d.nombre, centro: d.centro, radioM: d.radioM };
    elegidos = [];
    for (const p of filtrar(abiertos.filter((x) => elegibleFueraDeZona(s, x)))) {
      const c = p.pub.zonaMapa?.centro ?? centroDe(p.pub.zonaAproximada);
      if (distanciaM(c, d.centro) <= d.radioM) elegidos.push({ p, u: 'en_destino' });
      else if (desde && enElCamino(desde, d.centro, c)) elegidos.push({ p, u: 'en_el_camino' });
    }
  } else if (b.referencia.tipo === 'barrio') {
    const id = b.referencia.barrioId;
    const barrio = barriosPrueba().find((x) => x.id === id);
    if (!barrio) throw fallo('no_encontrado', 404, 'no_encontrado', 'No encontramos ese barrio.');
    referencia = { nombre: barrio.nombre, centro: barrio.centro, radioM: 1500 };
    elegidos = filtrar(abiertos.filter((x) => visible(s, x) && x.pub.zonaAproximada === barrio.id)).map((p) => ({ p, u: 'en_tus_zonas' }));
  } else {
    const mios = barriosPrueba().filter((x) => s.disponibilidad.zonas.includes(x.id));
    const centro = mios.length ? { lat: mios.reduce((n, x) => n + x.centro.lat, 0) / mios.length, lng: mios.reduce((n, x) => n + x.centro.lng, 0) / mios.length } : centroDe('Centro');
    referencia = { nombre: 'Tus zonas', centro, radioM: 4000 };
    elegidos = filtrar(abiertos.filter((x) => visible(s, x))).map((p) => ({ p, u: 'en_tus_zonas' }));
  }
  const pedidos = elegidos.map(({ p, u }) => aPedidoEnMapa(s, p, desde, u));
  // Ordenados por distancia si se mandó desde dónde; si no, por llegada (sin ranking).
  pedidos.sort((a, b2) => (a.distanciaM !== null && b2.distanciaM !== null ? a.distanciaM - b2.distanciaM : Date.parse(b2.creadoEn) - Date.parse(a.creadoEn)));
  const porBarrio = new Map<string, number>();
  for (const p of abiertos) porBarrio.set(p.pub.zonaAproximada, (porBarrio.get(p.pub.zonaAproximada) ?? 0) + 1);
  const zonas = [...porBarrio.entries()].map(([nombre, n]) => ({ barrioId: nombre, nombre, centro: centroDe(nombre), nivel: n >= 3 ? ('alta' as const) : n === 2 ? ('media' as const) : ('baja' as const) }));
  return { referencia, pedidos: pedidos.slice(0, 50), zonas, actualizadoEn: iso(ahoraMs(s)) };
}

/** Dentro del corredor hacia el destino: en su dirección (±35°) y no más lejos que él. */
function enElCamino(desde: Punto, destino: Punto, p: Punto): boolean {
  const largo = distanciaM(desde, destino);
  const d = distanciaM(desde, p);
  if (d > largo) return false;
  const dif = Math.abs(((rumbo(desde, p) - rumbo(desde, destino) + 540) % 360) - 180);
  return dif <= 35 && Math.sin((dif * Math.PI) / 180) * d <= 1500;
}

export function mapaPedido(s: EstadoMock, id: string): PedidoEntrante {
  if (!habilitada(s)) throw fallo('permiso', 403, 'sin_permiso', 'Podés ver pedidos cuando tu alta esté habilitada.');
  const p = s.pedidos.find((x) => x.pub.id === id);
  // Ajeno, cerrado o que no te corresponde: igual que inexistente.
  if (!p || (!visible(s, p) && !elegibleFueraDeZona(s, p))) throw fallo('no_encontrado', 404, 'no_encontrado', 'Este pedido ya no está disponible.');
  return {
    ...aPedidoEnMapa(s, p, BASE_PRUEBA_SI_HAY(s), visible(s, p) ? 'en_tus_zonas' : 'en_destino'),
    descripcion: p.pub.descripcion,
    fotos: p.pub.id === idFijo(0xb1) ? [{ id: idFijo(0xf01), url: FOTO_PRUEBA }] : [],
    conversacionId: p.conversacionId,
  };
}

/** En el detalle, la distancia se mide desde la última posición simulada solo si el GPS de prueba da señal. */
const BASE_PRUEBA_SI_HAY = (s: EstadoMock): Punto | null => (s.gps.senal === 'normal' || s.gps.senal === 'imprecisa' ? s.gps.posicion : null);

export function descartar(s: EstadoMock, id: string): void {
  // Descartar uno ajeno o inexistente responde igual (no revela nada) y no tiene ninguna consecuencia.
  extra(s).descartados.add(id);
}

// ── Tu día ────────────────────────────────────────────────────────────────────────────────────────

const diaBA = (ms: number): string => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Argentina/Buenos_Aires', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(ms));
const iniciales = (n: string): string =>
  n
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((x) => x.charAt(0).toUpperCase())
    .join('') || '?';

interface TurnoInterno {
  turno: TurnoAgenda;
  punto: Punto;
  hecho: boolean;
  opcional: boolean;
}

function turnosDeHoy(s: EstadoMock): TurnoInterno[] {
  const ahora = ahoraMs(s);
  const hoy = diaBA(ahora);
  const r: TurnoInterno[] = [];
  for (const t of s.trabajos) {
    const tr = t.trabajo;
    if (tr.estado === 'cancelado') continue;
    if (tr.tipo === 'obra') {
      for (const j of t.jornadas) {
        if (diaBA(Date.parse(j.horario.inicio)) !== hoy) continue;
        // Una jornada que ya empezó cuenta como parada hecha: ya estás (o estuviste) en la obra.
        const hecho = j.estado === 'hecha' || Date.parse(j.horario.inicio) <= ahora;
        r.push({
          punto: tr.destino ?? centroDe('Güemes'),
          hecho,
          opcional: false,
          turno: {
            id: j.id,
            tipo: 'jornada',
            trabajoId: tr.id,
            obraId: null,
            jornadaId: j.id,
            pedidoId: tr.pedidoId,
            pedidoFerreteriaId: null,
            titulo: tr.acuerdo.alcance.split(/[,.]/)[0]?.slice(0, 80) ?? NOMBRE_RUBRO[tr.rubro],
            detalle: `Obra · jornada ${j.numero} de ${t.jornadas.length}`,
            rubro: tr.rubro,
            barrio: 'Güemes',
            cliente: { nombre: t.contraparte, iniciales: iniciales(t.contraparte) },
            equipo: [],
            inicio: j.horario.inicio,
            fin: j.horario.fin,
            estado: hecho ? 'hecho' : 'agendado',
            monto: null,
            cobro: null,
            superpuesto: false,
          },
        });
      }
      continue;
    }
    if (diaBA(Date.parse(tr.acuerdo.horario.inicio)) !== hoy) continue;
    const hecho = tr.estado === 'finalizado';
    const pedido = s.pedidos.find((p) => p.pub.id === tr.pedidoId);
    r.push({
      punto: tr.destino ?? centroDe('Centro'),
      hecho,
      opcional: false,
      turno: {
        id: tr.id,
        tipo: 'trabajo',
        trabajoId: tr.id,
        obraId: null,
        jornadaId: null,
        pedidoId: tr.pedidoId,
        pedidoFerreteriaId: null,
        titulo: tr.id === ID_NUCLEO.canilla ? 'Pierde la canilla' : pedido ? tituloPedido(pedido.pub) : NOMBRE_RUBRO[tr.rubro],
        detalle: `${NOMBRE_RUBRO[tr.rubro]} · Centro`,
        rubro: tr.rubro,
        barrio: 'Centro',
        cliente: { nombre: t.contraparte, iniciales: iniciales(t.contraparte) },
        equipo: [],
        inicio: tr.acuerdo.horario.inicio,
        fin: tr.acuerdo.horario.fin,
        estado: hecho ? 'hecho' : 'agendado',
        monto: tr.acuerdo.monto,
        cobro: null,
        superpuesto: false,
      },
    });
  }
  // Un retiro opcional en la ferretería de prueba, solo si hay otras paradas hoy.
  if (r.length > 0 && habilitada(s)) {
    const inicio = Date.parse(`${hoy}T23:30:00.000Z`); // 20:30 en Buenos Aires
    r.push({
      punto: desplazar(centroDe('Centro'), 900, 300),
      hecho: false,
      opcional: true,
      turno: {
        id: ID_NUCLEO.retiro,
        tipo: 'retiro_ferreteria',
        trabajoId: null,
        obraId: null,
        jornadaId: null,
        pedidoId: null,
        pedidoFerreteriaId: idFijo(0x7c2),
        titulo: 'Retiro en ferretería',
        detalle: 'Pastina para mañana · Ferretería Simulación',
        rubro: null,
        barrio: 'Centro',
        cliente: null,
        equipo: [],
        inicio: iso(inicio),
        fin: null,
        estado: 'agendado',
        monto: null,
        cobro: null,
        superpuesto: false,
      },
    });
  }
  return r;
}

function armarDia(s: EstadoMock, desde: Punto | null): Dia {
  const ex = extra(s);
  const lista = turnosDeHoy(s).sort((a, b) => Date.parse(a.turno.inicio) - Date.parse(b.turno.inicio));
  if (ex.orden) {
    const pos = (id: string) => {
      const i = ex.orden?.indexOf(id) ?? -1;
      return i < 0 ? 999 : i;
    };
    lista.sort((a, b) => Number(b.hecho) - Number(a.hecho) || pos(a.turno.id) - pos(b.turno.id));
  } else lista.sort((a, b) => Number(b.hecho) - Number(a.hecho));
  let proxima = false;
  let anterior: Punto | null = desde;
  let total = 0;
  const paradas: Parada[] = lista.map((t, i) => {
    const estado = t.hecho ? 'hecha' : proxima ? 'pendiente' : ((proxima = true), 'proxima');
    const tramo = anterior && !t.hecho ? tramoEntre(anterior, t.punto, t.opcional) : null;
    if (tramo) total += tramo.distanciaM;
    anterior = t.punto;
    const salirA = tramo && !t.hecho ? iso(Date.parse(t.turno.inicio) - tramo.duracionS * 1000 - 5 * MIN) : null;
    return { orden: i + 1, turno: t.turno, estado, opcional: t.opcional, tramo, salirA };
  });
  const ultima = lista.filter((t) => !t.opcional).at(-1);
  const dia: Dia = {
    fecha: diaBA(ahoraMs(s)),
    paradas,
    terminaA: ultima ? (ultima.turno.fin ?? ultima.turno.inicio) : null,
    distanciaDiaM: Math.round(total),
    distanciaMesM: 312_000 + Math.round(total),
    version: ex.versionDia,
  };
  return DiaSchema.parse(dia);
}

function tramoEntre(a: Punto, b: Punto, opcional: boolean): NonNullable<Parada['tramo']> {
  const m = Math.round(distanciaM(a, b) * 1.3); // las calles no van en línea recta
  const s = Math.max(60, Math.round((m / 1000 / KMH_CIUDAD) * 3600));
  return { distanciaM: m, duracionS: s, desvioS: opcional ? Math.round(s * 0.3) : null };
}

export function dia(s: EstadoMock, cuerpo?: unknown): Dia {
  if (!habilitada(s)) throw fallo('permiso', 403, 'sin_permiso', 'Tu día aparece cuando tu alta esté habilitada.');
  if (cuerpo === undefined) return armarDia(s, null);
  const ok = RecorridoDiaSchema.safeParse(cuerpo);
  if (!ok.success) throw zodAFallo(ok.error);
  return armarDia(s, ok.data.desde?.punto ?? null);
}

export function ordenarDia(s: EstadoMock, cuerpo: unknown): Dia {
  const ok = OrdenParadasSchema.safeParse(cuerpo);
  if (!ok.success) throw zodAFallo(ok.error);
  const ex = extra(s);
  if (ok.data.version !== ex.versionDia) throw fallo('conflicto', 409, 'conflicto_version', 'Tu día cambió. Volvé a cargarlo.');
  const ids = new Set(turnosDeHoy(s).map((t) => t.turno.id));
  if (ok.data.turnos.length !== ids.size || ok.data.turnos.some((x) => !ids.has(x))) throw fallo('validacion', 400, 'validacion', 'El orden tiene que incluir todas las paradas de hoy.');
  ex.orden = [...ok.data.turnos];
  ex.versionDia += 1;
  return armarDia(s, null);
}

// ── Demora ────────────────────────────────────────────────────────────────────────────────────────

export function avisarDemora(s: EstadoMock, trabajoId: string, cuerpo: unknown, clave: string): MensajeChat {
  return idempotente(s, `demora:${clave}`, () => {
    const ok = AvisoDemoraSchema.safeParse(cuerpo);
    if (!ok.success) throw zodAFallo(ok.error);
    const t = s.trabajos.find((x) => x.trabajo.id === trabajoId);
    if (!t) throw fallo('no_encontrado', 404, 'no_encontrado', 'No encontramos ese trabajo.');
    if (!['agendado', 'en_camino'].includes(t.trabajo.estado)) throw fallo('conflicto', 409, 'transicion_invalida', 'Solo podés avisar una demora antes de llegar.');
    const texto = `Llego ${ok.data.minutos} minutos tarde.`;
    agregarMensaje(s, t.trabajo.conversacionId, { autorRol: 'especialista', tipo: 'texto', texto });
    return {
      id: idNuevo(s),
      chatId: t.trabajo.conversacionId,
      autor: { miembroId: idFijo(0x8e1), nombre: 'Especialista De Prueba', iniciales: 'ED', rol: 'profesional', esVos: true },
      tipo: 'tarjeta',
      texto: null,
      media: [],
      tarjeta: { tipo: 'demora', refId: trabajoId, titulo: 'Aviso de demora', detalle: texto, monto: null, estado: 'enviada' },
      respondeA: null,
      reacciones: [],
      editadoEn: null,
      borrado: false,
      fijado: false,
      enviadoEn: iso(ahoraMs(s)),
      vistoPorTodos: false,
    };
  });
}

// ── Cobro informado (reportado ≠ verificado) ─────────────────────────────────────────────────────

function aCobro(s: EstadoMock, p: Pago): Cobro {
  const inf = extra(s).cobros.get(p.id);
  const informado = inf ? monto(inf.informado) : p.estado === 'pendiente' ? null : p.monto;
  return {
    id: p.id,
    trabajoId: p.trabajoId,
    etapaId: p.etapaId,
    descripcion: p.descripcion,
    monto: p.monto,
    informado,
    metodo: inf?.metodo ?? (p.estado === 'pendiente' ? null : p.metodo),
    estado: p.estado,
    fuenteConfirmacion: p.fuenteConfirmacion,
    actualizadoEn: p.actualizadoEn,
    version: extra(s).version.get(p.id) ?? 0,
  };
}

export function cobro(s: EstadoMock, pagoId: string): Cobro {
  const p = s.pagos.find((x) => x.id === pagoId);
  if (!p) throw fallo('no_encontrado', 404, 'no_encontrado', 'No encontramos ese cobro.');
  return aCobro(s, p);
}

export function informarCobro(s: EstadoMock, pagoId: string, cuerpo: unknown, clave: string): Cobro {
  return idempotente(s, `informe-cobro:${clave}`, () => {
    const ok = InformeCobroSchema.safeParse(cuerpo);
    if (!ok.success) throw zodAFallo(ok.error);
    const p = s.pagos.find((x) => x.id === pagoId);
    if (!p) throw fallo('no_encontrado', 404, 'no_encontrado', 'No encontramos ese cobro.');
    const ex = extra(s);
    const version = ex.version.get(p.id) ?? 0;
    if (ok.data.version !== version) throw fallo('conflicto', 409, 'conflicto_version', 'El cobro cambió. Volvé a cargarlo.');
    if (p.estado === 'verificado') throw fallo('conflicto', 409, 'transicion_invalida', 'Este cobro ya está verificado.');
    const t = s.trabajos.find((x) => x.trabajo.id === p.trabajoId);
    if (t && !['en_sitio', 'en_curso', 'finalizado'].includes(t.trabajo.estado)) throw fallo('conflicto', 409, 'transicion_invalida', 'Informás el cobro cuando ya hiciste el trabajo.');
    if (ok.data.monto.centavos > p.monto.centavos) throw fallo('validacion', 400, 'validacion', 'No puede ser más que lo acordado.');
    ex.cobros.set(p.id, { metodo: ok.data.metodo, informado: ok.data.monto.centavos });
    ex.version.set(p.id, version + 1);
    if (ok.data.metodo !== 'transferencia') p.metodo = ok.data.metodo;
    p.estado = 'reportado';
    p.fuenteConfirmacion = 'reporte_especialista';
    p.actualizadoEn = iso(ahoraMs(s));
    return aCobro(s, p);
  });
}
