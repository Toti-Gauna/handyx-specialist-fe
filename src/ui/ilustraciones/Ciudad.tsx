'use client';
// Mar del Plata isométrica, como la de la landing: edificios de la costa con ventanas amarillas, el torreón, el faro,
// el puerto con un barquito, casas y árboles. Decorativa (aria-hidden). Las ventanas titilan solo sin "reducir movimiento".
import type { ReactNode } from 'react';
import { Arbol, Cilindro, PALETA, Piso, Poli, Prisma, pt, TONOS_AZUL, TONOS_CLARO, TONOS_NOCHE, Ventanas } from './iso.tsx';
import { Lienzo, type PropsIlustracion } from './Lienzo.tsx';

interface Elemento {
  orden: number;
  nodo: ReactNode;
}

function edificio(id: string, x: number, y: number, w: number, d: number, h: number, tonos = TONOS_AZUL, semilla = 1): Elemento {
  const filas = Math.max(1, Math.round(h / 12));
  return {
    orden: x + y,
    nodo: (
      <g key={id}>
        <Prisma x={x} y={y} w={w} d={d} h={h} tonos={tonos} />
        <Ventanas x={x} y={y} w={w} d={d} h={h} cara="izquierda" filas={filas} columnas={Math.max(1, Math.round(w / 8))} semilla={semilla} encendidas={0.55} />
        <Ventanas x={x} y={y} w={w} d={d} h={h} cara="derecha" filas={filas} columnas={Math.max(1, Math.round(d / 8))} semilla={semilla + 7} encendidas={0.35} />
      </g>
    ),
  };
}

function casa(id: string, x: number, y: number): Elemento {
  return {
    orden: x + y,
    nodo: (
      <g key={id}>
        <Prisma x={x} y={y} w={14} d={12} h={9} tonos={TONOS_CLARO} />
        <Poli fill={PALETA.hondo} puntos={[[x, y + 12, 9], [x + 14, y + 12, 9], [x + 14, y + 6, 16], [x, y + 6, 16]]} />
        <Poli fill={PALETA.azul} puntos={[[x + 14, y, 9], [x + 14, y + 12, 9], [x + 14, y + 6, 16]]} />
        <Poli fill={PALETA.ventana} className="ui-ilu__ventana" puntos={[[x + 4, y + 12, 2], [x + 8, y + 12, 2], [x + 8, y + 12, 6], [x + 4, y + 12, 6]]} />
      </g>
    ),
  };
}

function arbol(id: string, x: number, y: number, tam = 1): Elemento {
  return { orden: x + y + 0.5, nodo: <Arbol key={id} x={x} y={y} tam={tam} /> };
}

function torreon(): Elemento {
  const x = 128;
  const y = 92;
  const [cx, cy] = pt(x + 5, y + 5, 46);
  return {
    orden: x + y,
    nodo: (
      <g key="torreon">
        <Prisma x={x - 4} y={y - 4} w={18} d={18} h={8} tonos={TONOS_NOCHE} />
        <Prisma x={x} y={y} w={10} d={10} h={38} tonos={TONOS_CLARO} />
        <Ventanas x={x} y={y} w={10} d={10} h={36} cara="izquierda" filas={3} columnas={1} semilla={3} encendidas={0.8} />
        <polygon fill={PALETA.hondo} points={`${cx},${cy - 16} ${cx - 10},${cy + 6} ${cx + 10},${cy + 6}`} />
        <polygon fill={PALETA.tinta} points={`${cx},${cy - 16} ${cx},${cy + 8} ${cx + 10},${cy + 6}`} />
      </g>
    ),
  };
}

function faro(): Elemento {
  const x = 168;
  const y = 120;
  const [cx, cy] = pt(x, y, 0);
  return {
    orden: x + y,
    nodo: (
      <g key="faro">
        <Piso x={x - 12} y={y - 12} w={24} d={24} color={PALETA.claro} />
        <Cilindro x={x} y={y} r={5} h={44} tono={PALETA.blanco} sombra={PALETA.claro} tapa={PALETA.blanco} />
        <rect x={cx - 6.1} y={cy - 30} width={12.2} height={7} fill={PALETA.azul} />
        <rect x={cx - 6.1} y={cy - 14} width={12.2} height={7} fill={PALETA.azul} />
        <rect x={cx - 4} y={cy - 54} width={8} height={10} rx={2} fill={PALETA.ventana} className="ui-ilu__faro" />
        <path d={`M${cx - 6},${cy - 54} L${cx},${cy - 62} L${cx + 6},${cy - 54} Z`} fill={PALETA.tinta} />
        <path d={`M${cx + 6},${cy - 50} L${cx + 40},${cy - 60} L${cx + 40},${cy - 40} Z`} fill={PALETA.ventana} opacity="0.45" className="ui-ilu__haz" />
      </g>
    ),
  };
}

function puerto(): Elemento[] {
  const [bx, by] = pt(182, 28, 0);
  return [
    { orden: 150 + 22, nodo: <Prisma key="muelle" x={150} y={20} w={44} d={6} h={3} tonos={TONOS_NOCHE} /> },
    {
      orden: 182 + 34,
      nodo: (
        <g key="barco">
          <Prisma x={176} y={32} w={16} d={7} h={4} tonos={TONOS_AZUL} />
          <Prisma x={180} y={33} w={6} d={5} h={5} z={4} tonos={TONOS_CLARO} />
          <line x1={bx + 4} y1={by + 4} x2={bx + 4} y2={by - 18} stroke={PALETA.tinta} strokeWidth={1.5} />
          <polygon fill={PALETA.ventana} points={`${bx + 4},${by - 18} ${bx + 14},${by - 10} ${bx + 4},${by - 8}`} />
        </g>
      ),
    },
  ];
}

export function Ciudad(props: PropsIlustracion) {
  const elementos: Elemento[] = [
    edificio('e1', 112, 6, 14, 14, 58, TONOS_AZUL, 2),
    edificio('e2', 120, 28, 12, 16, 74, TONOS_NOCHE, 5),
    edificio('e3', 116, 52, 16, 14, 50, TONOS_AZUL, 9),
    edificio('e4', 92, 14, 12, 12, 40, TONOS_CLARO, 4),
    edificio('e5', 94, 40, 14, 12, 34, TONOS_AZUL, 6),
    edificio('e6', 70, 26, 12, 12, 26, TONOS_NOCHE, 8),
    torreon(),
    faro(),
    ...puerto(),
    casa('c1', 60, 60),
    casa('c2', 40, 40),
    casa('c3', 76, 84),
    casa('c4', 30, 74),
    arbol('a1', 54, 50),
    arbol('a2', 88, 70, 0.9),
    arbol('a3', 46, 92, 1.1),
    arbol('a4', 104, 96),
    arbol('a5', 24, 58, 0.8),
  ];
  elementos.sort((a, b) => a.orden - b.orden);
  return (
    <Lienzo viewBox="-120 -50 300 225" {...props} className={`ui-ilu--ciudad${props.className ? ` ${props.className}` : ''}`}>
      <Piso x={150} y={-10} w={60} d={150} color={PALETA.mar} />
      <Piso x={0} y={0} w={150} d={130} color={PALETA.tinte} />
      <Piso x={140} y={0} w={10} d={130} color="#EFE8D8" />
      {elementos.map((e) => e.nodo)}
    </Lienzo>
  );
}
