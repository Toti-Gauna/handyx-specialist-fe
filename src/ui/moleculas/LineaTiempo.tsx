// Línea de tiempo continua (etapas de una obra, estado de un pedido): una sola línea vertical que une los puntos; el
// estado de cada paso se dice con texto e ícono, no solo con el color.
import type { ReactNode } from 'react';
import { Icono } from '../atomos/Icono.tsx';

export type EstadoPaso = 'hecho' | 'actual' | 'pendiente';

const TEXTO: Record<EstadoPaso, string> = { hecho: 'Hecho', actual: 'Ahora', pendiente: 'Falta' };

export function LineaTiempo({ pasos, etiqueta }: { pasos: readonly { titulo: string; detalle?: ReactNode; estado: EstadoPaso; derecha?: ReactNode }[]; etiqueta: string }) {
  return (
    <ol className="ui-linea" aria-label={etiqueta}>
      {pasos.map((p, i) => (
        <li key={`${p.titulo}-${i}`} className={`ui-linea__paso ui-linea__paso--${p.estado}`} aria-current={p.estado === 'actual' ? 'step' : undefined}>
          <span className="ui-linea__punto" aria-hidden="true">
            {p.estado === 'hecho' ? <Icono nombre="check" tam="chico" /> : null}
          </span>
          <span className="ui-linea__texto">
            <strong>{p.titulo}</strong>
            <span className="ui-linea__estado">{TEXTO[p.estado]}</span>
            {p.detalle ? <span className="ui-linea__detalle">{p.detalle}</span> : null}
          </span>
          {p.derecha ? <span className="ui-linea__derecha">{p.derecha}</span> : null}
        </li>
      ))}
    </ol>
  );
}
