'use client';
// Un objeto isométrico por rubro para "construir el arreglo": cuando llega o se cotiza un pedido, las piezas caen a su
// lugar en orden (GSAP, en Lienzo.tsx). Con "reducir movimiento" se ven armadas. Decorativas: el rubro y lo que hay
// que hacer van en texto al lado.
import type { Rubro } from '../../contracts/rubros.ts';
import { Cilindro, PALETA, Piso, Poli, Prisma, pt, TONOS_AMARILLO, TONOS_AZUL, TONOS_CLARO, TONOS_GRIS, TONOS_NOCHE } from './iso.tsx';
import { Lienzo, Pieza, type PropsIlustracion } from './Lienzo.tsx';

const VISTA = '-70 -70 140 120';

/** Canilla de pared: placa, caño, cuerpo, manija en cruz y la gota. */
export function Canilla(props: PropsIlustracion) {
  const [gx, gy] = pt(30, 20, 6);
  return (
    <Lienzo viewBox={VISTA} {...props}>
      <Piso x={-30} y={-30} w={80} d={80} />
      <Pieza>
        <Prisma x={-10} y={-24} w={30} d={4} h={50} tonos={TONOS_GRIS} />
      </Pieza>
      <Pieza>
        <Prisma x={0} y={-20} w={8} d={18} h={6} z={26} tonos={TONOS_CLARO} />
      </Pieza>
      <Pieza>
        <Prisma x={-2} y={-4} w={12} d={12} h={12} z={22} tonos={TONOS_AZUL} />
      </Pieza>
      <Pieza>
        <Prisma x={2} y={0} w={4} d={4} h={8} z={34} tonos={TONOS_NOCHE} />
        <Prisma x={-6} y={1} w={20} d={2} h={3} z={41} tonos={TONOS_NOCHE} />
      </Pieza>
      <Pieza>
        <Prisma x={10} y={0} w={22} d={5} h={5} z={24} tonos={TONOS_AZUL} />
        <Prisma x={28} y={0} w={5} d={5} h={4} z={20} tonos={TONOS_AZUL} />
      </Pieza>
      <Pieza>
        <path d={`M${gx},${gy - 8} c4,6 5,9 5,11 a5,5 0 0 1 -10,0 c0,-2 1,-5 5,-11 Z`} fill={PALETA.ventana} stroke={PALETA.hondo} strokeWidth={1.2} />
      </Pieza>
    </Lienzo>
  );
}

/** Tablero eléctrico: gabinete, fila de térmicas, disyuntor y la tapa. */
export function Tablero(props: PropsIlustracion) {
  return (
    <Lienzo viewBox={VISTA} {...props}>
      <Piso x={-30} y={-30} w={80} d={80} />
      <Pieza>
        <Prisma x={-20} y={-6} w={44} d={10} h={54} tonos={TONOS_CLARO} />
      </Pieza>
      <Pieza>
        <Prisma x={-16} y={4} w={36} d={2} h={4} z={30} tonos={TONOS_NOCHE} />
      </Pieza>
      {[0, 1, 2, 3].map((i) => (
        <Pieza key={i}>
          <Prisma x={-15 + i * 9} y={5} w={6} d={4} h={12} z={26} tonos={i === 0 ? TONOS_AMARILLO : TONOS_AZUL} />
        </Pieza>
      ))}
      <Pieza>
        <Prisma x={-15} y={5} w={14} d={4} h={10} z={8} tonos={TONOS_AZUL} />
        <Prisma x={6} y={5} w={14} d={4} h={10} z={8} tonos={TONOS_NOCHE} />
      </Pieza>
      <Pieza>
        <Poli fill={PALETA.ventana} puntos={[[0, 6, 50], [6, 6, 50], [2, 6, 44], [7, 6, 44], [-2, 6, 36], [1, 6, 42], [-4, 6, 42]]} />
      </Pieza>
    </Lienzo>
  );
}

