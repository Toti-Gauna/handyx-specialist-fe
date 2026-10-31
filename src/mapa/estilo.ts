// Estilo Handyx del mapa (lote 4.3): manzanas en gris mosaico, calles blancas, avenidas en azul pálido, el mar en el azul
// de la demo y la ruta en el azul de la marca. Sin textos en las teselas (no hace falta un servidor de fuentes): las
// etiquetas de barrio son elementos HTML con DM Sans. Las teselas son propias (scripts/mapa) y se sirven del mismo hosting.
import type { ExpressionSpecification, StyleSpecification } from 'maplibre-gl';
import { colores } from '../brand/tokens.ts';

/** Lo que escribe scripts/mapa/generar.ts junto a las teselas (public/mapa/meta.json). */
export interface MetaTeselas {
  version: 1;
  /** Oeste, sur, este, norte. */
  limites: [number, number, number, number];
  zMin: number;
  zMax: number;
  /** Fecha del extracto de OpenStreetMap. */
  fecha: string;
}

export const ATRIBUCION_OSM = '© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>';

/** Colores del mapa: los de la marca, más los tonos de agua, verde y arena que no están en los tokens. */
export const COLORES_MAPA = {
  tierra: colores.mosaico,
  mar: '#bcd3f2',
  verde: '#d9ead3',
  arena: '#f3edc6',
  calle: '#ffffff',
  borde: '#dadde3',
  avenida: '#d4e0f5',
  ruta: colores.azulPersonajes,
  rutaBorde: colores.azul,
  zona: colores.azul,
} as const;

/** Estilo base. Sin `meta` (todavía no se generaron las teselas) queda solo el fondo y las capas propias. */
export function estiloHandyx(urlTeselas: string | null, meta: MetaTeselas | null): StyleSpecification {
  const conBase = urlTeselas !== null && meta !== null;
  const ancho = (base: number): ExpressionSpecification => ['interpolate', ['exponential', 1.6], ['zoom'], 12, base * 0.4, 16, base * 2.2, 18, base * 6];
  return {
    version: 8,
    sources: conBase
      ? {
          base: {
            type: 'vector',
            tiles: [urlTeselas],
            minzoom: meta.zMin,
            maxzoom: meta.zMax,
            bounds: meta.limites,
            attribution: ATRIBUCION_OSM,
          },
        }
      : {},
    layers: [
      { id: 'fondo', type: 'background', paint: { 'background-color': COLORES_MAPA.tierra } },
      ...(conBase
        ? ([
            { id: 'mar', type: 'fill', source: 'base', 'source-layer': 'mar', paint: { 'fill-color': COLORES_MAPA.mar } },
            { id: 'agua', type: 'fill', source: 'base', 'source-layer': 'agua', paint: { 'fill-color': COLORES_MAPA.mar } },
            { id: 'verde', type: 'fill', source: 'base', 'source-layer': 'verde', paint: { 'fill-color': COLORES_MAPA.verde } },
            { id: 'playa', type: 'fill', source: 'base', 'source-layer': 'playa', paint: { 'fill-color': COLORES_MAPA.arena } },
            {
              id: 'calles-borde',
              type: 'line',
              source: 'base',
              'source-layer': 'calles',
              filter: ['in', ['get', 'clase'], ['literal', ['calle', 'secundaria', 'avenida', 'autopista']]],
              minzoom: 13,
              layout: { 'line-cap': 'round', 'line-join': 'round' },
              paint: { 'line-color': COLORES_MAPA.borde, 'line-width': ['interpolate', ['exponential', 1.6], ['zoom'], 13, 1.4, 16, 6, 18, 15] },
            },
            {
              id: 'calles-servicio',
              type: 'line',
              source: 'base',
              'source-layer': 'calles',
              filter: ['==', ['get', 'clase'], 'servicio'],
              minzoom: 15,
              layout: { 'line-cap': 'round', 'line-join': 'round' },
              paint: { 'line-color': COLORES_MAPA.calle, 'line-width': ancho(0.8) },
            },
            {
              id: 'calles',
              type: 'line',
              source: 'base',
              'source-layer': 'calles',
              filter: ['in', ['get', 'clase'], ['literal', ['calle', 'secundaria']]],
              layout: { 'line-cap': 'round', 'line-join': 'round' },
              paint: { 'line-color': COLORES_MAPA.calle, 'line-width': ancho(1.6) },
            },
            {
              id: 'avenidas',
              type: 'line',
              source: 'base',
              'source-layer': 'calles',
              filter: ['in', ['get', 'clase'], ['literal', ['avenida', 'autopista']]],
              layout: { 'line-cap': 'round', 'line-join': 'round' },
              paint: { 'line-color': COLORES_MAPA.avenida, 'line-width': ancho(2.6) },
            },
          ] satisfies StyleSpecification['layers'])
        : []),
    ],
  };
}
