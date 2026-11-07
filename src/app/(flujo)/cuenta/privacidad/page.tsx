import type { Metadata } from 'next';
import { Suspense } from 'react';
import { RUTAS } from '../../../../app/rutas.ts';
import { PrivacidadCuenta } from '../../../../pantallas/cuenta/PrivacidadCuenta.tsx';
import '../../../../pantallas/cuenta/cuenta.css';

export const metadata: Metadata = { title: RUTAS.cuentaPrivacidad.titulo };

export default function Pagina() {
  return (
    <Suspense>
      <PrivacidadCuenta />
    </Suspense>
  );
}
