// Lógica pura de las obras de varios días (lote 4.7): avance, próxima jornada, fechas de cada etapa y cuánto se cobró.
// Lo cobrado distingue lo verificado de lo que informó el especialista (reportado ≠ verificado, como en Caja).
import type { EtapaObra, Jornada, Pago, TrabajoDetalle } from '../contracts/dto.ts';
import { diaLocal } from './formato.ts';

export function avanceObra(etapas: readonly EtapaObra[]): { hechas: number; total: number } {
  return { hechas: etapas.filter((e) => e.estado === 'terminada').length, total: etapas.length };
}

export const etapaEnCurso = (etapas: readonly EtapaObra[]): EtapaObra | null => etapas.find((e) => e.estado === 'en_curso') ?? null;

/** La próxima jornada sin hacer que todavía no terminó (la de hoy cuenta). */
export function proximaJornada(jornadas: readonly Jornada[], ahora: Date): Jornada | null {
  return (
    [...jornadas]
      .filter((j) => j.estado === 'programada' && Date.parse(j.horario.fin ?? j.horario.inicio) > ahora.getTime())
      .sort((a, b) => Date.parse(a.horario.inicio) - Date.parse(b.horario.inicio))[0] ?? null
  );
}

/** La jornada de hoy (hora de Buenos Aires), si hay. */
export function jornadaDeHoy(jornadas: readonly Jornada[], ahora: Date): Jornada | null {
  const hoy = diaLocal(ahora.toISOString());
  return jornadas.find((j) => diaLocal(j.horario.inicio) === hoy) ?? null;
}

/** Desde y hasta de una etapa según sus jornadas, y cuántas son. */
export function fechasEtapa(etapaId: string, jornadas: readonly Jornada[]): { desde: string; hasta: string; cantidad: number } | null {
  const propias = jornadas.filter((j) => j.etapaId === etapaId).sort((a, b) => Date.parse(a.horario.inicio) - Date.parse(b.horario.inicio));
  const primera = propias[0];
  const ultima = propias.at(-1);
  return primera && ultima ? { desde: primera.horario.inicio, hasta: ultima.horario.inicio, cantidad: propias.length } : null;
}

/** Cobros de la obra en centavos: verificado, informado sin verificar y lo que falta del total vigente. */
export function montosObra(d: Pick<TrabajoDetalle, 'trabajo' | 'totalVigente'>, pagos: readonly Pago[]): { total: number; verificado: number; informado: number; falta: number } {
  const propios = pagos.filter((p) => p.trabajoId === d.trabajo.id);
  const suma = (estado: Pago['estado']) => propios.filter((p) => p.estado === estado).reduce((n, p) => n + p.monto.centavos, 0);
  const verificado = suma('verificado');
  const informado = suma('reportado');
  const total = d.totalVigente.centavos;
  return { total, verificado, informado, falta: Math.max(0, total - verificado - informado) };
}

/** Lo que vale una etapa con sus adicionales aceptados. */
export function totalEtapa(etapa: EtapaObra, adicionales: TrabajoDetalle['adicionales']): number {
  return adicionales.filter((a) => a.etapaId === etapa.id && a.estado === 'aceptado').reduce((n, a) => n + a.monto.centavos, etapa.monto.centavos);
}
