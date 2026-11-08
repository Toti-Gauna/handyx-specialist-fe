'use client';
// Moléculas de control: segmento (elegir una de pocas opciones, como radio), stepper (− cantidad +, con botones de
// 56 px) y buscador (campo con lupa y botón de borrar).
import { useId } from 'react';
import { BotonIcono } from '../atomos/Boton.tsx';
import { Icono } from '../atomos/Icono.tsx';
import { pasoStepper } from '../logica.ts';

export function Segmento<T extends string>({ opciones, valor, onCambio, etiqueta }: { opciones: readonly { valor: T; texto: string }[]; valor: T; onCambio(v: T): void; etiqueta: string }) {
  const nombre = useId();
  return (
    <fieldset className="ui-segmento">
      <legend className="visualmente-oculto">{etiqueta}</legend>
      {opciones.map((o) => (
        <label key={o.valor} className={`ui-segmento__op${o.valor === valor ? ' ui-segmento__op--on' : ''}`}>
          <input type="radio" name={nombre} value={o.valor} checked={o.valor === valor} onChange={() => onCambio(o.valor)} />
          <span>{o.texto}</span>
        </label>
      ))}
    </fieldset>
  );
}

export function Stepper({ valor, onCambio, min = 0, max = 99, etiqueta, unidad, paso = 1 }: { valor: number; onCambio(v: number): void; min?: number; max?: number; etiqueta: string; unidad?: string; paso?: number }) {
  return (
    <div className="ui-stepper" role="group" aria-label={etiqueta}>
      <BotonIcono icono="menos" etiqueta={`Restar ${paso}: ${etiqueta}`} tono="azul" disabled={valor <= min} onClick={() => onCambio(pasoStepper(valor, -paso, min, max))} />
      <output className="ui-stepper__valor" aria-live="polite">
        <strong>{valor}</strong>
        {unidad ? <span>{unidad}</span> : null}
      </output>
      <BotonIcono icono="mas" etiqueta={`Sumar ${paso}: ${etiqueta}`} tono="azul" disabled={valor >= max} onClick={() => onCambio(pasoStepper(valor, paso, min, max))} />
    </div>
  );
}

export function Buscador({ valor, onCambio, etiqueta, ejemplo, onEnviar }: { valor: string; onCambio(v: string): void; etiqueta: string; ejemplo?: string; onEnviar?: () => void }) {
  const id = useId();
  return (
    <form
      role="search"
      className="ui-buscador"
      onSubmit={(e) => {
        e.preventDefault();
        onEnviar?.();
      }}
    >
      <label htmlFor={id} className="visualmente-oculto">
        {etiqueta}
      </label>
      <Icono nombre="lupa" />
      <input id={id} className="ui-buscador__input" type="search" enterKeyHint="search" autoComplete="off" value={valor} placeholder={ejemplo} onChange={(e) => onCambio(e.target.value)} />
      {valor ? (
        <button type="button" className="ui-buscador__borrar" aria-label="Borrar lo escrito" onClick={() => onCambio('')}>
          <Icono nombre="cerrar" />
        </button>
      ) : null}
    </form>
  );
}
