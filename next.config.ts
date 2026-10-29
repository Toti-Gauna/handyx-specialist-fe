import type { NextConfig } from 'next';

// Hostinger sirve archivos estáticos: exportación pura, sin SSR, Route Handlers ni middleware de Next.
// Cada ruta es una carpeta con su index.html (trailingSlash), como la landing.
//
// `@handyx/origen-datos` se resuelve en build: con NEXT_PUBLIC_DATA_SOURCE=http el bundle solo lleva el
// adaptador HTTP; el mock y sus fixtures no entran (scripts/verificar-bundle.mjs lo comprueba).
const origen = process.env.NEXT_PUBLIC_DATA_SOURCE === 'http' ? './src/data/origen.http.ts' : './src/data/origen.mock.ts';

const config: NextConfig = {
  output: 'export',
  trailingSlash: true,
  images: { unoptimized: true },
  poweredByHeader: false,
  reactStrictMode: true,
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || undefined,
  turbopack: { resolveAlias: { '@handyx/origen-datos': origen } },
};

export default config;
