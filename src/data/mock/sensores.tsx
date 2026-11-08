// Sensores simulados de la vista previa (lote 2.4). Solo en el mock: nunca abre la cámara, no usa fotos reales ni el
// giroscopio. Las escenas son dibujos propios; la vuelta del escaneo sale de escaneoPrueba.ts (un termotanque de prueba).
import { fotoPrueba, puntasTarjeta, TERMOTANQUE_PRUEBA, vueltaPrueba } from '../../herramientas/escaneoPrueba.ts';
import type { Punto2 } from '../../herramientas/medir.ts';
import type { SensoresPrueba } from '../sensores.ts';

const svg = (cuerpo: string, w: number, h: number) => `data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${cuerpo}</svg>`)}`;

// Foto de prueba para medir: el hueco de una ventana de 1,42 × 1,68 m y una tarjeta apoyada en la pared, a 2,5 mm por
// píxel (la tarjeta de 85,6 mm ocupa 34 px).
const MEDIR = { ancho: 720, alto: 960 };
const HUECO = { x0: 76, y0: 140, x1: 644, y1: 812 };
const TARJETA: [Punto2, Punto2] = [
  [96, 892],
  [130.24, 892],
];
const FOTO_MEDIR = svg(
  `<rect width="720" height="960" fill="#C9C3B6"/><rect y="900" width="720" height="60" fill="#8C7A64"/>` +
    `<rect x="${HUECO.x0}" y="${HUECO.y0}" width="${HUECO.x1 - HUECO.x0}" height="${HUECO.y1 - HUECO.y0}" fill="#E9E6DD" stroke="#D9D4C8" stroke-width="20"/>` +
    `<rect x="${HUECO.x0 + 40}" y="${HUECO.y0 + 40}" width="${HUECO.x1 - HUECO.x0 - 80}" height="${HUECO.y1 - HUECO.y0 - 80}" fill="#DCE6F5"/>` +
    `<rect x="96" y="881" width="34.24" height="21.6" rx="2" fill="#1F57A8"/><rect x="99" y="885" width="10" height="7" rx="1" fill="#F5F59A"/>` +
    `<text x="360" y="60" font-family="sans-serif" font-size="26" text-anchor="middle" fill="#26324a">Simulación · hueco de prueba</text>`,
  MEDIR.ancho,
  MEDIR.alto,
);

const ESCANEAR = svg(
  `<rect width="390" height="844" fill="#2A2F38"/><rect y="470" width="390" height="374" fill="#8C7A64"/>` +
    `<rect x="130" y="300" width="130" height="190" rx="18" fill="#F2F2F2"/><rect x="225" y="300" width="35" height="190" rx="10" fill="#D8D8D8"/>` +
    `<circle cx="195" cy="355" r="15" fill="#B8BFCC"/><rect x="130" y="380" width="130" height="8" fill="#1F57A8"/>`,
  390,
  844,
);
const LUPA = svg(
  `<rect width="390" height="844" fill="#D9D4C8"/><rect x="40" y="300" width="310" height="200" rx="14" fill="#F2F2F2" stroke="#B8BFCC" stroke-width="4"/>` +
    `<text x="195" y="370" font-family="sans-serif" font-size="22" font-weight="700" text-anchor="middle" fill="#26324a">MODELO DE PRUEBA</text>` +
    `<text x="195" y="410" font-family="sans-serif" font-size="18" text-anchor="middle" fill="#26324a">220 V ~ 50 Hz · 2000 W</text>` +
    `<text x="195" y="445" font-family="sans-serif" font-size="14" text-anchor="middle" fill="#26324a">Simulación</text>`,
  390,
  844,
);
const BARRAS = Array.from({ length: 34 }, (_, i) => `<rect x="${85 + i * 6.5}" y="360" width="${i % 3 === 0 ? 4 : 2}" height="110" fill="#0E1D36"/>`).join('');
const CODIGO = svg(`<rect width="390" height="844" fill="#8C7A64"/><rect x="55" y="300" width="280" height="240" rx="10" fill="#F2F2F2"/>${BARRAS}<text x="195" y="500" font-family="monospace" font-size="20" text-anchor="middle" fill="#0E1D36">7790000000017</text>`, 390, 844);

const ESCENAS = { medir: FOTO_MEDIR, escanear: ESCANEAR, lupa: LUPA, codigo: CODIGO } as const;

function Escena({ tipo }: { tipo: keyof typeof ESCENAS }) {
  return <img className="ui-camara__simulada" src={ESCENAS[tipo]} alt="" aria-hidden="true" />;
}

/** La primera foto del escaneo, grande, para marcar la tarjeta (se dibuja en un lienzo: solo en el navegador). */
function primeraGrande(): { url: string; ancho: number; alto: number; tarjeta: [Punto2, Punto2] } {
  const o = { ancho: 720, alto: 540, metrosPorPx: 0.85 / 420, corrimiento: -2, tarjeta: true };
  const f = fotoPrueba(TERMOTANQUE_PRUEBA, 0, 30, o);
  const c = document.createElement('canvas');
  c.width = f.ancho;
  c.height = f.alto;
  c.getContext('2d')?.putImageData(new ImageData(new Uint8ClampedArray(f.datos), f.ancho, f.alto), 0, 0);
  return { url: c.toDataURL('image/png'), ancho: f.ancho, alto: f.alto, tarjeta: puntasTarjeta(o) };
}

export const sensoresPrueba: SensoresPrueba = {
  aviso: 'Cámara simulada: no se usa la tuya',
  Escena,
  fotoMedir: () => ({
    url: FOTO_MEDIR,
    ...MEDIR,
    tarjeta: TARJETA,
    puntos: [
      [HUECO.x0, HUECO.y0],
      [HUECO.x1, HUECO.y0],
      [HUECO.x1, HUECO.y1],
    ],
  }),
  vuelta: (n, anchoProceso) => ({
    fotos: vueltaPrueba(TERMOTANQUE_PRUEBA, n, { ancho: anchoProceso, alto: Math.round(anchoProceso * 0.75), metrosPorPx: (0.85 / 420) * (720 / anchoProceso) }),
    primera: primeraGrande(),
  }),
  orientacion: { beta: 0.1, gamma: -0.4 },
  codigoBarras: '7790000000017',
  sinProceso: typeof location !== 'undefined' && new URLSearchParams(location.search).get('simular') === 'sin-proceso',
};
