import { z } from 'zod';
import { ContactoSchema, ConversacionSchema, MensajeSchema, PropuestaSchema } from '../../contracts/dto.ts';
import type { ApiMensajes } from '../api/mensajes.ts';
import type { ClienteHttp } from './cliente.ts';
import { id, Nada } from './comun.ts';

export const mensajesHttp = (c: ClienteHttp): ApiMensajes => ({
  conversaciones: () => c.pedir('GET', '/v1/conversaciones', z.array(ConversacionSchema)),
  conversacion: (cid) => c.pedir('GET', `/v1/conversaciones/${id(cid)}`, ConversacionSchema),
  abrirConversacion: (pid) => c.pedir('POST', `/v1/especialista/pedidos/${id(pid)}/conversacion`, ConversacionSchema),
  mensajes: (cid) => c.pedir('GET', `/v1/conversaciones/${id(cid)}/mensajes`, z.array(MensajeSchema)),
  propuestasConversacion: (cid) => c.pedir('GET', `/v1/conversaciones/${id(cid)}/propuestas`, z.array(PropuestaSchema)),
  enviarMensaje(cid, mensaje, clave, archivo) {
    if (!archivo) return c.pedir('POST', `/v1/conversaciones/${id(cid)}/mensajes`, MensajeSchema, { cuerpo: mensaje, idempotencyKey: clave });
    const f = new FormData();
    f.set('archivo', archivo);
    f.set('tipo', mensaje.tipo);
    if (mensaje.texto) f.set('texto', mensaje.texto);
    return c.pedir('POST', `/v1/conversaciones/${id(cid)}/mensajes`, MensajeSchema, { formulario: f, idempotencyKey: clave });
  },
  contactos: () => c.pedir('GET', '/v1/especialista/contactos', z.array(ContactoSchema)),
  agregarContacto: (cid) => c.pedir('POST', '/v1/especialista/contactos', ContactoSchema, { cuerpo: { conversacionId: cid } }),
  quitarContacto: (kid) => c.pedir('DELETE', `/v1/especialista/contactos/${id(kid)}`, Nada),
});
