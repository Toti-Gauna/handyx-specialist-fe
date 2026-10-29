'use client';
import { api, controles } from '@handyx/origen-datos';
import { useEffect, useState } from 'react';

/** "Ahora" para cuentas regresivas, actualizado cada segundo. Los vencimientos los decide siempre el servidor. */
export function useAhora(cadaMs = 1000): Date {
  const [ahora, setAhora] = useState(() => api.ahora());
  useEffect(() => {
    const id = setInterval(() => setAhora(api.ahora()), cadaMs);
    return () => clearInterval(id);
  }, [cadaMs]);
  // Con el origen de prueba, las acciones del panel (p. ej. mover el reloj) se reflejan al instante.
  useEffect(() => controles?.alCambiar(() => setAhora(api.ahora())), []);
  return ahora;
}
