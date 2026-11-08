import type { Metadata } from 'next';
import { Suspense } from 'react';
import { RUTAS } from '../../../../app/rutas.ts';
import { Medir } from '../../../../pantallas/herramientas/Medir.tsx';

export const metadata: Metadata = { title: RUTAS.tallerMedir.titulo };

export default function Pagina() {
  return (
    <Suspense>
      <Medir />
    </Suspense>
  );
}
