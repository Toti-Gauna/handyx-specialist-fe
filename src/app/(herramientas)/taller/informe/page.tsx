import type { Metadata } from 'next';
import { Suspense } from 'react';
import { RUTAS } from '../../../../app/rutas.ts';
import { Informe } from '../../../../pantallas/taller/Informe.tsx';

export const metadata: Metadata = { title: RUTAS.tallerInforme.titulo };

export default function Pagina() {
  return (
    <Suspense>
      <Informe />
    </Suspense>
  );
}
