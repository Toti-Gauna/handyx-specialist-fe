import type { Metadata } from 'next';
import { Suspense } from 'react';
import { RUTAS } from '../../../../app/rutas.ts';
import { Dictado } from '../../../../pantallas/taller/Dictado.tsx';

export const metadata: Metadata = { title: RUTAS.tallerDictado.titulo };

export default function Pagina() {
  return (
    <Suspense>
      <Dictado />
    </Suspense>
  );
}
