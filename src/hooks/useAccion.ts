'use client';
import { useCallback, useRef, useState } from 'react';
import { useSesion } from '../app/contexto.tsx';
import { FalloApi } from '../data/errores.ts';
import { nuevaClave } from '../lib/formato.ts';

/**
 * Ejecuta una mutación mostrando el estado de envío y el error. La Idempotency-Key se genera una vez por
 * intención y se reusa al reintentar (`clave()`); se renueva con `nueva()` cuando la intención cambia o salió bien.
 * Un 401 abre el aviso de sesión expirada, salvo con `publica` (Entrar, Google o Apple): ahí un 401 son credenciales
 * incorrectas, no una sesión vencida.
 */
export function useAccion({ publica = false }: { publica?: boolean } = {}) {
  const { expirarSesion } = useSesion();
  const [pendiente, setPendiente] = useState(false);
  const [fallo, setFallo] = useState<FalloApi | null>(null);
  const claveActual = useRef<string | null>(null);

  const ejecutar = useCallback(
    async <T>(fn: () => Promise<T>): Promise<{ ok: true; valor: T } | { ok: false; fallo: FalloApi }> => {
      setPendiente(true);
      setFallo(null);
      try {
        const valor = await fn();
        claveActual.current = null; // salió bien: la próxima acción es otra intención
        return { ok: true, valor };
      } catch (e) {
        const f = e instanceof FalloApi ? e : new FalloApi('servidor');
        if (f.tipo === 'sesion' && !publica) expirarSesion();
        setFallo(f);
        return { ok: false, fallo: f };
      } finally {
        setPendiente(false);
      }
    },
    [expirarSesion, publica],
  );

  const clave = useCallback(() => (claveActual.current ??= nuevaClave()), []);
  const nueva = useCallback(() => {
    claveActual.current = null;
  }, []);
  const limpiar = useCallback(() => setFallo(null), []);
  return { pendiente, fallo, ejecutar, clave, nueva, limpiar };
}
