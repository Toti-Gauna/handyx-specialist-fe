'use client';
import { useEffect, useRef } from 'react';
import { useAhora } from '../hooks/useAhora.ts';
import { restante } from '../lib/formato.ts';
import { Icono } from './Icono.tsx';

/**
 * Tiempo que queda de una vigencia calculada por el servidor. Al llegar a cero avisa una vez (`alVencer`)
 * para volver a pedir el estado real: la pantalla nunca decide sola que algo venció.
 */
export function CuentaRegresiva({ hasta, etiqueta, alVencer }: { hasta: string; etiqueta: string; alVencer?: () => void }) {
  const ahora = useAhora();
  const r = restante(hasta, ahora);
  const avisado = useRef(false);
  useEffect(() => {
    if (r === null && !avisado.current) {
      avisado.current = true;
      alVencer?.();
    }
    if (r !== null) avisado.current = false;
  }, [r, alVencer]);

  return r === null ? (
    <span className="cuenta cuenta--vencida">
      <Icono nombre="reloj" /> {etiqueta}: venció
    </span>
  ) : (
    <span className="cuenta">
      <Icono nombre="reloj" /> {etiqueta}: <strong>{r}</strong>
    </span>
  );
}
