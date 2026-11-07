import type { Metadata } from 'next';
import { Suspense } from 'react';
import { RUTAS } from '../../../../app/rutas.ts';
import { Nivel } from '../../../../pantallas/taller/Nivel.tsx';

export const metadata: Metadata = { title: RUTAS.tallerNivel.titulo };

export default function Pagina() {
  return (
    <Suspense>
      <Nivel />
    </Suspense>
  );
}
