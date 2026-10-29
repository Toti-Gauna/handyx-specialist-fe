import { Suspense } from 'react';
import { Soporte } from '../../../pantallas/Soporte.tsx';

export default function Pagina() {
  return (
    <Suspense>
      <Soporte />
    </Suspense>
  );
}
