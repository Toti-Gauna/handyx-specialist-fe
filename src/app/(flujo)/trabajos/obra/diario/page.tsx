import type { Metadata } from 'next';
import { Suspense } from 'react';
import { RUTAS } from '../../../../../app/rutas.ts';
import { DiarioObra } from '../../../../../pantallas/obra/DiarioObra.tsx';
import '../../../../../pantallas/trabajo/trabajo.css';
import '../../../../../pantallas/obra/obra.css';

export const metadata: Metadata = { title: RUTAS.obraDiario.titulo };

export default function Pagina() {
  return (
    <Suspense>
      <DiarioObra />
    </Suspense>
  );
}
