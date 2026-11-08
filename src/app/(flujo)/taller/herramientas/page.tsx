import type { Metadata } from 'next';
import { Suspense } from 'react';
import { RUTAS } from '../../../../app/rutas.ts';
import { Taller } from '../../../../pantallas/taller/Taller.tsx';

export const metadata: Metadata = { title: RUTAS.tallerHerramientas.titulo };

export default function Pagina() {
  return (
    <Suspense>
      <Taller />
    </Suspense>
  );
}
