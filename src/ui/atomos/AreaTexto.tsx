'use client';
// Campo de texto de varias líneas del kit v3, con el mismo estilo que `Campo`: etiqueta arriba, ayuda y error debajo y un
// contador «N de M» (texto, no solo color). 18 px para que se lea sin anteojos.
import { useId, type TextareaHTMLAttributes } from 'react';
import { Icono } from './Icono.tsx';
import './area.css';

type Props = Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'children' | 'value' | 'onChange'> & {
  etiqueta: string;
  valor: string;
  onCambio(v: string): void;
  maximo: number;
  ayuda?: string;
  error?: string | null;
};

export function AreaTexto({ etiqueta, valor, onCambio, maximo, ayuda, error, id: idDado, ...resto }: Props) {
  const propio = useId();
  const id = idDado ?? propio;
  const describe = [ayuda ? `${id}-ayuda` : '', error ? `${id}-error` : '', `${id}-cuenta`].filter(Boolean).join(' ');
  return (
    <div className={`ui-campo ui-area${error ? ' ui-campo--error' : ''}`}>
      <label className="ui-campo__etiqueta" htmlFor={id}>
        {etiqueta}
      </label>
      <textarea {...resto} id={id} className="ui-area__texto" rows={4} maxLength={maximo} value={valor} aria-invalid={error ? true : undefined} aria-describedby={describe} onChange={(e) => onCambio(e.target.value)} />
      {ayuda ? (
        <span id={`${id}-ayuda`} className="ui-campo__ayuda">
          {ayuda}
        </span>
      ) : null}
      {error ? (
        <span id={`${id}-error`} className="ui-campo__error">
          <Icono nombre="alerta" tam="chico" /> {error}
        </span>
      ) : null}
      <span id={`${id}-cuenta`} className="ui-area__cuenta">
        {valor.length} de {maximo} letras
      </span>
    </div>
  );
}
