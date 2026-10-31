import type { NextConfig } from 'next';

// Hostinger sirve archivos estáticos: exportación pura, sin SSR, Route Handlers ni middleware de Next.
// Cada ruta es una carpeta con su index.html (trailingSlash), como la landing.
//
// `@handyx/origen-datos` se resuelve en build: con NEXT_PUBLIC_DATA_SOURCE=http el bundle solo lleva el
// adaptador HTTP; el mock y sus fixtures no entran (scripts/verificar-bundle.mjs lo comprueba).
const origen = process.env.NEXT_PUBLIC_DATA_SOURCE === 'http' ? './src/data/origen.http.ts' : './src/data/origen.mock.ts';

const config: NextConfig = {
  output: 'export',
  // Las páginas `page.mock.tsx` (el catálogo del kit) existen solo con el origen de prueba: en producción no son rutas,
  // así que ni se construyen ni entran al bundle (scripts/verificar-bundle.mjs lo comprueba).
  pageExtensions: origen.endsWith('mock.ts') ? ['mock.tsx', 'tsx', 'ts'] : ['tsx', 'ts'],
  trailingSlash: true,
  images: { unoptimized: true },
  poweredByHeader: false,
  reactStrictMode: true,
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || undefined,
  turbopack: { resolveAlias: { '@handyx/origen-datos': origen } },
};

export default config;
