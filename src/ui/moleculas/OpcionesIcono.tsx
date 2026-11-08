'use client';
// Elegir una de pocas opciones grandes, cada una con su mosaico, título, detalle y una pastilla opcional (lote 1.1,
// D6-Acceso: «Código por email» / «Código por SMS»). Son radios reales dentro de un fieldset: el lector dice «1 de 2,
// seleccionado» y las flechas cambian la opción. La elegida va con borde azul y tinte, y además lo dice su tilde.
import { useId, type ReactNode } from 'react';
import { Icono, type NombreIconoUi } from '../atomos/Icono.tsx';

export interface OpcionIcono<T extends string> {
  valor: T;
  icono: NombreIconoUi;
  titulo: string;
  detalle?: ReactNode;
  pastilla?: ReactNode;
  deshabilitada?: boolean;
}

export function OpcionesIcono<T extends string>({ opciones, valor, onCambio, etiqueta, etiquetaVisible = false }: { opciones: readonly OpcionIcono<T>[]; valor: T | null; onCambio(v: T): void; etiqueta: string; etiquetaVisible?: boolean }) {
  const nombre = useId();
  return (
    <fieldset className="ui-opciones-icono">
      <legend className={etiquetaVisible ? 'ui-campo__etiqueta' : 'visualmente-oculto'}>{etiqueta}</legend>
      {opciones.map((o) => {
        const elegida = o.valor === valor;
        return (
          <label key={o.valor} className={`ui-opcion-icono${elegida ? ' ui-opcion-icono--elegida' : ''}${o.deshabilitada ? ' ui-opcion-icono--apagada' : ''}`}>
            <input type="radio" name={nombre} value={o.valor} checked={elegida} disabled={o.deshabilitada} onChange={() => onCambio(o.valor)} />
            <span className="ui-opcion-icono__mosaico" aria-hidden="true">
              <Icono nombre={o.icono} />
            </span>
            <span className="ui-opcion-icono__texto">
              <strong>{o.titulo}</strong>
              {o.detalle ? <span>{o.detalle}</span> : null}
              {o.pastilla ? <span className="ui-opcion-icono__pastilla">{o.pastilla}</span> : null}
            </span>
            <span className="ui-opcion-icono__marca" aria-hidden="true">
              {elegida ? <Icono nombre="check" tam="chico" /> : null}
            </span>
          </label>
        );
      })}
    </fieldset>
  );
}
