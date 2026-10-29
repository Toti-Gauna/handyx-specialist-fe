// Adaptador mock: estado en memoria de la pestaña (nada en localStorage, cookies ni IndexedDB).
// Escenarios para recorrer estados sin backend; fallas simuladas para probar error/reintento.
import type { Disponibilidad, PerfilEspecialista } from '../../contracts/dto.ts';
import { POLITICA_FEE_DEMO } from '../../contracts/fee.ts';
import type { EspecialistaApi } from '../api.ts';
import { FalloApi } from '../errores.ts';
import { disponibilidadInicial, ID_CUENTA, pedidosFixture, perfilEnRevision, perfilHabilitado } from './fixtures.ts';
import { filtrarElegibles } from './reglas.ts';

export const ESCENARIOS = ['habilitado', 'en_revision', 'sin_sesion'] as const;
export type Escenario = (typeof ESCENARIOS)[number];

export interface OpcionesMock {
  escenario?: Escenario;
  latenciaMs?: number;
  /** Simula una caída en todas las llamadas. */
  falla?: 'red' | 'servidor' | null;
}

export function crearApiMock(o: OpcionesMock = {}): EspecialistaApi {
  const escenario = o.escenario ?? 'habilitado';
  const perfil: PerfilEspecialista = structuredClone(escenario === 'en_revision' ? perfilEnRevision : perfilHabilitado);
  let disp: Disponibilidad = structuredClone(disponibilidadInicial);
  // Aceptar el aviso de fee (modal de primer ingreso) llega en el lote 2.1.
  const avisoFeeAceptadoEn: string | null = null;

  const responder = async <T>(valor: () => T): Promise<T> => {
    await new Promise((r) => setTimeout(r, o.latenciaMs ?? 250));
    if (o.falla === 'red') throw new FalloApi('red');
    if (o.falla === 'servidor') throw new FalloApi('servidor', 503);
    return structuredClone(valor());
  };

  return {
    origen: 'mock',
    sesion: () =>
      responder(() =>
        escenario === 'sin_sesion'
          ? null
          : {
              cuenta: { id: ID_CUENTA, roles: ['especialista' as const] },
              csrfToken: 'mock-csrf-solo-en-memoria',
              expiraEn: new Date(Date.now() + 3_600_000).toISOString(),
            },
      ),
    perfil: () => responder(() => perfil),
    disponibilidad: () => responder(() => disp),
    actualizarDisponibilidad: (cambio) =>
      responder(() => {
        if (cambio.version !== disp.version) throw new FalloApi('conflicto', 409);
        const ahora = new Date().toISOString();
        disp = {
          ...disp,
          ...cambio,
          urgentesCambiadoEn: cambio.urgentesAhora !== disp.urgentesAhora ? ahora : disp.urgentesCambiadoEn,
          version: disp.version + 1,
        };
        return disp;
      }),
    pedidosElegibles: () =>
      responder(() => ({ items: filtrarElegibles(pedidosFixture, perfil, disp), siguienteCursor: null })),
    feeVigente: () => responder(() => ({ politica: POLITICA_FEE_DEMO, avisoAceptadoEn: avisoFeeAceptadoEn })),
  };
}

