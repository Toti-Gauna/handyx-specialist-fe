import type { ReactNode } from 'react';
import { BannerPrueba } from '../../components/BannerPrueba.tsx';
import { GuardiaApp } from '../../components/GuardiaApp.tsx';
import { AvisoSinConexion } from '../../components/SinConexion.tsx';
import './presupuestos.css';

// Presupuestos y lista de precios (lote 2.2): pantallas secundarias del kit v3 (barra compacta con Volver y la acción
// principal fija abajo), sin la cabecera vieja ni la barra de pestañas.
export default function LayoutPresupuestos({ children }: { children: ReactNode }) {
  return (
    <div className="pr-app">
      <BannerPrueba />
      <AvisoSinConexion />
      <main id="contenido" className="pr-app__cuerpo">
        <GuardiaApp>{children}</GuardiaApp>
      </main>
    </div>
  );
}
