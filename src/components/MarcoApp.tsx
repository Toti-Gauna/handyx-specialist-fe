'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { RUTAS } from '../app/rutas.ts';
import { BarraPestanas } from '../ui/organismos/BarraPestanas.tsx';
import { BannerPrueba } from './BannerPrueba.tsx';
import { Icono } from './Icono.tsx';
import { AvisoSinConexion } from './SinConexion.tsx';

const base = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

export function MarcoApp({ children }: { children: ReactNode }) {
  return (
    <div className="app">
      <BannerPrueba />
      <header className="app-cabecera">
        <Link href={RUTAS.inicio.ruta} className="app-logo">
          <img src={`${base}/logo-handyx.webp`} alt="Handyx" width={120} height={34} />
          <small>ESPECIALISTAS</small>
        </Link>
        <Link href={RUTAS.notificaciones.ruta} className="app-cuadrado" aria-label="Avisos">
          <Icono nombre="campana" />
        </Link>
      </header>
      <AvisoSinConexion />
      <main id="contenido" className="app-cuerpo">
        {children}
      </main>
      <BarraPestanas />
    </div>
  );
}
