import type { Metadata } from 'next';
import { Suspense } from 'react';
import { RUTAS } from '../../../../app/rutas.ts';
import { Equipamiento } from '../../../../pantallas/equipamiento/Equipamiento.tsx';

export const metadata: Metadata = { title: RUTAS.equipamiento.titulo };

export default function Pagina() {
  return (
    <Suspense>
      <Equipamiento />
    </Suspense>
  );
}
