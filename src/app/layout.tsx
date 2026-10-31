import '@fontsource-variable/archivo/wdth.css';
import '@fontsource-variable/dm-sans/index.css';
import './globals.css';
import '../kit/kit.css';
import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { colores, variablesCss } from '../brand/tokens.ts';
import { RegistrarSw } from '../components/RegistrarSw.tsx';
import { ProveedorIsla } from '../kit/Efectos.tsx';
import { Proveedor } from './contexto.tsx';

const base = process.env.NEXT_PUBLIC_BASE_PATH ?? '';
// Con la API real, la conexión a su dominio (DNS, TCP y TLS) se abre mientras baja la app: el primer pedido no la espera.
const origenApi = process.env.NEXT_PUBLIC_DATA_SOURCE === 'http' && process.env.NEXT_PUBLIC_API_BASE_URL ? new URL(process.env.NEXT_PUBLIC_API_BASE_URL).origin : null;

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
        {/* Con credenciales: es la misma conexión que usan los pedidos con la cookie de sesión. */}
        {origenApi ? <link rel="preconnect" href={origenApi} crossOrigin="use-credentials" /> : null}
      </head>
      <body>
        <a className="saltar" href="#contenido">
          Ir al contenido
        </a>
        <ProveedorIsla>
          <Proveedor>{children}</Proveedor>
        </ProveedorIsla>
        <RegistrarSw />
      </body>
    </html>
  );
}
