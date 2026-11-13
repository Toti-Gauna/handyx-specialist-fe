import type { Metadata } from 'next';
import { Suspense } from 'react';
import { RUTAS } from '../../../../app/rutas.ts';
import { Ohm } from '../../../../pantallas/taller/Ohm.tsx';

export const metadata: Metadata = { title: RUTAS.tallerOhm.titulo };

export default function Pagina() {
  return (
    <Suspense>
      <Ohm />
    </Suspense>
  );
}
