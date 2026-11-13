import type { Metadata } from 'next';
import { Suspense } from 'react';
import { RUTAS } from '../../../../../app/rutas.ts';
import { PlanObra } from '../../../../../pantallas/obra/PlanObra.tsx';
import '../../../../../pantallas/trabajo/trabajo.css';
import '../../../../../pantallas/obra/obra.css';

export const metadata: Metadata = { title: RUTAS.obraPlan.titulo };

export default function Pagina() {
  return (
    <Suspense>
      <PlanObra />
    </Suspense>
  );
}
