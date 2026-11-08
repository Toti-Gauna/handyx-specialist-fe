// Recuadro de aviso del kit v3 (lote 1.1): ícono + texto, nunca solo color. `error` se anuncia en cuanto aparece
// (role="alert"); `info` y `exito` como estado (role="status"); `prueba` es la ayuda amarilla de la vista previa.
import type { ReactNode } from 'react';
import { Icono, type NombreIconoUi } from '../atomos/Icono.tsx';

const ICONO: Record<TonoAviso, NombreIconoUi> = { info: 'escudo', error: 'alerta', exito: 'check', prueba: 'ayuda' };
export type TonoAviso = 'info' | 'error' | 'exito' | 'prueba';

export function AvisoCaja({ tono = 'info', icono, titulo, children, accion }: { tono?: TonoAviso; icono?: NombreIconoUi; titulo?: ReactNode; children: ReactNode; accion?: ReactNode }) {
  const rol = tono === 'error' ? 'alert' : tono === 'prueba' ? undefined : 'status';
  return (
    <div className={`ui-aviso-caja ui-aviso-caja--${tono}`} role={rol}>
      <Icono nombre={icono ?? ICONO[tono]} />
      <div className="ui-aviso-caja__texto">
        {titulo ? <strong>{titulo}</strong> : null}
        <span>{children}</span>
        {accion}
      </div>
    </div>
  );
}
