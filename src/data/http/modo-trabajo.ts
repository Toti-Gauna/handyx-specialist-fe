// Modo trabajo y cierre por HTTP (contrato 0.11.0, tag modo-trabajo y equipo de docs/api/openapi.yaml). Lo implementa
// el backend en el lote 2.5; `llamadaContacto` está PENDIENTE de contrato (ver api/modo-trabajo.ts).
import { z } from 'zod';
import { ChatResumenSchema } from '../../contracts/chat.ts';
import { LlamadaPuenteSchema } from '../../contracts/dto.ts';
import { ContactoProfesionalSchema, InvitacionObraSchema } from '../../contracts/equipo.ts';
import { AntesDespuesSchema, InformeTrabajoSchema, ModoTrabajoSchema, TareaSchema } from '../../contracts/modo-trabajo.ts';
import type { ApiModoTrabajo } from '../api/modo-trabajo.ts';
import type { ClienteHttp } from './cliente.ts';
import { id, Nada } from './comun.ts';

const T = '/v1/especialista/trabajos';

export const modoTrabajoHttp = (c: ClienteHttp): ApiModoTrabajo => ({
  modoTrabajo: (tid) => c.pedir('GET', `${T}/${id(tid)}/modo`, ModoTrabajoSchema),
  pausarModo: (tid, version) => c.pedir('POST', `${T}/${id(tid)}/modo/pausa`, ModoTrabajoSchema, { cuerpo: { version } }),
  reanudarModo: (tid, version) => c.pedir('POST', `${T}/${id(tid)}/modo/reanudacion`, ModoTrabajoSchema, { cuerpo: { version } }),
  crearTarea: (tid, tarea) => c.pedir('POST', `${T}/${id(tid)}/tareas`, TareaSchema, { cuerpo: tarea }),
  cambiarTarea: (tid, tareaId, cambio) => c.pedir('PATCH', `${T}/${id(tid)}/tareas/${id(tareaId)}`, TareaSchema, { cuerpo: cambio }),
  quitarTarea: (tid, tareaId) => c.pedir('DELETE', `${T}/${id(tid)}/tareas/${id(tareaId)}`, Nada),
  subirFotoTrabajo(tid, foto, momento, clave, tareaId) {
    const f = new FormData();
    if (foto) f.set('foto', foto);
    f.set('momento', momento);
    if (tareaId) f.set('tareaId', tareaId);
    return c.pedir('POST', `${T}/${id(tid)}/fotos`, ModoTrabajoSchema, { formulario: f, idempotencyKey: clave });
  },
  guardarNota: (tid, texto, clave) => c.pedir('POST', `${T}/${id(tid)}/notas`, ModoTrabajoSchema, { cuerpo: { texto }, idempotencyKey: clave }),
  antesDespues: (tid) => c.pedir('GET', `${T}/${id(tid)}/antes-despues`, AntesDespuesSchema),
  guardarAntesDespues: (tid, datos) => c.pedir('PUT', `${T}/${id(tid)}/antes-despues`, AntesDespuesSchema, { cuerpo: datos }),
  informeTrabajo: (tid) => c.pedir('GET', `${T}/${id(tid)}/informe`, InformeTrabajoSchema),
  guardarSeccionInforme: (tid, seccion, datos) => c.pedir('PUT', `${T}/${id(tid)}/informe/secciones/${id(seccion)}`, InformeTrabajoSchema, { cuerpo: datos }),
  enviarInforme: (tid, envio, clave) => c.pedir('POST', `${T}/${id(tid)}/informe/envio`, InformeTrabajoSchema, { cuerpo: envio, idempotencyKey: clave }),
  contactosProfesionales: () => c.pedir('GET', '/v1/especialista/contactos-profesionales', z.array(ContactoProfesionalSchema)),
  abrirChatContacto: (cid) => c.pedir('POST', `/v1/especialista/contactos-profesionales/${id(cid)}/chat`, ChatResumenSchema),
  sumarAyuda: (tid, ayuda) => c.pedir('POST', `${T}/${id(tid)}/ayuda`, InvitacionObraSchema, { cuerpo: ayuda }),
  llamadaContacto: (cid) => c.pedir('POST', `/v1/especialista/contactos-profesionales/${id(cid)}/llamada`, LlamadaPuenteSchema),
});
