import type { Proveedor } from '../contracts/dto.ts';

/**
 * Ayudas para recorrer la vista previa sin email ni Google o Apple de verdad: el código de 6 dígitos, los enlaces de
 * recuperación y las cuentas de prueba de cada proveedor. Solo existen con el origen de prueba: en producción son null
 * y los datos viven en el mock, fuera del bundle (scripts/verificar-bundle.mjs lo comprueba).
 */
export interface AyudasPrueba {
  codigoEmail: string;
  /** Token del enlace de recuperación válido (aparece después de pedir la recuperación de una cuenta que existe). */
  tokenRecuperacion: string;
  tokenVencido: string;
  cuentasProveedor: Record<Proveedor, readonly { email: string; idToken: string; nueva: boolean }[]>;
}
