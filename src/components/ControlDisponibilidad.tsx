'use client';
import { api } from '@handyx/origen-datos';
import type { Disponibilidad } from '../contracts/dto.ts';
import { useAccion } from '../hooks/useAccion.ts';
import { fechaHora } from '../lib/formato.ts';
import { ErrorCaja } from './Estados.tsx';
import { Interruptor } from './ui.tsx';

/**
 * Los dos interruptores de oferta. Cambian al instante en el servidor: apagar "Ahora" corta la oferta de
 * urgentes en ese momento. Apagarlos no tiene ninguna consecuencia: no hay obligación de aceptar.
 */
export function ControlDisponibilidad({ disp, bloqueado, alCambiar }: { disp: Disponibilidad; bloqueado: boolean; alCambiar(d: Disponibilidad): void | Promise<void> }) {
  const { pendiente, fallo, ejecutar } = useAccion();

  async function cambiar(parcial: { urgentesAhora?: boolean; programados?: boolean }) {
    // El refresco va dentro de la acción: hasta tener la versión nueva el interruptor sigue deshabilitado.
    await ejecutar(async () => {
      const d = await api.actualizarDisponibilidad({ urgentesAhora: parcial.urgentesAhora ?? disp.urgentesAhora, programados: parcial.programados ?? disp.programados, version: disp.version });
      await alCambiar(d);
    });
  }

  return (
    <div>
      {fallo ? <ErrorCaja fallo={fallo} /> : null}
      <Interruptor
        etiqueta="Pedidos urgentes · Ahora"
        descripcion={
          disp.urgentesAhora
            ? 'Encendido: te ofrecemos pedidos urgentes de tus rubros y zonas. Podés apagarlo cuando quieras.'
            : `Apagado: no te ofrecemos pedidos urgentes.${disp.urgentesCambiadoEn ? ` Último cambio: ${fechaHora(disp.urgentesCambiadoEn)}.` : ''}`
        }
        activo={disp.urgentesAhora}
        deshabilitado={bloqueado || pendiente}
        onCambio={(v) => void cambiar({ urgentesAhora: v })}
      />
      <Interruptor
        etiqueta="Pedidos programados y obras"
        descripcion={disp.programados ? 'Encendido: ves pedidos para otro día y visitas de presupuesto.' : 'Apagado: no te ofrecemos pedidos programados ni obras.'}
        activo={disp.programados}
        deshabilitado={bloqueado || pendiente}
        onCambio={(v) => void cambiar({ programados: v })}
      />
    </div>
  );
}
