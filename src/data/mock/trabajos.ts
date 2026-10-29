import {
  AVANCES_TRABAJO,
  CancelarTrabajoSchema,
  MarcarLlegadaSchema,
  NuevoAdicionalSchema,
  NuevoCambioSchema,
  type Adicional,
  type AgendaItem,
  type AvanceTrabajo,
  type LlamadaPuente,
  type Pago,
  type Propuesta,
  type Trabajo,
  type TrabajoDetalle,
} from '../../contracts/dto.ts';
import { monto, sumar, type Monto } from '../../contracts/dinero.ts';
import { MAQUINA_ADICIONAL, MAQUINA_TRABAJO, puedeTransicionar, type EstadoTrabajo } from '../../contracts/maquinas.ts';
import { VIGENCIA_PROPUESTA_PROGRAMADO_MS } from '../../contracts/tiempos.ts';
import { ahoraMs, fallo, idempotente, idNuevo, iso, type EstadoMock, type TrabajoInterno } from './estado.ts';
import { zodAFallo } from './validacion.ts';
import { registrarLlegada, terminarViaje } from './viajes.ts';

const ACTIVOS: readonly EstadoTrabajo[] = ['agendado', 'en_camino', 'en_sitio', 'en_curso'];
const DOS_HORAS = 2 * 60 * 60_000;
const DIEZ_MINUTOS = 10 * 60_000;
/** Número puente de prueba: no existe en ningún país (el código 00 no se asigna), así que no llama a nadie. */
const PUENTE_PRUEBA = '+0000000000';

function buscar(s: EstadoMock, id: string): TrabajoInterno {
  const t = s.trabajos.find((x) => x.trabajo.id === id);
  if (!t) throw fallo('no_encontrado', 404, 'no_encontrado', 'No encontramos ese trabajo.');
  return t;
}

function mismaVersion(t: TrabajoInterno, version: number): void {
  if (t.trabajo.version !== version) throw fallo('conflicto', 409, 'conflicto_version', 'El trabajo cambió. Volvé a abrirlo para ver su estado actual.');
}

/** El cambio pendiente de un trabajo solo cuenta mientras la propuesta siga pendiente y vigente. */
function cambioVigente(s: EstadoMock, t: TrabajoInterno): Propuesta | null {
  const p = t.cambioPendienteId ? s.propuestas.find((x) => x.id === t.cambioPendienteId) : undefined;
  if (p && p.estado === 'pendiente' && Date.parse(p.venceEn) > ahoraMs(s)) return p;
  t.cambioPendienteId = null;
  return null;
}

/** Lo acordado más los adicionales aceptados: lo pendiente no suma (rige el precio vigente). */
export function totalVigente(t: TrabajoInterno): Monto {
  return t.adicionales.filter((a) => a.estado === 'aceptado').reduce((m, a) => sumar(m, a.monto), t.trabajo.acuerdo.monto);
}

const fin = (inicio: string, f: string | null): number => (f ? Date.parse(f) : Date.parse(inicio) + DOS_HORAS);

function cerrarConversacion(s: EstadoMock, t: TrabajoInterno): void {
  const c = s.conversaciones.find((x) => x.id === t.trabajo.conversacionId);
  if (c) c.etapa = 'cerrada';
}

