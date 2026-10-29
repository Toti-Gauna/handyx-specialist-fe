'use client';
import { api } from '@handyx/origen-datos';
import { useEffect, useState } from 'react';

/** "Ahora" para cuentas regresivas, actualizado cada segundo. Los vencimientos los decide siempre el servidor. */
export function useAhora(cadaMs = 1000): Date {
  const [ahora, setAhora] = useState(() => api.ahora());
  useEffect(() => {
    const id = setInterval(() => setAhora(api.ahora()), cadaMs);
    return () => clearInterval(id);
  }, [cadaMs]);
  return ahora;
}
