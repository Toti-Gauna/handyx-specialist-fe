import { Suspense } from 'react';
import { Mensajes } from '../../../pantallas/Mensajes.tsx';

export default function Pagina() {
  return (
    <Suspense>
      <Mensajes />
    </Suspense>
  );
}
