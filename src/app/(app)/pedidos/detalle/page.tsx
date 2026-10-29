import { Suspense } from 'react';
import { PedidoDetalle } from '../../../../pantallas/PedidoDetalle.tsx';

export default function Pagina() {
  return (
    <Suspense>
      <PedidoDetalle />
    </Suspense>
  );
}
