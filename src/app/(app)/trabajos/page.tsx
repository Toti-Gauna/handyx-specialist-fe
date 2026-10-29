import { Suspense } from 'react';
import { Trabajos } from '../../../pantallas/Trabajos.tsx';

export default function Pagina() {
  return (
    <Suspense>
      <Trabajos />
    </Suspense>
  );
}
