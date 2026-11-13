import type { Metadata } from 'next';
import { Suspense } from 'react';
import { RUTAS } from '../../../../app/rutas.ts';
import { ManoObra } from '../../../../pantallas/presupuestos/ManoObra.tsx';

export const metadata: Metadata = { title: RUTAS.manoDeObra.titulo };

export default function Pagina() {
  return (
    <Suspense>
      <ManoObra />
    </Suspense>
  );
}
