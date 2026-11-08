import type { ReactNode } from 'react';
import { BannerPrueba } from '../../components/BannerPrueba.tsx';
import { AvisoSinConexion } from '../../components/SinConexion.tsx';
import './registro.css';

// Registro y onboarding (lote 1.2) con el kit v3: pantalla completa, sin la cabecera de la app ni pestañas. Crear la
// cuenta (RG-1) no pide sesión; lo de /alta/ pasa por la guardia (alta/layout.tsx).
export default function LayoutRegistro({ children }: { children: ReactNode }) {
  return (
    <div className="rg-app">
      <BannerPrueba />
      <AvisoSinConexion />
      <main id="contenido" className="rg-app__cuerpo">
        {children}
      </main>
    </div>
  );
}