/** Caño con codo, unión y la gota que se arregla. */
export function Cano(props: PropsIlustracion) {
  const [gx, gy] = pt(8, 20, 14);
  return (
    <Lienzo viewBox={VISTA} {...props}>
      <Piso x={-30} y={-30} w={80} d={80} />
      <Pieza>
        <Prisma x={-30} y={0} w={30} d={8} h={8} z={10} tonos={TONOS_GRIS} />
      </Pieza>
      <Pieza>
        <Prisma x={-2} y={-2} w={12} d={12} h={12} z={8} tonos={TONOS_AZUL} />
      </Pieza>
      <Pieza>
        <Prisma x={0} y={8} w={8} d={30} h={8} z={10} tonos={TONOS_GRIS} />
      </Pieza>
      <Pieza>
        <Prisma x={-1} y={22} w={10} d={4} h={10} z={9} tonos={TONOS_NOCHE} />
      </Pieza>
      <Pieza>
        <Prisma x={0} y={0} w={8} d={8} h={34} z={20} tonos={TONOS_GRIS} />
      </Pieza>
      <Pieza>
        <path d={`M${gx},${gy - 6} c3,5 4,7 4,9 a4,4 0 0 1 -8,0 c0,-2 1,-4 4,-9 Z`} fill={PALETA.ventana} stroke={PALETA.hondo} strokeWidth={1.2} />
      </Pieza>
    </Lienzo>
  );
}

/** Puerta con cerradura: hoja, caja de la cerradura, cilindro, picaporte y la llave. */
export function Cerradura(props: PropsIlustracion) {
  const [kx, ky] = pt(26, 6, 24);
  return (
    <Lienzo viewBox={VISTA} {...props}>
      <Piso x={-30} y={-30} w={80} d={80} />
      <Pieza>
        <Prisma x={-20} y={-4} w={40} d={6} h={62} tonos={TONOS_AZUL} />
      </Pieza>
      <Pieza>
        <Prisma x={8} y={2} w={10} d={2} h={18} z={18} tonos={TONOS_CLARO} />
      </Pieza>
      <Pieza>
        <Prisma x={11} y={4} w={4} d={2} h={5} z={20} tonos={TONOS_NOCHE} />
      </Pieza>
      <Pieza>
        <Prisma x={6} y={4} w={10} d={3} h={3} z={30} tonos={TONOS_GRIS} />
      </Pieza>
      <Pieza>
        <circle cx={kx} cy={ky} r={5} fill="none" stroke={PALETA.ventana} strokeWidth={3} />
        <path d={`M${kx - 5},${ky + 2} l-12,6 m4,-2 l2,4 m3,-6 l2,4`} stroke={PALETA.ventana} strokeWidth={3} strokeLinecap="round" fill="none" />
      </Pieza>
    </Lienzo>
  );
}

/** Aire acondicionado: unidad interior, rejilla, control y el aire que sale. */
export function Aire(props: PropsIlustracion) {
  const [ax, ay] = pt(10, 14, 22);
  return (
    <Lienzo viewBox={VISTA} {...props}>
      <Piso x={-30} y={-30} w={80} d={80} />
      <Pieza>
        <Prisma x={-24} y={-20} w={50} d={4} h={60} tonos={TONOS_GRIS} />
      </Pieza>
      <Pieza>
        <Prisma x={-18} y={-16} w={40} d={10} h={14} z={36} tonos={TONOS_CLARO} />
      </Pieza>
      <Pieza>
        <Prisma x={-16} y={-6} w={36} d={1} h={2} z={38} tonos={TONOS_AZUL} />
        <Prisma x={-16} y={-6} w={36} d={1} h={2} z={42} tonos={TONOS_AZUL} />
      </Pieza>
      <Pieza>
        <Prisma x={18} y={14} w={6} d={3} h={12} z={0} tonos={TONOS_NOCHE} />
      </Pieza>
      <Pieza>
        <path d={`M${ax - 18},${ay} q4,8 0,14 M${ax - 6},${ay + 4} q4,8 0,14 M${ax + 6},${ay + 8} q4,8 0,14`} fill="none" stroke={PALETA.azul} strokeWidth={3} strokeLinecap="round" />
      </Pieza>
    </Lienzo>
  );
}

/** Pared de ladrillos: hiladas que se apilan y la cuchara. */
export function Pared(props: PropsIlustracion) {
  const hiladas = [0, 1, 2, 3, 4];
  return (
    <Lienzo viewBox={VISTA} {...props}>
      <Piso x={-30} y={-30} w={80} d={80} />
      {hiladas.map((f) => (
        <Pieza key={f}>
          {[0, 1, 2].map((c) => (
            <Prisma key={c} x={-24 + c * 16 + (f % 2) * 8} y={0} w={15} d={8} h={8} z={f * 9} tonos={(f + c) % 2 === 0 ? TONOS_AZUL : TONOS_NOCHE} />
          ))}
        </Pieza>
      ))}
      <Pieza>
        <Poli fill={PALETA.ventana} puntos={[[30, 14, 0], [44, 14, 0], [40, 22, 0], [28, 20, 0]]} />
        <Prisma x={26} y={16} w={4} d={2} h={10} tonos={TONOS_NOCHE} />
      </Pieza>
    </Lienzo>
  );
}

