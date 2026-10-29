import { Suspense } from 'react';
import { Disponibilidad } from '../../../pantallas/Disponibilidad.tsx';

export default function Pagina() {
  return (
    <Suspense>
      <Disponibilidad />
    </Suspense>
  );
}
