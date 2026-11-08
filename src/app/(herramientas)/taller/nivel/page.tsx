import type { Metadata } from 'next';
import { Suspense } from 'react';
import { RUTAS } from '../../../../app/rutas.ts';
import { NivelTelefono } from '../../../../pantallas/herramientas/NivelTelefono.tsx';

export const metadata: Metadata = { title: RUTAS.tallerNivel.titulo };

export default function Pagina() {
  return (
    <Suspense>
      <NivelTelefono />
    </Suspense>
  );
}
