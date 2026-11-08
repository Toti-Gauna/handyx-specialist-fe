// Acción fija abajo: la acción principal de la pantalla siempre a mano, sobre la barra de pestañas si la hay. Con dos
// acciones, van en fila solo si sus textos son cortos; si no, en columna con la principal arriba (logica.ts).
import type { ReactNode } from 'react';
import { disposicionAcciones } from '../logica.ts';

export function AccionFija({ children, nota }: { children: ReactNode; nota?: ReactNode }) {
  return (
    <div className="ui-accion-fija">
      {nota ? <p className="ui-accion-fija__nota">{nota}</p> : null}
      {children}
    </div>
  );
}

/** `textos`: los textos de los botones, para decidir fila o columna (con texto agrandado todo pasa a columna). */
export function AccionesFijas({ children, textos, nota }: { children: ReactNode; textos: readonly string[]; nota?: ReactNode }) {
  return (
    <div className={`ui-accion-fija ui-accion-fija--${disposicionAcciones(textos)}`}>
      {nota ? <p className="ui-accion-fija__nota">{nota}</p> : null}
      <div className="ui-accion-fija__botones">{children}</div>
    </div>
  );
}
