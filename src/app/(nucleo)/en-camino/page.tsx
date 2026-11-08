import type { Metadata } from 'next';
import { Suspense } from 'react';
import { RUTAS } from '../../../app/rutas.ts';
import { EnCamino } from '../../../pantallas/EnCamino.tsx';

export const metadata: Metadata = { title: RUTAS.enCamino.titulo };

export default function Pagina() {
  return (
    <Suspense>
      <EnCamino />
    </Suspense>
  );
}
