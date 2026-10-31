import type { Metadata } from 'next';
import { Suspense } from 'react';
import { RUTAS } from '../../../../app/rutas.ts';
import { CambiarFecha } from '../../../../pantallas/trabajo/CambiarFecha.tsx';
import '../../../../pantallas/trabajo/trabajo.css';

export const metadata: Metadata = { title: RUTAS.trabajoCambio.titulo };

export default function Pagina() {
  return (
    <Suspense>
      <CambiarFecha />
    </Suspense>
  );
}
