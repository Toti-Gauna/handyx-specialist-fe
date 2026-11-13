// Dominio cuenta: política de tarifa (la decide el contrato), preferencias, avisos del dispositivo, baja y, desde el
// lote 1.4 (contrato 0.11.0), el perfil propio, la seguridad de la cuenta, la bandeja de avisos y la descarga de datos.
import type { Baja, FeeVigente, Preferencias } from '../../contracts/dto.ts';
import type { AvisoBandeja, ExportacionDatos, GuardarPresentacion, PerfilPropio } from '../../contracts/cuenta.ts';
import type { RegistroEspecialista } from '../../contracts/registro.ts';
import type { AltaTotp, CambioSegundaVerificacion, CodigosRespaldo, ConfirmarTotp, Reautenticacion, Seguridad } from '../../contracts/seguridad.ts';
import type { Pagina } from './tipos.ts';

/**
 * Preferencias con «Letra más grande» (lote 1.4). El campo `letraGrande` lo guarda el servidor junto al resto de las
 * preferencias: el lote 1.5 lo suma al contrato (opcional hasta 1.0.0) y este tipo pasa a ser `Preferencias` a secas.
 */
export type PreferenciasCuenta = Preferencias & { letraGrande?: boolean };

export interface ApiCuenta {
  feeVigente(): Promise<FeeVigente>;
  aceptarAvisoFee(politicaId: string, version: number): Promise<FeeVigente>;
  preferencias(): Promise<PreferenciasCuenta>;
  guardarPreferencias(p: Omit<PreferenciasCuenta, 'push'>): Promise<PreferenciasCuenta>;
  activarPush(): Promise<PreferenciasCuenta>;
  baja(): Promise<Baja | null>;
  solicitarBaja(): Promise<Baja>;
  cancelarBaja(): Promise<void>;

  // ── Perfil propio (CU-Perfil) ──
  perfilPropio(): Promise<PerfilPropio>;
  guardarPresentacion(g: GuardarPresentacion): Promise<PerfilPropio>;
  /** JPEG, PNG o WebP de hasta 5 MB, achicada y sin metadatos en el teléfono. Con el mock no se manda ningún archivo. */
  cambiarFotoPerfil(foto: Blob): Promise<PerfilPropio>;

  // ── Datos y verificación (CU-Datos): `GET /registro`, con los últimos dígitos y sin archivos ──
  datosYVerificacion(): Promise<RegistroEspecialista>;

  // ── Seguridad (D6-Seguridad, D6-TOTP) ──
  seguridad(): Promise<Seguridad>;
  /** La clave se muestra una vez; nunca se guarda en el navegador. */
  iniciarTotp(r: Reautenticacion): Promise<AltaTotp>;
  confirmarTotp(c: ConfirmarTotp): Promise<CodigosRespaldo>;
  cambiarSegundaVerificacion(c: CambioSegundaVerificacion): Promise<Seguridad>;
  generarCodigosRespaldo(r: Reautenticacion): Promise<CodigosRespaldo>;
  /** Cierra la sesión de un teléfono y lo olvida. */
  cerrarDispositivo(id: string): Promise<void>;

  // ── Bandeja de avisos (D6-Avisos): reemplaza a `avisos()`. Abrir un aviso nunca acepta nada. ──
  bandeja(cursor?: string): Promise<Pagina<AvisoBandeja>>;
  marcarLeidoEnBandeja(id: string): Promise<void>;
  borrarDeBandeja(id: string): Promise<void>;
  vaciarBandeja(): Promise<void>;

  // ── Descargar mis datos (CU-Privacidad) ──
  exportacionDatos(): Promise<ExportacionDatos | null>;
  pedirExportacionDatos(r: Reautenticacion): Promise<ExportacionDatos>;
}
