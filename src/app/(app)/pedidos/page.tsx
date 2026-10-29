import { Suspense } from 'react';
import { Pedidos } from '../../../pantallas/Pedidos.tsx';

export default function Pagina() {
  return (
    <Suspense>
      <Pedidos />
    </Suspense>
  );
}
