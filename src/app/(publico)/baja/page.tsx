import { Suspense } from 'react';
import { Baja } from '../../../pantallas/Baja.tsx';

export default function Pagina() {
  return (
    <Suspense>
      <Baja />
    </Suspense>
  );
}
