'use client';
// Pantalla de carga de la app (lote 4.2, decisión de Ignacio del 29/10/2026). Distinta a la de la landing:
// el fondo cambia de color mientras los cinco Handys saltan en fila; cae el logo y terminan todos de la mano, con un
// último saltito juntos. Solo al abrir la app (la monta la Puerta, en "/"), dura 2,5 s, se saltea tocando o con una
// tecla, y con "reducir movimiento" queda quieta 0,6 s. Las poses nuevas (docs/handys-prompt.md) reemplazan a estas.
import { useCallback, useEffect, useRef, useState } from 'react';
import { sinMovimiento } from '../kit/movimiento.ts';
import { Handy, type NombreHandy } from './Handy.tsx';
import './carga.css';

const base = process.env.NEXT_PUBLIC_BASE_PATH ?? '';
const FILA: { nombre: NombreHandy; alto: number }[] = [
  { nombre: 'gota', alto: 46 },
  { nombre: 'cano', alto: 78 },
  { nombre: 'engranaje', alto: 60 },
  { nombre: 'lamparita', alto: 80 },
  { nombre: 'llave', alto: 56 },
];
export const DURACION_CARGA = 2500;
const DURACION_QUIETA = 600;
const SALIDA = 280;

export function PantallaCarga({ onFin }: { onFin(): void }) {
  const [saliendo, setSaliendo] = useState(false);
  const terminada = useRef(false);

  const salir = useCallback(() => {
    if (terminada.current) return;
    terminada.current = true;
    setSaliendo(true);
    window.setTimeout(onFin, sinMovimiento() ? 0 : SALIDA);
  }, [onFin]);

  useEffect(() => {
    const t = window.setTimeout(salir, sinMovimiento() ? DURACION_QUIETA : DURACION_CARGA);
    window.addEventListener('keydown', salir);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener('keydown', salir);
    };
  }, [salir]);

  return (
    <div className={`cu-carga${saliendo ? ' cu-carga--sale' : ''}`} onPointerDown={salir} data-carga>
      <p className="visualmente-oculto" role="status">
        Abriendo Handyx
      </p>
      <div className="cu-carga__escena" aria-hidden="true">
        <img className="cu-carga__logo" src={`${base}/logo-handyx.webp`} alt="" width={240} height={52} />
        <div className="cu-carga__fila">
          {FILA.map((h) => (
            <span key={h.nombre} className="cu-carga__handy">
              <Handy nombre={h.nombre} alto={h.alto} />
            </span>
          ))}
        </div>
        <span className="cu-carga__sombra" />
      </div>
    </div>
  );
}