/** Gas: garrafa, regulador, manguera y estufa con la llama. */
export function Garrafa(props: PropsIlustracion) {
  const [lx, ly] = pt(20, 8, 26);
  const [mx, my] = pt(-14, 10, 30);
  return (
    <Lienzo viewBox={VISTA} {...props}>
      <Piso x={-30} y={-30} w={80} d={80} />
      <Pieza>
        <Cilindro x={-18} y={8} r={9} h={30} tono={PALETA.azul} sombra={PALETA.hondo} tapa={PALETA.ui} />
      </Pieza>
      <Pieza>
        <Cilindro x={-18} y={8} z={30} r={3} h={6} tono={PALETA.noche} sombra={PALETA.tinta} tapa={PALETA.gris} />
      </Pieza>
      <Pieza>
        <path d={`M${mx},${my - 6} C${mx + 20},${my - 20} ${lx - 22},${ly + 20} ${lx - 12},${ly + 8}`} fill="none" stroke={PALETA.tinta} strokeWidth={3} strokeLinecap="round" />
      </Pieza>
      <Pieza>
        <Prisma x={6} y={-4} w={26} d={12} h={26} tonos={TONOS_CLARO} />
        <Prisma x={10} y={8} w={18} d={1} h={10} z={8} tonos={TONOS_NOCHE} />
      </Pieza>
      <Pieza>
        <path className="ui-ilu__llama" d={`M${lx},${ly - 16} c6,6 8,10 8,14 a8,8 0 0 1 -16,0 c0,-4 3,-6 4,-8 c1,3 2,4 3,4 c0,-4 0,-7 1,-10 Z`} fill={PALETA.ventana} stroke={PALETA.hondo} strokeWidth={1.2} />
      </Pieza>
    </Lienzo>
  );
}

/** Casa isométrica: base, techo a dos aguas, puerta, ventanas y chimenea. */
export function Casa(props: PropsIlustracion) {
  return (
    <Lienzo viewBox="-60 -70 120 110" {...props}>
      <Piso x={-30} y={-26} w={70} d={66} />
      <Pieza>
        <Prisma x={-20} y={-14} w={36} d={30} h={24} tonos={TONOS_CLARO} />
      </Pieza>
      <Pieza>
        <Poli fill={PALETA.hondo} puntos={[[-20, 16, 24], [16, 16, 24], [16, 1, 42], [-20, 1, 42]]} />
        <Poli fill={PALETA.azul} puntos={[[16, -14, 24], [16, 16, 24], [16, 1, 42]]} />
      </Pieza>
      <Pieza>
        <Prisma x={6} y={4} w={5} d={5} h={12} z={34} tonos={TONOS_NOCHE} />
      </Pieza>
      <Pieza>
        <Poli fill={PALETA.azul} puntos={[[-6, 16, 0], [2, 16, 0], [2, 16, 14], [-6, 16, 14]]} />
        <Poli fill={PALETA.ventana} className="ui-ilu__ventana" puntos={[[-16, 16, 8], [-10, 16, 8], [-10, 16, 16], [-16, 16, 16]]} />
        <Poli fill={PALETA.ventana} className="ui-ilu__ventana" puntos={[[16, -8, 8], [16, -2, 8], [16, -2, 16], [16, -8, 16]]} />
        <Poli fill={PALETA.ventanaApagada} puntos={[[16, 4, 8], [16, 10, 8], [16, 10, 16], [16, 4, 16]]} />
      </Pieza>
    </Lienzo>
  );
}

const POR_RUBRO = {
  electricidad: Tablero,
  plomeria: Canilla,
  gas: Garrafa,
  cerrajeria: Cerradura,
  albanileria: Pared,
  aire_acondicionado: Aire,
} as const satisfies Record<Rubro, (p: PropsIlustracion) => unknown>;

/** El objeto del rubro de un pedido ("construir el arreglo"). */
export function ArregloRubro({ rubro, ...props }: PropsIlustracion & { rubro: Rubro }) {
  const Objeto = POR_RUBRO[rubro];
  return <Objeto {...props} />;
}
