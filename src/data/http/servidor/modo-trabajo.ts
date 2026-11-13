// Modo trabajo, antes y después, informe y adjuntos contra api-especialista (ola 2.5). Lo que se guarda necesita
// conexión (sin cola offline); las fotos van achicadas y sin ubicación.
import { z } from 'zod';
import {
  AdjuntoTrabajoSchema,
  AntesDespuesSchema,
  InformeTrabajoSchema,
  ModoTrabajoSchema,
  TareaSchema,
  type CambioTarea,
  type EnvioInforme,
  type GuardarAntesDespues,
  type GuardarSeccionInforme,
  type NuevaTarea,
  type SeccionInforme,
} from '../../../contracts/modo-trabajo.ts';
import type { ClienteHttp } from '../cliente.ts';
import { id, Nada } from '../comun.ts';

const T = (trabajoId: string) => `/v1/especialista/trabajos/${id(trabajoId)}`;

export const modoTrabajoServidor = (c: ClienteHttp) => ({
  modoTrabajo: (trabajoId: string) => c.pedir('GET', `${T(trabajoId)}/modo`, ModoTrabajoSchema),
  pausarModo: (trabajoId: string, version: number) => c.pedir('POST', `${T(trabajoId)}/modo/pausa`, ModoTrabajoSchema, { cuerpo: { version } }),
  reanudarModo: (trabajoId: string, version: number) => c.pedir('POST', `${T(trabajoId)}/modo/reanudacion`, ModoTrabajoSchema, { cuerpo: { version } }),
  crearTarea: (trabajoId: string, n: NuevaTarea) => c.pedir('POST', `${T(trabajoId)}/tareas`, TareaSchema, { cuerpo: n }),
  cambiarTarea: (trabajoId: string, tareaId: string, cambio: CambioTarea) =>
    c.pedir('PATCH', `${T(trabajoId)}/tareas/${id(tareaId)}`, TareaSchema, { cuerpo: cambio }),
  borrarTarea: async (trabajoId: string, tareaId: string) => void (await c.pedir('DELETE', `${T(trabajoId)}/tareas/${id(tareaId)}`, Nada)),
  subirFotoTrabajo(trabajoId: string, foto: Blob, momento: 'antes' | 'durante' | 'despues', tareaId: string | null, clave: string) {
    const f = new FormData();
    f.set('momento', momento);
    if (tareaId) f.set('tareaId', tareaId);
    f.set('foto', foto, 'foto.jpg');
    return c.pedir('POST', `${T(trabajoId)}/fotos`, ModoTrabajoSchema, { formulario: f, idempotencyKey: clave });
  },
  notaTrabajo: (trabajoId: string, texto: string, clave: string) =>
    c.pedir('POST', `${T(trabajoId)}/notas`, ModoTrabajoSchema, { cuerpo: { texto }, idempotencyKey: clave }),
  antesDespues: (trabajoId: string) => c.pedir('GET', `${T(trabajoId)}/antes-despues`, AntesDespuesSchema),
  guardarAntesDespues: (trabajoId: string, g: GuardarAntesDespues) => c.pedir('PUT', `${T(trabajoId)}/antes-despues`, AntesDespuesSchema, { cuerpo: g }),
  informeTrabajo: (trabajoId: string) => c.pedir('GET', `${T(trabajoId)}/informe`, InformeTrabajoSchema),
  guardarSeccionInforme: (trabajoId: string, seccion: SeccionInforme, g: GuardarSeccionInforme) =>
    c.pedir('PUT', `${T(trabajoId)}/informe/secciones/${id(seccion)}`, InformeTrabajoSchema, { cuerpo: g }),
  enviarInforme: (trabajoId: string, e: EnvioInforme, clave: string) =>
    c.pedir('POST', `${T(trabajoId)}/informe/envio`, InformeTrabajoSchema, { cuerpo: e, idempotencyKey: clave }),
  adjuntosTrabajo: (trabajoId: string) => c.pedir('GET', `${T(trabajoId)}/adjuntos`, z.array(AdjuntoTrabajoSchema)),
  adjuntarTrabajo(trabajoId: string, tipo: 'informe_taller' | 'modelo_3d' | 'plano', nombre: string, archivo: Blob, clave: string) {
    const f = new FormData();
    f.set('datos', new Blob([JSON.stringify({ tipo, nombre })], { type: 'application/json' }));
    f.set('archivo', archivo, nombre);
    return c.pedir('POST', `${T(trabajoId)}/adjuntos`, AdjuntoTrabajoSchema, { formulario: f, idempotencyKey: clave });
  },
});
