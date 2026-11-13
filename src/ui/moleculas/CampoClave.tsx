'use client';
// Contraseña del kit v3 (lote 1.1, D6-Login y D6-Recuperar): el campo de siempre con «Mostrar» adentro (texto + ojo,
// no solo el ícono) y, para una contraseña nueva, el medidor con el nivel escrito y un consejo concreto. La regla que
// manda es la del servidor (mínimo de REGLAS_CLAVE).
import { useId, useState } from 'react';
import { fuerzaClave } from '../../lib/clave.ts';
import { Icono } from '../atomos/Icono.tsx';

export function CampoClave({
  etiqueta = 'Contraseña',
  valor,
  onCambio,
  nueva = false,
  email = '',
  error,
  ayuda,
}: {
  etiqueta?: string;
  valor: string;
  onCambio(v: string): void;
  /** Contraseña nueva: autocompletado de "nueva" y medidor. */
  nueva?: boolean;
  /** Para avisar si la contraseña repite el email. */
  email?: string;
  error?: string | null;
  ayuda?: string;
}) {
  const id = useId();
  const [ver, setVer] = useState(false);
  const f = nueva && valor ? fuerzaClave(valor, email) : null;
  const describe = [ayuda ? `${id}-ayuda` : '', f ? `${id}-medidor` : '', error ? `${id}-error` : ''].filter(Boolean).join(' ') || undefined;
  return (
    <div className={`ui-campo ui-clave${error ? ' ui-campo--error' : ''}`}>
      <label className="ui-campo__etiqueta" htmlFor={id}>
        {etiqueta}
      </label>
      <span className="ui-campo__caja">
        <Icono nombre="candado" />
        <input
          id={id}
          className="ui-campo__input"
          type={ver ? 'text' : 'password'}
          autoComplete={nueva ? 'new-password' : 'current-password'}
          autoCapitalize="none"
          spellCheck={false}
          value={valor}
          onChange={(e) => onCambio(e.target.value)}
          aria-invalid={error ? true : undefined}
          aria-describedby={describe}
          required
        />
        <button type="button" className="ui-clave__ver" aria-pressed={ver} aria-label={ver ? 'Ocultar la contraseña' : 'Mostrar la contraseña'} onClick={() => setVer((v) => !v)}>
          <Icono nombre="ojo" tam="chico" />
          <span aria-hidden="true">{ver ? 'Ocultar' : 'Mostrar'}</span>
        </button>
      </span>
      {ayuda ? (
        <span id={`${id}-ayuda`} className="ui-campo__ayuda">
          {ayuda}
        </span>
      ) : null}
      {f ? (
        <span id={`${id}-medidor`} className={`ui-clave__medidor ui-clave__medidor--${f.nivel}`} aria-live="polite">
          <span className="ui-clave__barra" aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
          <span>
            <strong>{f.texto}</strong>
            {f.consejo ? `. ${f.consejo}` : '.'}
          </span>
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
