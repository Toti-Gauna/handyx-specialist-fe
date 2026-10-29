import { Suspense } from 'react';
import { Alta } from '../../../pantallas/Alta.tsx';

export default function Pagina() {
  return (
    <Suspense>
      <Alta />
    </Suspense>
  );
}
