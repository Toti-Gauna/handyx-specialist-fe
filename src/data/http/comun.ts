// Ayudas comunes de los adaptadores HTTP por dominio.
import { z } from 'zod';

/** Respuesta sin cuerpo (204). */
export const Nada = z.undefined();
/** Id seguro para un segmento de la ruta. */
export const id = (v: string): string => encodeURIComponent(v);
