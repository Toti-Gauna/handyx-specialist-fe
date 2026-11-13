// Plantilla de las pantallas de entrar (lote 1.1): la escena con la ciudad arriba, el contenido y, si hay, la acción
// fija abajo. Sin cabecera de la app ni pestañas (todavía no hay sesión). El contenido nunca queda bajo la acción.
import type { ReactNode } from 'react';

export function PantallaAcceso({ escena, children, accion }: { escena: ReactNode; children: ReactNode; accion?: ReactNode }) {
  return (
    <div className={`ui-pantalla ui-pantalla--acceso${accion ? ' ui-pantalla--con-accion' : ''}`}>
      {escena}
      <div className="ui-pantalla__contenido">{children}</div>
      {accion}
    </div>
  );
}
