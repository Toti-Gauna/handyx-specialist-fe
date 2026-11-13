import type { Metadata } from 'next';
import { Suspense } from 'react';
import { RUTAS } from '../../../../app/rutas.ts';
import { AntesDespues } from '../../../../pantallas/modo/AntesDespues.tsx';

export const metadata: Metadata = { title: RUTAS.antesDespues.titulo };

export default function Pagina() {
  return (
    <Suspense>
      <AntesDespues />
    </Suspense>
  );
}
