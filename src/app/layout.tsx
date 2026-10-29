import '@fontsource-variable/archivo/wdth.css';
import '@fontsource-variable/dm-sans/index.css';
import './globals.css';
import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { colores, variablesCss } from '../brand/tokens.ts';
import { RegistrarSw } from '../components/RegistrarSw.tsx';
import { Proveedor } from './contexto.tsx';

const base = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

export const metadata: Metadata = {
  title: { default: 'Handyx · Especialistas', template: '%s · Handyx Especialistas' },
  description: 'App de especialistas de Handyx: pedidos, propuestas, agenda y trabajos en Mar del Plata.',
  manifest: `${base}/manifest.webmanifest`,
  icons: { icon: `${base}/icono-app-192.png`, apple: `${base}/icono-app-180.png` },
  robots: { index: false, follow: false },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: colores.azul,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es-AR">
      <head>
        {/* Tokens de marca (copia de Handy-landing-page-fe/src/brand/tokens.ts) como variables CSS. */}
        <style dangerouslySetInnerHTML={{ __html: variablesCss() }} />
      </head>
      <body>
        <a className="saltar" href="#contenido">
          Ir al contenido
        </a>
        <Proveedor>{children}</Proveedor>
        <RegistrarSw />
      </body>
    </html>
  );
}
