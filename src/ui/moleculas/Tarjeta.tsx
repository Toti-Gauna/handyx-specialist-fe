// Tarjeta blanca con franja gris abajo ("Ver más información"), fila con ícono en mosaico y dato mini (rótulo + cifra).
import Link from 'next/link';
import type { ReactNode } from 'react';
import { Icono, type NombreIconoUi } from '../atomos/Icono.tsx';
import { Cifra } from '../atomos/Texto.tsx';

interface Franja {
  texto: string;
  href?: string;
  onClick?: () => void;
}

export function Tarjeta({ children, franja, tono = 'blanca', etiqueta, como: Como = 'section' }: { children: ReactNode; franja?: Franja; tono?: 'blanca' | 'gris' | 'azul' | 'noche'; etiqueta?: string; como?: 'section' | 'article' | 'div' }) {
  return (
    <Como className={`ui-tarjeta ui-tarjeta--${tono}`} aria-label={etiqueta}>
      <div className="ui-tarjeta__cuerpo">{children}</div>
      {franja ? <FranjaTarjeta {...franja} /> : null}
    </Como>
  );
}

function FranjaTarjeta({ texto, href, onClick }: Franja) {
  const contenido = (
    <>
      <span>{texto}</span>
      <Icono nombre="flecha" />
    </>
  );
  if (href)
    return (
      <Link className="ui-tarjeta__franja" href={href}>
        {contenido}
      </Link>
    );
  return (
    <button type="button" className="ui-tarjeta__franja" onClick={onClick}>
      {contenido}
    </button>
  );
}

/** Fila de lista con ícono en mosaico gris, título, detalle y algo a la derecha (chip, cifra). Con `href`, es un enlace. */
export function FilaIcono({ icono, titulo, detalle, derecha, href, onClick, borde = true }: { icono: NombreIconoUi; titulo: ReactNode; detalle?: ReactNode; derecha?: ReactNode; href?: string; onClick?: () => void; borde?: boolean }) {
  const cuerpo = (
    <>
      <span className="ui-fila__ico" aria-hidden="true">
        <Icono nombre={icono} />
      </span>
      <span className="ui-fila__texto">
        <strong>{titulo}</strong>
        {detalle ? <span>{detalle}</span> : null}
      </span>
      {derecha ? <span className="ui-fila__derecha">{derecha}</span> : null}
      {href || onClick ? <Icono nombre="flecha" className="ui-fila__flecha" /> : null}
    </>
  );
  const clase = `ui-fila${borde ? ' ui-fila--borde' : ''}${href || onClick ? ' ui-fila--tocable' : ''}`;
  if (href)
    return (
      <Link className={clase} href={href}>
        {cuerpo}
      </Link>
    );
  if (onClick)
    return (
      <button type="button" className={clase} onClick={onClick}>
        {cuerpo}
      </button>
    );
  return <div className={clase}>{cuerpo}</div>;
}

/** Dato chico de un mosaico de resumen: rótulo arriba y cifra abajo, sin corte. */
export function DatoMini({ rotulo, centavos, texto, detalle }: { rotulo: string; centavos?: number; texto?: string; detalle?: string }) {
  return (
    <div className="ui-dato">
      <span className="ui-dato__rotulo">{rotulo}</span>
      <Cifra centavos={centavos} texto={texto} tam="chico" como="strong" />
      {detalle ? <span className="ui-dato__detalle">{detalle}</span> : null}
    </div>
  );
}
