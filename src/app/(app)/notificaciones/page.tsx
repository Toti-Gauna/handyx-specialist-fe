import { Suspense } from 'react';
import { Avisos } from '../../../pantallas/Avisos.tsx';

export default function Pagina() {
  return (
    <Suspense>
      <Avisos />
    </Suspense>
  );
}
