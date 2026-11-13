import type { Metadata } from 'next';
import { Suspense } from 'react';
import { RUTAS } from '../../../../../app/rutas.ts';
import { AgendaTrabajo } from '../../../../../pantallas/modo/AgendaTrabajo.tsx';

export const metadata: Metadata = { title: RUTAS.modoAgenda.titulo };

export default function Pagina() {
  return (
    <Suspense>
      <AgendaTrabajo />
    </Suspense>
  );
}
