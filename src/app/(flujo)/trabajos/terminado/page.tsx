import type { Metadata } from 'next';
import { Suspense } from 'react';
import { RUTAS } from '../../../../app/rutas.ts';
import { Terminado } from '../../../../pantallas/trabajo/Terminado.tsx';
import '../../../../pantallas/trabajo/trabajo.css';

export const metadata: Metadata = { title: RUTAS.trabajoTerminado.titulo };

export default function Pagina() {
  return (
    <Suspense>
      <Terminado />
    </Suspense>
  );
}
