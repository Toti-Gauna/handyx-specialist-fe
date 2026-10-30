import { EnviarMensajeSchema, type Conversacion, type Mensaje, type Propuesta } from '../../contracts/dto.ts';
import { fallo, idempotente, type EstadoMock } from './estado.ts';
import { agregarMensaje, asegurarConversacion } from './propuestas.ts';
import { visible } from './reglas.ts';
import { zodAFallo } from './validacion.ts';
import { FOTO_PRUEBA } from './fotos.ts';
import { FalloApi } from '../errores.ts';

function conversacion(s: EstadoMock, id: string): Conversacion {
  const c = s.conversaciones.find((x) => x.id === id);
  if (!c) throw fallo('no_encontrado', 404, 'no_encontrado', 'No encontramos esa conversación.');
  return c;
}

export const mensajes = (s: EstadoMock) => ({
  conversaciones: (): Conversacion[] => [...s.conversaciones].sort((a, b) => Date.parse(b.actualizadoEn) - Date.parse(a.actualizadoEn)),
  conversacion: (id: string): Conversacion => conversacion(s, id),
  abrirConversacion(pedidoId: string): Conversacion {
    const p = s.pedidos.find((x) => x.pub.id === pedidoId);
    if (!p || !visible(s, p)) throw fallo('no_encontrado', 404, 'no_encontrado', 'No encontramos ese pedido.');
    return conversacion(s, asegurarConversacion(s, p));
  },
  propuestasConversacion(id: string): Propuesta[] {
    const c = conversacion(s, id);
    return s.propuestas.filter((p) => p.pedidoId === c.pedidoId);
  },
  mensajes(id: string): Mensaje[] {
    const c = conversacion(s, id);
    c.noLeidos = 0; // el servidor marca como leído al abrir el hilo
    return s.mensajes[id] ?? [];
  },
  enviarMensaje(id: string, datos: unknown, clave: string): Mensaje {
    return idempotente(s, `mensaje:${clave}`, () => {
      const c = conversacion(s, id);
      const ok = EnviarMensajeSchema.safeParse(datos);
      if (!ok.success) throw zodAFallo(ok.error);
      if (ok.data.tipo === 'texto' && !ok.data.texto) throw fallo('validacion', 400, 'validacion', 'Escribí un mensaje.');
      if (c.etapa === 'cerrada') throw fallo('conflicto', 409, 'transicion_invalida', 'Esta conversación está cerrada.');
      if (s.fallaMensaje) {
        s.fallaMensaje = false;
        // Falla antes de guardar: el reintento con la misma clave no duplica.
        throw new FalloApi('red');
      }
      agregarMensaje(s, id, { autorRol: 'especialista', tipo: ok.data.tipo, texto: ok.data.texto, mediaUrl: ok.data.tipo === 'foto' ? FOTO_PRUEBA : null });
      return (s.mensajes[id] ?? []).at(-1) as Mensaje;
    });
  },
});

