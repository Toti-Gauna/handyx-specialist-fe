import { NuevoCambioSchema, type AgendaItem, type Pago, type Propuesta, type Trabajo, type TrabajoDetalle } from '../../contracts/dto.ts';
import { monto } from '../../contracts/dinero.ts';
import { MAQUINA_TRABAJO, puedeTransicionar, type EstadoTrabajo } from '../../contracts/maquinas.ts';
import { VIGENCIA_PROPUESTA_PROGRAMADO_MS } from '../../contracts/tiempos.ts';
import { ahoraMs, fallo, idempotente, idNuevo, iso, type EstadoMock, type TrabajoInterno } from './estado.ts';
import { zodAFallo } from './validacion.ts';

const ACTIVOS: readonly EstadoTrabajo[] = ['agendado', 'en_camino', 'en_sitio', 'en_curso'];
const DOS_HORAS = 2 * 60 * 60_000;

function buscar(s: EstadoMock, id: string): TrabajoInterno {
  const t = s.trabajos.find((x) => x.trabajo.id === id);
  if (!t) throw fallo('no_encontrado', 404, 'no_encontrado', 'No encontramos ese trabajo.');
  return t;
}

/** El cambio pendiente de un trabajo solo cuenta mientras la propuesta siga pendiente y vigente. */
function cambioVigente(s: EstadoMock, t: TrabajoInterno): Propuesta | null {
  const p = t.cambioPendienteId ? s.propuestas.find((x) => x.id === t.cambioPendienteId) : undefined;
  if (p && p.estado === 'pendiente' && Date.parse(p.venceEn) > ahoraMs(s)) return p;
  t.cambioPendienteId = null;
  return null;
}

const fin = (inicio: string, f: string | null): number => (f ? Date.parse(f) : Date.parse(inicio) + DOS_HORAS);

