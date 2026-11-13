'use client';
// Nivel del kit v3 (lote 2.4, T-Nivel): un círculo oscuro con la burbuja amarilla y el centro marcado. La burbuja se
// mueve con lo que mide el giroscopio (x e y de −1 a 1; ±10° llegan al borde). La posición se fija desde código en
// variables CSS (sin estilos en línea) y se desliza solo sin «reducir movimiento». Decorativo: la lectura y el estado
// van escritos al lado, con palabras.
import { useLayoutEffect, useRef } from 'react';
import '../herramientas.css';

export function BurbujaNivel({ x, y, estado }: { x: number; y: number; estado: 'a_nivel' | 'casi' | 'fuera' | 'sin_medir' }) {
  const ref = useRef<HTMLSpanElement>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const lim = (v: number) => Math.max(-1, Math.min(1, Number.isFinite(v) ? v : 0));
    el.style.setProperty('--nivel-x', String(lim(x)));
    el.style.setProperty('--nivel-y', String(lim(y)));
  }, [x, y]);
  return (
    <div className={`ui-nivel ui-nivel--${estado}`} aria-hidden="true">
      <span className="ui-nivel__cruz ui-nivel__cruz--v" />
      <span className="ui-nivel__cruz ui-nivel__cruz--h" />
      <span className="ui-nivel__centro" />
      <span ref={ref} className="ui-nivel__burbuja" />
    </div>
  );
}
