// Dominio mensajes: conversaciones, presupuestos del hilo y contactos.
import type { ClaveIdempotencia } from './tipos.ts';
import type { Contacto, Conversacion, EnviarMensaje, Mensaje, Propuesta } from '../../contracts/dto.ts';

export interface ApiMensajes {
  conversaciones(): Promise<Conversacion[]>;
  conversacion(id: string): Promise<Conversacion>;
  /** Abre (o devuelve) el chat de un pedido ANTES de contratar: sirve para consultar y cotizar. No compromete nada. */
  abrirConversacion(pedidoId: string): Promise<Conversacion>;
  mensajes(conversacionId: string): Promise<Mensaje[]>;
  /** Presupuestos estructurados del hilo (mensajes de tipo `propuesta`). */
  propuestasConversacion(conversacionId: string): Promise<Propuesta[]>;
  /** Contactos (0.9.0): solo los agregados desde un chat; agregar dos veces devuelve el mismo. */
  contactos(): Promise<Contacto[]>;
  agregarContacto(conversacionId: string): Promise<Contacto>;
  quitarContacto(id: string): Promise<void>;
  /** `archivo`: solo para fotos con la API real; el mock nunca lee ni guarda una imagen. */
  enviarMensaje(conversacionId: string, mensaje: EnviarMensaje, clave: ClaveIdempotencia, archivo?: Blob): Promise<Mensaje>;
}
