// Del contrato a lo que muestran las pantallas del núcleo (lote 1.3). Funciones puras, con pruebas en vista.test.ts.
// Zona aproximada siempre: nada de esto lleva la dirección exacta de un pedido.
import type { Parada } from '../../contracts/agenda.ts';
import type { ArchivoFirmado } from '../../contracts/comun.ts';
import type { PedidoDetalle, Propuesta } from '../../contracts/dto.ts';
import type { EstadoTrabajo } from '../../contracts/maquinas.ts';
import type { PedidoEnMapa, PedidoEntrante } from '../../contracts/mapa.ts';
import type { Rubro } from '../../contracts/rubros.ts';
import type { NombreIconoUi } from '../../ui/atomos/Icono.tsx';
import type { TonoChip } from '../../ui/atomos/Texto.tsx';
import { textoDistancia } from '../../ui/logica.ts';
import { minutosBA, textoHorario, textoMinutos, textoSalida } from '../../ui/logicaNucleo.ts';
import type { ParadaUi } from '../../ui/moleculas/Paradas.tsx';
import type { EstadoPaso } from '../../ui/moleculas/LineaTiempo.tsx';
import type { PedidoMapa } from '../../ui/organismos/MapaArreglos.tsx';
import type { PedidoCercano } from '../../ui/organismos/PedidosCercanos.tsx';
import { restante } from '../../lib/formato.ts';

/** Lo que muestra el detalle de un pedido, venga del mapa (PedidoEntrante) o de un aviso (PedidoDetalle). */
export interface VistaPedido {
  id: string;
  rubro: Rubro;
  tipo: 'urgente' | 'programado' | 'obra';
  titulo: string;
  descripcion: string;
  zona: string;
  distanciaM: number | null;
  horario: { inicio: string; fin: string | null } | null;
  ventanaHasta: string | null;
  sugeridoCentavos: number | null;
  sumaAlCamino: boolean;
  fotos: ArchivoFirmado[];
  abierto: boolean;
  conversacionId: string | null;
}

/** El primer pedazo de lo que escribió el cliente, como título corto. */
export function tituloDe(descripcion: string): string {
  const primera = descripcion.split(/[.:;]/)[0]?.trim() || descripcion.trim();
  return primera.length > 60 ? `${primera.slice(0, 57).trimEnd()}…` : primera;
}

export function vistaDesdeMapa(p: PedidoEntrante): VistaPedido {
  return {
    id: p.id,
    rubro: p.rubro,
    tipo: p.tipo,
    titulo: p.titulo,
    descripcion: p.descripcion,
    zona: p.barrio,
    distanciaM: p.distanciaM,
    horario: p.horarioPedido,
    ventanaHasta: p.ventanaHasta,
    sugeridoCentavos: p.precioSugerido?.centavos ?? null,
    sumaAlCamino: p.sumaAlCamino,
    fotos: p.fotos,
    abierto: p.miPropuesta === null,
    conversacionId: p.conversacionId,
  };
}

export function vistaDesdeDetalle(p: PedidoDetalle): VistaPedido {
  return {
    id: p.id,
    rubro: p.rubro,
    tipo: p.tipo,
    titulo: tituloDe(p.descripcion),
    descripcion: p.descripcion,
    zona: p.zonaAproximada,
    distanciaM: null,
    horario: p.tipo === 'urgente' || !p.fechaSolicitada ? null : { inicio: p.fechaSolicitada, fin: new Date(Date.parse(p.fechaSolicitada) + 4 * 3600_000).toISOString() },
    ventanaHasta: p.ventanaHasta,
    sugeridoCentavos: p.precioSugerido?.monto.centavos ?? null,
    sumaAlCamino: true,
    fotos: [],
    abierto: p.estado === 'buscando',
    conversacionId: p.conversacionId,
  };
}

/** Para el mapa de arreglos del kit (marcadores y lista). */
export function aPedidoMapa(p: PedidoEnMapa, nuevos: ReadonlySet<string>): PedidoMapa {
  return { id: p.id, rubro: p.rubro, zona: p.barrio, punto: p.zona.centro, radioM: p.zona.radioM, sugeridoCentavos: p.precioSugerido?.centavos ?? null, urgente: p.tipo === 'urgente', nuevo: nuevos.has(p.id) };
}

/** Para la hoja de cercanos y el pedido flotante. */
export function aPedidoCercano(p: PedidoEnMapa, ahora: Date, hoy: string): PedidoCercano {
  return {
    id: p.id,
    rubro: p.rubro,
    titulo: p.titulo,
    zona: p.barrio,
    distanciaM: p.distanciaM,
    sugeridoCentavos: p.precioSugerido?.centavos ?? null,
    urgente: p.tipo === 'urgente',
    quedan: p.tipo === 'urgente' && p.ventanaHasta ? restante(p.ventanaHasta, ahora) : null,
    cuando: p.horarioPedido ? textoHorario(p.horarioPedido, hoy) : null,
  };
}

