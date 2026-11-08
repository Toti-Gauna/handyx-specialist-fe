'use client';
// Tira de días (elegir un día de la semana con botones grandes) y rueda de hora: una lista que se desliza y, para
// quien no puede deslizar, botones "Antes" y "Después" (todo gesto tiene botón).
import { useEffect, useRef } from 'react';
import { BotonIcono } from '../atomos/Boton.tsx';
import { indiceCercano, textoHora, tiraDias } from '../logica.ts';
import { sinMovimiento } from '../../kit/movimiento.ts';

export function TiraDias({ desde, cuantos = 7, hoy, valor, onCambio, ocupados = [], etiqueta = 'Elegí el día' }: { desde: string; cuantos?: number; hoy?: string; valor: string | null; onCambio(fecha: string): void; ocupados?: readonly string[]; etiqueta?: string }) {
  const dias = tiraDias(desde, cuantos, hoy ?? desde);
  return (
    <div className="ui-tira" role="group" aria-label={etiqueta}>
      {dias.map((d) => {
        const ocupado = ocupados.includes(d.fecha);
        return (
          <button
            key={d.fecha}
            type="button"
            className={`ui-tira__dia${d.fecha === valor ? ' ui-tira__dia--on' : ''}${d.esHoy ? ' ui-tira__dia--hoy' : ''}`}
            aria-pressed={d.fecha === valor}
            onClick={() => onCambio(d.fecha)}
          >
            <span>{d.corto} </span>
            <strong>{d.dia}</strong>
            {d.esHoy || ocupado ? <span className="visualmente-oculto">{`${d.esHoy ? ', hoy' : ''}${ocupado ? ', ya tenés un trabajo' : ''}`}</span> : null}
            {ocupado ? <span className="ui-tira__punto" aria-hidden="true" /> : null}
          </button>
        );
      })}
    </div>
  );
}

export function RuedaHora({ opciones, valor, onCambio, etiqueta = 'Hora' }: { opciones: readonly number[]; valor: number; onCambio(minutos: number): void; etiqueta?: string }) {
  const lista = useRef<HTMLDivElement>(null);
  const i = indiceCercano(opciones, valor);
  useEffect(() => {
    const el = lista.current?.querySelector<HTMLElement>('[aria-checked="true"]');
    el?.scrollIntoView({ block: 'center', inline: 'nearest', behavior: sinMovimiento() ? 'auto' : 'smooth' });
  }, [i]);
  const mover = (d: number) => {
    const n = Math.max(0, Math.min(opciones.length - 1, i + d));
    const v = opciones[n];
    if (v !== undefined) onCambio(v);
  };
  return (
    <div className="ui-rueda">
      <BotonIcono icono="arriba" etiqueta={`${etiqueta}: más temprano`} disabled={i <= 0} onClick={() => mover(-1)} />
      <div
        ref={lista}
        className="ui-rueda__lista"
        role="radiogroup"
        aria-label={etiqueta}
        onKeyDown={(e) => {
          if (e.key === 'ArrowUp') {
            e.preventDefault();
            mover(-1);
          } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            mover(1);
          }
        }}
      >
        {opciones.map((m, j) => (
          <button key={m} type="button" role="radio" aria-checked={j === i} tabIndex={j === i ? 0 : -1} className={`ui-rueda__op${j === i ? ' ui-rueda__op--on' : ''}`} onClick={() => onCambio(m)}>
            {textoHora(m)}
          </button>
        ))}
      </div>
      <BotonIcono icono="abajo" etiqueta={`${etiqueta}: más tarde`} disabled={i >= opciones.length - 1} onClick={() => mover(1)} />
    </div>
  );
}
