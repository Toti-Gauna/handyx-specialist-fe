import type { Metadata } from 'next';
import { Suspense } from 'react';
import { RUTAS } from '../../../../app/rutas.ts';
import { Consumo } from '../../../../pantallas/taller/Consumo.tsx';

export const metadata: Metadata = { title: RUTAS.tallerConsumo.titulo };

export default function Pagina() {
  return (
    <Suspense>
      <Consumo />
    </Suspense>
  );
}
