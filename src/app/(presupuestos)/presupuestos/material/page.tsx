import type { Metadata } from 'next';
import { Suspense } from 'react';
import { RUTAS } from '../../../../app/rutas.ts';
import { AgregarMaterial } from '../../../../pantallas/presupuestos/AgregarMaterial.tsx';

export const metadata: Metadata = { title: RUTAS.presupuestoMaterial.titulo };

export default function Pagina() {
  return (
    <Suspense>
      <AgregarMaterial />
    </Suspense>
  );
}
