import type { Metadata } from 'next';
import { Suspense } from 'react';
import { RUTAS } from '../../../../app/rutas.ts';
import { CobrosCuenta } from '../../../../pantallas/cuenta/CobrosCuenta.tsx';
import '../../../../pantallas/cuenta/cuenta.css';

export const metadata: Metadata = { title: RUTAS.cuentaCobros.titulo };

export default function Pagina() {
  return (
    <Suspense>
      <CobrosCuenta />
    </Suspense>
  );
}
