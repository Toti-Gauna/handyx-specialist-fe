import type { Metadata } from 'next';
import { Suspense } from 'react';
import { RUTAS } from '../../../../app/rutas.ts';
import { AgregarVarios } from '../../../../pantallas/presupuestos/AgregarVarios.tsx';

export const metadata: Metadata = { title: RUTAS.presupuestoVarios.titulo };

export default function Pagina() {
  return (
    <Suspense>
      <AgregarVarios />
    </Suspense>
  );
}
