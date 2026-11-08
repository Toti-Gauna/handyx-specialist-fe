// Estado propio del mock de la cuenta (lote 1.4): perfil propio, seguridad y descarga de datos. Vive aparte de
// `estado.ts` (que comparten todos los lotes) y se asocia al estado del mock con un WeakMap: nada fuera de la memoria.
import type { ExportacionDatos } from '../../contracts/cuenta.ts';
import type { Dispositivo } from '../../contracts/seguridad.ts';
import { ahoraMs, idFijo, iso, type EstadoMock } from './estado.ts';

/** Código de la app autenticadora que acepta el mock (en producción lo calcula la app del teléfono). */
export const CODIGO_TOTP_PRUEBA = '246810';
/** Clave de ejemplo, no real. */
export const CLAVE_TOTP_PRUEBA = 'JBSW Y3DP EHPK 3PXP';

export interface ExtraCuenta {
  letraGrande: boolean;
  presentacion: string | null;
  fotoCambiada: boolean;
  perfilVersion: number;
  totp: boolean;
  email2fa: boolean;
  seguridadVersion: number;
  respaldo: { restantes: number; generadosEn: string | null };
  dispositivos: Dispositivo[];
  altaTotp: { alta: string; venceMs: number } | null;
  exportacion: ExportacionDatos | null;
}

const extras = new WeakMap<EstadoMock, ExtraCuenta>();

export function extraCuenta(s: EstadoMock): ExtraCuenta {
  let e = extras.get(s);
  if (!e) {
    const ahora = ahoraMs(s);
    e = {
      letraGrande: false,
      presentacion: s.escenario === 'habilitado' ? 'Plomero y electricista en Mar del Plata hace 12 años. Trabajo prolijo y te explico todo.' : null,
      fotoCambiada: false,
      perfilVersion: 1,
      totp: false,
      email2fa: false,
      seguridadVersion: 1,
      respaldo: { restantes: 0, generadosEn: null },
      dispositivos: [
        { id: idFijo(0xd01), nombre: 'Este teléfono · Android', esEste: true, recordado: true, ultimoIngreso: iso(ahora - 20 * 60_000) },
        { id: idFijo(0xd02), nombre: 'Otro teléfono · Android', esEste: false, recordado: false, ultimoIngreso: iso(ahora - 3 * 86_400_000) },
      ],
      altaTotp: null,
      exportacion: null,
    };
    extras.set(s, e);
  }
  return e;
}
