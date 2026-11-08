import type { ReactNode } from 'react';
import { BannerPrueba } from '../../components/BannerPrueba.tsx';
import { GuardiaApp } from '../../components/GuardiaApp.tsx';
import { AvisoSinConexion } from '../../components/SinConexion.tsx';
import { VigiaAvisos } from '../../components/VigiaAvisos.tsx';
import { LetraGrande } from '../../ui/letra.tsx';
import './taller-grupo.css';

// Pestaña Taller (lote 2.1): la pantalla del Taller, la agenda, los ingresos y el gasto. Sin la cabecera vieja de la app:
// cada pantalla trae su encabezado del kit v3 y las raíces (Taller y Agenda) llevan la barra de pestañas.
export default function LayoutTaller({ children }: { children: ReactNode }) {
  return (
    <div className="tg-app">
      <BannerPrueba />
      <AvisoSinConexion />
      <main id="contenido" className="tg-app__cuerpo">
        <GuardiaApp>
          <VigiaAvisos />
          <LetraGrande />
          {children}
        </GuardiaApp>
      </main>
    </div>
  );
}
