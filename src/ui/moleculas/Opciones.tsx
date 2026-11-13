'use client';
// Elegir de una lista (lote 1.2): mosaico grande que se marca (rubros) y pastillas que se marcan (barrios, cómo
// facturás). Son casillas o radios reales dentro de un `fieldset` con su leyenda: el lector dice «marcado» y el
// estado también se ve con el tilde y el texto, no solo con el color. Toda la pieza es tocable (≥ 48 px).
import type { ReactNode } from 'react';
import { Icono, type NombreIconoUi } from '../atomos/Icono.tsx';
import '../registro.css';

/** Mosaico grande con casilla real adentro (rubros de RG-3). `insignia`: lo que pide ese rubro («Pide matrícula»). */
export function OpcionMosaico({ icono, titulo, marcado, onCambio, insignia, deshabilitado = false }: { icono: NombreIconoUi; titulo: string; marcado: boolean; onCambio(v: boolean): void; insignia?: string; deshabilitado?: boolean }) {
  return (
    <label className={`ui-op-mosaico${marcado ? ' ui-op-mosaico--on' : ''}`}>
      <input type="checkbox" checked={marcado} disabled={deshabilitado} onChange={(e) => onCambio(e.target.checked)} />
      <span className="ui-op-mosaico__tilde" aria-hidden="true">
        {marcado ? <Icono nombre="check" tam="chico" /> : null}
      </span>
      <Icono nombre={icono} tam="grande" />
      <strong className="ui-op-mosaico__titulo">{titulo}</strong>
      {insignia ? <span className="ui-op-mosaico__insignia">{insignia}</span> : null}
    </label>
  );
}

/** Grilla de mosaicos con su leyenda (visible para el lector). */
export function GrillaOpciones({ leyenda, children }: { leyenda: string; children: ReactNode }) {
  return (
    <fieldset className="ui-grilla-op">
      <legend className="visualmente-oculto">{leyenda}</legend>
      {children}
    </fieldset>
  );
}

/**
 * Pastillas que se marcan. `multiple`: casillas (barrios); si no, radios (una sola opción). La leyenda se ve arriba.
 */
export function PastillasOpcion<T extends string>({ leyenda, opciones, valores, onCambio, multiple = false, leyendaVisible = true }: { leyenda: string; opciones: readonly { valor: T; texto: string }[]; valores: readonly T[]; onCambio(v: T[]): void; multiple?: boolean; leyendaVisible?: boolean }) {
  const nombre = `op-${leyenda.replace(/\W+/g, '-')}`;
  return (
    <fieldset className="ui-pastillas">
      <legend className={leyendaVisible ? 'ui-pastillas__leyenda' : 'visualmente-oculto'}>{leyenda}</legend>
      <div className="ui-pastillas__lista">
        {opciones.map((o) => {
          const on = valores.includes(o.valor);
          return (
            <label key={o.valor} className={`ui-pastilla${on ? ' ui-pastilla--on' : ''}`}>
              <input
                type={multiple ? 'checkbox' : 'radio'}
                name={nombre}
                value={o.valor}
                checked={on}
                onChange={(e) => {
                  if (!multiple) return onCambio([o.valor]);
                  onCambio(e.target.checked ? [...valores, o.valor] : valores.filter((v) => v !== o.valor));
                }}
              />
              {on ? <Icono nombre="check" tam="chico" /> : null}
              <span>{o.texto}</span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
