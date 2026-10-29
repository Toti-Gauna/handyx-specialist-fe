import type { Metadata } from 'next';
import { Suspense } from 'react';
import { RUTAS } from '../../../../app/rutas.ts';
import { TuPrecio } from '../../../../pantallas/TuPrecio.tsx';
import '../../../../pantallas/tu-precio.css';

export const metadata: Metadata = { title: RUTAS.tuPrecio.titulo };

export default function Pagina() {
  return (
    <Suspense>
      <TuPrecio />
    </Suspense>
  );
}
