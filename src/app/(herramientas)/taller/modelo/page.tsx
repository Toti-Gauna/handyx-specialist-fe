import type { Metadata } from 'next';
import { Suspense } from 'react';
import { RUTAS } from '../../../../app/rutas.ts';
import { ModeloTres } from '../../../../pantallas/herramientas/ModeloTres.tsx';

export const metadata: Metadata = { title: RUTAS.tallerModelo.titulo };

export default function Pagina() {
  return (
    <Suspense>
      <ModeloTres />
    </Suspense>
  );
}
