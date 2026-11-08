import type { Metadata } from 'next';
import { Suspense } from 'react';
import { RUTAS } from '../../../../../app/rutas.ts';
import { PedirAyuda } from '../../../../../pantallas/modo/PedirAyuda.tsx';

export const metadata: Metadata = { title: RUTAS.modoAyuda.titulo };

export default function Pagina() {
  return (
    <Suspense>
      <PedirAyuda />
    </Suspense>
  );
}
