// Progreso del kit v3: barra (con un tramo amarillo "lo que suma esto") y anillo con "N/M" en el centro. Los dos dicen
// el avance en texto para el lector de pantalla. Se dibujan en SVG con atributos (sin estilos inline).
import { porcentaje } from '../logica.ts';

export function BarraProgreso({ hechas, total, extra = 0, etiqueta, fondo = 'blanco' }: { hechas: number; total: number; extra?: number; etiqueta: string; fondo?: 'blanco' | 'gris' }) {
  const pct = porcentaje(hechas, total);
  const pctExtra = Math.min(100 - pct, porcentaje(extra, total));
  return (
    <span className={`ui-progreso ui-progreso--${fondo}`} role="progressbar" aria-label={etiqueta} aria-valuemin={0} aria-valuemax={total} aria-valuenow={hechas} aria-valuetext={`${hechas} de ${total}`}>
      <svg className="ui-progreso__svg" aria-hidden="true" focusable="false" preserveAspectRatio="none">
        <rect className="ui-progreso__hecho" x="0" y="0" height="100%" width={`${pct}%`} />
        {pctExtra > 0 ? <rect className="ui-progreso__extra" x={`${pct}%`} y="0" height="100%" width={`${pctExtra}%`} /> : null}
      </svg>
    </span>
  );
}

const R = 21;
const LARGO = 2 * Math.PI * R;

export function Anillo({ hechas, total, unidad = 'etapas', tam = 'medio' }: { hechas: number; total: number; unidad?: string; tam?: 'medio' | 'grande' }) {
  const pct = porcentaje(hechas, total);
  return (
    <span className={`ui-anillo ui-anillo--${tam}`} role="img" aria-label={`${hechas} de ${total} ${unidad}`}>
      <svg viewBox="0 0 56 56" aria-hidden="true" focusable="false">
        <circle className="ui-anillo__fondo" cx="28" cy="28" r={R} />
        <circle className="ui-anillo__hecho" cx="28" cy="28" r={R} strokeDasharray={`${(LARGO * pct) / 100} ${LARGO}`} transform="rotate(-90 28 28)" />
      </svg>
      <span className="ui-anillo__centro" aria-hidden="true">
        {hechas}/{total}
      </span>
    </span>
  );
}
