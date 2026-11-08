import type { Metadata } from 'next';
import { Suspense } from 'react';
import { RUTAS } from '../../../app/rutas.ts';
import { ListaPrecios } from '../../../pantallas/presupuestos/ListaPrecios.tsx';

export const metadata: Metadata = { title: RUTAS.precios.titulo };

export default function Pagina() {
  return (
    <Suspense>
      <ListaPrecios />
    </Suspense>
  );
}
