// Dominio alta y perfil: datos, documentos, rubros, turno de antecedentes y envío a revisión (lote 4.4).
import type { DatosAlta, GuardarDatosAlta, PerfilEspecialista, PerfilPublico, TipoDocumento, TurnoAntecedentes } from '../../contracts/dto.ts';
import type { Rubro } from '../../contracts/rubros.ts';

export interface ApiAlta {
  perfil(): Promise<PerfilEspecialista>;
  perfilPublico(): Promise<PerfilPublico>;
  datosAlta(): Promise<DatosAlta>;
  guardarDatosAlta(datos: GuardarDatosAlta): Promise<DatosAlta>;
  /** Queda `cargado`: solo Operations verifica. Antecedentes no existen como documento. */
  /** `dorso`: el DNI va con frente (`archivo`) y dorso (0.5.0). Con el mock no se manda ningún archivo. */
  cargarDocumento(tipo: TipoDocumento, rubro?: Rubro, archivo?: Blob, dorso?: Blob): Promise<PerfilEspecialista>;
  /** Turnos libres de la verificación presencial de antecedentes (0.5.0). */
  turnosAntecedentes(): Promise<TurnoAntecedentes[]>;
  /** Reserva (o cambia) el turno. Nunca se sube el certificado: se muestra en persona. */
  reservarTurno(turnoId: string): Promise<PerfilEspecialista>;
  elegirRubros(rubros: Rubro[]): Promise<PerfilEspecialista>;
  enviarAlta(): Promise<PerfilEspecialista>;
}
