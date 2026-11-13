// Políticas de tarifa (fee) de Handy, versionadas y con vigencia en UTC.
//
// Reglas (decisión de Ignacio, 29/10/2026, y bloque de ejecución):
// - Demo cerrada 10/11/2026–10/12/2026: fee de Handy 0 % para usuario y especialista.
// - El fee 0 % es la tarifa de Handy; NO es un descuento sobre el precio del especialista.
// - Al terminar una política no se infiere ninguna tarifa: sin política activa vigente, la app no
//   muestra ni cobra porcentaje alguno. Una tarifa posterior exige política aprobada + aceptación.
// - "Hasta el 10/12" se interpreta inclusive (fin del 10/12 en Buenos Aires). PENDIENTE de confirmar:
//   los cupones "aplicables desde el 10/12" sugieren que ese día ya es posterior a la demo.
// - 0.11.0 (decisión de Ignacio del 08/11/2026): Handyx NO le cobra comisión al especialista, NUNCA. `bpsEspecialista`
//   es siempre 0 (`BPS_ESPECIALISTA`); una política con otro valor es inválida y no se aplica (falla cerrada). El modal
//   y el contador del «0 % durante la demo» se quitan de la app (lote 0.2): `avisoFee` queda solo por compatibilidad.
import { diasEntre, fechaLocal } from './tiempos.ts';

/** Comisión de Handyx al especialista, en puntos básicos: 0, siempre (0.11.0). */
export const BPS_ESPECIALISTA = 0;

export interface PoliticaFee {
  id: string;
  version: number;
  alcance: 'demo_cerrada' | 'general';
  /** Inicio inclusive (UTC). */
  desde: string;
  /** Fin exclusivo (UTC). */
  hastaExclusivo: string;
  /** Último día de vigencia tal como se comunica (AAAA-MM-DD, Buenos Aires). */
  ultimoDiaLocal: string;
  bpsUsuario: number;
  /** Siempre `BPS_ESPECIALISTA` (0): Handyx no le cobra comisión al especialista, nunca (0.11.0). */
  bpsEspecialista: number;
  /** Solo `activa` se aplica. `borrador` = configurada pero sin aprobación. */
  estado: 'activa' | 'borrador';
}

export const POLITICA_FEE_DEMO: PoliticaFee = {
  id: 'fee-demo-2026',
  version: 1,
  alcance: 'demo_cerrada',
  desde: '2026-11-10T03:00:00.000Z', // 10/11/2026 00:00 en Buenos Aires
  hastaExclusivo: '2026-12-11T03:00:00.000Z', // fin del 10/12/2026 en Buenos Aires
  ultimoDiaLocal: '2026-12-10',
  bpsUsuario: 0,
  bpsEspecialista: 0,
  estado: 'activa',
};

/**
 * La política activa que rige en `ahora`, o null (nunca se inventa una tarifa por defecto). Una política que le cobre
 * algo al especialista es inválida (0.11.0) y se ignora.
 */
export function politicaVigente(ahora: Date, politicas: readonly PoliticaFee[]): PoliticaFee | null {
  const t = ahora.getTime();
  return (
    politicas.find(
      (p) =>
        p.estado === 'activa' &&
        p.bpsEspecialista === BPS_ESPECIALISTA &&
        Date.parse(p.desde) <= t &&
        t < Date.parse(p.hastaExclusivo),
    ) ?? null
  );
}

export type AvisoFee =
  | { fase: 'antes'; diasParaEmpezar: number; ultimoDiaLocal: string }
  | { fase: 'vigente'; diasRestantes: number; ultimoDia: boolean; ultimoDiaLocal: string }
  | { fase: 'terminada'; ultimoDiaLocal: string };

/**
 * Estado del aviso de fee 0 % para el modal de inicio, el post-registro y el contador de Cuenta. Obsoleto desde 0.11.0:
 * la app ya no muestra el modal ni el contador (no hay comisión al especialista); se quita en 1.0.0.
 * `diasRestantes` cuenta días calendario de Buenos Aires: el 10/12 da 0 (`ultimoDia: true`).
 */
export function avisoFee(ahora: Date, politica: PoliticaFee): AvisoFee {
  const t = ahora.getTime();
  const hoy = fechaLocal(ahora);
  if (t < Date.parse(politica.desde)) {
    return {
      fase: 'antes',
      diasParaEmpezar: diasEntre(hoy, fechaLocal(new Date(politica.desde))),
      ultimoDiaLocal: politica.ultimoDiaLocal,
    };
  }
  if (t >= Date.parse(politica.hastaExclusivo)) return { fase: 'terminada', ultimoDiaLocal: politica.ultimoDiaLocal };
  const diasRestantes = diasEntre(hoy, politica.ultimoDiaLocal);
  return { fase: 'vigente', diasRestantes, ultimoDia: diasRestantes === 0, ultimoDiaLocal: politica.ultimoDiaLocal };
}
