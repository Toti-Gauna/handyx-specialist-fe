'use client';
// Ilustraciones de estados y de la marca: escudo verificado, remera y manual del kit de bienvenida, desenchufado (sin
// conexión, D6-Error), en obra (error del servidor, D6-Fallo) y la caja de regalo plana. Copian los dibujos del lienzo
// (design/deluxe/project/D6-Error y D6-Fallo). Decorativas: el título y el texto de al lado dicen lo que pasa.
import { PALETA, Prisma, TONOS_AZUL, TONOS_CLARO, TONOS_NOCHE } from './iso.tsx';
import { Lienzo, Pieza, type PropsIlustracion } from './Lienzo.tsx';

/** Sin conexión: el enchufe quedó afuera del tomacorriente y saltan chispas. */
export function Desenchufado(props: PropsIlustracion) {
  return (
    <Lienzo viewBox="0 0 300 230" {...props}>
      <circle cx="150" cy="115" r="105" fill={PALETA.tinte} />
      <path d="M20 150 C 60 150, 70 110, 112 110" fill="none" stroke={PALETA.noche} strokeWidth="8" strokeLinecap="round" />
      <Pieza>
        <rect x="108" y="92" width="44" height="36" rx="8" fill={PALETA.azul} />
        <rect x="150" y="100" width="16" height="6" rx="2" fill={PALETA.gris} />
        <rect x="150" y="114" width="16" height="6" rx="2" fill={PALETA.gris} />
      </Pieza>
      <Pieza>
        <rect x="196" y="88" width="48" height="44" rx="10" fill={PALETA.blanco} stroke="#E3E7EE" strokeWidth="3" />
        <rect x="208" y="102" width="6" height="16" rx="2" fill={PALETA.noche} />
        <rect x="226" y="102" width="6" height="16" rx="2" fill={PALETA.noche} />
      </Pieza>
      <path className="ui-ilu__chispa" d="M180 74 l8 -14 M186 84 l14 -8 M176 66 l-2 -14" stroke={PALETA.ventana} strokeWidth="5" strokeLinecap="round" />
      <path d="M244 132 C 270 160, 280 190, 290 210" fill="none" stroke={PALETA.noche} strokeWidth="8" strokeLinecap="round" />
    </Lienzo>
  );
}

/** Error del servidor: dos edificios con la cinta de obra cruzada. */
export function EnObra(props: PropsIlustracion) {
  const cinta = [66, 94, 122, 150, 178, 206, 234];
  return (
    <Lienzo viewBox="0 0 300 230" {...props}>
      <circle cx="150" cy="120" r="105" fill={PALETA.mosaico} />
      <rect x="40" y="186" width="220" height="10" rx="5" fill={PALETA.noche} />
      <Pieza>
        <rect x="70" y="120" width="70" height="66" rx="6" fill={PALETA.azul} />
        <rect className="ui-ilu__ventana" x="82" y="132" width="14" height="16" rx="2" fill={PALETA.ventana} />
        <rect x="108" y="132" width="14" height="16" rx="2" fill={PALETA.ventanaApagada} />
      </Pieza>
      <Pieza>
        <rect x="160" y="96" width="74" height="90" rx="6" fill={PALETA.hondo} />
        <rect x="172" y="110" width="14" height="16" rx="2" fill={PALETA.ventanaApagada} />
        <rect className="ui-ilu__ventana" x="200" y="110" width="14" height="16" rx="2" fill={PALETA.ventana} />
      </Pieza>
      <Pieza>
        <g transform="rotate(-8 150 158)">
          <rect x="58" y="150" width="190" height="16" rx="3" fill={PALETA.ventana} />
          {cinta.map((x) => (
            <rect key={x} x={x} y="150" width="14" height="16" fill={PALETA.noche} />
          ))}
        </g>
      </Pieza>
      <path className="ui-ilu__chispa" d="M150 40 l0 30 M135 55 l30 0" stroke={PALETA.azul} strokeWidth="6" strokeLinecap="round" />
    </Lienzo>
  );
}

