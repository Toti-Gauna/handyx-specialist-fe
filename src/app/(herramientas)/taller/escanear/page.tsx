import type { Metadata } from 'next';
import { Suspense } from 'react';
import { RUTAS } from '../../../../app/rutas.ts';
import { Escanear } from '../../../../pantallas/herramientas/Escanear.tsx';

export const metadata: Metadata = { title: RUTAS.tallerEscanear.titulo };

export default function Pagina() {
  return (
    <Suspense>
      <Escanear />
    </Suspense>
  );
}
