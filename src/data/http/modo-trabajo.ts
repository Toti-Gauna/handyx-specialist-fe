// Adaptador HTTP del Modo trabajo y el cierre (lote 2.3). Las rutas y la validación del modo, las tareas, las fotos, el
// antes y después y el informe viven en `servidor/modo-trabajo.ts` (lote 2.5, probado contra la API real). «Pedir
// ayuda» (contactos profesionales) llega al backend con el lote 3.5: hasta entonces la API real responde 404.
import { z } from 'zod';
import { ChatResumenSchema } from '../../contracts/chat.ts';
import { LlamadaPuenteSchema } from '../../contracts/dto.ts';
import { ContactoProfesionalSchema, InvitacionObraSchema } from '../../contracts/equipo.ts';
import { ModoTrabajoSchema } from '../../contracts/modo-trabajo.ts';
import type { ApiModoTrabajo } from '../api/modo-trabajo.ts';
import type { ClienteHttp } from './cliente.ts';
import { id } from './comun.ts';
import { modoTrabajoServidor } from './servidor/modo-trabajo.ts';

const E = '/v1/especialista';

export const modoTrabajoHttp = (c: ClienteHttp): ApiModoTrabajo => {
  const s = modoTrabajoServidor(c);
  return {
    modoTrabajo: s.modoTrabajo,
    pausarModo: s.pausarModo,
    reanudarModo: s.reanudarModo,
    crearTarea: s.crearTarea,
    cambiarTarea: s.cambiarTarea,
    quitarTarea: s.borrarTarea,
    subirFotoTrabajo(tid, foto, momento, clave, tareaId) {
      if (foto) return s.subirFotoTrabajo(tid, foto, momento, tareaId ?? null, clave);
      // Sin foto (solo pasa con la cámara simulada del mock): el servidor lo rechaza con su error de validación.
      const f = new FormData();
      f.set('momento', momento);
      if (tareaId) f.set('tareaId', tareaId);
      return c.pedir('POST', `${E}/trabajos/${id(tid)}/fotos`, ModoTrabajoSchema, { formulario: f, idempotencyKey: clave });
    },
    guardarNota: s.notaTrabajo,
    antesDespues: s.antesDespues,
    guardarAntesDespues: s.guardarAntesDespues,
    informeTrabajo: s.informeTrabajo,
    guardarSeccionInforme: s.guardarSeccionInforme,
    enviarInforme: s.enviarInforme,
    contactosProfesionales: () => c.pedir('GET', `${E}/contactos-profesionales`, z.array(ContactoProfesionalSchema)),
    abrirChatContacto: (cid) => c.pedir('POST', `${E}/contactos-profesionales/${id(cid)}/chat`, ChatResumenSchema),
    sumarAyuda: (tid, ayuda) => c.pedir('POST', `${E}/trabajos/${id(tid)}/ayuda`, InvitacionObraSchema, { cuerpo: ayuda }),
    llamadaContacto: (cid) => c.pedir('POST', `${E}/contactos-profesionales/${id(cid)}/llamada`, LlamadaPuenteSchema),
  };
};
