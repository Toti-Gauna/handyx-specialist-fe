import type { Metadata } from 'next';
import { Suspense } from 'react';
import { RUTAS } from '../../../../app/rutas.ts';
import { Checklists } from '../../../../pantallas/taller/Checklists.tsx';

export const metadata: Metadata = { title: RUTAS.tallerChecklists.titulo };

export default function Pagina() {
  return (
    <Suspense>
      <Checklists />
    </Suspense>
  );
}
