import type { Metadata } from 'next';
import { Suspense } from 'react';
import { RUTAS } from '../../../../app/rutas.ts';
import { EtiquetadoIa } from '../../../../pantallas/taller/EtiquetadoIa.tsx';

export const metadata: Metadata = { title: RUTAS.tallerEtiquetas.titulo };

export default function Pagina() {
  return (
    <Suspense>
      <EtiquetadoIa />
    </Suspense>
  );
}
