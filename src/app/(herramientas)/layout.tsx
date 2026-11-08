import type { ReactNode } from 'react';
import { BannerPrueba } from '../../components/BannerPrueba.tsx';
import { GuardiaApp } from '../../components/GuardiaApp.tsx';
import { AvisoSinConexion } from '../../components/SinConexion.tsx';
import { LetraGrande } from '../../ui/letra.tsx';
import '../../ui/herramientas.css';
import './herramientas.css';

// Tu equipamiento y las herramientas del teléfono (lote 2.4): pantallas del kit v3 sin la cabecera vieja. Las raíz
// (Tu equipamiento, Herramientas del teléfono) traen la barra de pestañas; el resto, la barra compacta con Volver.
// Las que usan la cámara ocupan toda la pantalla.
export default function LayoutHerramientas({ children }: { children: ReactNode }) {
  return (
    <div className="he-app">
      <BannerPrueba />
      <AvisoSinConexion />
      <main id="contenido" className="he-app__cuerpo">
        <GuardiaApp>
          <LetraGrande />
          {children}
        </GuardiaApp>
      </main>
    </div>
  );
}
