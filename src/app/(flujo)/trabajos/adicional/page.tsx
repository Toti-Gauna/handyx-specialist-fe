import type { Metadata } from 'next';
import { Suspense } from 'react';
import { RUTAS } from '../../../../app/rutas.ts';
import { AgregarAdicional } from '../../../../pantallas/trabajo/AgregarAdicional.tsx';
import '../../../../pantallas/trabajo/trabajo.css';

export const metadata: Metadata = { title: RUTAS.trabajoAdicional.titulo };

export default function Pagina() {
  return (
    <Suspense>
      <AgregarAdicional />
    </Suspense>
  );
}
