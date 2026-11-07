import type { Metadata } from 'next';
import { Suspense } from 'react';
import { RUTAS } from '../../../../app/rutas.ts';
import { DatosPersonales } from '../../../../pantallas/cuenta/DatosPersonales.tsx';
import '../../../../pantallas/cuenta/cuenta.css';

export const metadata: Metadata = { title: RUTAS.cuentaDatos.titulo };

export default function Pagina() {
  return (
    <Suspense>
      <DatosPersonales />
    </Suspense>
  );
}
