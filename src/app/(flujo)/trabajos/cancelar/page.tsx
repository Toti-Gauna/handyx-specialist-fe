import type { Metadata } from 'next';
import { Suspense } from 'react';
import { RUTAS } from '../../../../app/rutas.ts';
import { CancelarTrabajo } from '../../../../pantallas/trabajo/CancelarTrabajo.tsx';
import '../../../../pantallas/trabajo/trabajo.css';

export const metadata: Metadata = { title: RUTAS.trabajoCancelar.titulo };

export default function Pagina() {
  return (
    <Suspense>
      <CancelarTrabajo />
    </Suspense>
  );
}
