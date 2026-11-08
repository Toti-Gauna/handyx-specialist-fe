import type { ReactNode } from 'react';
import { BannerPrueba } from '../../components/BannerPrueba.tsx';
import { GuardiaApp } from '../../components/GuardiaApp.tsx';
import { AvisoSinConexion } from '../../components/SinConexion.tsx';
import { VigiaAvisos } from '../../components/VigiaAvisos.tsx';
import '../../pantallas/modo/modo.css';

// Modo trabajo y cierre (lote 2.3). Sin barra de pestañas: el Modo trabajo trae su cabecera azul y el resto, la barra
// compacta del kit v3. Lo que se guarda necesita conexión (sin cola offline): el aviso de sin conexión queda arriba.
export default function LayoutModo({ children }: { children: ReactNode }) {
  return (
    <div className="mt-app">
      <BannerPrueba />
      <AvisoSinConexion />
      <main id="contenido" className="mt-app__cuerpo">
        <GuardiaApp>
          <VigiaAvisos />
          {children}
        </GuardiaApp>
      </main>
    </div>
  );
}
