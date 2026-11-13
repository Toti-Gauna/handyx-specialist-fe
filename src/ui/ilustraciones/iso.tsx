// Piezas de dibujo isométrico de las ilustraciones (estilo de la ciudad de la landing): prismas con tres caras de la
// paleta de marca, ventanas amarillas, cilindros y árboles. Proyección 2:1 (30°): x hacia abajo a la derecha, y hacia
// abajo a la izquierda, z hacia arriba. Todo es decorativo; el texto importante va siempre fuera del dibujo.
import type { ReactNode } from 'react';

export const PALETA = {
  azul: '#1F57A8',
  hondo: '#143E7E',
  tinta: '#0E1D36',
  noche: '#1D2C4A',
  ui: '#4A72B0',
  tinte: '#E9EFF9',
  claro: '#C9D7EE',
  ventana: '#F5F59A',
  ventanaApagada: '#2F5FA6',
  blanco: '#FFFFFF',
  mosaico: '#ECECEC',
  gris: '#B8BFCC',
  mar: '#DCE6F5',
} as const;

const C = 0.866;

/** Punto isométrico: devuelve las coordenadas de pantalla de (x, y, z). */
export function pt(x: number, y: number, z: number): [number, number] {
  return [Math.round((x - y) * C * 100) / 100, Math.round(((x + y) * 0.5 - z) * 100) / 100];
}

const pts = (lista: Array<[number, number, number]>) => lista.map(([x, y, z]) => pt(x, y, z).join(',')).join(' ');

export interface Tonos {
  arriba: string;
  izquierda: string;
  derecha: string;
}

export const TONOS_AZUL: Tonos = { arriba: PALETA.ui, izquierda: PALETA.azul, derecha: PALETA.hondo };
export const TONOS_CLARO: Tonos = { arriba: PALETA.blanco, izquierda: PALETA.tinte, derecha: PALETA.claro };
export const TONOS_NOCHE: Tonos = { arriba: PALETA.hondo, izquierda: PALETA.noche, derecha: PALETA.tinta };
export const TONOS_AMARILLO: Tonos = { arriba: '#FBFBC8', izquierda: PALETA.ventana, derecha: '#D8D65E' };
export const TONOS_GRIS: Tonos = { arriba: PALETA.blanco, izquierda: PALETA.mosaico, derecha: PALETA.gris };

/** Prisma (caja) en (x, y, z) de ancho w (eje x), fondo d (eje y) y alto h. */
export function Prisma({ x, y, z = 0, w, d, h, tonos = TONOS_AZUL, children }: { x: number; y: number; z?: number; w: number; d: number; h: number; tonos?: Tonos; children?: ReactNode }) {
  return (
    <g>
      <polygon fill={tonos.izquierda} points={pts([[x, y + d, z], [x + w, y + d, z], [x + w, y + d, z + h], [x, y + d, z + h]])} />
      <polygon fill={tonos.derecha} points={pts([[x + w, y, z], [x + w, y + d, z], [x + w, y + d, z + h], [x + w, y, z + h]])} />
      <polygon fill={tonos.arriba} points={pts([[x, y, z + h], [x + w, y, z + h], [x + w, y + d, z + h], [x, y + d, z + h]])} />
      {children}
    </g>
  );
}

/**
 * Ventanas sobre una cara de un prisma: `cara` "izquierda" (la que mira a +y) o "derecha" (+x). Filas y columnas
 * repartidas; `encendidas` decide cuáles son amarillas (el resto, apagadas), con una semilla fija para que no cambie.
 */
export function Ventanas({
  x,
  y,
  z = 0,
  w,
  d,
  h,
  cara,
  filas,
  columnas,
  encendidas = 0.5,
  semilla = 1,
}: {
  x: number;
  y: number;
  z?: number;
  w: number;
  d: number;
  h: number;
  cara: 'izquierda' | 'derecha';
  filas: number;
  columnas: number;
  encendidas?: number;
  semilla?: number;
}) {
  const largo = cara === 'izquierda' ? w : d;
  const paso = largo / columnas;
  const alto = h / filas;
  const vw = paso * 0.42;
  const vh = alto * 0.48;
  const lista: ReactNode[] = [];
  let s = semilla;
  for (let f = 0; f < filas; f++) {
    for (let c = 0; c < columnas; c++) {
      s = (s * 9301 + 49297) % 233280;
      const on = s / 233280 < encendidas;
      const a = c * paso + (paso - vw) / 2;
      const zz = z + f * alto + (alto - vh) / 2;
      const quad: Array<[number, number, number]> =
        cara === 'izquierda'
          ? [[x + a, y + d, zz], [x + a + vw, y + d, zz], [x + a + vw, y + d, zz + vh], [x + a, y + d, zz + vh]]
          : [[x + w, y + a, zz], [x + w, y + a + vw, zz], [x + w, y + a + vw, zz + vh], [x + w, y + a, zz + vh]];
      lista.push(<polygon key={`${f}-${c}`} className={on ? 'ui-ilu__ventana' : undefined} fill={on ? PALETA.ventana : PALETA.ventanaApagada} points={pts(quad)} />);
    }
  }
  return <g>{lista}</g>;
}

/** Cilindro vertical (faro, garrafa, caño parado): cuerpo con sombra a la derecha y tapa elíptica. */
export function Cilindro({ x, y, z = 0, r, h, tono = PALETA.azul, sombra = PALETA.hondo, tapa = PALETA.ui }: { x: number; y: number; z?: number; r: number; h: number; tono?: string; sombra?: string; tapa?: string }) {
  const [cx, cyBase] = pt(x, y, z);
  const cyTop = cyBase - h;
  const rx = r * C * 1.414;
  const ry = rx / 2;
  return (
    <g>
      <path fill={tono} d={`M${cx - rx},${cyTop} L${cx - rx},${cyBase} A${rx},${ry} 0 0 0 ${cx + rx},${cyBase} L${cx + rx},${cyTop} Z`} />
      <path fill={sombra} d={`M${cx},${cyTop + ry} L${cx},${cyBase + ry} A${rx},${ry} 0 0 0 ${cx + rx},${cyBase} L${cx + rx},${cyTop} Z`} opacity="0.85" />
      <ellipse fill={tapa} cx={cx} cy={cyTop} rx={rx} ry={ry} />
    </g>
  );
}

/** Árbol de copa redonda sobre un tronco corto (azules: la paleta de la ciudad). */
export function Arbol({ x, y, tam = 1 }: { x: number; y: number; tam?: number }) {
  const [cx, cy] = pt(x, y, 0);
  return (
    <g>
      <rect x={cx - 1.5 * tam} y={cy - 10 * tam} width={3 * tam} height={10 * tam} rx={1} fill={PALETA.tinta} />
      <circle cx={cx} cy={cy - 15 * tam} r={8 * tam} fill={PALETA.hondo} />
      <circle cx={cx - 2.5 * tam} cy={cy - 17 * tam} r={4.5 * tam} fill={PALETA.azul} />
    </g>
  );
}

/** Losa del piso (rombo) en z = 0. */
export function Piso({ x, y, w, d, color = PALETA.tinte }: { x: number; y: number; w: number; d: number; color?: string }) {
  return <polygon fill={color} points={pts([[x, y, 0], [x + w, y, 0], [x + w, y + d, 0], [x, y + d, 0]])} />;
}

/** Polígono libre con puntos isométricos (techos, rampas). */
export function Poli({ puntos, fill, className }: { puntos: Array<[number, number, number]>; fill: string; className?: string }) {
  return <polygon className={className} fill={fill} points={pts(puntos)} />;
}
