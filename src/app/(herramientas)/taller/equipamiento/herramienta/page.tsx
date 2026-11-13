import type { Metadata } from 'next';
import { Suspense } from 'react';
import { RUTAS } from '../../../../../app/rutas.ts';
import { DetalleEquipo } from '../../../../../pantallas/equipamiento/DetalleEquipo.tsx';

export const metadata: Metadata = { title: RUTAS.equipamientoHerramienta.titulo };

export default function Pagina() {
  return (
    <Suspense>
      <DetalleEquipo />
    </Suspense>
  );
}
