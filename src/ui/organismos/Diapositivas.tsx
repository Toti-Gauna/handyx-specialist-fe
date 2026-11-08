'use client';
// Láminas de «Cómo funciona» (OB-Tour, lote 1.2): una idea por lámina, con su ilustración arriba, el avance dicho en
// texto («2 de 3») y botones Anterior / Siguiente (no hace falta deslizar). «Saltar» siempre a mano y sin tiempo límite:
// las láminas no pasan solas.
import { useEffect, useRef, type ReactNode } from 'react';
import { Boton } from '../atomos/Boton.tsx';
import '../registro.css';

export interface Lamina {
  ilustracion: ReactNode;
  titulo: ReactNode;
  texto: ReactNode;
}

export function Diapositivas({ laminas, indice, onCambio, onTerminar, saltar, textoFinal = 'Seguir' }: { laminas: readonly Lamina[]; indice: number; onCambio(i: number): void; onTerminar(): void; saltar?: ReactNode; textoFinal?: string }) {
  const titulo = useRef<HTMLHeadingElement>(null);
  const primera = useRef(true);
  // Al cambiar de lámina, el foco va al título nuevo (el lector lo lee); al entrar, no se mueve.
  useEffect(() => {
    if (primera.current) {
      primera.current = false;
      return;
    }
    titulo.current?.focus();
  }, [indice]);
  const l = laminas[indice];
  if (!l) return null;
  const ultima = indice === laminas.length - 1;
  return (
    <div className="ui-laminas">
      <div className="ui-laminas__escena">
        {saltar ? <span className="ui-laminas__saltar">{saltar}</span> : null}
        {l.ilustracion}
      </div>
      <div className="ui-laminas__cuerpo">
        <p className="ui-laminas__avance">
          <span className="ui-laminas__puntos" aria-hidden="true">
            {laminas.map((_, i) => (
              <span key={i} className={`ui-laminas__punto${i === indice ? ' ui-laminas__punto--on' : ''}`} />
            ))}
          </span>
          <span>
            {indice + 1} de {laminas.length}
          </span>
        </p>
        <h1 ref={titulo} tabIndex={-1} className="ui-titulo ui-titulo--grande">
          {l.titulo}
        </h1>
        <p className="ui-laminas__texto">{l.texto}</p>
      </div>
      <div className="ui-accion-fija">
        <div className="ui-laminas__botones">
          <Boton onClick={() => (ultima ? onTerminar() : onCambio(indice + 1))}>{ultima ? textoFinal : 'Siguiente'}</Boton>
          {indice > 0 ? (
            <Boton variante="texto" onClick={() => onCambio(indice - 1)}>
              Anterior
            </Boton>
          ) : null}
        </div>
      </div>
    </div>
  );
}
