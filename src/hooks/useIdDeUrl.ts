'use client';
import { useSearchParams } from 'next/navigation';

/** El id del recurso va en `?id=` (en la exportación estática no se conocen los ids al construir). */
export function useIdDeUrl(): string | null {
  return useSearchParams().get('id');
}
