import type { ReactNode } from 'react';
import { BannerPrueba } from '../../components/BannerPrueba.tsx';
import { AvisoSinConexion } from '../../components/SinConexion.tsx';

// Acceso (lote 1.1): bienvenida, entrar, la segunda verificación y recuperar la contraseña. Pantalla completa con la
// plantilla PantallaAcceso del kit v3, sin la cabecera de la app ni pestañas (todavía no hay sesión).
export default function LayoutAcceso({ children }: { children: ReactNode }) {
  return (
    <div className="ui-marco-acceso">
      <BannerPrueba />
      <AvisoSinConexion />
      <main id="contenido" className="ui-marco-acceso__cuerpo">
        {children}
      </main>
    </div>
  );
}
