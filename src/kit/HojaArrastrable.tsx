'use client';
// Hoja arrastrable sobre el mapa o el contenido (lote 4.1), como la de "Pedidos para vos" en las apps de reparto.
// No es modal: lo de atrás sigue usable. Tres alturas fijas (un tercio, dos tercios, casi completa).
// Se mueve arrastrando la manija, tocándola (pasa a la siguiente altura) o con el teclado (flechas, Enter).
// Las otras confirmaciones (aceptar, rechazar, terminar) siguen usando la Hoja modal de components/Hoja.tsx.
import { useEffect, useId, useRef, useState, type KeyboardEvent, type PointerEvent, type ReactNode } from 'react';
import { ALTURAS_HOJA, alturaAlSoltar, siguienteAltura, type AlturaHoja } from './logica.ts';

const TEXTO_ALTURA = ['chica', 'mediana', 'grande'] as const;

interface Arrastre {
  y0: number;
  fraccion0: number;
  ultimaY: number;
  ultimoT: number;
  velocidad: number;
  movido: boolean;
}

interface PropsHoja {
  titulo: string;
  inicial?: AlturaHoja;
  /** Cuando cambia, la hoja va a esa altura (por ejemplo, baja al empezar a compartir la ubicación). Se puede seguir moviendo. */
  pedida?: AlturaHoja;
  /** Avisa la altura actual (el mapa de atrás deja ese lugar libre al encuadrar). */
  alCambiar?: (a: AlturaHoja) => void;
  children: ReactNode;
}

export function HojaArrastrable({ titulo, inicial = 0, pedida, alCambiar, children }: PropsHoja) {
  const [altura, setAltura] = useState<AlturaHoja>(pedida ?? inicial);
  const [pedidaPrevia, setPedidaPrevia] = useState(pedida);
  if (pedida !== pedidaPrevia) {
    setPedidaPrevia(pedida);
    if (pedida !== undefined) setAltura(pedida);
  }
  const aviso = useRef(alCambiar);
  aviso.current = alCambiar;
  useEffect(() => aviso.current?.(altura), [altura]);
  const [suelta, setSuelta] = useState(true);
  const hoja = useRef<HTMLElement>(null);
  const arrastre = useRef<Arrastre | null>(null);
  const ayuda = useId();

  // Alto de referencia: la pantalla, o el marco que la contiene en el catálogo.
  const altoRef = () => hoja.current?.closest<HTMLElement>('[data-hx-marco]')?.clientHeight || window.innerHeight || 1;
  const fijarFraccion = (f: number | null) => {
    if (f === null) hoja.current?.style.removeProperty('--hx-hoja-altura');
    else hoja.current?.style.setProperty('--hx-hoja-altura', String(f));
  };

  function alBajar(e: PointerEvent<HTMLButtonElement>) {
    e.currentTarget.setPointerCapture(e.pointerId);
    arrastre.current = { y0: e.clientY, fraccion0: ALTURAS_HOJA[altura], ultimaY: e.clientY, ultimoT: e.timeStamp, velocidad: 0, movido: false };
    setSuelta(false);
  }

  function alMover(e: PointerEvent<HTMLButtonElement>) {
    const a = arrastre.current;
    if (!a) return;
    const alto = altoRef();
    if (Math.abs(e.clientY - a.y0) > 6) a.movido = true;
    const dt = Math.max(1, e.timeStamp - a.ultimoT);
    a.velocidad = ((a.ultimaY - e.clientY) / alto / dt) * 1000; // fracciones de pantalla por segundo, positiva hacia arriba
    a.ultimaY = e.clientY;
    a.ultimoT = e.timeStamp;
    fijarFraccion(Math.min(0.96, Math.max(0.2, a.fraccion0 + (a.y0 - e.clientY) / alto)));
  }

  function alSoltar(e: PointerEvent<HTMLButtonElement>) {
    const a = arrastre.current;
    if (!a) return;
    setSuelta(true);
    if (a.movido) {
      const alto = altoRef();
      setAltura(alturaAlSoltar(a.fraccion0 + (a.y0 - e.clientY) / alto, a.velocidad));
    }
    fijarFraccion(null);
  }

  function alTocar() {
    const a = arrastre.current;
    arrastre.current = null;
    if (a?.movido) return; // fue un arrastre, no un toque
    setAltura((h) => (h === 2 ? 0 : siguienteAltura(h, 1)));
  }

  function alTeclear(e: KeyboardEvent) {
    if (e.key === 'ArrowUp') setAltura((h) => siguienteAltura(h, 1));
    else if (e.key === 'ArrowDown') setAltura((h) => siguienteAltura(h, -1));
    else return;
    e.preventDefault();
  }

  return (
    <section ref={hoja} className={`hx-hoja hx-hoja--a${altura}${suelta ? ' hx-hoja--suelta' : ''}`} aria-label={titulo}>
      <button
        type="button"
        className="hx-hoja__manija"
        aria-expanded={altura === 2}
        aria-describedby={ayuda}
        onPointerDown={alBajar}
        onPointerMove={alMover}
        onPointerUp={alSoltar}
        onPointerCancel={alSoltar}
        onClick={alTocar}
        onKeyDown={alTeclear}
      >
        <span className="hx-hoja__titulo">{titulo}</span>
        <span id={ayuda} className="visualmente-oculto">
          Hoja {TEXTO_ALTURA[altura]}. Tocá para cambiar el tamaño, o usá las flechas arriba y abajo.
        </span>
      </button>
      <div className="hx-hoja__cuerpo">{children}</div>
    </section>
  );
}
