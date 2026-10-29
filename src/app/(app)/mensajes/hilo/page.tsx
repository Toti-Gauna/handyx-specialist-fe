import { Suspense } from 'react';
import { Hilo } from '../../../../pantallas/Hilo.tsx';

export default function Pagina() {
  return (
    <Suspense>
      <Hilo />
    </Suspense>
  );
}
