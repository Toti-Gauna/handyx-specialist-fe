import { Suspense } from 'react';
import { CasoDetalle } from '../../../../pantallas/CasoDetalle.tsx';

export default function Pagina() {
  return (
    <Suspense>
      <CasoDetalle />
    </Suspense>
  );
}
