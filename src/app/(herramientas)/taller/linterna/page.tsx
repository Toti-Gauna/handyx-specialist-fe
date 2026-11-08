import type { Metadata } from 'next';
import { Suspense } from 'react';
import { RUTAS } from '../../../../app/rutas.ts';
import { LinternaLupa } from '../../../../pantallas/herramientas/LinternaLupa.tsx';

export const metadata: Metadata = { title: RUTAS.tallerLinterna.titulo };

export default function Pagina() {
  return (
    <Suspense>
      <LinternaLupa />
    </Suspense>
  );
}