export const trabajos = (s: EstadoMock) => ({
  trabajos(vista: 'activos' | 'historial') {
    const items = s.trabajos
      .filter((t) => (vista === 'activos') === ACTIVOS.includes(t.trabajo.estado))
      .map((t) => t.trabajo)
      .sort((a, b) => Date.parse(a.acuerdo.horario.inicio) - Date.parse(b.acuerdo.horario.inicio));
    if (vista === 'historial') items.reverse();
    return { items, siguienteCursor: null };
  },

  trabajo(id: string): TrabajoDetalle {
    const t = buscar(s, id);
    return { trabajo: t.trabajo, contraparte: t.contraparte, eventos: t.eventos, etapas: t.etapas, cambioPendiente: cambioVigente(s, t), pagoId: t.pagoId };
  },

  avanzarTrabajo(id: string, hacia: Exclude<EstadoTrabajo, 'agendado'>, version: number, clave: string): Trabajo {
    return idempotente(s, `trabajo:${clave}`, () => {
      const t = buscar(s, id);
      if (t.trabajo.version !== version) throw fallo('conflicto', 409, 'conflicto_version', 'El trabajo cambió. Volvé a abrirlo para ver su estado actual.');
      if (!puedeTransicionar(MAQUINA_TRABAJO, t.trabajo.estado, hacia, 'especialista')) {
        throw fallo('conflicto', 409, 'transicion_invalida', 'Ese paso no corresponde al estado actual del trabajo.');
      }
      t.trabajo.estado = hacia;
      t.trabajo.version += 1;
      t.eventos.push({ estado: hacia, en: iso(ahoraMs(s)), actor: 'especialista' });
      if (hacia === 'finalizado' || hacia === 'cancelado') {
        const c = s.conversaciones.find((x) => x.id === t.trabajo.conversacionId);
        if (c) c.etapa = 'cerrada';
      }
      if (hacia === 'finalizado' && !t.pagoId) {
        // El cobro del servicio es directo del usuario al especialista; Handy no es receptor.
        const pago: Pago = {
          id: idNuevo(s),
          trabajoId: t.trabajo.id,
          descripcion: `${t.trabajo.rubro === 'aire_acondicionado' ? 'Aire acondicionado' : t.trabajo.rubro.charAt(0).toUpperCase() + t.trabajo.rubro.slice(1)} · trabajo terminado`,
          feeHandy: monto(0),
          neto: t.trabajo.acuerdo.monto,
          metodo: t.metodoPago,
          monto: t.trabajo.acuerdo.monto,
          estado: 'pendiente',
          fuenteConfirmacion: null,
          referenciaProveedor: null,
          actualizadoEn: iso(ahoraMs(s)),
        };
        s.pagos.unshift(pago);
        t.pagoId = pago.id;
      }
      return structuredClone(t.trabajo);
    });
  },

  proponerCambio(id: string, cambio: unknown, clave: string): Propuesta {
    return idempotente(s, `cambio:${clave}`, () => {
      const t = buscar(s, id);
      const ok = NuevoCambioSchema.safeParse(cambio);
      if (!ok.success) throw zodAFallo(ok.error);
      if (!ACTIVOS.includes(t.trabajo.estado)) throw fallo('conflicto', 409, 'transicion_invalida', 'Este trabajo ya no admite cambios.');
      if (cambioVigente(s, t)) throw fallo('conflicto', 409, 'transicion_invalida', 'Ya hay un cambio esperando respuesta.');
      if (Date.parse(ok.data.horario.inicio) <= ahoraMs(s)) throw fallo('validacion', 400, 'validacion', 'La fecha alternativa tiene que ser a futuro.');
      const p: Propuesta = {
        id: idNuevo(s),
        pedidoId: t.trabajo.pedidoId,
        autorRol: 'especialista',
        monto: ok.data.monto ?? t.trabajo.acuerdo.monto,
        alcance: ok.data.alcance,
        horario: ok.data.horario,
        venceEn: iso(ahoraMs(s) + VIGENCIA_PROPUESTA_PROGRAMADO_MS),
        estado: 'pendiente',
        reemplazaA: t.trabajo.propuestaAceptadaId, // el acuerdo vigente sigue igual hasta que la otra parte acepte
        version: 0,
      };
      s.propuestas.push(p);
      t.cambioPendienteId = p.id;
      return p;
    });
  },

  agenda(desde: string, hasta: string): AgendaItem[] {
    const d = Date.parse(desde);
    const h = Date.parse(hasta);
    const items: AgendaItem[] = [];
    const confirmados: Array<[number, number]> = [];
    for (const t of s.trabajos) {
      if (!ACTIVOS.includes(t.trabajo.estado)) continue;
      const { inicio, fin: f } = t.trabajo.acuerdo.horario;
      confirmados.push([Date.parse(inicio), fin(inicio, f)]);
      items.push({ id: `${t.trabajo.id}`, trabajoId: t.trabajo.id, titulo: `${t.trabajo.tipo === 'obra' ? 'Obra' : 'Trabajo'} · ${t.contraparte}`, inicio, fin: f, estado: cambioVigente(s, t) ? 'cambio_pendiente' : 'confirmado', superpuesto: false });
    }
    // Ofertas pendientes (mías o del usuario) que se superponen con un trabajo confirmado
    for (const p of s.propuestas) {
      if (p.estado !== 'pendiente' || Date.parse(p.venceEn) <= ahoraMs(s)) continue;
      if (s.trabajos.some((t) => t.cambioPendienteId === p.id)) continue;
      const pi = Date.parse(p.horario.inicio);
      const pf = fin(p.horario.inicio, p.horario.fin);
      items.push({ id: p.id, trabajoId: null, titulo: p.autorRol === 'usuario' ? 'Propuesta recibida' : 'Propuesta enviada', inicio: p.horario.inicio, fin: p.horario.fin, estado: 'oferta_pendiente', superpuesto: confirmados.some(([a, b]) => pi < b && a < pf) });
    }
    return items.filter((i) => Date.parse(i.inicio) >= d && Date.parse(i.inicio) < h).sort((a, b) => Date.parse(a.inicio) - Date.parse(b.inicio));
  },
});
