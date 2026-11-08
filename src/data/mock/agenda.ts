// Mock de la agenda del taller (lote 2.1, contrato 0.11.0): resumen, turnos por vista, el mes y un día. Emula al servidor:
// arma los turnos desde los trabajos, las jornadas de obra y las ofertas pendientes del estado, y suma un historial de
// pasadas de PRUEBA (nombres ficticios) para que las pasadas tengan qué mostrar. Una oferta no es un turno; el cobro de una
// pasada sigue la regla reportado ≠ verificado. Todo es sintético.
import { AgendaMesSchema, FILTROS_MES, ResumenAgendaSchema, TurnoAgendaSchema, VISTAS_AGENDA, type AgendaMes, type ResumenAgenda, type TurnoAgenda, type VistaAgenda } from '../../contracts/agenda.ts';
import { monto } from '../../contracts/dinero.ts';
import { MesSchema, FechaSchema } from '../../contracts/comun.ts';
import type { EstadoPago } from '../../contracts/maquinas.ts';
import { NOMBRE_RUBRO } from '../../contracts/rubros.ts';
import { ahoraMs, fallo, idFijo, iso, type EstadoMock, type TrabajoInterno } from './estado.ts';
import { ID } from './fixtures.ts';
import { ID_NUCLEO, tituloPedido } from './nucleo.ts';
import { zodAFallo } from './validacion.ts';

const MIN = 60_000;
const HORA = 60 * MIN;
const DIA = 24 * HORA;
const DOS_HORAS = 2 * HORA;
const PAGINA = 20;

export const diaBA = (ms: number): string =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Argentina/Buenos_Aires',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(ms));
export const mesBA = (ms: number): string => diaBA(ms).slice(0, 7);

const iniciales = (n: string): string =>
  n
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((x) => x.charAt(0).toUpperCase())
    .join('') || '?';

/** Un cobro de una pasada o de un pago (lo usa también el mock de ingresos). */
export interface CobroDeTurno {
  /** Id de la pasada o del pago al que pertenece. */
  id: string;
  trabajoId: string | null;
  etapaId: string | null;
  titulo: string;
  centavos: number;
  estado: EstadoPago;
  /** Cuándo pasó (para saber de qué mes es). */
  en: string;
}

interface Historial {
  turno: TurnoAgenda;
}

/** Pasadas de prueba que no son trabajos del estado: dan historia a F-AgendaPasadas y a F-Ingresos. */
function historial(): Historial[] {
  const h = (n: number, titulo: string, detalle: string, barrio: string, cliente: string, rubro: 'plomeria' | 'electricidad', inicio: string, centavos: number, estado: EstadoPago): Historial => {
    const ini = Date.parse(inicio);
    return {
      turno: {
        id: idFijo(0x2100 + n),
        tipo: 'trabajo',
        trabajoId: null,
        obraId: null,
        jornadaId: null,
        pedidoId: null,
        pedidoFerreteriaId: null,
        titulo,
        detalle,
        rubro,
        barrio,
        cliente: { nombre: cliente, iniciales: iniciales(cliente) },
        equipo: [],
        inicio: iso(ini),
        fin: iso(ini + 90 * MIN),
        estado: 'hecho',
        monto: monto(centavos),
        cobro: { estado, monto: monto(centavos) },
        superpuesto: false,
      },
    };
  };
  return [
    h(1, 'Revisión de termotanque', 'Plomería · Chauvín', 'Chauvín', 'Carla Ibáñez', 'plomeria', '2026-11-16T14:00:00.000Z', 2_800_000, 'verificado'),
    h(2, 'Cambio de flexible', 'Plomería · Centro', 'Centro', 'Julián Ortiz', 'plomeria', '2026-11-13T13:00:00.000Z', 1_500_000, 'reportado'),
    h(3, 'Cambio de tomas en la cocina', 'Electricidad · Güemes', 'Güemes', 'Pablo Vega', 'electricidad', '2026-11-11T16:00:00.000Z', 3_800_000, 'verificado'),
  ];
}

/** Título corto de un trabajo (igual que «Tu día»: el primer tramo de lo acordado). */
export const tituloTrabajo = (t: TrabajoInterno, pedidoDescripcion?: { id: string; descripcion: string }): string => {
  if (t.trabajo.id === ID_NUCLEO.canilla) return 'Pierde la canilla';
  if (pedidoDescripcion) return tituloPedido(pedidoDescripcion);
  return t.trabajo.acuerdo.alcance.split(/[,.]/)[0]?.slice(0, 80) ?? NOMBRE_RUBRO[t.trabajo.rubro];
};

