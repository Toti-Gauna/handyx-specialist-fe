import type { Metadata } from 'next';
import { Suspense } from 'react';
import { RUTAS } from '../../../../app/rutas.ts';
import { CobroTrabajo } from '../../../../pantallas/CobroTrabajo.tsx';

export const metadata: Metadata = { title: RUTAS.trabajoCobro.titulo };

export default function Pagina() {
  return (
    <Suspense>
      <CobroTrabajo />
    </Suspense>
  );
}
