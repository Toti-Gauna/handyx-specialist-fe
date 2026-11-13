// Dominio Modo trabajo y cierre (contrato 0.11.0, lote 2.3): tareas, cronómetro, fotos, notas, antes y después, informe
// con conformidad y garantía, y «Pedir ayuda» (contactos profesionales). Lo que se guarda necesita conexión: sin cola
// offline. Rutas: docs/api/openapi.yaml (tag modo-trabajo y equipo).
import type { LlamadaPuente } from '../../contracts/dto.ts';
import type { ChatResumen } from '../../contracts/chat.ts';
import type { ContactoProfesional, InvitacionObra, SumarAyuda } from '../../contracts/equipo.ts';
import type {
  AntesDespues,
  CambioTarea,
  EnvioInforme,
  GuardarAntesDespues,
  GuardarSeccionInforme,
  InformeTrabajo,
  ModoTrabajo,
  NuevaTarea,
  SeccionInforme,
  Tarea,
} from '../../contracts/modo-trabajo.ts';
import type { ClaveIdempotencia } from './tipos.ts';

export type MomentoFoto = 'antes' | 'durante' | 'despues';

export interface ApiModoTrabajo {
  /** El Modo trabajo de un trabajo en curso (409 si todavía no empezó). */
  modoTrabajo(trabajoId: string): Promise<ModoTrabajo>;
  pausarModo(trabajoId: string, version: number): Promise<ModoTrabajo>;
  reanudarModo(trabajoId: string, version: number): Promise<ModoTrabajo>;
  crearTarea(trabajoId: string, tarea: NuevaTarea): Promise<Tarea>;
  /** Marcar una tarea lista (o volver a abrirla), cambiar su texto o reordenarla. */
  cambiarTarea(trabajoId: string, tareaId: string, cambio: CambioTarea): Promise<Tarea>;
  quitarTarea(trabajoId: string, tareaId: string): Promise<void>;
  /** Foto achicada y sin ubicación (la prepara el teléfono). `foto` null solo con la cámara simulada del mock. */
  subirFotoTrabajo(trabajoId: string, foto: Blob | null, momento: MomentoFoto, clave: ClaveIdempotencia, tareaId?: string): Promise<ModoTrabajo>;
  /** Nota escrita o dictada con el micrófono del teclado. La ve solo el especialista. */
  guardarNota(trabajoId: string, texto: string, clave: ClaveIdempotencia): Promise<ModoTrabajo>;

  antesDespues(trabajoId: string): Promise<AntesDespues>;
  guardarAntesDespues(trabajoId: string, datos: GuardarAntesDespues): Promise<AntesDespues>;

  informeTrabajo(trabajoId: string): Promise<InformeTrabajo>;
  guardarSeccionInforme(trabajoId: string, seccion: SeccionInforme, datos: GuardarSeccionInforme): Promise<InformeTrabajo>;
  /** Manda el informe por el chat (tarjeta) y en PDF y pide la conformidad. Empieza la garantía. */
  enviarInforme(trabajoId: string, envio: EnvioInforme, clave: ClaveIdempotencia): Promise<InformeTrabajo>;

  // ── Pedir ayuda (H0-ModoAyuda) ──
  contactosProfesionales(): Promise<ContactoProfesional[]>;
  /** Abre (o devuelve) el chat de equipo con un contacto profesional. */
  abrirChatContacto(contactoId: string): Promise<ChatResumen>;
  /** Sumar un contacto a este trabajo: una invitación (el reparto se acuerda aparte). */
  sumarAyuda(trabajoId: string, ayuda: SumarAyuda): Promise<InvitacionObra>;
  /**
   * Llamar a un contacto profesional por un número puente (nadie ve el teléfono del otro).
   * PENDIENTE DE CONTRATO (lote 2.3 → 2.5/cierre): `POST /v1/especialista/contactos-profesionales/{id}/llamada`,
   * misma respuesta que `/trabajos/{id}/llamada`. Hasta que entre al contrato, la API real responde 404.
   */
  llamadaContacto(contactoId: string): Promise<LlamadaPuente>;
}
