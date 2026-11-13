import type { Metadata } from 'next';
import { Suspense } from 'react';
import { RUTAS } from '../../../../app/rutas.ts';
import { ModoTrabajo } from '../../../../pantallas/modo/ModoTrabajo.tsx';

export const metadata: Metadata = { title: RUTAS.modoTrabajo.titulo };

export default function Pagina() {
  return (
    <Suspense>
      <ModoTrabajo />
    </Suspense>
  );
}
