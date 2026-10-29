import { Suspense } from 'react';
import { Acceso } from '../../../pantallas/Acceso.tsx';

export default function Pagina() {
  return (
    <Suspense>
      <Acceso />
    </Suspense>
  );
}
