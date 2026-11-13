import type { Metadata } from 'next';
import { Suspense } from 'react';
import { RUTAS } from '../../../../../app/rutas.ts';
import { TotpCuenta } from '../../../../../pantallas/cuenta/TotpCuenta.tsx';

export const metadata: Metadata = { title: RUTAS.cuentaSeguridadApp.titulo };

export default function Pagina() {
  return (
    <Suspense>
      <TotpCuenta />
    </Suspense>
  );
}
