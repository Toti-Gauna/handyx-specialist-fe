import type { ReactNode } from 'react';
import { BannerPrueba } from '../../components/BannerPrueba.tsx';

// Acceso, registro, recuperación y alta: sin barra de navegación (todavía no hay cuenta habilitada).
export default function LayoutPublico({ children }: { children: ReactNode }) {
  return (
    <div className="app app--publico">
      <BannerPrueba />
      <main id="contenido" className="app-cuerpo">
        {children}
      </main>
    </div>
  );
}
