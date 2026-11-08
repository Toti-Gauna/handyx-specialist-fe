import type { Metadata } from 'next';
import { Suspense } from 'react';
import { RUTAS } from '../../../../app/rutas.ts';
import { Tablero } from '../../../../pantallas/taller/Tablero.tsx';

export const metadata: Metadata = { title: RUTAS.tallerTablero.titulo };

export default function Pagina() {
  return (
    <Suspense>
      <Tablero />
    </Suspense>
  );
}
