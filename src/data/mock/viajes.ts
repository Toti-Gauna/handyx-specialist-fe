// Viaje de un trabajo (lote 4.3): emula lo que hará api-especialista con las posiciones del especialista. Calcula el
// trayecto con la primera posición, lo recalcula si te desviás dos veces seguidas y deja de compartir al llegar o cancelar.
import { PRECISION_MAX_LLEGADA_M, PosicionSchema, RADIO_LLEGADA_M, type Barrio, type Llegada, type Viaje } from '../../contracts/dto.ts';
import { distanciaM, fueraDelTrayecto, largoM, proyectar } from '../../lib/geo.ts';
import { ahoraMs, fallo, iso, type EstadoMock, type TrabajoInterno, type ViajeInterno } from './estado.ts';
import { barriosPrueba, rutaPrueba } from './mapa.ts';
import { zodAFallo } from './validacion.ts';

/** Sin trayecto, la llegada se estima en línea recta a 25 km/h. */
const VELOCIDAD_SIN_TRAYECTO_MS = 25_000 / 3600;

function trabajoConDestino(s: EstadoMock, id: string): TrabajoInterno & { trabajo: { destino: NonNullable<TrabajoInterno['trabajo']['destino']> } } {
  const t = s.trabajos.find((x) => x.trabajo.id === id);
  if (!t) throw fallo('no_encontrado', 404, 'no_encontrado', 'No encontramos ese trabajo.');
  if (!t.trabajo.destino) throw fallo('conflicto', 409, 'transicion_invalida', 'Este trabajo no tiene un destino para el mapa.');
  return t as TrabajoInterno & { trabajo: { destino: NonNullable<TrabajoInterno['trabajo']['destino']> } };
}

function interno(s: EstadoMock, id: string): ViajeInterno {
  let v = s.viajes.get(id);
  if (!v) {
    v = { estado: 'sin_compartir', trayecto: null, ultimaPosicion: null, desvios: 0 };
    s.viajes.set(id, v);
  }
  return v;
}

function vista(s: EstadoMock, t: ReturnType<typeof trabajoConDestino>, v: ViajeInterno): Viaje {
  const destino = t.trabajo.destino;
  const p = v.ultimaPosicion;
  let restante: number | null = null;
  let segundos: number | null = null;
  if (p && v.trayecto) {
    const total = largoM(v.trayecto.linea);
    restante = Math.max(0, total - proyectar(v.trayecto.linea, p.punto).recorridoM);
    segundos = total > 0 ? (v.trayecto.duracionS * restante) / total : 0;
  } else if (p) {
    restante = distanciaM(p.punto, destino);
    segundos = restante / VELOCIDAD_SIN_TRAYECTO_MS;
  }
  return {
    trabajoId: t.trabajo.id,
    destino,
    estado: v.estado,
    trayecto: v.trayecto,
    ultimaPosicion: p,
    distanciaRestanteM: restante === null ? null : Math.round(restante),
    llegadaEstimada: segundos === null ? null : iso(ahoraMs(s) + Math.round(segundos) * 1000),
  };
}

export const viajes = (s: EstadoMock) => ({
  barrios(): Barrio[] {
    return barriosPrueba();
  },

  viaje(id: string): Viaje {
    const t = trabajoConDestino(s, id);
    return vista(s, t, interno(s, id));
  },

  enviarPosicion(id: string, posicion: unknown): Viaje {
    const ok = PosicionSchema.safeParse(posicion);
    if (!ok.success) throw zodAFallo(ok.error);
    const t = trabajoConDestino(s, id);
    if (t.trabajo.estado !== 'en_camino') throw fallo('conflicto', 409, 'transicion_invalida', 'La ubicación se comparte solo mientras vas en camino.');
    const v = interno(s, id);
    const pos = ok.data;
    v.estado = 'compartiendo';
    v.ultimaPosicion = pos;
    const recalcular = () => {
      const r = rutaPrueba(pos.punto, t.trabajo.destino);
      v.trayecto = r ? { ...r, version: (v.trayecto?.version ?? -1) + 1 } : null;
      v.desvios = 0;
    };
    if (!v.trayecto) recalcular();
    else if (fueraDelTrayecto(v.trayecto.linea, pos.punto, pos.precisionM)) {
      v.desvios += 1;
      if (v.desvios >= 2) recalcular();
    } else v.desvios = 0;
    // Geocerca (0.7.0): dentro del radio y con buena precisión, el servidor marca la llegada solo y avisa al usuario.
    if (distanciaM(pos.punto, t.trabajo.destino) <= RADIO_LLEGADA_M && pos.precisionM <= PRECISION_MAX_LLEGADA_M) {
      registrarLlegada(s, t, { modo: 'automatica', motivo: null, en: iso(ahoraMs(s)) }, 'sistema');
    }
    return vista(s, t, v);
  },

  dejarDeCompartir(id: string): Viaje {
    const t = trabajoConDestino(s, id);
    const v = interno(s, id);
    if (v.estado === 'compartiendo') v.estado = 'sin_compartir';
    return vista(s, t, v);
  },
});

/** Llegada (automática o de respaldo): en el lugar, con fecha y actor, y deja de compartir la ubicación. */
export function registrarLlegada(s: EstadoMock, t: TrabajoInterno, llegada: Llegada, actor: 'sistema' | 'especialista'): void {
  t.trabajo.estado = 'en_sitio';
  t.trabajo.llegada = llegada;
  t.trabajo.version += 1;
  t.eventos.push({ estado: 'en_sitio', en: llegada.en, actor });
  terminarViaje(s, t.trabajo.id);
}

/** Al llegar, empezar, terminar o cancelar, el servidor deja de compartir la ubicación. */
export function terminarViaje(s: EstadoMock, trabajoId: string): void {
  const v = s.viajes.get(trabajoId);
  if (v) v.estado = 'terminado';
}
