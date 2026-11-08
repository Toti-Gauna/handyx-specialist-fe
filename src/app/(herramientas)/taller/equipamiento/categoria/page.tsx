import type { Metadata } from 'next';
import { Suspense } from 'react';
import { RUTAS } from '../../../../../app/rutas.ts';
import { CategoriaEquipo } from '../../../../../pantallas/equipamiento/CategoriaEquipo.tsx';

export const metadata: Metadata = { title: RUTAS.equipamientoCategoria.titulo };

export default function Pagina() {
  return (
    <Suspense>
      <CategoriaEquipo />
    </Suspense>
  );
}
