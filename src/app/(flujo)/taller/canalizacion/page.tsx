import type { Metadata } from 'next';
import { Suspense } from 'react';
import { RUTAS } from '../../../../app/rutas.ts';
import { Canalizacion } from '../../../../pantallas/taller/Canalizacion.tsx';

export const metadata: Metadata = { title: RUTAS.tallerCanalizacion.titulo };

export default function Pagina() {
  return (
    <Suspense>
      <Canalizacion />
    </Suspense>
  );
}
