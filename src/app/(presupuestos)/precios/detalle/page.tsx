import type { Metadata } from 'next';
import { Suspense } from 'react';
import { RUTAS } from '../../../../app/rutas.ts';
import { DetallePrecio } from '../../../../pantallas/presupuestos/DetallePrecio.tsx';

export const metadata: Metadata = { title: RUTAS.precioDetalle.titulo };

export default function Pagina() {
  return (
    <Suspense>
      <DetallePrecio />
    </Suspense>
  );
}
