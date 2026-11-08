import type { Metadata } from 'next';
import { Suspense } from 'react';
import { RUTAS } from '../../../../app/rutas.ts';
import { PerfilCuenta } from '../../../../pantallas/cuenta/PerfilCuenta.tsx';

export const metadata: Metadata = { title: RUTAS.cuentaPerfil.titulo };

export default function Pagina() {
  return (
    <Suspense>
      <PerfilCuenta />
    </Suspense>
  );
}
