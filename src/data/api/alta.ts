// Dominio alta y registro.
// - Lote 4.4 (contrato hasta 0.10, `deprecated` hasta 1.0.0): perfil, datos del alta, documentos, turno de antecedentes.
//   `perfil()` y `perfilPublico()` siguen vigentes (los usan la guardia, la cuenta y el taller).
// - Lote 1.2 (contrato 0.11 `registro.ts`): crear la cuenta con lo mínimo (RG-1), registro por pasos que se retoma
//   (RG-2 a RG-10), estado del alta (D6-Alta) y onboarding (OB-*). Cada paso se guarda en el servidor apenas se completa.
import type { DatosAlta, GuardarDatosAlta, PerfilEspecialista, PerfilPublico, TipoDocumento, TurnoAntecedentes } from '../../contracts/dto.ts';
import type {
  Certificado,
  EnvioRegistro,
  GuardarCuit,
  GuardarDatosRegistro,
  GuardarDomicilio,
  GuardarRubrosRegistro,
  GuardarZonas,
  MarcarOnboarding,
  Onboarding,
  RegistroCuenta,
  RegistroEspecialista,
  TipoCertificado,
} from '../../contracts/registro.ts';
import type { Rubro } from '../../contracts/rubros.ts';

/** Archivo de un paso del registro. `archivo` null solo con datos de prueba (el mock nunca recibe archivos). */
export interface ArchivoRegistro {
  archivo: Blob | null;
  /** Lo decide el servidor por los bytes; el mock lo usa para emularlo. */
  formato: 'foto' | 'pdf';
}

export interface DatosCertificado {
  tipo: TipoCertificado;
  rubro?: Rubro;
  nombre: string;
  venceEn?: string;
}

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

  // ── Registro por pasos (0.11) ──
  /** RG-1. Respuesta neutra (202) exista o no la cuenta; sigue con el código al email. Pública. */
  crearCuenta(datos: RegistroCuenta): Promise<void>;
  registro(): Promise<RegistroEspecialista>;
  guardarDatosRegistro(datos: GuardarDatosRegistro): Promise<RegistroEspecialista>;
  guardarDomicilio(datos: GuardarDomicilio): Promise<RegistroEspecialista>;
  guardarRubrosRegistro(datos: GuardarRubrosRegistro): Promise<RegistroEspecialista>;
  guardarZonas(datos: GuardarZonas): Promise<RegistroEspecialista>;
  /** RG-5: la foto va como archivo (multipart), nunca en el JSON. */
  cargarSelfie(foto: Blob | null, version: number): Promise<RegistroEspecialista>;
  /** RG-6: frente, dorso y el número (cifrado + HMAC; vuelven los últimos dígitos). */
  cargarDni(datos: { frente: Blob | null; dorso: Blob | null; numero: string; version: number }): Promise<RegistroEspecialista>;
  guardarCuit(datos: GuardarCuit): Promise<RegistroEspecialista>;
  /** RG-8: matrícula o certificado en foto o PDF. Queda cargado: solo Operations verifica. */
  cargarCertificado(datos: DatosCertificado, archivo: ArchivoRegistro): Promise<Certificado>;
  quitarCertificado(id: string): Promise<void>;
  /** RG-9: dato sensible (cifrado, solo verificación, nunca a IA, se borra al verificar). */
  cargarAntecedentes(archivo: ArchivoRegistro): Promise<RegistroEspecialista>;
  enviarRegistro(datos: EnvioRegistro): Promise<RegistroEspecialista>;
  onboarding(): Promise<Onboarding>;
  marcarOnboarding(datos: MarcarOnboarding): Promise<Onboarding>;
}