const barrioDe = (t: TrabajoInterno): string => (t.trabajo.id === ID.t6 ? 'Centro' : t.trabajo.tipo === 'obra' ? 'Güemes' : 'Centro');

/** Todos los turnos del estado, sin ordenar. `ahora` define si una oferta o un cambio siguen vigentes. */
export function todosLosTurnos(s: EstadoMock): TurnoAgenda[] {
  const ahora = ahoraMs(s);
  const r: TurnoAgenda[] = [];
  const agendados: Array<[number, number]> = [];
  for (const t of s.trabajos) {
    const tr = t.trabajo;
    if (tr.estado === 'cancelado') continue;
    const pedido = s.pedidos.find((p) => p.pub.id === tr.pedidoId);
    const titulo = tituloTrabajo(t, pedido?.pub);
    const cliente = {
      nombre: t.contraparte,
      iniciales: iniciales(t.contraparte),
    };
    if (tr.tipo === 'obra' && t.jornadas.length > 0) {
      for (const j of t.jornadas) {
        const hecho = j.estado === 'hecha';
        const ini = Date.parse(j.horario.inicio);
        if (!hecho) agendados.push([ini, j.horario.fin ? Date.parse(j.horario.fin) : ini + DOS_HORAS]);
        r.push({
          id: j.id,
          tipo: 'jornada',
          trabajoId: tr.id,
          obraId: tr.id,
          jornadaId: j.id,
          pedidoId: tr.pedidoId,
          pedidoFerreteriaId: null,
          titulo,
          detalle: `Obra · jornada ${j.numero} de ${t.jornadas.length} · ${barrioDe(t)}`,
          rubro: tr.rubro,
          barrio: barrioDe(t),
          cliente,
          equipo: [],
          inicio: j.horario.inicio,
          fin: j.horario.fin,
          estado: hecho ? 'hecho' : j.cambioPendiente ? 'cambio_pendiente' : 'agendado',
          monto: null,
          cobro: null,
          superpuesto: false,
        });
      }
      continue;
    }
    const hecho = tr.estado === 'finalizado';
    const ini = Date.parse(tr.acuerdo.horario.inicio);
    if (!hecho) agendados.push([ini, tr.acuerdo.horario.fin ? Date.parse(tr.acuerdo.horario.fin) : ini + DOS_HORAS]);
    const pago = t.pagoId ? s.pagos.find((p) => p.id === t.pagoId) : undefined;
    const cambio = t.cambioPendienteId ? s.propuestas.find((p) => p.id === t.cambioPendienteId) : undefined;
    r.push({
      id: tr.id,
      tipo: 'trabajo',
      trabajoId: tr.id,
      obraId: null,
      jornadaId: null,
      pedidoId: tr.pedidoId,
      pedidoFerreteriaId: null,
      titulo,
      detalle: `${NOMBRE_RUBRO[tr.rubro]} · ${barrioDe(t)}`,
      rubro: tr.rubro,
      barrio: barrioDe(t),
      cliente,
      equipo: [],
      inicio: tr.acuerdo.horario.inicio,
      fin: tr.acuerdo.horario.fin,
      estado: hecho ? 'hecho' : cambio && cambio.estado === 'pendiente' && Date.parse(cambio.venceEn) > ahora ? 'cambio_pendiente' : 'agendado',
      monto: tr.acuerdo.monto,
      cobro: hecho && pago ? { estado: pago.estado, monto: pago.monto } : null,
      superpuesto: false,
    });
  }
  // Ofertas pendientes (mías o del cliente): no son turnos hasta que la otra parte acepta.
  for (const p of s.propuestas) {
    if (p.estado !== 'pendiente' || Date.parse(p.venceEn) <= ahora) continue;
    if (s.trabajos.some((t) => t.cambioPendienteId === p.id)) continue;
    const pedido = s.pedidos.find((x) => x.pub.id === p.pedidoId);
    const ini = Date.parse(p.horario.inicio);
    const fin = p.horario.fin ? Date.parse(p.horario.fin) : ini + DOS_HORAS;
    r.push({
      id: p.id,
      tipo: 'oferta',
      trabajoId: null,
      obraId: null,
      jornadaId: null,
      pedidoId: p.pedidoId,
      pedidoFerreteriaId: null,
      titulo: pedido ? tituloPedido(pedido.pub) : p.autorRol === 'usuario' ? 'Propuesta recibida' : 'Propuesta enviada',
      detalle: pedido ? `${NOMBRE_RUBRO[pedido.pub.rubro]} · ${pedido.pub.zonaAproximada}` : 'Propuesta',
      rubro: pedido?.pub.rubro ?? null,
      barrio: pedido?.pub.zonaAproximada ?? null,
      cliente: pedido ? { nombre: pedido.cliente, iniciales: iniciales(pedido.cliente) } : null,
      equipo: [],
      inicio: p.horario.inicio,
      fin: p.horario.fin,
      estado: 'oferta_pendiente',
      monto: p.monto,
      cobro: null,
      superpuesto: agendados.some(([a, b]) => ini < b && a < fin),
    });
  }
  for (const h of historial()) r.push(h.turno);
  return r.map((t) => TurnoAgendaSchema.parse(t));
}

