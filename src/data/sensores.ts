import type { ReactNode } from 'react';
import type { Fotograma } from '../herramientas/escaneo.ts';
import type { Punto2 } from '../herramientas/medir.ts';

/** Una foto (en memoria) con su tamaño en píxeles y, si la hay, dónde está la tarjeta de referencia. */
export interface FotoConTarjeta {
  url: string;
  ancho: number;
  alto: number;
  tarjeta: [Punto2, Punto2];
}

/**
 * Sensores simulados de la vista previa (lote 2.4): cámara, giroscopio y lector de códigos para recorrer las
 * herramientas del teléfono sin abrir la cámara ni moverse. Con la API real es null y se usan los del teléfono; así
 * ningún dibujo ni foto de prueba llega al bundle de producción (scripts/verificar-bundle.mjs).
 */
export interface SensoresPrueba {
  /** «Cámara simulada: no se usa la tuya». */
  aviso: string;
  /** Lo que «ve» la cámara simulada en cada herramienta (decorativo). */
  Escena: (p: { tipo: 'medir' | 'escanear' | 'lupa' | 'codigo' }) => ReactNode;
  /** Foto de prueba para medir con la tarjeta y los puntos que «marca» la persona, en orden. */
  fotoMedir(): FotoConTarjeta & { puntos: Punto2[] };
  /** La vuelta de fotos de prueba alrededor de un termotanque: achicadas para procesar y la primera, grande. */
  vuelta(n: number, anchoProceso: number): { fotos: Fotograma[]; primera: FotoConTarjeta };
  /** Inclinación del giroscopio simulado, en grados. */
  orientacion: { beta: number; gamma: number };
  /** Código de barras que «lee» la cámara simulada (el catálogo de prueba lo reconoce). */
  codigoBarras: string;
  /** `?simular=sin-proceso`: el teléfono no puede armar el modelo 3D (para probar el aviso). */
  sinProceso: boolean;
}
