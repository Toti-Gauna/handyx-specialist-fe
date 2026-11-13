import type { Metadata } from 'next';
import { Suspense } from 'react';
import { RUTAS } from '../../../../app/rutas.ts';
import { Ingresos } from '../../../../pantallas/agenda/Ingresos.tsx';

export const metadata: Metadata = { title: RUTAS.ingresos.titulo };

export default function Pagina() {
  return (
    <Suspense>
      <Ingresos />
    </Suspense>
  );
}
