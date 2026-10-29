import { PreferenciasSchema, type Baja, type FeeVigente, type Preferencias } from '../../contracts/dto.ts';
import { POLITICA_FEE_DEMO } from '../../contracts/fee.ts';
import { ahoraMs, fallo, iso, type EstadoMock } from './estado.ts';
import { zodAFallo } from './validacion.ts';

export const cuenta = (s: EstadoMock) => ({
  feeVigente: (): FeeVigente => ({ politica: POLITICA_FEE_DEMO, avisoAceptadoEn: s.feeAvisoEn }),
  aceptarAvisoFee(politicaId: string, version: number): FeeVigente {
    if (politicaId !== POLITICA_FEE_DEMO.id || version !== POLITICA_FEE_DEMO.version) {
      throw fallo('conflicto', 409, 'conflicto_version', 'El aviso cambió. Volvé a abrirlo.');
    }
    s.feeAvisoEn ??= iso(ahoraMs(s));
    return { politica: POLITICA_FEE_DEMO, avisoAceptadoEn: s.feeAvisoEn };
  },

  preferencias: (): Preferencias => s.preferencias,
  guardarPreferencias(p: unknown): Preferencias {
    const ok = PreferenciasSchema.omit({ push: true }).safeParse(p);
    if (!ok.success) throw zodAFallo(ok.error);
    s.preferencias = { ...s.preferencias, ...ok.data };
    return s.preferencias;
  },
  // Opt-in contextual: el permiso del dispositivo puede ser rechazado y la entrega nunca está garantizada.
  activarPush(): Preferencias {
    s.preferencias.push = s.pushRechazado ? 'rechazado' : 'activado';
    return s.preferencias;
  },

  baja: (): Baja | null => s.baja,
  solicitarBaja(): Baja {
    if (s.baja && s.baja.estado !== 'cancelada') throw fallo('conflicto', 409, 'transicion_invalida', 'Ya tenés una solicitud de baja.');
    s.baja = {
      estado: 'solicitada',
      solicitadaEn: iso(ahoraMs(s)),
      mensaje: 'Recibimos tu solicitud. Todavía no se borró nada: podés cancelarla mientras esté en este estado. Cerramos tus sesiones y no vas a recibir pedidos.',
    };
    s.perfil.baja = 'solicitada';
    s.sesionActiva = false; // la baja bloquea las sesiones
    return s.baja;
  },
  cancelarBaja(): void {
    if (!s.baja || s.baja.estado !== 'solicitada') throw fallo('conflicto', 409, 'transicion_invalida', 'Esta solicitud ya no se puede cancelar.');
    s.baja = null;
    s.perfil.baja = null;
  },
});
