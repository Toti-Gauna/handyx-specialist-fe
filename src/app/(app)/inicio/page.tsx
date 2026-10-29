import { Suspense } from 'react';
import { Inicio } from '../../../pantallas/Inicio.tsx';

export default function Pagina() {
  return (
    <Suspense>
      <Inicio />
    </Suspense>
  );
}
