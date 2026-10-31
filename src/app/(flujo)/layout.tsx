import type { ReactNode } from 'react';
import { BannerPrueba } from '../../components/BannerPrueba.tsx';
import { GuardiaApp } from '../../components/GuardiaApp.tsx';
import { AvisoSinConexion } from '../../components/SinConexion.tsx';
import './flujo.css';

// Flujos guiados a pantalla completa (4.4: el alta · 4.5: tu precio): sin la cabecera de la app ni las pestañas, con barra compacta
// y la acción principal fija abajo.
export default function LayoutFlujo({ children }: { children: ReactNode }) {
  return (
    <div className="fl">
      <BannerPrueba />
      <AvisoSinConexion />
      <main id="contenido" className="fl-cuerpo">
        <GuardiaApp>{children}</GuardiaApp>
      </main>
    </div>
  );
}
