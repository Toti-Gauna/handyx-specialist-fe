import type { Metadata } from 'next';
import { Suspense } from 'react';
import { RUTAS } from '../../../app/rutas.ts';
import { Herramientas } from '../../../pantallas/agenda/Herramientas.tsx';

export const metadata: Metadata = { title: RUTAS.taller.titulo };

export default function Pagina() {
  return (
    <Suspense>
      <Herramientas />
    </Suspense>
  );
}
