'use client';
// Marco común de las ilustraciones: SVG decorativo (aria-hidden) y la animación "construir el arreglo": cada <Pieza>
// cae a su lugar en orden con GSAP. Con "reducir movimiento" (o sin JS) el objeto se ve armado desde el principio.
import { gsap } from 'gsap';
import { useEffect, useRef, type ReactNode } from 'react';
import { sinMovimiento } from '../../kit/movimiento.ts';

export interface PropsIlustracion {
  /** Arma el objeto pieza por pieza al aparecer (y otra vez cuando cambia `vuelta`). */
  armar?: boolean;
  /** Cambialo para volver a armar (por ejemplo, al llegar otro pedido). */
  vuelta?: number;
  tam?: 'chico' | 'medio' | 'grande' | 'lleno';
  className?: string;
}

export function Lienzo({ viewBox, armar = false, vuelta = 0, tam = 'medio', className = '', children }: PropsIlustracion & { viewBox: string; children: ReactNode }) {
  const ref = useRef<SVGSVGElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!armar || !el || sinMovimiento()) return;
    const piezas = el.querySelectorAll<SVGGElement>('.ui-ilu__pieza');
    if (piezas.length === 0) return;
    const anim = gsap.from(piezas, { y: -36, opacity: 0, duration: 0.5, ease: 'back.out(1.6)', stagger: 0.16, clearProps: 'transform,opacity' });
    return () => {
      anim.revert();
    };
  }, [armar, vuelta]);
  return (
    <svg ref={ref} className={`ui-ilu ui-ilu--${tam}${className ? ` ${className}` : ''}`} viewBox={viewBox} aria-hidden="true" focusable="false">
      {children}
    </svg>
  );
}

/** Una parte del objeto que se arma (el orden en el código es el orden en que cae). */
export function Pieza({ children }: { children: ReactNode }) {
  return <g className="ui-ilu__pieza">{children}</g>;
}