/** Escudo con el tilde: "verificado por Operations" (solo con el estado del servidor). */
export function EscudoVerificado(props: PropsIlustracion) {
  return (
    <Lienzo viewBox="0 0 120 120" {...props}>
      <circle cx="60" cy="62" r="50" fill={PALETA.tinte} />
      <Pieza>
        <path d="M60 14 L96 28 V58 C96 82 80 98 60 106 C40 98 24 82 24 58 V28 Z" fill={PALETA.azul} />
        <path d="M60 14 L96 28 V58 C96 82 80 98 60 106 Z" fill={PALETA.hondo} />
      </Pieza>
      <Pieza>
        <path d="M42 60 L55 73 L80 46" fill="none" stroke={PALETA.ventana} strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" />
      </Pieza>
    </Lienzo>
  );
}

/** Remera Handyx del kit de bienvenida. */
export function Remera(props: PropsIlustracion) {
  return (
    <Lienzo viewBox="0 0 120 120" {...props}>
      <circle cx="60" cy="62" r="50" fill={PALETA.mosaico} />
      <Pieza>
        <path d="M40 22 L20 34 L28 54 L38 50 V100 H82 V50 L92 54 L100 34 L80 22 C76 32 44 32 40 22 Z" fill={PALETA.azul} />
        <path d="M60 30 C70 30 78 27 80 22 L100 34 L92 54 L82 50 V100 H60 Z" fill={PALETA.hondo} />
      </Pieza>
      <Pieza>
        <rect x="46" y="58" width="28" height="7" rx="3.5" fill={PALETA.ventana} />
        <rect x="50" y="70" width="20" height="5" rx="2.5" fill={PALETA.blanco} opacity="0.85" />
      </Pieza>
    </Lienzo>
  );
}

/** Manual del kit de bienvenida (libro isométrico). */
export function Manual(props: PropsIlustracion) {
  return (
    <Lienzo viewBox="-50 -46 100 86" {...props}>
      <Pieza>
        <Prisma x={-24} y={-16} w={44} d={32} h={6} tonos={TONOS_CLARO} />
      </Pieza>
      <Pieza>
        <Prisma x={-24} y={-16} w={44} d={32} h={3} z={6} tonos={TONOS_AZUL} />
      </Pieza>
      <Pieza>
        <Prisma x={-14} y={-6} w={22} d={4} h={1} z={9} tonos={{ arriba: PALETA.ventana, izquierda: PALETA.ventana, derecha: PALETA.ventana }} />
        <Prisma x={-14} y={2} w={14} d={3} h={1} z={9} tonos={TONOS_NOCHE} />
      </Pieza>
    </Lienzo>
  );
}

/** Caja de regalo plana (el regalo del Camino Handyx). */
export function CajaRegalo(props: PropsIlustracion) {
  return (
    <Lienzo viewBox="0 0 120 120" {...props}>
      <circle cx="60" cy="64" r="50" fill={PALETA.tinte} />
      <Pieza>
        <rect x="26" y="54" width="68" height="48" rx="6" fill={PALETA.azul} />
        <rect x="56" y="54" width="8" height="48" fill={PALETA.ventana} />
      </Pieza>
      <Pieza>
        <rect x="20" y="40" width="80" height="18" rx="5" fill={PALETA.hondo} />
        <rect x="56" y="40" width="8" height="18" fill={PALETA.ventana} />
      </Pieza>
      <Pieza>
        <path d="M60 40 C50 22 34 24 38 34 C41 41 60 40 60 40 Z M60 40 C70 22 86 24 82 34 C79 41 60 40 60 40 Z" fill={PALETA.ventana} stroke="#D8D65E" strokeWidth="2" />
      </Pieza>
    </Lienzo>
  );
}
