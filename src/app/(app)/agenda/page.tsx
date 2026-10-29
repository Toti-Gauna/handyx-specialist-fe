import { Suspense } from 'react';
import { Agenda } from '../../../pantallas/Agenda.tsx';

export default function Pagina() {
  return (
    <Suspense>
      <Agenda />
    </Suspense>
  );
}