function crearCobro(s: EstadoMock, t: TrabajoInterno): void {
  // El cobro del servicio es directo del usuario al especialista; Handy no es receptor. Va por el total vigente: si ya
  // había un cobro pendiente (por ejemplo, de una seña), se actualiza al total con los adicionales aceptados.
  const total = totalVigente(t);
  const previo = t.pagoId ? s.pagos.find((p) => p.id === t.pagoId) : undefined;
  if (previo) {
    if (previo.estado === 'pendiente') {
      previo.monto = total;
      previo.neto = total;
      previo.actualizadoEn = iso(ahoraMs(s));
    }
    return;
  }
  const pago: Pago = {
    id: idNuevo(s),
    trabajoId: t.trabajo.id,
    descripcion: `${t.trabajo.rubro === 'aire_acondicionado' ? 'Aire acondicionado' : t.trabajo.rubro.charAt(0).toUpperCase() + t.trabajo.rubro.slice(1)} · trabajo terminado`,
    feeHandy: monto(0),
    neto: total,
    metodo: t.metodoPago,
    monto: total,
    estado: 'pendiente',
    fuenteConfirmacion: null,
    referenciaProveedor: null,
    actualizadoEn: iso(ahoraMs(s)),
  };
  s.pagos.unshift(pago);
  t.pagoId = pago.id;
}

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
    return {
      trabajo: t.trabajo,
      contraparte: t.contraparte,
      eventos: t.eventos,
      etapas: t.etapas,
      cambioPendiente: cambioVigente(s, t),
      pagoId: t.pagoId,
      adicionales: [...t.adicionales].reverse(),
      totalVigente: totalVigente(t),
    };
  },

  avanzarTrabajo(id: string, hacia: AvanceTrabajo, version: number, clave: string): Trabajo {
    return idempotente(s, `trabajo:${clave}`, () => {
      const t = buscar(s, id);
      mismaVersion(t, version);
      // La llegada y la cancelación tienen su propio endpoint (0.7.0): llevan modo o motivo.
      if (!AVANCES_TRABAJO.includes(hacia) || !puedeTransicionar(MAQUINA_TRABAJO, t.trabajo.estado, hacia, 'especialista')) {
        throw fallo('conflicto', 409, 'transicion_invalida', 'Ese paso no corresponde al estado actual del trabajo.');
      }
      t.trabajo.estado = hacia;
      t.trabajo.version += 1;
      t.eventos.push({ estado: hacia, en: iso(ahoraMs(s)), actor: 'especialista' });
      if (hacia !== 'en_camino') terminarViaje(s, t.trabajo.id);
      if (hacia === 'finalizado') {
        // Lo que el usuario no respondió no se cobra: el sistema lo retira.
        for (const a of t.adicionales) {
          if (a.estado === 'pendiente') {
            a.estado = 'retirado';
            a.respondidoEn = iso(ahoraMs(s));
            a.version += 1;
          }
        }
        cerrarConversacion(s, t);
        crearCobro(s, t);
      }
      return structuredClone(t.trabajo);
    });
  },

  marcarLlegada(id: string, motivo: unknown, version: number, clave: string): Trabajo {
    return idempotente(s, `llegada:${clave}`, () => {
      const ok = MarcarLlegadaSchema.safeParse({ motivo, version });
      if (!ok.success) throw zodAFallo(ok.error);
      const t = buscar(s, id);
      mismaVersion(t, version);
      if (t.trabajo.estado !== 'en_camino') throw fallo('conflicto', 409, 'transicion_invalida', 'Para avisar que llegaste, el trabajo tiene que estar en camino.');
      registrarLlegada(s, t, { modo: 'respaldo', motivo: ok.data.motivo, en: iso(ahoraMs(s)) }, 'especialista');
      return structuredClone(t.trabajo);
    });
  },

  cancelarTrabajo(id: string, motivo: unknown, version: number, clave: string): Trabajo {
    return idempotente(s, `cancelacion:${clave}`, () => {
      const ok = CancelarTrabajoSchema.safeParse({ motivo, version });
      if (!ok.success) throw zodAFallo(ok.error);
      const t = buscar(s, id);
      mismaVersion(t, version);
      if (!puedeTransicionar(MAQUINA_TRABAJO, t.trabajo.estado, 'cancelado', 'especialista')) {
        throw fallo('conflicto', 409, 'transicion_invalida', 'Este trabajo ya no se puede cancelar desde la app. Escribinos desde Ayuda.');
      }
      t.trabajo.estado = 'cancelado';
      t.trabajo.version += 1;
      t.eventos.push({ estado: 'cancelado', en: iso(ahoraMs(s)), actor: 'especialista' });
      terminarViaje(s, t.trabajo.id);
      cerrarConversacion(s, t);
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

  crearAdicional(id: string, datos: unknown, clave: string): Adicional {
    return idempotente(s, `adicional:${clave}`, () => {
      const t = buscar(s, id);
      const ok = NuevoAdicionalSchema.safeParse(datos);
      if (!ok.success) throw zodAFallo(ok.error);
      if (t.trabajo.estado !== 'en_curso') throw fallo('conflicto', 409, 'transicion_invalida', 'Los adicionales se agregan con el trabajo en curso.');
      const a: Adicional = { id: idNuevo(s), trabajoId: t.trabajo.id, ...ok.data, estado: 'pendiente', creadoEn: iso(ahoraMs(s)), respondidoEn: null, version: 0 };
      t.adicionales.push(a);
      return structuredClone(a);
    });
  },

  retirarAdicional(id: string, adicionalId: string): Adicional {
    const t = buscar(s, id);
    const a = t.adicionales.find((x) => x.id === adicionalId);
    if (!a) throw fallo('no_encontrado', 404, 'no_encontrado', 'No encontramos ese adicional.');
    if (!puedeTransicionar(MAQUINA_ADICIONAL, a.estado, 'retirado', 'especialista')) throw fallo('conflicto', 409, 'transicion_invalida', 'El cliente ya respondió este adicional.');
    a.estado = 'retirado';
    a.respondidoEn = iso(ahoraMs(s));
    a.version += 1;
    return structuredClone(a);
  },

  llamada(id: string): LlamadaPuente {
    const t = buscar(s, id);
    if (!ACTIVOS.includes(t.trabajo.estado)) throw fallo('conflicto', 409, 'transicion_invalida', 'La llamada por la app está disponible mientras el trabajo está activo.');
    return { telefono: PUENTE_PRUEBA, venceEn: iso(ahoraMs(s) + DIEZ_MINUTOS) };
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
      items.push({ id: `${t.trabajo.id}`, trabajoId: t.trabajo.id, pedidoId: null, titulo: `${t.trabajo.tipo === 'obra' ? 'Obra' : 'Trabajo'} · ${t.contraparte}`, inicio, fin: f, estado: cambioVigente(s, t) ? 'cambio_pendiente' : 'confirmado', superpuesto: false });
    }
    // Ofertas pendientes (mías o del usuario) que se superponen con un trabajo confirmado
    for (const p of s.propuestas) {
      if (p.estado !== 'pendiente' || Date.parse(p.venceEn) <= ahoraMs(s)) continue;
      if (s.trabajos.some((t) => t.cambioPendienteId === p.id)) continue;
      const pi = Date.parse(p.horario.inicio);
      const pf = fin(p.horario.inicio, p.horario.fin);
      items.push({ id: p.id, trabajoId: null, pedidoId: p.pedidoId, titulo: p.autorRol === 'usuario' ? 'Propuesta recibida' : 'Propuesta enviada', inicio: p.horario.inicio, fin: p.horario.fin, estado: 'oferta_pendiente', superpuesto: confirmados.some(([a, b]) => pi < b && a < pf) });
    }
    return items.filter((i) => Date.parse(i.inicio) >= d && Date.parse(i.inicio) < h).sort((a, b) => Date.parse(a.inicio) - Date.parse(b.inicio));
  },
});
