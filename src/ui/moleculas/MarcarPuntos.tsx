'use client';
// Marcar puntos sobre una foto (lote 2.4: medir con la tarjeta de referencia y la escala del escaneo 3D). Sobre la foto,
// cada punto se arrastra con el dedo; eso es un atajo: todo se puede hacer con botones (WCAG 2.5.7). Debajo se elige el
// punto (radios reales, con su nombre) y se mueve con los botones de flecha (también con el teclado). Los puntos de la foto
// quedan fuera del orden de tabulación y del lector (pueden estar muy juntos: la tarjeta mide pocos milímetros).
// La posición se fija desde código en variables CSS (sin estilos en línea). Coordenadas en píxeles de la foto original.
import { useId, useLayoutEffect, useRef, type PointerEvent as EventoPuntero } from 'react';
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
  /** Nombre de cada punto («punta izquierda de la tarjeta»). */
  nombres: readonly string[];
  /** Medida escrita en el medio de cada tramo («1,42 m»); vacío = sin línea. */
  tramos?: readonly string[];
  /** `tarjeta`: los puntos se dibujan en amarillo, como la tarjeta. */
  tono?: 'medida' | 'tarjeta';
}

function usarPosicion<T extends HTMLElement>(x: number, y: number, ancho: number, alto: number) {
  const ref = useRef<T>(null);
  useLayoutEffect(() => {
    ref.current?.style.setProperty('--px', `${(x / ancho) * 100}%`);
    ref.current?.style.setProperty('--py', `${(y / alto) * 100}%`);
  }, [x, y, ancho, alto]);
  return ref;
}

/** El punto sobre la foto: se arrastra (atajo con el dedo). Decorativo para el lector: los botones de abajo hacen lo mismo. */
function PuntoFoto({ p, ancho, alto, i, elegido, onTomar, onArrastre }: { p: Punto2; ancho: number; alto: number; i: number; elegido: boolean; onTomar(): void; onArrastre(e: EventoPuntero<HTMLSpanElement>): void }) {
  const ref = usarPosicion<HTMLSpanElement>(p[0], p[1], ancho, alto);
  return (
    <span
      ref={ref}
      aria-hidden="true"
      className={`ui-puntos__punto${elegido ? ' ui-puntos__punto--elegido' : ''}`}
      onPointerDown={(e) => {
        onTomar();
        e.currentTarget.setPointerCapture(e.pointerId);
      }}
      onPointerMove={(e) => {
        if (e.currentTarget.hasPointerCapture(e.pointerId)) onArrastre(e);
      }}
    >
      <span>{i + 1}</span>
    </span>
  );
}

/** La medida escrita en el medio de un tramo (decorativa: la lista de medidas va en texto en la pantalla). */
function EtiquetaTramo({ a, b, ancho, alto, texto }: { a: Punto2; b: Punto2; ancho: number; alto: number; texto: string }) {
  const ref = usarPosicion<HTMLSpanElement>((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, ancho, alto);
  return (
    <span ref={ref} className="ui-puntos__medida" aria-hidden="true">
      {texto}
    </span>
  );
}

export function MarcarPuntos({ imagen, alt, ancho, alto, puntos, onCambio, elegido, onElegir, nombres, tramos = [], tono = 'medida' }: PropsMarcarPuntos) {
  const caja = useRef<HTMLDivElement>(null);
  const grupo = useId();
  // Un toque de flecha mueve medio por ciento de la foto (fino para las puntas de la tarjeta); con Mayús, diez veces más.
  const paso = Math.max(1, ancho / 200);
  const mover = (i: number, dx: number, dy: number) => onCambio(puntos.map((p, j) => (j === i ? moverPunto(p, dx * paso, dy * paso, ancho, alto) : p)));
  const arrastrar = (i: number, e: EventoPuntero<HTMLSpanElement>) => {
    const r = caja.current?.getBoundingClientRect();
    if (!r || !r.width) return;
    const x = ((e.clientX - r.left) / r.width) * ancho;
    const y = ((e.clientY - r.top) / r.height) * alto;
    onCambio(puntos.map((p, j) => (j === i ? moverPunto([x, y], 0, 0, ancho, alto) : p)));
  };
  const actual = puntos[elegido];
  const nombre = (i: number) => `Punto ${i + 1}: ${nombres[i] ?? ''}`;
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
          <PuntoFoto key={i} p={p} ancho={ancho} alto={alto} i={i} elegido={i === elegido} onTomar={() => onElegir(i)} onArrastre={(e) => arrastrar(i, e)} />
        ))}
      </div>
      {puntos.length ? (
        <fieldset className="ui-puntos__elegir">
          <legend>Elegí un punto para moverlo</legend>
          {puntos.map((_, i) => (
            <label key={i} className={`ui-puntos__op${i === elegido ? ' ui-puntos__op--on' : ''}`}>
              <input type="radio" name={grupo} checked={i === elegido} onChange={() => onElegir(i)} aria-label={nombre(i)} />
              <span aria-hidden="true">{i + 1}</span>
            </label>
          ))}
        </fieldset>
      ) : null}
      {actual ? (
        <div className="ui-puntos__mover" role="group" aria-label={`Mover el ${nombre(elegido).toLowerCase()}`}>
          <BotonIcono icono="izquierda" etiqueta={`Mover el punto ${elegido + 1} a la izquierda`} onClick={() => mover(elegido, -1, 0)} />
          <BotonIcono icono="arriba" etiqueta={`Mover el punto ${elegido + 1} hacia arriba`} onClick={() => mover(elegido, 0, -1)} />
          <BotonIcono icono="abajo" etiqueta={`Mover el punto ${elegido + 1} hacia abajo`} onClick={() => mover(elegido, 0, 1)} />
          <BotonIcono icono="derecha" etiqueta={`Mover el punto ${elegido + 1} a la derecha`} onClick={() => mover(elegido, 1, 0)} />
        </div>
      ) : null}
    </div>
  );
}
