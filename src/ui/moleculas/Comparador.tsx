'use client';
// Antes y después (H0-AntesDespues y H0-AntesLado, lote 2.3).
// - `Comparador`: las dos fotos encimadas con la manija en el medio. Se desliza con el dedo o el mouse sobre la foto, con
//   el teclado (es un control deslizante real) y con dos botones («Ver el antes» / «Ver el después»): ningún gesto es
//   la única forma. La posición se fija desde código en la variable CSS --ui-corte (sin estilos en línea).
// - `FotosLado`: las dos fotos lado a lado, cada una con su rótulo y su hora.
import { useEffect, useId, useRef, useState } from 'react';
import { Icono } from '../atomos/Icono.tsx';
import { Chip } from '../atomos/Texto.tsx';
import { textoComparador } from '../logicaModo.ts';
import '../trabajo.css';

export interface FotoComparada {
  url: string;
  /** "Antes · 18:12". */
  rotulo: string;
  /** Texto alternativo: qué se ve (lo escribe la pantalla con la hora, sin datos del cliente). */
  alt: string;
}

export function Comparador({ antes, despues }: { antes: FotoComparada; despues: FotoComparada }) {
  const [pos, setPos] = useState(50);
  const ref = useRef<HTMLDivElement>(null);
  const id = useId();
  useEffect(() => {
    ref.current?.style.setProperty('--ui-corte', `${pos}%`);
  }, [pos]);
  return (
    <div className="ui-comparador">
      <div ref={ref} className="ui-comparador__marco">
        <img className="ui-comparador__foto" src={antes.url} alt={antes.alt} />
        <div className="ui-comparador__despues">
          <img className="ui-comparador__foto" src={despues.url} alt={despues.alt} />
        </div>
        <span className="ui-comparador__rotulo ui-comparador__rotulo--antes">
          <Chip tono="noche" icono="camara">
            {antes.rotulo}
          </Chip>
        </span>
        <span className="ui-comparador__rotulo ui-comparador__rotulo--despues">
          <Chip tono="blanco" icono="camara">
            {despues.rotulo}
          </Chip>
        </span>
        <span className="ui-comparador__linea" aria-hidden="true" />
        <span className="ui-comparador__manija" aria-hidden="true">
          <Icono nombre="atras" tam="chico" />
          <Icono nombre="flecha" tam="chico" />
        </span>
        <input
          id={id}
          className="ui-comparador__control"
          type="range"
          min={0}
          max={100}
          step={5}
          value={pos}
          aria-label="Comparar el antes y el después"
          aria-valuetext={textoComparador(pos)}
          onChange={(e) => setPos(Number(e.target.value))}
        />
      </div>
      <div className="ui-comparador__botones">
        <button type="button" className="ui-comparador__boton" aria-controls={id} aria-pressed={pos === 100} onClick={() => setPos(100)}>
          Ver el antes
        </button>
        <button type="button" className="ui-comparador__boton" aria-controls={id} aria-pressed={pos === 50} onClick={() => setPos(50)}>
          Mitad y mitad
        </button>
        <button type="button" className="ui-comparador__boton" aria-controls={id} aria-pressed={pos === 0} onClick={() => setPos(0)}>
          Ver el después
        </button>
      </div>
    </div>
  );
}

export function FotosLado({ antes, despues }: { antes: FotoComparada & { pie: string }; despues: FotoComparada & { pie: string } }) {
  return (
    <div className="ui-fotos-lado">
      {[
        { f: antes, tono: 'noche' as const },
        { f: despues, tono: 'blanco' as const },
      ].map(({ f, tono }) => (
        <figure key={f.rotulo} className="ui-fotos-lado__item">
          <span className="ui-fotos-lado__marco">
            <img src={f.url} alt={f.alt} />
            <span className="ui-fotos-lado__rotulo">
              <Chip tono={tono} icono="camara">
                {f.rotulo}
              </Chip>
            </span>
          </span>
          <figcaption>{f.pie}</figcaption>
        </figure>
      ))}
    </div>
  );
}