/** "Centro · zona aproximada · a 2,1 km". */
export function textoZona(v: Pick<VistaPedido, 'zona' | 'distanciaM'>): string {
  return `${v.zona} · zona aproximada${v.distanciaM !== null ? ` · a ${textoDistancia(v.distanciaM)}` : ''}`;
}

/** "18:00" de Buenos Aires. */
export const horaBA = (iso: string): string => {
  const m = minutosBA(iso);
  return `${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}`;
};

/** Nombre corto para la tira: "Pierde la canilla" → "La canilla", "Retiro en ferretería" → "Ferretería". */
export function tituloCorto(titulo: string): string {
  const m = /\b(la|el|los|las)\s+(\S+)$/i.exec(titulo);
  if (m) {
    const art = m[1] ?? '';
    return `${art.charAt(0).toUpperCase()}${art.slice(1).toLowerCase()} ${m[2] ?? ''}`;
  }
  const p = titulo.split(/\s+/);
  if (p.length <= 2) return titulo;
  const ultima = p.at(-1) ?? titulo;
  return `${ultima.charAt(0).toUpperCase()}${ultima.slice(1)}`;
}

export function aParadaUi(p: Parada, ahora: Date, corto = false): ParadaUi {
  const t = p.turno;
  const salida = p.estado === 'proxima' ? textoSalida(p.salirA, ahora) : null;
  return {
    id: t.id,
    hora: horaBA(t.inicio),
    titulo: corto ? tituloCorto(t.titulo) : t.titulo,
    detalle: [t.detalle, t.cliente?.nombre].filter(Boolean).join(' · '),
    estado: p.estado,
    opcional: p.opcional,
    tramo: p.tramo ? `${textoMinutos(p.tramo.duracionS)} · ${textoDistancia(p.tramo.distanciaM)}${p.tramo.desvioS ? ` · ${textoMinutos(p.tramo.desvioS)} de desvío` : ''}` : null,
    nota: salida ?? undefined,
  };
}

// ── Trabajo ─────────────────────────────────────────────────────────────

export const ESTADO_TRABAJO: Record<EstadoTrabajo, { texto: string; icono: NombreIconoUi; tono: TonoChip }> = {
  agendado: { texto: 'Agendado', icono: 'agenda', tono: 'noche' },
  en_camino: { texto: 'En camino', icono: 'camion', tono: 'azul' },
  en_sitio: { texto: 'En el lugar', icono: 'pin', tono: 'azul' },
  en_curso: { texto: 'En curso', icono: 'herramienta', tono: 'azul' },
  finalizado: { texto: 'Terminado', icono: 'check', tono: 'exito' },
  cancelado: { texto: 'Cancelado', icono: 'cerrar', tono: 'gris' },
};

/** Los cuatro pasos del trabajo (F-Trabajo): acordado, salir, llegué y terminé, con su estado. */
export function pasosTrabajo(estado: EstadoTrabajo): [EstadoPaso, EstadoPaso, EstadoPaso, EstadoPaso] {
  switch (estado) {
    case 'agendado':
      return ['hecho', 'actual', 'pendiente', 'pendiente'];
    case 'en_camino':
      return ['hecho', 'hecho', 'actual', 'pendiente'];
    case 'en_sitio':
    case 'en_curso':
      return ['hecho', 'hecho', 'hecho', 'actual'];
    case 'finalizado':
      return ['hecho', 'hecho', 'hecho', 'hecho'];
    default:
      return ['hecho', 'pendiente', 'pendiente', 'pendiente'];
  }
}

/** La propuesta vigente del especialista que generó el trabajo (para saber si incluye materiales y la garantía). */
export function propuestaDelTrabajo(propuestas: readonly Propuesta[], id: string): Propuesta | null {
  return propuestas.find((p) => p.id === id) ?? null;
}

/** "Urgente · quedan 18:42" o null. */
export function textoUrgencia(v: Pick<VistaPedido, 'tipo' | 'ventanaHasta'>, ahora: Date): string | null {
  if (v.tipo !== 'urgente') return null;
  const q = v.ventanaHasta ? restante(v.ventanaHasta, ahora) : null;
  return q ? `Urgente · quedan ${q}` : 'Urgente';
}

/** Minutos de Buenos Aires de un instante, para la rueda y las franjas. */
export { minutosBA };
