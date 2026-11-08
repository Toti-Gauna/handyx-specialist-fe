'use client';
// Lista desplegable del kit v3 (la del teléfono): etiqueta arriba, 18 px, con la misma caja que `Campo`.
import { useId, type ReactNode, type SelectHTMLAttributes } from 'react';
import './area.css';

type Props = Omit<SelectHTMLAttributes<HTMLSelectElement>, 'children'> & { etiqueta: string; ayuda?: string; children: ReactNode };

export function Seleccion({ etiqueta, ayuda, children, id: idDado, ...resto }: Props) {
  const propio = useId();
  const id = idDado ?? propio;
  return (
    <div className="ui-campo">
      <label className="ui-campo__etiqueta" htmlFor={id}>
        {etiqueta}
      </label>
      <select {...resto} id={id} className="ui-seleccion" aria-describedby={ayuda ? `${id}-ayuda` : undefined}>
        {children}
      </select>
      {ayuda ? (
        <span id={`${id}-ayuda`} className="ui-campo__ayuda">
          {ayuda}
        </span>
      ) : null}
    </div>
  );
}
