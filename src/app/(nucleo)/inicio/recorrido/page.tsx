import type { Metadata } from 'next';
import { Suspense } from 'react';
import { RUTAS } from '../../../../app/rutas.ts';
import { Recorrido } from '../../../../pantallas/Recorrido.tsx';

export const metadata: Metadata = { title: RUTAS.recorrido.titulo };

export default function Pagina() {
  return (
    <Suspense>
      <Recorrido />
    </Suspense>
  );
}
