import type { Metadata } from 'next';
import { Suspense } from 'react';
import { RUTAS } from '../../../../app/rutas.ts';
import { AgendaMes } from '../../../../pantallas/agenda/AgendaMes.tsx';

export const metadata: Metadata = { title: RUTAS.agendaMes.titulo };

export default function Pagina() {
  return (
    <Suspense>
      <AgendaMes />
    </Suspense>
  );
}
