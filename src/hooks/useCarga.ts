'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { controles } from '@handyx/origen-datos';
import { useSesion } from '../app/contexto.tsx';
import { FalloApi } from '../data/errores.ts';

export interface Carga<T> {
  estado: 'cargando' | 'ok' | 'error';
  datos: T | null;
  fallo: FalloApi | null;
  recargar(): Promise<void>;
}

/**
 * Pide datos a la API. Con error mantiene los datos anteriores (si los hay) y ofrece reintentar:
 * jamás cae a datos de muestra. Una sesión vencida abre el aviso de sesión expirada.
 */
export function useCarga<T>(cargar: () => Promise<T>, claves: readonly unknown[] = []): Carga<T> {
  const { expirarSesion } = useSesion();
  const [s, setS] = useState<{ estado: Carga<T>['estado']; datos: T | null; fallo: FalloApi | null }>({ estado: 'cargando', datos: null, fallo: null });
  const funcion = useRef(cargar);
  funcion.current = cargar;
  const turno = useRef(0);

  const ejecutar = useCallback(
    async (silencioso: boolean) => {
      const mio = ++turno.current;
      if (!silencioso) setS((p) => ({ estado: 'cargando', datos: p.datos, fallo: null }));
      try {
        const datos = await funcion.current();
        if (mio === turno.current) setS({ estado: 'ok', datos, fallo: null });
      } catch (e) {
        const fallo = e instanceof FalloApi ? e : new FalloApi('servidor');
        if (mio !== turno.current) return;
        if (fallo.tipo === 'sesion') expirarSesion();
        setS((p) => ({ estado: 'error', datos: p.datos, fallo }));
      }
    },
    [expirarSesion],
  );

  // Las claves las elige quien llama (se vuelve a pedir cuando cambian).
  useEffect(() => void ejecutar(false), [ejecutar, ...claves]);
  // Las acciones del panel de prueba (solo mock) refrescan en silencio lo que se está mirando.
  useEffect(() => controles?.alCambiar(() => void ejecutar(true)), [ejecutar]);

  return { ...s, recargar: () => ejecutar(false) };
}
