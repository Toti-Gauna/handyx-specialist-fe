import type { Metadata } from 'next';
import { Suspense } from 'react';
import { RUTAS } from '../../../../app/rutas.ts';
import { TrabajoDetalle } from '../../../../pantallas/TrabajoDetalle.tsx';

// Título propio por pantalla (WCAG 2.4.2); el anunciador de rutas de Next lo lee al navegar.
export const metadata: Metadata = { title: RUTAS.trabajo.titulo };

export default function Pagina() {
  return (
    <Suspense>
      <TrabajoDetalle />
    </Suspense>
  );
}
