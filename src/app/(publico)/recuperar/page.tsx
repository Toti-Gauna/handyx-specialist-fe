import { Suspense } from 'react';
import { Recuperar } from '../../../pantallas/Recuperar.tsx';

export default function Pagina() {
  return (
    <Suspense>
      <Recuperar />
    </Suspense>
  );
}
