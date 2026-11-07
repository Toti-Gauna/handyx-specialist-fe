import type { Metadata } from 'next';
import { Suspense } from 'react';
import { RUTAS } from '../../../../app/rutas.ts';
import { Iluminacion } from '../../../../pantallas/taller/Iluminacion.tsx';

export const metadata: Metadata = { title: RUTAS.tallerIluminacion.titulo };

export default function Pagina() {
  return (
    <Suspense>
      <Iluminacion />
    </Suspense>
  );
}
