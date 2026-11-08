'use client';
// Ilustraciones del Taller (lote 2.4): la caja de herramientas que se abre en la portada de «Herramientas del
// teléfono» y el teléfono que mide. SVG isométrico con la paleta de la ciudad; con `armar`, las piezas caen a su lugar
// (GSAP, Lienzo.tsx) y con «reducir movimiento» se ve armada. Siempre decorativas: el texto de al lado dice lo
// importante.
import { Lienzo, Pieza, type PropsIlustracion } from './Lienzo.tsx';
import { Cilindro, PALETA, Piso, Poli, Prisma, TONOS_AMARILLO, TONOS_AZUL, TONOS_CLARO, TONOS_GRIS, TONOS_NOCHE } from './iso.tsx';

const VISTA = '-80 -78 160 116';

/** Caja de herramientas abierta: el cuerpo azul, la tapa amarilla que se abre y las herramientas que asoman. */
export function CajaHerramientas(props: PropsIlustracion) {
  return (
    <Lienzo viewBox={VISTA} {...props}>
      <Piso x={-46} y={-34} w={92} d={68} />
      <Pieza>
        <Prisma x={-34} y={-12} w={68} d={26} h={22} tonos={TONOS_AZUL} />
      </Pieza>
      <Pieza>
        {/* Destornillador: mango amarillo y vástago gris. */}
        <Prisma x={-24} y={-2} w={4} d={4} h={14} z={22} tonos={TONOS_GRIS} />
        <Prisma x={-25} y={-3} w={6} d={6} h={10} z={34} tonos={TONOS_AMARILLO} />
      </Pieza>
      <Pieza>
        {/* Llave y martillo. */}
        <Prisma x={-6} y={0} w={4} d={3} h={24} z={20} tonos={TONOS_CLARO} />
        <Prisma x={-10} y={-1} w={12} d={5} h={6} z={42} tonos={TONOS_NOCHE} />
      </Pieza>
      <Pieza>
        {/* Cinta métrica. */}
        <Cilindro x={16} y={2} z={22} r={7} h={8} tono={PALETA.ventana} sombra="#D8D65E" tapa="#FBFBC8" />
      </Pieza>
      <Pieza>
        {/* Tapa abierta hacia atrás, con la manija. */}
        <Poli fill={PALETA.ventana} puntos={[[-34, -12, 22], [34, -12, 22], [34, -30, 44], [-34, -30, 44]]} />
        <Poli fill="#D8D65E" puntos={[[34, -12, 22], [34, -30, 44], [34, -30, 47], [34, -12, 25]]} />
        <Prisma x={-8} y={-31} w={16} d={3} h={4} z={44} tonos={TONOS_NOCHE} />
      </Pieza>
    </Lienzo>
  );
}

/** Teléfono parado que mide una pared: la línea amarilla con sus dos puntos. */
export function TelefonoMide(props: PropsIlustracion) {
  return (
    <Lienzo viewBox={VISTA} {...props}>
      <Piso x={-46} y={-34} w={92} d={68} />
      <Pieza>
        <Prisma x={-40} y={-30} w={80} d={4} h={58} tonos={TONOS_CLARO} />
      </Pieza>
      <Pieza>
        <Poli fill={PALETA.ventana} puntos={[[-26, -25, 40], [26, -25, 40], [26, -25, 37], [-26, -25, 37]]} />
      </Pieza>
      <Pieza>
        <Prisma x={-6} y={12} w={12} d={3} h={24} tonos={TONOS_NOCHE} />
        <Prisma x={-5} y={14.5} w={10} d={1} h={20} z={2} tonos={TONOS_AZUL} />
      </Pieza>
    </Lienzo>
  );
}
