import type { Metadata } from 'next';
import { Suspense } from 'react';
import { RUTAS } from '../../../../../app/rutas.ts';
import { InformeEnviado } from '../../../../../pantallas/modo/InformeEnviado.tsx';

export const metadata: Metadata = { title: RUTAS.informeEnviado.titulo };

export default function Pagina() {
  return (
    <Suspense>
      <InformeEnviado />
    </Suspense>
  );
}
