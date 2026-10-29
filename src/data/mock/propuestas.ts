import { NuevaPropuestaSchema, RespuestaPropuestaSchema, type Aceptacion, type Propuesta, type Trabajo } from '../../contracts/dto.ts';
import { puedeResponder } from '../../contracts/maquinas.ts';
import { VIGENCIA_PROPUESTA_INMEDIATA_MS, VIGENCIA_PROPUESTA_PROGRAMADO_MS } from '../../contracts/tiempos.ts';
import { ahora, ahoraMs, fallo, idempotente, idNuevo, iso, type EstadoMock, type PedidoInterno } from './estado.ts';
import { aPedidoElegible, habilitada, visible } from './reglas.ts';
import { zodAFallo } from './validacion.ts';

const buscar = (s: EstadoMock, id: string): Propuesta => {
  const p = s.propuestas.find((x) => x.id === id);
  if (!p) throw fallo('no_encontrado', 404, 'no_encontrado', 'No encontramos esa propuesta.');
  return p;
};

/** Vigencia calculada por el servidor: 5 min en urgentes, más larga en programados y obras. */
export const venceEn = (s: EstadoMock, p: PedidoInterno): string =>
  iso(ahoraMs(s) + (p.pub.tipo === 'urgente' ? VIGENCIA_PROPUESTA_INMEDIATA_MS : VIGENCIA_PROPUESTA_PROGRAMADO_MS));

export function asegurarConversacion(s: EstadoMock, p: PedidoInterno): string {
  if (p.conversacionId) return p.conversacionId;
  const id = idNuevo(s);
  p.conversacionId = id;
  s.conversaciones.unshift({ id, pedidoId: p.pub.id, trabajoId: null, contraparte: p.cliente, etapa: 'cotizando', ultimoMensaje: null, noLeidos: 0, actualizadoEn: iso(ahoraMs(s)) });
  s.mensajes[id] = [];
  return id;
}

export function agregarMensaje(s: EstadoMock, conversacionId: string, m: { autorRol: 'usuario' | 'especialista' | 'operations'; tipo: 'texto' | 'foto' | 'propuesta'; texto: string | null; propuestaId?: string | null; mediaUrl?: string | null }): void {
  const msg = { id: idNuevo(s), conversacionId, autorRol: m.autorRol, tipo: m.tipo, texto: m.texto, mediaUrl: m.mediaUrl ?? null, propuestaId: m.propuestaId ?? null, enviadoEn: iso(ahoraMs(s)) };
  (s.mensajes[conversacionId] ??= []).push(msg);
  const c = s.conversaciones.find((x) => x.id === conversacionId);
  if (c) {
    c.ultimoMensaje = m.texto ?? (m.tipo === 'foto' ? 'Foto' : 'Propuesta');
    c.actualizadoEn = msg.enviadoEn;
    if (m.autorRol !== 'especialista') c.noLeidos += 1;
  }
}


/**
 * Efecto de aceptar una propuesta (en producción, una sola transacción con control de versión):
 * - si cambia un acuerdo vigente, actualiza el snapshot del trabajo (queda el historial de propuestas);
 * - si no, cierra el pedido, deja las demás propuestas como reemplazadas y crea el trabajo.
 */
export function aplicarAceptacion(s: EstadoMock, p: Propuesta): Trabajo {
  const existente = s.trabajos.find((t) => t.cambioPendienteId === p.id || (p.reemplazaA !== null && t.trabajo.propuestaAceptadaId === p.reemplazaA));
  if (existente) {
    existente.trabajo.acuerdo = { monto: p.monto, alcance: p.alcance, horario: p.horario };
    existente.trabajo.propuestaAceptadaId = p.id;
    existente.trabajo.version += 1;
    existente.cambioPendienteId = null;
    return existente.trabajo;
  }
  const pedido = s.pedidos.find((x) => x.pub.id === p.pedidoId);
  if (!pedido) throw fallo('no_encontrado', 404, 'no_encontrado', 'No encontramos ese pedido.');
  pedido.pub.estado = 'acordado';
  for (const otra of s.propuestas) {
    if (otra.pedidoId === p.pedidoId && otra.id !== p.id && otra.estado === 'pendiente') {
      otra.estado = 'reemplazada';
      otra.version += 1;
    }
  }
  const conversacionId = asegurarConversacion(s, pedido);
  const trabajo: Trabajo = {
    id: idNuevo(s),
    pedidoId: pedido.pub.id,
    propuestaAceptadaId: p.id,
    rubro: pedido.pub.rubro,
    tipo: pedido.pub.tipo,
    acuerdo: { monto: p.monto, alcance: p.alcance, horario: p.horario },
    direccion: pedido.direccion,
    destino: pedido.destino,
    estado: 'agendado',
    conversacionId,
    version: 0,
  };
  s.trabajos.unshift({ trabajo, contraparte: pedido.cliente, eventos: [{ estado: 'agendado', en: iso(ahoraMs(s)), actor: 'sistema' }], etapas: [], cambioPendienteId: null, pagoId: null, metodoPago: pedido.metodoPago });
  const conv = s.conversaciones.find((c) => c.id === conversacionId);
  if (conv) {
    conv.trabajoId = trabajo.id;
    conv.etapa = 'trabajo';
  }
  return trabajo;
}

