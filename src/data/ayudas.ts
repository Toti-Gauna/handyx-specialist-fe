import type { ReactNode } from 'react';
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

/**
 * Cámara simulada de la vista previa (lote 4.4): el visor dibujado y sus textos. Con la API real es null y la cámara es la
 * del teléfono; así ningún texto ni dibujo de prueba llega al bundle de producción.
 */
export interface CamaraPrueba {
  Visor: (p: { modo: 'documento' | 'selfie' }) => ReactNode;
  disparo: string;
  aviso: string;
  sello: string;
}
