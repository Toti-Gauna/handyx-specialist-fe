import { Suspense } from 'react';
import { TrabajoDetalle } from '../../../../pantallas/TrabajoDetalle.tsx';

export default function Pagina() {
  return (
    <Suspense>
      <TrabajoDetalle />
    </Suspense>
  );
}
