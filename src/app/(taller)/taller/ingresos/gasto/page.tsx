import type { Metadata } from 'next';
import { Suspense } from 'react';
import { RUTAS } from '../../../../../app/rutas.ts';
import { CargarGasto } from '../../../../../pantallas/agenda/CargarGasto.tsx';

export const metadata: Metadata = { title: RUTAS.ingresoGasto.titulo };

export default function Pagina() {
  return (
    <Suspense>
      <CargarGasto />
    </Suspense>
  );
}
