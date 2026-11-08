// Mosaicos grises como la grilla de rubros de la app: el cuadro con un ícono y el mosaico de herramienta (ícono,
// nombre y una línea), tocable entero (≥ 48 px).
import Link from 'next/link';
import type { ReactNode } from 'react';
import { Icono, type NombreIconoUi } from '../atomos/Icono.tsx';

export function Mosaico({ icono, tam = 'medio', tono = 'gris' }: { icono: NombreIconoUi; tam?: 'chico' | 'medio' | 'grande'; tono?: 'gris' | 'azul' | 'amarillo' | 'tinte' }) {
  return (
    <span className={`ui-mosaico ui-mosaico--${tam} ui-mosaico--${tono}`} aria-hidden="true">
      <Icono nombre={icono} tam={tam === 'grande' ? 'grande' : 'medio'} />
    </span>
  );
}

export function MosaicoHerramienta({ icono, titulo, detalle, href, onClick, insignia }: { icono: NombreIconoUi; titulo: string; detalle?: string; href?: string; onClick?: () => void; insignia?: ReactNode }) {
  const cuerpo = (
    <>
      <span className="ui-mosaico-herr__ico" aria-hidden="true">
        <Icono nombre={icono} tam="grande" />
      </span>
      <strong className="ui-mosaico-herr__titulo">{titulo}</strong>
      {detalle ? <span className="ui-mosaico-herr__detalle">{detalle}</span> : null}
      {insignia ? <span className="ui-mosaico-herr__insignia">{insignia}</span> : null}
    </>
  );
  if (href)
    return (
      <Link className="ui-mosaico-herr" href={href}>
        {cuerpo}
      </Link>
    );
  return (
    <button type="button" className="ui-mosaico-herr" onClick={onClick}>
      {cuerpo}
    </button>
  );
}
