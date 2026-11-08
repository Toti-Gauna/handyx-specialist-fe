import type { Metadata } from 'next';
import { Suspense } from 'react';
import { RUTAS } from '../../../../app/rutas.ts';
import { Conversor } from '../../../../pantallas/herramientas/Conversor.tsx';

export const metadata: Metadata = { title: RUTAS.tallerConversor.titulo };

export default function Pagina() {
  return (
    <Suspense>
      <Conversor />
    </Suspense>
  );
}
