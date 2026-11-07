import type { Metadata } from 'next';
import { Suspense } from 'react';
import { RUTAS } from '../../../../app/rutas.ts';
import { NotificacionesCuenta } from '../../../../pantallas/cuenta/NotificacionesCuenta.tsx';
import '../../../../pantallas/cuenta/cuenta.css';

export const metadata: Metadata = { title: RUTAS.cuentaNotificaciones.titulo };

export default function Pagina() {
  return (
    <Suspense>
      <NotificacionesCuenta />
    </Suspense>
  );
}
