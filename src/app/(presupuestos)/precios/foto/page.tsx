import type { Metadata } from 'next';
import { Suspense } from 'react';
import { RUTAS } from '../../../../app/rutas.ts';
import { FotoLista } from '../../../../pantallas/presupuestos/FotoLista.tsx';

export const metadata: Metadata = { title: RUTAS.preciosFoto.titulo };

export default function Pagina() {
  return (
    <Suspense>
      <FotoLista />
    </Suspense>
  );
}
