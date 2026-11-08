'use client';
// Marcar puntos sobre una foto (lote 2.4: medir con la tarjeta de referencia y la escala del escaneo 3D). Cada punto es
// un botón: se arrastra con el dedo **o** se elige y se mueve con las flechas de la pantalla o del teclado (WCAG 2.5.7:
// todo gesto tiene botón). Las líneas entre puntos llevan su medida escrita. La posición se fija desde código en
// variables CSS (sin estilos en línea). Coordenadas en píxeles de la foto original.
import { useLayoutEffect, useRef, type PointerEvent as EventoPuntero } from 'react';
import { moverPunto, type Punto2 } from '../../herramientas/medir.ts';
import { BotonIcono } from '../atomos/Boton.tsx';
import '../herramientas.css';

export interface PropsMarcarPuntos {
  imagen: string;
  /** Texto alternativo de la foto. */
  alt: string;
  ancho: number;
  alto: number;
  puntos: readonly Punto2[];
  onCambio(p: Punto2[]): void;
  elegido: number;
  onElegir(i: number): void;
  /** Nombre de cada punto para el lector («Punta izquierda de la tarjeta»). */
  nombres: readonly string[];
  /** Medida escrita en el medio de cada tramo («1,42 m»); vacío = sin línea. */
  tramos?: readonly string[];
  /** `tarjeta`: los dos puntos se dibujan en amarillo con la línea de la tarjeta. */
  tono?: 'medida' | 'tarjeta';
}

function PuntoMovil({ p, ancho, alto, i, nombre, elegido, onElegir, onArrastre, onTecla }: { p: Punto2; ancho: number; alto: number; i: number; nombre: string; elegido: boolean; onElegir(): void; onArrastre(e: EventoPuntero<HTMLButtonElement>): void; onTecla(dx: number, dy: number): void }) {
  const ref = useRef<HTMLButtonElement>(null);
  useLayoutEffect(() => {
    ref.current?.style.setProperty('--px', `${(p[0] / ancho) * 100}%`);
    ref.current?.style.setProperty('--py', `${(p[1] / alto) * 100}%`);
  }, [p, ancho, alto]);
  return (
    <button
      ref={ref}
      type="button"
      className={`ui-puntos__punto${elegido ? ' ui-puntos__punto--elegido' : ''}`}
      aria-label={`Punto ${i + 1}: ${nombre}`}
      aria-pressed={elegido}
      onClick={onElegir}
      onPointerDown={(e) => {
        onElegir();
        e.currentTarget.setPointerCapture(e.pointerId);
      }}
      onPointerMove={(e) => {
        if (e.currentTarget.hasPointerCapture(e.pointerId)) onArrastre(e);
      }}
      onKeyDown={(e) => {
        const paso = e.shiftKey ? 10 : 1;
        const d: Record<string, [number, number]> = { ArrowLeft: [-paso, 0], ArrowRight: [paso, 0], ArrowUp: [0, -paso], ArrowDown: [0, paso] };
        const m = d[e.key];
        if (!m) return;
        e.preventDefault();
        onTecla(m[0], m[1]);
      }}
    >
      <span aria-hidden="true">{i + 1}</span>
    </button>
  );
}

/** La medida escrita en el medio de un tramo (decorativa: la lista de medidas va en texto en la pantalla). */
function EtiquetaTramo({ a, b, ancho, alto, texto }: { a: Punto2; b: Punto2; ancho: number; alto: number; texto: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  useLayoutEffect(() => {
    ref.current?.style.setProperty('--px', `${((a[0] + b[0]) / 2 / ancho) * 100}%`);
    ref.current?.style.setProperty('--py', `${((a[1] + b[1]) / 2 / alto) * 100}%`);
  }, [a, b, ancho, alto]);
  return (
    <span ref={ref} className="ui-puntos__medida" aria-hidden="true">
      {texto}
    </span>
  );
}

export function MarcarPuntos({ imagen, alt, ancho, alto, puntos, onCambio, elegido, onElegir, nombres, tramos = [], tono = 'medida' }: PropsMarcarPuntos) {
  const caja = useRef<HTMLDivElement>(null);
  // Un toque de flecha mueve medio por ciento de la foto (fino para las puntas de la tarjeta).
  const paso = Math.max(1, ancho / 200);
  const mover = (i: number, dx: number, dy: number) => onCambio(puntos.map((p, j) => (j === i ? moverPunto(p, dx * paso, dy * paso, ancho, alto) : p)));
  const arrastrar = (i: number, e: EventoPuntero<HTMLButtonElement>) => {
    const r = caja.current?.getBoundingClientRect();
    if (!r || !r.width) return;
    const x = ((e.clientX - r.left) / r.width) * ancho;
    const y = ((e.clientY - r.top) / r.height) * alto;
    onCambio(puntos.map((p, j) => (j === i ? moverPunto([x, y], 0, 0, ancho, alto) : p)));
  };
  const actual = puntos[elegido];
  return (
    <div className={`ui-puntos ui-puntos--${tono}`}>
      <div ref={caja} className="ui-puntos__foto">
        <img src={imagen} alt={alt} width={ancho} height={alto} draggable={false} />
        <svg className="ui-puntos__lineas" viewBox={`0 0 ${ancho} ${alto}`} aria-hidden="true" preserveAspectRatio="none">
          {puntos.slice(1).map((p, i) => {
            const a = puntos[i];
            if (!a || tramos[i] === '') return null;
            return <line key={i} x1={a[0]} y1={a[1]} x2={p[0]} y2={p[1]} vectorEffect="non-scaling-stroke" />;
          })}
        </svg>
        {puntos.slice(1).map((p, i) => {
          const a = puntos[i];
          const t = tramos[i];
          return a && t ? <EtiquetaTramo key={`t${i}`} a={a} b={p} ancho={ancho} alto={alto} texto={t} /> : null;
        })}
        {puntos.map((p, i) => (
          <PuntoMovil key={i} p={p} ancho={ancho} alto={alto} i={i} nombre={nombres[i] ?? `punto ${i + 1}`} elegido={i === elegido} onElegir={() => onElegir(i)} onArrastre={(e) => arrastrar(i, e)} onTecla={(dx, dy) => mover(i, dx, dy)} />
        ))}
      </div>
      {actual ? (
        <div className="ui-puntos__mover" role="group" aria-label={`Mover el punto ${elegido + 1}: ${nombres[elegido] ?? ''}`}>
          <BotonIcono icono="izquierda" etiqueta={`Mover el punto ${elegido + 1} a la izquierda`} onClick={() => mover(elegido, -1, 0)} />
          <BotonIcono icono="arriba" etiqueta={`Mover el punto ${elegido + 1} hacia arriba`} onClick={() => mover(elegido, 0, -1)} />
          <BotonIcono icono="abajo" etiqueta={`Mover el punto ${elegido + 1} hacia abajo`} onClick={() => mover(elegido, 0, 1)} />
          <BotonIcono icono="derecha" etiqueta={`Mover el punto ${elegido + 1} a la derecha`} onClick={() => mover(elegido, 1, 0)} />
        </div>
      ) : null}
    </div>
  );
}
