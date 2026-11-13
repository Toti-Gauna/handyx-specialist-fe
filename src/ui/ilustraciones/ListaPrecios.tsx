'use client';
// La hoja de precios del corralón (H0-PreciosFoto, lote 2.2): un papel apenas girado con los renglones; los que el
// teléfono entendió van marcados con resaltador amarillo y los que no, en gris. Cada renglón es una `Pieza`: con
// `armar` se marcan uno tras otro (con «reducir movimiento», ya marcados). Decorativa: el texto de al lado dice cuántos.
import { PALETA } from './iso.tsx';
import { Lienzo, Pieza, type PropsIlustracion } from './Lienzo.tsx';

export function ListaPrecios({ renglones, ...props }: PropsIlustracion & { renglones: readonly boolean[] }) {
  const filas = renglones.slice(0, 12);
  const alto = 36;
  return (
    <Lienzo viewBox="0 0 360 440" {...props}>
      <g transform="rotate(-3 180 220)">
        <rect x="18" y="14" width="324" height="412" rx="10" fill="#E8E4DA" />
        <rect x="52" y="52" width="140" height="18" rx="4" fill={PALETA.gris} />
        {filas.map((ok, i) => (
          <Pieza key={i}>
            <rect x="52" y={110 + i * alto} width="276" height="22" rx="5" fill={ok ? PALETA.ventana : PALETA.blanco} opacity={ok ? 0.95 : 0.7} />
          </Pieza>
        ))}
      </g>
    </Lienzo>
  );
}
