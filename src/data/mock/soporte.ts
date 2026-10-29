import { NuevoCasoSchema, type CasoSoporte, type CasoSoporteDetalle } from '../../contracts/dto.ts';
import { ahoraMs, fallo, idempotente, idNuevo, iso, type EstadoMock } from './estado.ts';
import { zodAFallo } from './validacion.ts';

const resumen = (c: CasoSoporteDetalle): CasoSoporte => ({
  id: c.id,
  asunto: c.asunto,
  trabajoId: c.trabajoId,
  pedidoId: c.pedidoId,
  categoria: c.categoria,
  estado: c.estado,
  creadoEn: c.creadoEn,
  actualizadoEn: c.actualizadoEn,
});

function buscar(s: EstadoMock, id: string): CasoSoporteDetalle {
  const c = s.casos.find((x) => x.id === id);
  if (!c) throw fallo('no_encontrado', 404, 'no_encontrado', 'No encontramos ese caso.');
  return c;
}

export const soporte = (s: EstadoMock) => ({
  casos: (): CasoSoporte[] => s.casos.map(resumen).sort((a, b) => Date.parse(b.actualizadoEn) - Date.parse(a.actualizadoEn)),
  caso: (id: string): CasoSoporteDetalle => buscar(s, id),
  abrirCaso(datos: unknown, clave: string): CasoSoporte {
    return idempotente(s, `caso:${clave}`, () => {
      const ok = NuevoCasoSchema.safeParse(datos);
      if (!ok.success) throw zodAFallo(ok.error);
      const d = ok.data;
      if (d.trabajoId && !s.trabajos.some((t) => t.trabajo.id === d.trabajoId)) throw fallo('no_encontrado', 404, 'no_encontrado', 'No encontramos ese trabajo.');
      const ahora = iso(ahoraMs(s));
      const caso: CasoSoporteDetalle = {
        id: idNuevo(s),
        asunto: d.asunto,
        categoria: d.categoria,
        estado: 'abierto',
        trabajoId: d.trabajoId,
        pedidoId: d.pedidoId,
        creadoEn: ahora,
        actualizadoEn: ahora,
        detalle: d.detalle,
        eventos: [{ id: idNuevo(s), autor: 'vos', texto: d.detalle, adjuntos: d.adjuntos, creadoEn: ahora }],
      };
      s.casos.unshift(caso);
      return resumen(caso);
    });
  },
  responderCaso(id: string, texto: string, clave: string): CasoSoporteDetalle {
    return idempotente(s, `respuesta-caso:${clave}`, () => {
      const c = buscar(s, id);
      if (!texto.trim()) throw fallo('validacion', 400, 'validacion', 'Escribí tu respuesta.');
      if (c.estado === 'cerrado') throw fallo('conflicto', 409, 'transicion_invalida', 'Este caso está cerrado.');
      const ahora = iso(ahoraMs(s));
      c.eventos.push({ id: idNuevo(s), autor: 'vos', texto: texto.trim(), adjuntos: 0, creadoEn: ahora });
      c.estado = 'en_curso'; // responder reabre un caso resuelto o esperando respuesta
      c.actualizadoEn = ahora;
      return c;
    });
  },
});
