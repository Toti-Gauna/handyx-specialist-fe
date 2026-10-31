import { EnviarMensajeSchema, type Contacto, type Conversacion, type Mensaje, type Propuesta } from '../../contracts/dto.ts';
import { ahoraMs, fallo, idempotente, idNuevo, iso, type EstadoMock } from './estado.ts';
import { agregarMensaje, asegurarConversacion } from './propuestas.ts';
import { visible } from './reglas.ts';
import { zodAFallo } from './validacion.ts';
import { FOTO_PRUEBA } from './fotos.ts';
import { NOMBRE_RUBRO } from '../../contracts/rubros.ts';
import { FalloApi } from '../errores.ts';

function conversacion(s: EstadoMock, id: string): Conversacion {
  const c = s.conversaciones.find((x) => x.id === id);
  if (!c) throw fallo('no_encontrado', 404, 'no_encontrado', 'No encontramos esa conversación.');
  return c;
}

export const mensajes = (s: EstadoMock) => ({
  contactos: (): Contacto[] => [...s.contactos].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es')),
  agregarContacto(conversacionId: string): Contacto {
    const c = conversacion(s, conversacionId);
    const ya = s.contactos.find((k) => k.conversacionId === c.id);
    if (ya) return ya;
    const p = s.pedidos.find((x) => x.pub.id === c.pedidoId);
    const k: Contacto = { id: idNuevo(s), conversacionId: c.id, nombre: c.contraparte, detalle: p ? `${NOMBRE_RUBRO[p.pub.rubro]} · ${p.pub.zonaAproximada}` : 'Desde un chat', agregadoEn: iso(ahoraMs(s)) };
    s.contactos.push(k);
    c.contactoId = k.id;
    return k;
  },
  quitarContacto(id: string): void {
    const k = s.contactos.find((x) => x.id === id);
    if (!k) return; // uno ajeno o que ya no está responde igual
    s.contactos = s.contactos.filter((x) => x.id !== id);
    const c = s.conversaciones.find((x) => x.id === k.conversacionId);
    if (c) c.contactoId = null;
  },
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

