import type { Metadata } from 'next';
import { Suspense } from 'react';
import { RUTAS } from '../../../../../app/rutas.ts';
import { AgregarEquipo } from '../../../../../pantallas/equipamiento/AgregarEquipo.tsx';

export const metadata: Metadata = { title: RUTAS.equipamientoAgregar.titulo };

export default function Pagina() {
  return (
    <Suspense>
      <AgregarEquipo />
    </Suspense>
  );
}
