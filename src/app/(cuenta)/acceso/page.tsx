import type { Metadata } from 'next';
import { Suspense } from 'react';
import { RUTAS } from '../../../app/rutas.ts';
import { Acceso } from '../../../pantallas/Acceso.tsx';

// Título propio por pantalla (WCAG 2.4.2); el anunciador de rutas de Next lo lee al navegar.
export const metadata: Metadata = { title: RUTAS.acceso.titulo };

export default function Pagina() {
  return (
    <Suspense>
      <Acceso />
    </Suspense>
  );
}
