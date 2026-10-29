import type { Metadata } from 'next';
import { Catalogo } from '../../kit/Catalogo.tsx';

// El título no va en RUTAS: rutas.ts entra al bundle de producción y el catálogo no puede figurar ahí.
export const metadata: Metadata = { title: 'Catálogo del kit' };

// Solo existe con el origen de prueba (next.config.ts → pageExtensions).
export default function Page() {
  return <Catalogo />;
}
