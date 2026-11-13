import type { Metadata } from 'next';
import { Suspense } from 'react';
import { RUTAS } from '../../../../app/rutas.ts';
import { CasosSoporte } from '../../../../pantallas/CasosSoporte.tsx';

export const metadata: Metadata = { title: RUTAS.casosSoporte.titulo };

export default function Pagina() {
  return (
    <Suspense>
      <CasosSoporte />
    </Suspense>
  );
}
