import type { ReactNode } from 'react';
import { BannerPrueba } from '../../components/BannerPrueba.tsx';
import { GuardiaApp } from '../../components/GuardiaApp.tsx';
import { AvisoSinConexion } from '../../components/SinConexion.tsx';
import { VigiaAvisos } from '../../components/VigiaAvisos.tsx';
import { FocoEnDialogos } from '../../ui/organismos/FocoEnDialogos.tsx';
import './nucleo.css';

// Núcleo del especialista (lote 1.3): Inicio con el mapa de arreglos, el pedido, tu precio, el trabajo, el viaje y el
// cobro. Sin la cabecera vieja de la app: cada pantalla trae su cabecera del kit v3 (la azul en el Inicio, la compacta en
// el resto) y solo el Inicio lleva la barra de pestañas.
export default function LayoutNucleo({ children }: { children: ReactNode }) {
  return (
    <div className="nu-app">
      <BannerPrueba />
      <FocoEnDialogos />
      <AvisoSinConexion />
      <main id="contenido" className="nu-app__cuerpo">
        <GuardiaApp>
          <VigiaAvisos />
          {children}
        </GuardiaApp>
      </main>
    </div>
  );
}
