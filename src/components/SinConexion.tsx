'use client';

import { useEnLinea } from '../hooks/useEnLinea.ts';
import { Handy } from './Handy.tsx';

/** Franja fija mientras el teléfono no tiene red. No guarda nada para mandar después: al volver, se reintenta a mano. */
export function AvisoSinConexion() {
  const enLinea = useEnLinea();
  return (
    <div className="sin-red" role="status" aria-live="polite">
      {enLinea ? null : (
        <p className="sin-red__texto">
          <Handy nombre="lamparita-rota" alto={36} />
          <span>
            <strong>Sin conexión.</strong> Lo que ves puede estar desactualizado y no se puede enviar nada hasta que vuelva la red.
          </span>
        </p>
      )}
    </div>
  );
}
