// Recuadros de los datos del mapa (lote 4.3). Oeste, sur, este, norte.
import type { Bbox } from '../../src/mapa/osm.ts';

/** Mar del Plata y Batán, con margen: lo que cubren las teselas. */
export const RECUADRO_MAPA: Bbox = [-57.78, -38.2, -57.5, -37.88];

/**
 * Lo que cubre el grafo del mock: el centro y los barrios de prueba (Constitución a Punta Mogotes). Más chico que el
 * mapa para que el archivo del mock no pese de más; el motor real (fase 5) usa toda la ciudad.
 */
export const RECUADRO_GRAFO: Bbox = [-57.62, -38.085, -57.525, -37.955];

/** Zooms de las teselas. Más allá del 14 MapLibre agranda las del 14 (las calles se ven nítidas igual: son vectores). */
export const ZOOM_MIN = 10;
export const ZOOM_MAX = 14;
