import {
  CambioDisponibilidadSchema,
  type Aviso,
  type Disponibilidad,
  type Inicio,
  type PedidoDetalle,
} from '../../contracts/dto.ts';
import { monto } from '../../contracts/dinero.ts';
import { fallo, ahoraMs, type EstadoMock } from './estado.ts';
import { aPedidoElegible, habilitada, visible } from './reglas.ts';
import { zodAFallo } from './validacion.ts';
import { precioSugerido } from './precios.ts';

const ESTADOS_ACTIVOS = ['agendado', 'en_camino', 'en_sitio', 'en_curso'] as const;

export const pedidos = (s: EstadoMock) => ({
  disponibilidad: (): Disponibilidad => s.disponibilidad,
  actualizarDisponibilidad(cambio: unknown): Disponibilidad {
    const ok = CambioDisponibilidadSchema.safeParse(cambio);
    if (!ok.success) throw zodAFallo(ok.error);
    // Durante el alta (0.5.0) se declaran zonas y horarios; recibir pedidos se activa recién con el alta habilitada.
    if (!habilitada(s)) {
      const enAlta = ['borrador', 'requiere_correccion', 'enviada', 'en_revision'].includes(s.perfil.estadoAlta) && s.perfil.baja === null;
      if (!enAlta || ok.data.urgentesAhora || ok.data.programados) {
        throw fallo('permiso', 403, 'sin_permiso', 'Podés recibir pedidos cuando tu alta esté habilitada. Mientras tanto, solo zonas y horarios.');
      }
    }
    if (ok.data.version !== s.disponibilidad.version) {
      throw fallo('conflicto', 409, 'conflicto_version', 'Tu disponibilidad cambió desde otra pantalla. Volvé a cargarla.');
    }
    const d = s.disponibilidad;
    const cambioUrgentes = ok.data.urgentesAhora !== d.urgentesAhora;
    d.urgentesAhora = ok.data.urgentesAhora;
    d.programados = ok.data.programados;
    if (ok.data.franjas) d.franjas = ok.data.franjas;
    if (ok.data.zonas) d.zonas = ok.data.zonas;
    if (cambioUrgentes) d.urgentesCambiadoEn = new Date(ahoraMs(s)).toISOString();
    d.version += 1;
    return d;
  },

  inicio(): Inicio {
    const abiertos = s.pedidos.filter((p) => visible(s, p) && aPedidoElegible(s, p).estado === 'buscando');
    const proximo = s.trabajos
      .filter((t) => (ESTADOS_ACTIVOS as readonly string[]).includes(t.trabajo.estado))
      .sort((a, b) => Date.parse(a.trabajo.acuerdo.horario.inicio) - Date.parse(b.trabajo.acuerdo.horario.inicio))[0];
    const verificados = s.pagos.filter((p) => p.estado === 'verificado');
    return {
      estadoAlta: s.perfil.estadoAlta,
      urgentesAhora: s.disponibilidad.urgentesAhora,
      pedidosAbiertos: abiertos.length,
      urgentesAbiertos: abiertos.filter((p) => p.pub.tipo === 'urgente').length,
      propuestasPendientes: s.propuestas.filter((p) => p.autorRol === 'usuario' && p.estado === 'pendiente' && Date.parse(p.venceEn) > ahoraMs(s)).length,
      avisosSinLeer: s.avisos.filter((a) => !a.leido).length,
      proximoTrabajo: proximo?.trabajo ?? null,
      cobradoMes: monto(verificados.reduce((n, p) => n + p.neto.centavos, 0)),
      trabajosCobrados: verificados.length,
    };
  },

  pedidosElegibles() {
    const items = s.pedidos
      .filter((p) => visible(s, p))
      .map((p) => aPedidoElegible(s, p))
      .sort((a, b) => Date.parse(a.creadoEn) - Date.parse(b.creadoEn)); // orden de llegada, sin ranking
    return { items, siguienteCursor: null };
  },

  pedido(id: string): PedidoDetalle {
    if (!habilitada(s)) throw fallo('permiso', 403, 'sin_permiso', 'Podés ver pedidos cuando tu alta esté habilitada.');
    const p = s.pedidos.find((x) => x.pub.id === id);
    // Un pedido ajeno o que no me corresponde responde igual que uno inexistente.
    if (!p || !visible(s, p)) throw fallo('no_encontrado', 404, 'no_encontrado', 'No encontramos ese pedido.');
    const propuestas = s.propuestas.filter((x) => x.pedidoId === id);
    return {
      ...aPedidoElegible(s, p),
      conversacionId: p.conversacionId,
      propuestas,
      precioSugerido: precioSugerido(p.pub.rubro, p.pub.tipo),
      // Solo el trabajo que salió de una propuesta aceptada en este pedido (en el mock, todos los trabajos son míos).
      trabajoId: s.trabajos.find((t) => t.trabajo.pedidoId === p.pub.id)?.trabajo.id ?? null,
    };
  },

  avisos(): Aviso[] {
    return [...s.avisos].sort((a, b) => Date.parse(b.creadoEn) - Date.parse(a.creadoEn));
  },
  marcarAvisoLeido(id: string): void {
    const a = s.avisos.find((x) => x.id === id);
    if (a) a.leido = true;
  },
  // Borrar un aviso ajeno o inexistente responde igual que uno propio (no se revela nada).
  borrarAviso(id: string): void {
    s.avisos = s.avisos.filter((x) => x.id !== id);
  },
  borrarAvisos(): void {
    s.avisos = [];
  },
});