/** «Pasada»: es de un día anterior a hoy. Las ofertas nunca son pasadas: vencen. */
const esPasada = (t: TurnoAgenda, hoy: string): boolean => t.tipo !== 'oferta' && t.estado !== 'cancelado' && diaBA(Date.parse(t.inicio)) < hoy;
const esDeHoy = (t: TurnoAgenda, hoy: string): boolean => diaBA(Date.parse(t.inicio)) === hoy && t.estado !== 'cancelado';
const esFutura = (t: TurnoAgenda, hoy: string): boolean => diaBA(Date.parse(t.inicio)) > hoy && t.estado !== 'cancelado';

const porInicio = (a: TurnoAgenda, b: TurnoAgenda): number => Date.parse(a.inicio) - Date.parse(b.inicio);

/** Cobros de pagos y de pasadas de prueba, para el resumen y para los ingresos. Solo lo informado o verificado cuenta. */
export function cobrosDelEstado(s: EstadoMock): CobroDeTurno[] {
  const r: CobroDeTurno[] = [];
  for (const p of s.pagos) {
    if (p.estado !== 'verificado' && p.estado !== 'reportado') continue;
    const t = s.trabajos.find((x) => x.trabajo.id === p.trabajoId);
    const pedido = t ? s.pedidos.find((x) => x.pub.id === t.trabajo.pedidoId) : undefined;
    const etapa = t?.etapas.find((e) => e.id === p.etapaId);
    const base = t ? tituloTrabajo(t, pedido?.pub) : p.descripcion;
    r.push({
      id: p.id,
      trabajoId: p.trabajoId,
      etapaId: p.etapaId,
      titulo: etapa ? `${base} · etapa ${etapa.orden}` : base,
      centavos: p.monto.centavos,
      estado: p.estado,
      en: p.actualizadoEn,
    });
  }
  for (const { turno } of historial()) {
    if (!turno.cobro) continue;
    r.push({
      id: turno.id,
      trabajoId: null,
      etapaId: null,
      titulo: turno.titulo,
      centavos: turno.cobro.monto.centavos,
      estado: turno.cobro.estado,
      en: turno.inicio,
    });
  }
  return r;
}

const lunesDe = (dia: string): string => {
  const d = new Date(`${dia}T12:00:00.000Z`);
  const dow = (d.getUTCDay() + 6) % 7; // lunes = 0
  return new Date(d.getTime() - dow * DIA).toISOString().slice(0, 10);
};

export function resumenAgenda(s: EstadoMock): ResumenAgenda {
  const ahora = ahoraMs(s);
  const hoy = diaBA(ahora);
  const turnos = todosLosTurnos(s);
  const lunes = lunesDe(hoy);
  const semana = Array.from({ length: 7 }, (_, i) => {
    const fecha = new Date(Date.parse(`${lunes}T12:00:00.000Z`) + i * DIA).toISOString().slice(0, 10);
    return {
      fecha,
      turnos: turnos.filter((t) => t.tipo !== 'oferta' && t.estado !== 'cancelado' && diaBA(Date.parse(t.inicio)) === fecha).length,
    };
  });
  const proximo = turnos.filter((t) => t.tipo !== 'oferta' && (t.estado === 'agendado' || t.estado === 'cambio_pendiente') && Date.parse(t.inicio) > ahora).sort(porInicio)[0];
  const cobradoMes = cobrosDelEstado(s)
    .filter((c) => c.estado === 'verificado' && mesBA(Date.parse(c.en)) === mesBA(ahora))
    .reduce((n, c) => n + c.centavos, 0);
  return ResumenAgendaSchema.parse({
    hoy,
    pasadas: turnos.filter((t) => esPasada(t, hoy)).length,
    deHoy: turnos.filter((t) => t.tipo !== 'oferta' && esDeHoy(t, hoy)).length,
    futuras: turnos.filter((t) => esFutura(t, hoy)).length,
    semana,
    cobradoMes: monto(cobradoMes),
    proximo: proximo ?? null,
  });
}

