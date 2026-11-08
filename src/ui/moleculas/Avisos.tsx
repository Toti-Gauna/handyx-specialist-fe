// Avisos en la pantalla (lote 1.2). `AvisoPrivado`: el candado con lo que se guarda cifrado y quién lo ve.
// `AvisoCaja`: un aviso con ícono, título y texto (error, atención o información); los errores se anuncian
// (`role="alert"`) y siempre dicen qué hacer, no solo que algo falló.
import type { ReactNode } from 'react';
import { Icono, type NombreIconoUi } from '../atomos/Icono.tsx';
import '../registro.css';

export function AvisoPrivado({ children }: { children: ReactNode }) {
  return (
    <p className="ui-aviso-privado">
      <Icono nombre="candado" />
      <span>{children}</span>
    </p>
  );
}

const ICONO: Record<'error' | 'alerta' | 'info' | 'exito', NombreIconoUi> = { error: 'alerta', alerta: 'alerta', info: 'ayuda', exito: 'check' };

export function AvisoCaja({ tono = 'info', titulo, children, accion }: { tono?: 'error' | 'alerta' | 'info' | 'exito'; titulo?: string; children?: ReactNode; accion?: ReactNode }) {
  return (
    <div className={`ui-aviso-caja ui-aviso-caja--${tono}`} role={tono === 'error' ? 'alert' : 'status'}>
      <Icono nombre={ICONO[tono]} />
      <div className="ui-aviso-caja__texto">
        {titulo ? <strong>{titulo}</strong> : null}
        {children ? <span>{children}</span> : null}
        {accion ? <span className="ui-aviso-caja__accion">{accion}</span> : null}
      </div>
    </div>
  );
}
