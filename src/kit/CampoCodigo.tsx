'use client';
// Código de 6 dígitos (lote 4.2). Un solo campo real: se puede pegar el código entero y el teclado del teléfono ofrece
// el que llegó por email (autocomplete="one-time-code"). Las seis casillas son solo el dibujo.
import { useId } from 'react';
import { Icono } from '../components/Icono.tsx';

interface Props {
  valor: string;
  onCambio(v: string): void;
  /** Se llama al completar los 6 números (para verificar sin otro toque). */
  onCompleto?(v: string): void;
  error?: string | null;
  deshabilitado?: boolean;
  etiqueta?: string;
}

export const LARGO_CODIGO = 6;

export function CampoCodigo({ valor, onCambio, onCompleto, error, deshabilitado = false, etiqueta = 'Código de 6 números' }: Props) {
  const id = useId();
  const casillas = Array.from({ length: LARGO_CODIGO }, (_, i) => valor[i] ?? '');
  return (
    <div className={`hx-codigo${error ? ' hx-codigo--error' : ''}`}>
      <label className="hx-codigo__etiqueta" htmlFor={id}>
        {etiqueta}
      </label>
      <div className="hx-codigo__caja">
        <input
          id={id}
          className="hx-codigo__input"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9]*"
          maxLength={LARGO_CODIGO}
          value={valor}
          disabled={deshabilitado}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          onChange={(e) => {
            const v = e.target.value.replace(/\D/g, '').slice(0, LARGO_CODIGO);
            onCambio(v);
            if (v.length === LARGO_CODIGO) onCompleto?.(v);
          }}
        />
        <span className="hx-codigo__casillas" aria-hidden="true">
          {casillas.map((c, i) => (
            <span key={i} className={`hx-codigo__casilla${i === Math.min(valor.length, LARGO_CODIGO - 1) ? ' hx-codigo__casilla--actual' : ''}${c ? ' hx-codigo__casilla--llena' : ''}`}>
              {c}
            </span>
          ))}
        </span>
      </div>
      {error ? (
        <p id={`${id}-error`} className="campo__error" role="alert">
          <Icono nombre="alerta" /> {error}
        </p>
      ) : null}
    </div>
  );
}
