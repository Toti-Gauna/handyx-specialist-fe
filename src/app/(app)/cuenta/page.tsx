import { Suspense } from 'react';
import { Cuenta } from '../../../pantallas/Cuenta.tsx';

export default function Pagina() {
  return (
    <Suspense>
      <Cuenta />
    </Suspense>
  );
}
