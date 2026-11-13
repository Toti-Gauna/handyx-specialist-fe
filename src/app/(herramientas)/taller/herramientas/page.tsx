import type { Metadata } from 'next';
import { Suspense } from 'react';
import { RUTAS } from '../../../../app/rutas.ts';
import { PortalHerramientas } from '../../../../pantallas/herramientas/PortalHerramientas.tsx';

export const metadata: Metadata = { title: RUTAS.tallerHerramientas.titulo };

export default function Pagina() {
  return (
    <Suspense>
      <PortalHerramientas />
    </Suspense>
  );
}
