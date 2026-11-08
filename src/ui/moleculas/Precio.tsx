'use client';
// Teclado de precio (números grandes, como el de un cajero: 1-9, 000, 0 y borrar) con el monto arriba, y el resumen
// de opciones (elegir una entre pocas tarjetas que dicen todo en una línea). Se cotiza en pesos enteros; los datos
// guardan centavos (× 100 al salir).
import { useId } from 'react';
import { Icono } from '../atomos/Icono.tsx';
import { Cifra } from '../atomos/Texto.tsx';
import { aplicarTecla, TECLAS_PRECIO } from '../logica.ts';

export function TecladoPrecio({ centavos, onCambio, etiqueta = 'Tu precio' }: { centavos: number; onCambio(c: number): void; etiqueta?: string }) {
  const pesos = Math.trunc(centavos / 100);
  return (
    <div className="ui-teclado" role="group" aria-label={etiqueta}>
      <output className="ui-teclado__monto" aria-live="polite">
        <span className="ui-teclado__rotulo">{etiqueta}</span>
        <Cifra centavos={centavos} tam="grande" />
      </output>
      <div className="ui-teclado__teclas">
        {TECLAS_PRECIO.map((t) => (
          <button key={t} type="button" className={`ui-teclado__tecla${t === 'borrar' ? ' ui-teclado__tecla--borrar' : ''}`} aria-label={t === 'borrar' ? 'Borrar el último número' : t === '000' ? 'Tres ceros' : t} onClick={() => onCambio(aplicarTecla(pesos, t) * 100)}>
            {t === 'borrar' ? <Icono nombre="borrar" tam="grande" /> : t}
          </button>
        ))}
      </div>
    </div>
  );
}

export function ResumenOpciones<T extends string>({ opciones, valor, onCambio, etiqueta }: { opciones: readonly { valor: T; titulo: string; resumen: string; cifra?: string }[]; valor: T | null; onCambio(v: T): void; etiqueta: string }) {
  const nombre = useId();
  return (
    <fieldset className="ui-opciones">
      <legend className="ui-opciones__leyenda">{etiqueta}</legend>
      {opciones.map((o) => (
        <label key={o.valor} className={`ui-opciones__op${o.valor === valor ? ' ui-opciones__op--on' : ''}`}>
          <input type="radio" name={nombre} value={o.valor} checked={o.valor === valor} onChange={() => onCambio(o.valor)} />
          <span className="ui-opciones__marca" aria-hidden="true">
            <Icono nombre="check" tam="chico" />
          </span>
          <span className="ui-opciones__texto">
            <strong>{o.titulo}</strong>
            <span>{o.resumen}</span>
          </span>
          {o.cifra ? <Cifra texto={o.cifra} tam="chico" /> : null}
        </label>
      ))}
    </fieldset>
  );
}
