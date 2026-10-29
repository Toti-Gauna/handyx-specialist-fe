import type { Metadata } from 'next';
import { Suspense } from 'react';
import { RUTAS } from '../../../app/rutas.ts';
import { Recuperar } from '../../../pantallas/Recuperar.tsx';

// Título propio por pantalla (WCAG 2.4.2); el anunciador de rutas de Next lo lee al navegar.
export const metadata: Metadata = { title: RUTAS.recuperar.titulo };

export default function Pagina() {
  return (
    <Suspense>
      <Recuperar />
    </Suspense>
  );
}
