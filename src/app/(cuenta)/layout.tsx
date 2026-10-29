import type { ReactNode } from 'react';
import { BannerPrueba } from '../../components/BannerPrueba.tsx';
import { AvisoSinConexion } from '../../components/SinConexion.tsx';
import './cuenta.css';

// Bienvenida, entrar, crear cuenta, verificar el email y recuperar el acceso (lote 4.2): pantalla completa, sin la
// cabecera de la app ni pestañas (todavía no hay una cuenta lista).
export default function LayoutCuenta({ children }: { children: ReactNode }) {
  return (
    <div className="cu">
      <BannerPrueba />
      <AvisoSinConexion />
      <main id="contenido" className="cu-cuerpo">
        {children}
      </main>
    </div>
  );
}