export function turnosAgenda(s: EstadoMock, vista: unknown, cursor?: string | null): { items: TurnoAgenda[]; siguienteCursor: string | null } {
  if (!(VISTAS_AGENDA as readonly unknown[]).includes(vista)) throw fallo('validacion', 400, 'validacion', 'Elegí pasadas, hoy o futuras.');
  const v = vista as VistaAgenda;
  const ahora = ahoraMs(s);
  const hoy = diaBA(ahora);
  const todos = todosLosTurnos(s);
  let lista: TurnoAgenda[];
  if (v === 'pasadas') lista = todos.filter((t) => esPasada(t, hoy)).sort((a, b) => porInicio(b, a));
  else if (v === 'hoy') lista = todos.filter((t) => t.tipo !== 'oferta' && esDeHoy(t, hoy)).sort(porInicio);
  else lista = todos.filter((t) => esFutura(t, hoy)).sort(porInicio);
  const desde = cursor ? Number(cursor) : 0;
  if (!Number.isInteger(desde) || desde < 0) throw fallo('validacion', 400, 'validacion', 'El cursor no es válido.');
  const items = lista.slice(desde, desde + PAGINA);
  return {
    items,
    siguienteCursor: desde + PAGINA < lista.length ? String(desde + PAGINA) : null,
  };
}

export function agendaMes(s: EstadoMock, mes: unknown, filtro: unknown = 'todo'): AgendaMes {
  const m = MesSchema.safeParse(mes);
  if (!m.success) throw zodAFallo(m.error);
  if (!(FILTROS_MES as readonly unknown[]).includes(filtro)) throw fallo('validacion', 400, 'validacion', 'El filtro no es válido.');
  const turnos = todosLosTurnos(s).filter((t) => t.tipo !== 'oferta' && t.estado !== 'cancelado' && mesBA(Date.parse(t.inicio)) === m.data);
  const conObras = filtro !== 'trabajos';
  const conTrabajos = filtro !== 'obras';
  const dias = new Map<string, { trabajos: number; obras: Map<string, string>; hechos: number }>();
  const dia = (f: string) => {
    let d = dias.get(f);
    if (!d) dias.set(f, (d = { trabajos: 0, obras: new Map(), hechos: 0 }));
    return d;
  };
  const obrasDelMes = new Map<string, string>();
  let trabajos = 0;
  for (const t of turnos) {
    const f = diaBA(Date.parse(t.inicio));
    if (t.tipo === 'jornada' && t.obraId) {
      if (!conObras) continue;
      dia(f).obras.set(t.obraId, t.titulo);
      obrasDelMes.set(t.obraId, t.titulo);
    } else if (t.tipo === 'trabajo') {
      if (!conTrabajos) continue;
      dia(f).trabajos += 1;
      trabajos += 1;
    } else continue;
    if (t.estado === 'hecho') dia(f).hechos += 1;
  }
  return AgendaMesSchema.parse({
    mes: m.data,
    dias: [...dias.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([fecha, d]) => ({
        fecha,
        trabajos: d.trabajos,
        obras: [...d.obras].map(([obraId, nombre]) => ({ obraId, nombre })),
        hechos: d.hechos,
      })),
    totales: { trabajos, obras: obrasDelMes.size },
  });
}

export function turnosDelDia(s: EstadoMock, fecha: unknown): TurnoAgenda[] {
  const f = FechaSchema.safeParse(fecha);
  if (!f.success) throw zodAFallo(f.error);
  return todosLosTurnos(s)
    .filter((t) => t.tipo !== 'oferta' && t.estado !== 'cancelado' && diaBA(Date.parse(t.inicio)) === f.data)
    .sort(porInicio);
}

export const agenda = (s: EstadoMock) => ({
  resumenAgenda: () => resumenAgenda(s),
  turnosAgenda: (vista: unknown, cursor?: string | null) => turnosAgenda(s, vista, cursor),
  agendaMes: (mes: unknown, filtro?: unknown) => agendaMes(s, mes, filtro),
  turnosDelDia: (fecha: unknown) => turnosDelDia(s, fecha),
});
