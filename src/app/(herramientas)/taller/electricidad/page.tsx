import type { Metadata } from 'next';
import { Suspense } from 'react';
import { RUTAS } from '../../../../app/rutas.ts';
import { Electricidad } from '../../../../pantallas/herramientas/Electricidad.tsx';

export const metadata: Metadata = { title: RUTAS.tallerElectricidad.titulo };

export default function Pagina() {
  return (
    <Suspense>
      <Electricidad />
    </Suspense>
  );
}
