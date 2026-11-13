// Ilustraciones del registro y el onboarding (lote 1.2), en el mismo isométrico de la ciudad. Decorativas: el texto de
// al lado dice lo importante. `armar` arma cada pieza con GSAP; con «reducir movimiento» se ven armadas.
import { Lienzo, Pieza, type PropsIlustracion } from './Lienzo.tsx';
import { PALETA, Piso, Poli, Prisma, TONOS_AMARILLO, TONOS_AZUL, TONOS_CLARO, TONOS_GRIS, TONOS_NOCHE, pt } from './iso.tsx';

const MANZANAS: Array<[number, number]> = [];
for (let f = 0; f < 4; f++) for (let c = 0; c < 5; c++) MANZANAS.push([c * 22 - 50, f * 22 - 40]);

/**
 * Barrios de Mar del Plata vistos desde arriba: manzanas bajas y la costa a la derecha. `resaltadas`: cuántas
 * manzanas se pintan de azul (las zonas elegidas); `pin`: el punto del domicilio en el medio.
 */
export function MapaBarrios({ resaltadas = 0, pin = false, ...props }: PropsIlustracion & { resaltadas?: number; pin?: boolean }) {
  const orden = [6, 7, 11, 12, 8, 2, 13, 1, 16, 17, 3, 5, 10, 15, 0, 4, 9, 14, 18, 19];
  const azules = new Set(orden.slice(0, resaltadas));
  const [px, py] = pt(5, 0, 0);
  return (
    <Lienzo viewBox="-110 -70 220 130" {...props}>
      <Piso x={-60} y={-50} w={120} d={98} color={PALETA.mosaico} />
      <Poli fill={PALETA.mar} puntos={[[62, -50, 0], [80, -50, 0], [80, 48, 0], [62, 48, 0]]} />
      {MANZANAS.map(([x, y], i) => (
        <Prisma key={i} x={x} y={y} w={16} d={16} h={azules.has(i) ? 6 : 4} tonos={azules.has(i) ? TONOS_AZUL : TONOS_GRIS} />
      ))}
      {pin ? (
        <Pieza>
          <path d={`M${px},${py - 2} c-9,-10 -12,-15 -12,-21 a12,12 0 0 1 24,0 c0,6 -3,11 -12,21 Z`} fill={PALETA.azul} stroke={PALETA.blanco} strokeWidth={2.5} />
          <circle cx={px} cy={py - 23} r={4.5} fill={PALETA.ventana} />
        </Pieza>
      ) : null}
    </Lienzo>
  );
}

/** Carpeta con documentos y una lupa: «estamos evaluando tu perfil» (D6-Alta). No es un sello de verificado. */
export function CarpetaRevision(props: PropsIlustracion) {
  return (
    <Lienzo viewBox="-60 -66 120 104" {...props}>
      <Piso x={-34} y={-30} w={66} d={60} />
      <Pieza>
        <Prisma x={-24} y={-18} w={40} d={30} h={5} tonos={TONOS_AZUL} />
      </Pieza>
      <Pieza>
        <Prisma x={-20} y={-14} w={32} d={22} h={3} z={5} tonos={TONOS_CLARO} />
        <Poli fill={PALETA.gris} puntos={[[-16, -10, 8.2], [6, -10, 8.2], [6, -8, 8.2], [-16, -8, 8.2]]} />
        <Poli fill={PALETA.gris} puntos={[[-16, -4, 8.2], [0, -4, 8.2], [0, -2, 8.2], [-16, -2, 8.2]]} />
      </Pieza>
      <Pieza>
        <circle cx="16" cy="-30" r="15" fill={PALETA.tinte} stroke={PALETA.hondo} strokeWidth="5" />
        <path d="M27 -19 L40 -6" stroke={PALETA.hondo} strokeWidth="8" strokeLinecap="round" />
        <path d="M9 -36 a9 9 0 0 1 9 -3" stroke={PALETA.blanco} strokeWidth="3" strokeLinecap="round" fill="none" />
      </Pieza>
    </Lienzo>
  );
}

/** Teléfono acostado con la pantalla de cada lámina de «Cómo funciona»: el pedido, tu precio o el cobro directo. */
export function TelefonoIso({ pantalla, ...props }: PropsIlustracion & { pantalla: 'pedido' | 'precio' | 'cobro' }) {
  return (
    <Lienzo viewBox="-80 -80 160 130" {...props}>
      <Piso x={-46} y={-46} w={92} d={92} />
      <Pieza>
        <Prisma x={-30} y={-40} w={44} d={80} h={6} tonos={TONOS_NOCHE} />
        <Poli fill={PALETA.blanco} puntos={[[-27, -36, 6.1], [11, -36, 6.1], [11, 36, 6.1], [-27, 36, 6.1]]} />
        <Poli fill={PALETA.azul} puntos={[[-27, -36, 6.2], [11, -36, 6.2], [11, -22, 6.2], [-27, -22, 6.2]]} />
      </Pieza>
      {pantalla === 'pedido' ? (
        <Pieza>
          <Prisma x={-22} y={-14} w={28} d={22} h={4} z={6} tonos={TONOS_CLARO} />
          <Poli fill={PALETA.azul} puntos={[[-18, -10, 10.2], [-4, -10, 10.2], [-4, -6, 10.2], [-18, -6, 10.2]]} />
          <Prisma x={-22} y={14} w={28} d={10} h={3} z={6} tonos={TONOS_AMARILLO} />
        </Pieza>
      ) : null}
      {pantalla === 'precio' ? (
        <Pieza>
          <Prisma x={-22} y={-12} w={28} d={14} h={8} z={6} tonos={TONOS_AMARILLO} />
          <Prisma x={-22} y={8} w={12} d={10} h={4} z={6} tonos={TONOS_GRIS} />
          <Prisma x={-6} y={8} w={12} d={10} h={4} z={6} tonos={TONOS_GRIS} />
          <Prisma x={-22} y={22} w={28} d={10} h={3} z={6} tonos={TONOS_AZUL} />
        </Pieza>
      ) : null}
      {pantalla === 'cobro' ? (
        <>
          <Pieza>
            <Prisma x={20} y={-20} w={30} d={18} h={3} z={0} tonos={{ arriba: '#BFE3CC', izquierda: '#1E9E57', derecha: '#137140' }} />
            <Prisma x={22} y={-14} w={30} d={18} h={3} z={3} tonos={{ arriba: '#D8F0E0', izquierda: '#1E9E57', derecha: '#137140' }} />
          </Pieza>
          <Pieza>
            <Prisma x={-22} y={-10} w={28} d={26} h={3} z={6} tonos={TONOS_CLARO} />
            <path d={`M${pt(-14, 4, 9.5).join(',')} L${pt(-9, 9, 9.5).join(',')} L${pt(0, -2, 9.5).join(',')}`} stroke="#137140" strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </Pieza>
        </>
      ) : null}
    </Lienzo>
  );
}

/** Papelitos de festejo alrededor del escudo (OB-Aprobado). Solo flotan sin «reducir movimiento». */
export function Papelitos() {
  return (
    <span className="ui-papelitos" aria-hidden="true">
      {Array.from({ length: 8 }, (_, i) => (
        <span key={i} className={`ui-papelitos__p ui-papelitos__p--${i + 1}`} />
      ))}
    </span>
  );
}
