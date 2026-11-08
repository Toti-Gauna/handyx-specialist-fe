import type { Metadata } from 'next';
import { Suspense } from 'react';
import { RUTAS } from '../../../../app/rutas.ts';
import { InformeTrabajo } from '../../../../pantallas/modo/InformeTrabajo.tsx';

export const metadata: Metadata = { title: RUTAS.informeTrabajo.titulo };

export default function Pagina() {
  return (
    <Suspense>
      <InformeTrabajo />
    </Suspense>
  );
}
