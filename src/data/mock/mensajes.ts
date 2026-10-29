import { EnviarMensajeSchema, type Conversacion, type Mensaje } from '../../contracts/dto.ts';
import { fallo, idempotente, type EstadoMock } from './estado.ts';
import { agregarMensaje } from './propuestas.ts';
import { zodAFallo } from './validacion.ts';
import { FalloApi } from '../errores.ts';

/** Foto sintética (SVG): en el mock nunca se lee ni se guarda una imagen real. */
const FOTO_PRUEBA =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="320" height="200" viewBox="0 0 320 200"><rect width="320" height="200" fill="#ececec"/><path d="M40 150l60-60 40 40 50-70 90 90z" fill="#4a72b0"/><circle cx="240" cy="55" r="18" fill="#f5f59a"/><text x="160" y="190" font-family="sans-serif" font-size="14" text-anchor="middle" fill="#26324a">Foto de prueba</text></svg>',
  );

function conversacion(s: EstadoMock, id: string): Conversacion {
  const c = s.conversaciones.find((x) => x.id === id);
  if (!c) throw fallo('no_encontrado', 404, 'no_encontrado', 'No encontramos esa conversación.');
  return c;
}

export const mensajes = (s: EstadoMock) => ({
  conversaciones: (): Conversacion[] => [...s.conversaciones].sort((a, b) => Date.parse(b.actualizadoEn) - Date.parse(a.actualizadoEn)),
  conversacion: (id: string): Conversacion => conversacion(s, id),
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

