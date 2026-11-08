'use client';
// Código de N números del kit v3. Un solo campo real (se puede pegar el código entero y el teclado ofrece el que llegó
// por email); las casillas son solo el dibujo. Casillas de 56 px y números de 24 px.
import { useId } from 'react';
import { Icono } from '../atomos/Icono.tsx';
import { normalizarCodigo } from '../logica.ts';

export function CampoCodigo({ valor, onCambio, onCompleto, error, largo = 6, etiqueta = 'Código de 6 números', deshabilitado = false }: { valor: string; onCambio(v: string): void; onCompleto?(v: string): void; error?: string | null; largo?: number; etiqueta?: string; deshabilitado?: boolean }) {
  const id = useId();
  const casillas = Array.from({ length: largo }, (_, i) => valor[i] ?? '');
  return (
    <div className={`ui-codigo${error ? ' ui-codigo--error' : ''}`}>
      <label className="ui-campo__etiqueta" htmlFor={id}>
        {etiqueta}
      </label>
      <div className="ui-codigo__caja">
        <input
          id={id}
          className="ui-codigo__input"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9]*"
          maxLength={largo}
          value={valor}
          disabled={deshabilitado}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          onChange={(e) => {
            const v = normalizarCodigo(e.target.value, largo);
            onCambio(v);
            if (v.length === largo) onCompleto?.(v);
          }}
        />
        <span className="ui-codigo__casillas" aria-hidden="true">
          {casillas.map((c, i) => (
            <span key={i} className={`ui-codigo__casilla${i === valor.length ? ' ui-codigo__casilla--actual' : ''}`}>
              {c}
            </span>
          ))}
        </span>
      </div>
      {error ? (
        <span id={`${id}-error`} className="ui-campo__error">
          <Icono nombre="alerta" tam="chico" /> {error}
        </span>
      ) : null}
    </div>
  );
}
