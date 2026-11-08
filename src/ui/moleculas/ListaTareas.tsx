'use client';
// Lista de tareas grande del Modo trabajo (H0-Modo, lote 2.3): cada tarea es una casilla real de 56 px de alto con un
// cuadro de 34 px, para tocar con guantes. La de ahora va resaltada y marcada como paso actual; las de seguridad dicen
// «Seguridad» escrito; las hechas van tachadas y además dicen «Hecha» (nunca solo con el color o el tachado).
import { Icono } from '../atomos/Icono.tsx';
import '../trabajo.css';

export interface TareaUi {
  id: string;
  texto: string;
  estado: 'hecha' | 'actual' | 'pendiente';
  seguridad: boolean;
  /** "Usás: cartucho cerámico 35 mm". */
  detalle?: string | null;
}

export function ListaTareas({ tareas, onCambiar, deshabilitado = false, etiqueta = 'Tus tareas' }: { tareas: readonly TareaUi[]; onCambiar(id: string, hecha: boolean): void; deshabilitado?: boolean; etiqueta?: string }) {
  return (
    <ul className="ui-tareas" aria-label={etiqueta}>
      {tareas.map((t) => {
        const hecha = t.estado === 'hecha';
        const notas = [t.seguridad ? 'Seguridad' : null, t.detalle ?? null, hecha ? 'Hecha' : t.estado === 'actual' ? 'Ahora' : null].filter(Boolean).join(' · ');
        return (
          <li key={t.id} className={`ui-tareas__item ui-tareas__item--${t.estado}`} aria-current={t.estado === 'actual' ? 'step' : undefined}>
            <label className="ui-tareas__fila">
              <input type="checkbox" className="ui-tareas__control" checked={hecha} disabled={deshabilitado} onChange={(e) => onCambiar(t.id, e.target.checked)} />
              <span className="ui-tareas__caja" aria-hidden="true">
                {hecha ? <Icono nombre="check" /> : null}
              </span>
              <span className="ui-tareas__texto">
                <span className="ui-tareas__titulo">{t.texto}</span>
                {notas ? <span className="ui-tareas__detalle">{notas}</span> : null}
              </span>
              {t.seguridad ? <Icono nombre="escudo" className="ui-tareas__seguridad" /> : null}
            </label>
          </li>
        );
      })}
    </ul>
  );
}
