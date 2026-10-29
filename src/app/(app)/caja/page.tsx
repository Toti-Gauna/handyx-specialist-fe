import { Suspense } from 'react';
import { Caja } from '../../../pantallas/Caja.tsx';

export default function Pagina() {
  return (
    <Suspense>
      <Caja />
    </Suspense>
  );
}
