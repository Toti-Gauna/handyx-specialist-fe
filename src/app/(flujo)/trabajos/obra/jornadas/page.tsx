import type { Metadata } from 'next';
import { Suspense } from 'react';
import { RUTAS } from '../../../../../app/rutas.ts';
import { JornadasObra } from '../../../../../pantallas/obra/JornadasObra.tsx';
import '../../../../../pantallas/trabajo/trabajo.css';
import '../../../../../pantallas/obra/obra.css';

export const metadata: Metadata = { title: RUTAS.obraJornadas.titulo };

export default function Pagina() {
  return (
    <Suspense>
      <JornadasObra />
    </Suspense>
  );
}
