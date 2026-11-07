import type { ReactNode } from 'react';
import { BannerPrueba } from '../../components/BannerPrueba.tsx';
import { GuardiaApp } from '../../components/GuardiaApp.tsx';
import { AvisoSinConexion } from '../../components/SinConexion.tsx';
import './viaje.css';

// En camino (lote 4.3): el mapa ocupa toda la pantalla, sin la cabecera de la app ni las pestañas.
export default function LayoutViaje({ children }: { children: ReactNode }) {
  return (
    <div className="vj">
      <BannerPrueba />
      <AvisoSinConexion />
      <main id="contenido" className="vj-cuerpo">
        <GuardiaApp>{children}</GuardiaApp>
      </main>
    </div>
  );
}
