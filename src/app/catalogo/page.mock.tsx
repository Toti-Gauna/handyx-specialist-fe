import type { Metadata } from 'next';
import { CatalogoV3 } from '../../ui/Catalogo.tsx';

// El título no va en RUTAS: rutas.ts entra al bundle de producción y el catálogo no puede figurar ahí.
export const metadata: Metadata = { title: 'Catálogo del kit v3' };

// Solo existe con el origen de prueba (next.config.ts → pageExtensions). El kit v2 sigue en /catalogo/v2/.
export default function Page() {
  return <CatalogoV3 />;
}
