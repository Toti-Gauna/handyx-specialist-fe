'use client';
// Isla de avisos y confeti (lote 4.1). La isla anuncia por lector de pantalla y se puede cerrar; si se apoya el dedo o
// el foco encima, no se va. Todo lo que dice la isla también queda en Avisos: nada importante vive solo acá.
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Icono, type NombreIcono } from '../components/Icono.tsx';
import { sinMovimiento } from './movimiento.ts';

export interface AvisoIsla {
  titulo: string;
  texto?: string;
  icono?: NombreIcono;
  tono?: 'azul' | 'exito' | 'amarillo';
}

const CtxIsla = createContext<((a: AvisoIsla) => void) | null>(null);
const DURACION_ISLA = 4500;

export function ProveedorIsla({ children }: { children: ReactNode }) {
  const [aviso, setAviso] = useState<(AvisoIsla & { n: number }) | null>(null);
  const [quieta, setQuieta] = useState(false);
  const cuenta = useRef(0);
  const mostrar = useCallback((a: AvisoIsla) => setAviso({ ...a, n: ++cuenta.current }), []);

  useEffect(() => {
    if (!aviso || quieta) return;
    const t = window.setTimeout(() => setAviso(null), DURACION_ISLA);
    return () => window.clearTimeout(t);
  }, [aviso, quieta]);

  return (
    <CtxIsla.Provider value={mostrar}>
      {children}
      <div className="hx-isla-zona" role="status" aria-live="polite">
        {aviso ? (
          <div
            key={aviso.n}
            className={`hx-isla hx-isla--${aviso.tono ?? 'azul'}`}
            onPointerEnter={() => setQuieta(true)}
            onPointerLeave={() => setQuieta(false)}
            onFocus={() => setQuieta(true)}
            onBlur={() => setQuieta(false)}
          >
            <span className="hx-isla__ico" aria-hidden="true">
              <Icono nombre={aviso.icono ?? 'campana'} />
            </span>
            <span className="hx-isla__texto">
              <strong>{aviso.titulo}</strong>
              {aviso.texto ? <small>{aviso.texto}</small> : null}
            </span>
            <button type="button" className="hx-circulo" aria-label="Cerrar el aviso" onClick={() => setAviso(null)}>
              <Icono nombre="cerrar" />
            </button>
          </div>
        ) : null}
      </div>
    </CtxIsla.Provider>
  );
}

/** Muestra un aviso en la isla. Fuera del proveedor no hace nada (por ejemplo, en pruebas de una pieza suelta). */
export function useIsla(): (a: AvisoIsla) => void {
  return useContext(CtxIsla) ?? (() => undefined);
}

const COLORES_CONFETI = ['#1F57A8', '#F5F59A', '#2F6BFF', '#ECECEC', '#4A72B0', '#FFFFFF', '#F5F59A'];

/**
 * Confeti de mosaicos de los colores de la marca. Solo para celebrar (te eligieron, terminaste, cobro registrado):
 * nunca en decisiones pendientes ni en vencimientos. Con "reducir movimiento" no hace nada.
 */
export function useConfeti(): { lanzar(): void; capa: ReactNode } {
  const [activo, setActivo] = useState(0);
  const capa = useMemo(() => (activo && typeof document !== 'undefined' ? createPortal(<CapaConfeti key={activo} />, document.body) : null), [activo]);
  return { lanzar: () => (sinMovimiento() ? undefined : setActivo((n) => n + 1)), capa };
}

function CapaConfeti() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const zona = ref.current;
    if (!zona) return;
    const w = zona.clientWidth;
    const h = zona.clientHeight;
    const piezas: Animation[] = [];
    for (let i = 0; i < 46; i++) {
      const p = document.createElement('i');
      const color = COLORES_CONFETI[i % COLORES_CONFETI.length] ?? '#1F57A8';
      const lado = 7 + Math.random() * 8;
      p.style.width = `${lado}px`;
      p.style.height = `${lado * (0.7 + Math.random() * 0.6)}px`;
      p.style.background = color;
      if (color === '#FFFFFF' || color === '#ECECEC') p.style.boxShadow = '0 0 0 1px rgb(14 29 54 / 0.12)';
      zona.append(p);
      const x0 = w * (0.3 + Math.random() * 0.4);
      const y0 = h * 0.36;
      const dx = (Math.random() - 0.5) * w * 0.95;
      const alto = 90 + Math.random() * 150;
      const giro = (Math.random() - 0.5) * 900;
      piezas.push(
        p.animate(
          [
            { transform: `translate(${x0}px, ${y0}px) rotate(0deg) scale(0.4)` },
            { transform: `translate(${x0 + dx * 0.55}px, ${y0 - alto}px) rotate(${giro * 0.4}deg) scale(1)`, offset: 0.28 },
            { transform: `translate(${x0 + dx}px, ${h + 30}px) rotate(${giro}deg) scale(1)`, opacity: 0.9 },
          ],
          { duration: 1700 + Math.random() * 1300, delay: Math.random() * 180, easing: 'cubic-bezier(0.2, 0.6, 0.45, 1)', fill: 'both' },
        ),
      );
    }
    return () => {
      piezas.forEach((a) => a.cancel());
      zona.replaceChildren();
    };
  }, []);
  return <div ref={ref} className="hx-confeti" aria-hidden="true" />;
}
