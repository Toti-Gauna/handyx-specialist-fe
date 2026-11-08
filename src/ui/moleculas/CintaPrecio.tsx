'use client';
// Cinta de precio (F-Precio): una cinta métrica amarilla que se desliza bajo una aguja azul; cada marca vale $ 500 y el
// cartel «sugerido» muestra dónde está lo que sugiere Handyx (vos decidís). Es un `slider` de verdad: flechas (± $ 500),
// Re Pág / Av Pág (± $ 5.000) e Inicio (vuelve al sugerido). Deslizar tiene siempre alternativa con botones: los atajos
// y el teclado de la pantalla. Lo calculado (corrimiento de cada marca) se fija desde código en variables CSS.
import { useRef } from 'react';
import { textoCifra } from '../logica.ts';
import { arrastreCinta, marcasCinta, moverCinta, posicionSugerido } from '../logicaNucleo.ts';
import '../nucleo.css';

const fijarX = (x: number) => (el: HTMLElement | null) => {
  el?.style.setProperty('--x', `${x}px`);
};

export function CintaPrecio({ centavos, onCambio, sugerido, etiqueta = 'Tu precio' }: { centavos: number; onCambio(c: number): void; sugerido: number | null; etiqueta?: string }) {
  const inicio = useRef<{ x: number; valor: number } | null>(null);
  const marcas = marcasCinta(centavos);
  const xSugerido = posicionSugerido(centavos, sugerido);
  return (
    <div className="ui-cinta">
      {xSugerido !== null && sugerido !== null ? (
        <span className="ui-cinta__sugerido" ref={fijarX(xSugerido)} aria-hidden="true">
          sugerido · {Math.round(sugerido / 100_000)}
        </span>
      ) : null}
      <span className="ui-cinta__aguja" aria-hidden="true" />
      <div
        className="ui-cinta__regla"
        role="slider"
        tabIndex={0}
        aria-label={etiqueta}
        aria-valuemin={0}
        aria-valuenow={Math.round(centavos / 100)}
        aria-valuetext={textoCifra(centavos)}
        onKeyDown={(e) => {
          const pasos: Record<string, number> = { ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1, PageUp: 10, PageDown: -10 };
          if (e.key in pasos) {
            e.preventDefault();
            onCambio(moverCinta(centavos, pasos[e.key] ?? 0));
          } else if (e.key === 'Home' && sugerido !== null) {
            e.preventDefault();
            onCambio(sugerido);
          }
        }}
        onPointerDown={(e) => {
          inicio.current = { x: e.clientX, valor: centavos };
          e.currentTarget.setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => {
          if (!inicio.current) return;
          const v = arrastreCinta(inicio.current.valor, e.clientX - inicio.current.x);
          if (v !== centavos) onCambio(v);
        }}
        onPointerUp={() => {
          inicio.current = null;
        }}
        onPointerCancel={() => {
          inicio.current = null;
        }}
      >
        {marcas.map((m) => (
          <span key={m.centavos} ref={fijarX(m.x)} className={`ui-cinta__marca${m.larga ? ' ui-cinta__marca--larga' : ''}`} aria-hidden="true">
            {m.rotulo ? <span className="ui-cinta__numero">{m.rotulo}</span> : null}
          </span>
        ))}
      </div>
    </div>
  );
}