export const propuestas = (s: EstadoMock) => ({
  enviarPropuesta(datos: unknown, clave: string): Propuesta {
    return idempotente(s, `propuesta:${clave}`, () => {
      if (!habilitada(s)) throw fallo('permiso', 403, 'sin_permiso', 'Podés enviar propuestas cuando tu alta esté habilitada.');
      const ok = NuevaPropuestaSchema.safeParse(datos);
      if (!ok.success) throw zodAFallo(ok.error);
      const d = ok.data;
      const pedido = s.pedidos.find((x) => x.pub.id === d.pedidoId);
      if (!pedido || !visible(s, pedido)) throw fallo('no_encontrado', 404, 'no_encontrado', 'No encontramos ese pedido.');
      if (aPedidoElegible(s, pedido).estado !== 'buscando') throw fallo('conflicto', 409, 'pedido_no_elegible', 'La búsqueda de este pedido ya terminó: no se pueden enviar más propuestas.');
      if (d.monto.centavos <= 0) throw fallo('validacion', 400, 'validacion', 'El importe tiene que ser mayor a cero.');
      if (Date.parse(d.horario.inicio) <= ahoraMs(s)) throw fallo('validacion', 400, 'validacion', 'El horario tiene que ser a futuro.');

      if (d.reemplazaA) {
        const previa = buscar(s, d.reemplazaA);
        if (previa.pedidoId !== d.pedidoId || previa.estado !== 'pendiente' || Date.parse(previa.venceEn) <= ahoraMs(s)) {
          throw fallo('conflicto', 409, 'propuesta_no_disponible', 'La propuesta que querías contraofertar ya no está disponible.');
        }
        previa.estado = 'reemplazada';
        previa.version += 1;
      } else if (s.propuestas.some((x) => x.pedidoId === d.pedidoId && x.autorRol === 'especialista' && x.estado === 'pendiente')) {
        throw fallo('conflicto', 409, 'transicion_invalida', 'Ya tenés una propuesta pendiente en este pedido. Retirala o enviá una contrapropuesta.');
      }
      const nueva: Propuesta = { id: idNuevo(s), pedidoId: d.pedidoId, autorRol: 'especialista', monto: d.monto, alcance: d.alcance, horario: d.horario, venceEn: venceEn(s, pedido), estado: 'pendiente', reemplazaA: d.reemplazaA, version: 0 };
      s.propuestas.push(nueva);
      const conv = asegurarConversacion(s, pedido);
      agregarMensaje(s, conv, { autorRol: 'especialista', tipo: 'propuesta', texto: null, propuestaId: nueva.id });
      return nueva;
    });
  },

  responderPropuesta(id: string, accion: 'aceptar' | 'rechazar', version: number, clave: string): Aceptacion {
    return idempotente(s, `respuesta:${clave}`, () => {
      const ok = RespuestaPropuestaSchema.safeParse({ accion, version });
      if (!ok.success) throw zodAFallo(ok.error);
      const p = buscar(s, id);
      // Simulación de la doble aceptación: otra persona ganó la propuesta un instante antes.
      if (s.conflictoProximo) {
        s.conflictoProximo = false;
        p.estado = p.estado === 'pendiente' ? 'reemplazada' : p.estado;
        throw fallo('conflicto', 409, 'propuesta_no_disponible', 'Esta propuesta ya no está disponible: cambió mientras la mirabas.');
      }
      if (p.version !== ok.data.version) throw fallo('conflicto', 409, 'conflicto_version', 'La propuesta cambió. Volvé a abrirla para ver la versión vigente.');
      if (!puedeResponder({ estado: p.estado, autorRol: p.autorRol, venceEn: p.venceEn }, 'especialista', ahora(s))) {
        throw fallo('conflicto', 409, 'propuesta_no_disponible', p.autorRol === 'especialista' ? 'Solo la otra parte puede responder tu propuesta.' : 'Esta propuesta venció o ya fue respondida.');
      }
      p.version += 1;
      if (ok.data.accion === 'rechazar') {
        p.estado = 'rechazada';
        return { propuesta: structuredClone(p), trabajo: null };
      }
      p.estado = 'aceptada';
      return { propuesta: structuredClone(p), trabajo: structuredClone(aplicarAceptacion(s, p)) };
    });
  },

  retirarPropuesta(id: string): Propuesta {
    const p = buscar(s, id);
    if (p.autorRol !== 'especialista') throw fallo('permiso', 403, 'sin_permiso', 'Solo podés retirar tus propias propuestas.');
    if (p.estado !== 'pendiente') throw fallo('conflicto', 409, 'propuesta_no_disponible', 'Esta propuesta ya no está pendiente.');
    p.estado = 'retirada';
    p.version += 1;
    return p;
  },
});
