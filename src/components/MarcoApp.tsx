'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { NAV, RUTAS } from '../app/rutas.ts';
import { BannerPrueba } from './BannerPrueba.tsx';
import { Icono } from './Icono.tsx';

const base = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

export function MarcoApp({ children }: { children: ReactNode }) {
  const actual = usePathname();
  return (
    <div className="app">
      <BannerPrueba />
      <header className="app-cabecera">
        <Link href={RUTAS.inicio.ruta} className="app-logo" aria-label="Handyx · Inicio">
          <img src={`${base}/logo-handyx.webp`} alt="" width={120} height={34} />
          <small>ESPECIALISTAS</small>
        </Link>
        <Link href={RUTAS.notificaciones.ruta} className="app-cuadrado" aria-label="Avisos">
          <Icono nombre="campana" />
        </Link>
      </header>
      <main id="contenido" className="app-cuerpo">
        {children}
      </main>
      <nav className="app-nav" aria-label="Secciones">
        {NAV.map((clave) => {
          const r = RUTAS[clave];
          const activo = actual?.startsWith(r.ruta) ?? false;
          return (
            <Link
              key={clave}
              href={r.ruta}
              className={`app-nav__item${activo ? ' app-nav__item--activo' : ''}`}
              aria-current={activo ? 'page' : undefined}
            >
              <Icono nombre={r.nav.icono} />
              {r.nav.texto}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
