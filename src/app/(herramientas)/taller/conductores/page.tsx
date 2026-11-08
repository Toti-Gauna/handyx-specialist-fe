import type { Metadata } from 'next';
import { Suspense } from 'react';
import { RUTAS } from '../../../../app/rutas.ts';
import { Conductores } from '../../../../pantallas/taller/Conductores.tsx';

export const metadata: Metadata = { title: RUTAS.tallerConductores.titulo };

export default function Pagina() {
  return (
    <Suspense>
      <Conductores />
    </Suspense>
  );
}
