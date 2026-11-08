import type { Metadata } from 'next';
import { Suspense } from 'react';
import { RUTAS } from '../../../app/rutas.ts';
import { Presupuestador } from '../../../pantallas/presupuestos/Presupuestador.tsx';

export const metadata: Metadata = { title: RUTAS.presupuesto.titulo };

export default function Pagina() {
  return (
    <Suspense>
      <Presupuestador />
    </Suspense>
  );
}
