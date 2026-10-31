// Obras de varios días (lote 4.7): terminar una etapa (crea su cobro y arranca la siguiente), pedir otro día para una
// jornada (no mueve el resto) y el diario de obra (avance del día con nota y fotos que ve el cliente).
import { CambioJornadaSchema, MAX_FOTOS_DIARIO, NuevaEntradaDiarioSchema, type EntradaDiario, type Jornada, type Pago } from '../../contracts/dto.ts';
import { monto, sumar } from '../../contracts/dinero.ts';
import { MAQUINA_ETAPA, puedeTransicionar } from '../../contracts/maquinas.ts';
import { ahoraMs, fallo, idempotente, idNuevo, iso, type EstadoMock, type TrabajoInterno } from './estado.ts';
import { FOTO_PRUEBA } from './fotos.ts';
import { zodAFallo } from './validacion.ts';

function obra(s: EstadoMock, id: string): TrabajoInterno {
  const t = s.trabajos.find((x) => x.trabajo.id === id);
  if (!t) throw fallo('no_encontrado', 404, 'no_encontrado', 'No encontramos ese trabajo.');
  if (t.trabajo.tipo !== 'obra') throw fallo('conflicto', 409, 'transicion_invalida', 'Esto es solo para obras de varios días.');
  return t;
}

/** Al empezar la obra, o al terminar una etapa, arranca la próxima pendiente (de a una). */
export function arrancarSiguienteEtapa(t: TrabajoInterno): void {
  if (t.etapas.some((e) => e.estado === 'en_curso')) return;
  const sig = [...t.etapas].sort((a, b) => a.orden - b.orden).find((e) => e.estado === 'pendiente');
  if (sig) sig.estado = 'en_curso';
}

const capitalizar = (r: string) => (r === 'aire_acondicionado' ? 'Aire acondicionado' : r === 'albanileria' ? 'Albañilería' : r.charAt(0).toUpperCase() + r.slice(1));

export const obras = (s: EstadoMock) => ({
  terminarEtapa(id: string, etapaId: string, clave: string): Pago {
    return idempotente(s, `etapa:${clave}`, () => {
      const t = obra(s, id);
      const e = t.etapas.find((x) => x.id === etapaId);
      if (!e) throw fallo('no_encontrado', 404, 'no_encontrado', 'No encontramos esa etapa.');
      if (t.trabajo.estado !== 'en_curso' || !puedeTransicionar(MAQUINA_ETAPA, e.estado, 'terminada', 'especialista')) {
        throw fallo('conflicto', 409, 'transicion_invalida', 'Esa etapa no está en curso.');
      }
      // Lo que el cliente no respondió de esta etapa no se cobra: el sistema lo retira.
      for (const a of t.adicionales) {
        if (a.etapaId === e.id && a.estado === 'pendiente') {
          a.estado = 'retirado';
          a.respondidoEn = iso(ahoraMs(s));
          a.version += 1;
        }
      }
      const total = t.adicionales.filter((a) => a.etapaId === e.id && a.estado === 'aceptado').reduce((m, a) => sumar(m, a.monto), e.monto);
      const pago: Pago = {
        id: idNuevo(s),
        trabajoId: t.trabajo.id,
        etapaId: e.id,
        descripcion: `${capitalizar(t.trabajo.rubro)} · Etapa ${e.orden} · ${e.nombre}`,
        feeHandy: monto(0),
        neto: total,
        metodo: t.metodoPago,
        monto: total,
        estado: 'pendiente',
        fuenteConfirmacion: null,
        referenciaProveedor: null,
        actualizadoEn: iso(ahoraMs(s)),
      };
      s.pagos.unshift(pago);
      e.estado = 'terminada';
      e.terminadaEn = iso(ahoraMs(s));
      e.pagoId = pago.id;
      t.trabajo.version += 1;
      arrancarSiguienteEtapa(t);
      return structuredClone(pago);
    });
  },

  pedirCambioJornada(id: string, jornadaId: string, cambio: unknown, clave: string): Jornada {
    return idempotente(s, `jornada:${clave}`, () => {
      const t = obra(s, id);
      const ok = CambioJornadaSchema.safeParse(cambio);
      if (!ok.success) throw zodAFallo(ok.error);
      const j = t.jornadas.find((x) => x.id === jornadaId);
      if (!j) throw fallo('no_encontrado', 404, 'no_encontrado', 'No encontramos esa jornada.');
      if (!['agendado', 'en_camino', 'en_sitio', 'en_curso'].includes(t.trabajo.estado)) throw fallo('conflicto', 409, 'transicion_invalida', 'Esta obra ya no admite cambios.');
      if (j.estado !== 'programada' || Date.parse(j.horario.inicio) <= ahoraMs(s)) throw fallo('conflicto', 409, 'transicion_invalida', 'Solo se puede mover una jornada que todavía no pasó.');
      if (j.cambioPendiente) throw fallo('conflicto', 409, 'transicion_invalida', 'Ya pediste otro día para esta jornada.');
      if (Date.parse(ok.data.horario.inicio) <= ahoraMs(s)) throw fallo('validacion', 400, 'validacion', 'El día nuevo tiene que ser a futuro.');
      j.cambioPendiente = { horario: ok.data.horario, motivo: ok.data.motivo, pedidoEn: iso(ahoraMs(s)) };
      return structuredClone(j);
    });
  },

  agregarAlDiario(id: string, entrada: unknown, fotos: readonly Blob[], clave: string): EntradaDiario {
    return idempotente(s, `diario:${clave}`, () => {
      const t = obra(s, id);
      const ok = NuevaEntradaDiarioSchema.safeParse(entrada);
      if (!ok.success) throw zodAFallo(ok.error);
      if (fotos.length > MAX_FOTOS_DIARIO) throw fallo('validacion', 400, 'validacion', `Hasta ${MAX_FOTOS_DIARIO} fotos por día.`);
      if (t.trabajo.estado !== 'en_curso') throw fallo('conflicto', 409, 'transicion_invalida', 'El diario se completa con la obra en curso.');
      const e = t.etapas.find((x) => x.id === ok.data.etapaId);
      if (!e || e.estado === 'pendiente') throw fallo('validacion', 400, 'validacion', 'Elegí una etapa empezada.');
      const j = ok.data.jornadaId ? t.jornadas.find((x) => x.id === ok.data.jornadaId) : null;
      if (ok.data.jornadaId && !j) throw fallo('validacion', 400, 'validacion', 'Esa jornada no es de esta obra.');
      if (j) j.estado = 'hecha';
      // El mock nunca lee ni guarda las fotos: cada una queda como la foto sintética de prueba.
      const nueva: EntradaDiario = { id: idNuevo(s), etapaId: e.id, jornadaId: j?.id ?? null, nota: ok.data.nota, fotos: fotos.map(() => ({ id: idNuevo(s), url: FOTO_PRUEBA })), creadoEn: iso(ahoraMs(s)) };
      t.diario.push(nueva);
      return structuredClone(nueva);
    });
  },
});
