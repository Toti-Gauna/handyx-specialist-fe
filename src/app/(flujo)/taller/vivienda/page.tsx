import type { Metadata } from 'next';
import { Suspense } from 'react';
import { RUTAS } from '../../../../app/rutas.ts';
import { Vivienda } from '../../../../pantallas/taller/Vivienda.tsx';

export const metadata: Metadata = { title: RUTAS.tallerVivienda.titulo };

export default function Pagina() {
  return (
    <Suspense>
      <Vivienda />
    </Suspense>
  );
}
