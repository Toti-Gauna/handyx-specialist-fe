'use client';
// Controles de formulario del kit v3, todos con su etiqueta visible y áreas táctiles ≥ 48 px. El error se dice con
// texto (y se asocia al campo con aria-describedby), nunca solo con el color.
import { useId, type InputHTMLAttributes, type ReactNode } from 'react';
import { Icono, type NombreIconoUi } from './Icono.tsx';

/** Interruptor con el estado escrito ("Disponible" / "No disponible"): role="switch". */
export function Interruptor({
  encendido,
  onCambio,
  etiqueta,
  textoEncendido,
  textoApagado,
  tono = 'claro',
  deshabilitado = false,
}: {
  encendido: boolean;
  onCambio(v: boolean): void;
  /** Nombre del control para el lector ("Recibir pedidos urgentes"). */
  etiqueta: string;
  /** Texto visible del estado; por defecto, "Sí" / "No". */
  textoEncendido?: string;
  textoApagado?: string;
  /** `noche`: la pastilla oscura de borde amarillo de la cabecera (Disponible). */
  tono?: 'claro' | 'noche';
  deshabilitado?: boolean;
}) {
  const estado = encendido ? (textoEncendido ?? 'Sí') : (textoApagado ?? 'No');
  return (
    <button
      type="button"
      role="switch"
      aria-checked={encendido}
      aria-label={`${etiqueta}: ${estado}`}
      disabled={deshabilitado}
      className={`ui-interruptor ui-interruptor--${tono}${encendido ? ' ui-interruptor--on' : ''}`}
      onClick={() => onCambio(!encendido)}
    >
      <span className="ui-interruptor__texto" aria-hidden="true">
        {tono === 'noche' ? estado : etiqueta}
        {tono === 'claro' ? <small>{estado}</small> : null}
      </span>
      <span className="ui-interruptor__pista" aria-hidden="true">
        <span className="ui-interruptor__perilla" />
      </span>
    </button>
  );
}

type PropsMarca = Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'children'> & { children: ReactNode; ayuda?: string };

/** Casilla con el texto entero tocable (la fila completa es el área táctil). */
export function Casilla({ children, ayuda, className, ...resto }: PropsMarca) {
  const id = useId();
  return (
    <label className={`ui-marca ui-marca--casilla${className ? ` ${className}` : ''}`}>
      <input {...resto} type="checkbox" aria-describedby={ayuda ? `${id}-ayuda` : undefined} />
      <span className="ui-marca__caja" aria-hidden="true">
        <Icono nombre="check" tam="chico" />
      </span>
      <span className="ui-marca__texto">
        {children}
        {ayuda ? <small id={`${id}-ayuda`}>{ayuda}</small> : null}
      </span>
    </label>
  );
}

export function Radio({ children, ayuda, className, ...resto }: PropsMarca) {
  const id = useId();
  return (
    <label className={`ui-marca ui-marca--radio${className ? ` ${className}` : ''}`}>
      <input {...resto} type="radio" aria-describedby={ayuda ? `${id}-ayuda` : undefined} />
      <span className="ui-marca__caja" aria-hidden="true" />
      <span className="ui-marca__texto">
        {children}
        {ayuda ? <small id={`${id}-ayuda`}>{ayuda}</small> : null}
      </span>
    </label>
  );
}

type PropsCampo = Omit<InputHTMLAttributes<HTMLInputElement>, 'children'> & {
  etiqueta: string;
  ayuda?: string;
  error?: string | null;
  icono?: NombreIconoUi;
  /** Texto fijo antes del valor ("$"). */
  prefijo?: string;
};

/** Campo de texto con etiqueta arriba, ayuda y error debajo. Texto de 18 px para que se lea sin anteojos. */
export function Campo({ etiqueta, ayuda, error, icono, prefijo, className, id: idDado, ...resto }: PropsCampo) {
  const propio = useId();
  const id = idDado ?? propio;
  const describe = [ayuda ? `${id}-ayuda` : '', error ? `${id}-error` : ''].filter(Boolean).join(' ') || undefined;
  return (
    <div className={`ui-campo${error ? ' ui-campo--error' : ''}${className ? ` ${className}` : ''}`}>
      <label className="ui-campo__etiqueta" htmlFor={id}>
        {etiqueta}
      </label>
      <span className="ui-campo__caja">
        {icono ? <Icono nombre={icono} /> : null}
        {prefijo ? (
          <span className="ui-campo__prefijo" aria-hidden="true">
            {prefijo}
          </span>
        ) : null}
        <input {...resto} id={id} className="ui-campo__input" aria-invalid={error ? true : undefined} aria-describedby={describe} />
      </span>
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
    </div>
  );
}
