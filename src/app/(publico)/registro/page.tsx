import { Suspense } from 'react';
import { Registro } from '../../../pantallas/Registro.tsx';

export default function Pagina() {
  return (
    <Suspense>
      <Registro />
    </Suspense>
  );
}
