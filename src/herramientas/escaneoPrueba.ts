// Fotos sintéticas para el escaneo 3D (lote 2.4): un termotanque (o una caja, como un aire acondicionado) sobre una
// pared y un piso, visto desde cada toma de la vuelta, con un poco de ruido como una foto real. Las usan las pruebas y
// la cámara simulada de la vista previa (datos de prueba): nunca una foto real. No entra en producción (solo lo importan
// el mock y las pruebas).
import { TARJETA_LARGO_MM } from './medir.ts';
import type { Fotograma } from './escaneo.ts';

export interface ObjetoPrueba {
  forma: 'redondo' | 'caja';
  altoM: number;
  /** Redondo: diámetro. Caja: ancho de frente. */
  anchoM: number;
  /** Caja: fondo. */
  fondoM?: number;
}

export const TERMOTANQUE_PRUEBA: ObjetoPrueba = { forma: 'redondo', altoM: 0.85, anchoM: 0.45 };

const PARED = [201, 195, 182] as const;
const PISO = [140, 122, 100] as const;
const CUERPO = [242, 242, 242] as const;
const SOMBRA = [214, 214, 214] as const;
const ZOCALO = [40, 48, 63] as const;
const AZUL = [31, 87, 168] as const;

/** Generador pseudoaleatorio con semilla (las pruebas tienen que dar siempre lo mismo). */
function azar(semilla: number) {
  let s = semilla >>> 0 || 1;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 0x1_0000_0000;
  };
}

export interface OpcionesFoto {
  ancho: number;
  alto: number;
  /** Metros por píxel a la distancia del objeto. */
  metrosPorPx: number;
  /** Con la tarjeta de referencia apoyada al frente (la primera foto). */
  tarjeta?: boolean;
  /** Corrimiento del centro en píxeles (nadie encuadra perfecto). */
  corrimiento?: number;
  ruido?: number;
}

/** Dónde quedan las puntas de la tarjeta en la foto (para la vista previa, que arranca con los puntos ahí). */
export function puntasTarjeta(o: OpcionesFoto): [readonly [number, number], readonly [number, number]] {
  const largo = TARJETA_LARGO_MM / 1000 / o.metrosPorPx;
  const cx = o.ancho / 2 + (o.corrimiento ?? 0);
  const cy = Math.round(o.alto * 0.5);
  return [
    [cx - largo / 2, cy],
    [cx + largo / 2, cy],
  ];
}

/** La toma `i` de `n` alrededor del objeto. */
export function fotoPrueba(objeto: ObjetoPrueba, i: number, n: number, o: OpcionesFoto): Fotograma {
  const { ancho: W, alto: H, metrosPorPx: k } = o;
  const datos = new Uint8ClampedArray(W * H * 4);
  const r = azar(1000 + i * 7919);
  const ruido = o.ruido ?? 5;
  const horizonte = Math.round(H * 0.72);
  const base = Math.round(H * 0.88);
  const altoPx = objeto.altoM / k;
  const a = (2 * Math.PI * i) / n;
  const anchoPx = objeto.forma === 'redondo' ? objeto.anchoM / k : (Math.abs(objeto.anchoM * Math.cos(a)) + Math.abs((objeto.fondoM ?? objeto.anchoM) * Math.sin(a))) / k;
  const cx = W / 2 + (o.corrimiento ?? 0);
  const medio = anchoPx / 2;
  const domo = objeto.forma === 'redondo' ? medio * 0.35 : 0;
  const arriba = base - altoPx;
  const zocalo = altoPx * 0.04;
  const largoTarjeta = TARJETA_LARGO_MM / 1000 / k;
  const [[tx0], [tx1]] = puntasTarjeta(o);
  const ty0 = H * 0.5 - (largoTarjeta * 0.63) / 2;
  const ty1 = H * 0.5 + (largoTarjeta * 0.63) / 2;
  // La sombra del costado gira con la vuelta (para que se parezca a una foto; no cambia la silueta).
  const lado = Math.sin(a) >= 0 ? 1 : -1;

  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      let c: readonly number[] = y < horizonte ? PARED : PISO;
      const dx = x + 0.5 - cx;
      const enCuerpo = Math.abs(dx) <= medio && y + 0.5 >= arriba + domo && y + 0.5 <= base;
      const enDomo = domo > 0 && y + 0.5 < arriba + domo && y + 0.5 >= arriba && (dx / medio) ** 2 + ((arriba + domo - (y + 0.5)) / domo) ** 2 <= 1;
      if (enCuerpo || enDomo) {
        c = y + 0.5 > base - zocalo ? ZOCALO : dx * lado > medio * 0.55 ? SOMBRA : CUERPO;
        if (enCuerpo && Math.abs(y + 0.5 - (arriba + altoPx * 0.38)) < Math.max(1, altoPx * 0.02)) c = AZUL;
      }
      if (o.tarjeta && x + 0.5 >= tx0 && x + 0.5 <= tx1 && y + 0.5 >= ty0 && y + 0.5 <= ty1) c = AZUL;
      const p = (y * W + x) * 4;
      for (let q = 0; q < 3; q++) datos[p + q] = c[q]! + Math.round((r() * 2 - 1) * ruido);
      datos[p + 3] = 255;
    }
  }
  return { ancho: W, alto: H, datos };
}

/** Las n tomas de la vuelta, achicadas para procesar. La primera, con la tarjeta. */
export function vueltaPrueba(objeto: ObjetoPrueba, n: number, o: Omit<OpcionesFoto, 'tarjeta' | 'corrimiento'>): Fotograma[] {
  return Array.from({ length: n }, (_, i) => fotoPrueba(objeto, i, n, { ...o, tarjeta: i === 0, corrimiento: ((i * 37) % 5) - 2 }));
}
