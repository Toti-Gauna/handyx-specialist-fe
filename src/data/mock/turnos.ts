// Turnos de la verificación presencial de antecedentes (lote 4.4, contrato 0.5.0). El certificado se muestra en persona:
// acá solo se reserva el turno. La oficina es de prueba y su dirección es ficticia.
import { ReservaTurnoSchema, type PerfilEspecialista, type TurnoAntecedentes } from '../../contracts/dto.ts';
import { ahoraMs, fallo, idFijo, iso, type EstadoMock } from './estado.ts';
import { zodAFallo } from './validacion.ts';

export const LUGAR_PRUEBA = 'Oficina de Operations de prueba · Calle Ficticia 123, Mar del Plata';
const DIAS = ['2026-11-18', '2026-11-19', '2026-11-20', '2026-11-23', '2026-11-24'];
/** 10, 12 y 15 h de Buenos Aires (UTC−3). */
const HORAS_UTC = ['13:00', '15:00', '18:00'];
const MEDIA_HORA = 30 * 60_000;

/** Turnos fijos de prueba; algunos ya están tomados por otras personas. */
export function turnosDePrueba(): TurnoAntecedentes[] {
  return DIAS.flatMap((dia, i) =>
    HORAS_UTC.map((h, j) => {
      const inicio = Date.parse(`${dia}T${h}:00.000Z`);
      return { id: idFijo(0x6000 + i * 10 + j), inicio: iso(inicio), fin: iso(inicio + MEDIA_HORA), lugar: LUGAR_PRUEBA, disponible: (i + j) % 4 !== 1 };
    }),
  );
}

/** Reserva un turno (o lo cambia): libera el anterior y deja la cita coordinada. */
export function reservar(s: EstadoMock, turnoId: string): PerfilEspecialista {
  const p = s.perfil;
  if (p.antecedentes === 'aprobada' || p.antecedentes === 'no_aprobada') {
    throw fallo('conflicto', 409, 'transicion_invalida', 'La verificación de antecedentes ya tiene un resultado.');
  }
  if (p.estadoAlta === 'rechazada' || p.estadoAlta === 'suspendida') throw fallo('permiso', 403, 'sin_permiso', 'No podés reservar un turno con el alta en este estado.');
  const t = s.turnos.find((x) => x.id === turnoId);
  if (!t || !t.disponible || Date.parse(t.inicio) <= ahoraMs(s)) {
    throw fallo('conflicto', 409, 'transicion_invalida', 'Ese turno ya no está disponible. Elegí otro.');
  }
  const anterior = p.citaAntecedentes ? s.turnos.find((x) => x.id === p.citaAntecedentes?.turnoId) : undefined;
  if (anterior) anterior.disponible = true;
  t.disponible = false;
  p.citaAntecedentes = { turnoId: t.id, inicio: t.inicio, fin: t.fin, lugar: t.lugar };
  p.antecedentes = 'cita_coordinada';
  p.version += 1;
  return p;
}

export const turnos = (s: EstadoMock) => ({
  turnosAntecedentes(): TurnoAntecedentes[] {
    return s.turnos.filter((t) => Date.parse(t.inicio) > ahoraMs(s)).sort((a, b) => Date.parse(a.inicio) - Date.parse(b.inicio));
  },
  reservarTurno(turnoId: unknown): PerfilEspecialista {
    const ok = ReservaTurnoSchema.safeParse({ turnoId });
    if (!ok.success) throw zodAFallo(ok.error);
    return reservar(s, ok.data.turnoId);
  },
});
