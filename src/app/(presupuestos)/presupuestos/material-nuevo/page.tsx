import type { Metadata } from 'next';
import { Suspense } from 'react';
import { RUTAS } from '../../../../app/rutas.ts';
import { MaterialNuevo } from '../../../../pantallas/presupuestos/MaterialNuevo.tsx';

export const metadata: Metadata = { title: RUTAS.presupuestoMaterialNuevo.titulo };

export default function Pagina() {
  return (
    <Suspense>
      <MaterialNuevo />
    </Suspense>
  );
}
