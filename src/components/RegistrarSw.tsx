'use client';
import { useEffect } from 'react';

const base = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

/** Registra out/sw.js (solo en un build: en `next dev` no existe). Si falla, la app sigue igual, sin modo offline. */
export function RegistrarSw() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production' || !('serviceWorker' in navigator)) return;
    navigator.serviceWorker.register(`${base}/sw.js`, { scope: `${base}/` }).catch(() => undefined);
  }, []);
  return null;
}
