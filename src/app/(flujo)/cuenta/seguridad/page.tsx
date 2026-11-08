import type { Metadata } from 'next';
import { Suspense } from 'react';
import { RUTAS } from '../../../../app/rutas.ts';
import { SeguridadCuenta } from '../../../../pantallas/cuenta/SeguridadCuenta.tsx';

export const metadata: Metadata = { title: RUTAS.cuentaSeguridad.titulo };

export default function Pagina() {
  return (
    <Suspense>
      <SeguridadCuenta />
    </Suspense>
  );
}
