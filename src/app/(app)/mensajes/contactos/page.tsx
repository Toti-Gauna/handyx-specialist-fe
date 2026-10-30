import type { Metadata } from 'next';
import { Suspense } from 'react';
import { RUTAS } from '../../../../app/rutas.ts';
import { Contactos } from '../../../../pantallas/Contactos.tsx';

// Título propio por pantalla (WCAG 2.4.2); el anunciador de rutas de Next lo lee al navegar.
export const metadata: Metadata = { title: RUTAS.contactos.titulo };

export default function Pagina() {
  return (
    <Suspense>
      <Contactos />
    </Suspense>
  );
}
