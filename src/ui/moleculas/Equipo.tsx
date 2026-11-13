// Piezas de «Tu equipamiento» (lote 2.4, H0-Equipo y H0-EquipoCategoria): el mosaico de una categoría (cuántas hay y
// la alerta más importante, con ícono y texto: nunca solo el color), la fila de una herramienta con sus chips de estado
// y la franja amarilla que lleva a la lista de compras. Todo tocable entero y ≥ 48 px.
import Link from 'next/link';
import type { ReactNode } from 'react';
import { Icono, type NombreIconoUi } from '../atomos/Icono.tsx';
import '../herramientas.css';

/** Mosaico de una categoría: ícono, nombre, la cifra grande y la alerta (o «Todo en orden»). */
export function MosaicoCategoria({ icono, titulo, cantidad, unidad, alerta, tono = 'gris', href }: { icono: NombreIconoUi; titulo: string; cantidad: number; unidad: string; alerta: string | null; tono?: 'gris' | 'azul' | 'alerta'; href: string }) {
  return (
    <Link href={href} className={`ui-categoria ui-categoria--${tono}`}>
      <Icono nombre={icono} tam="grande" />
      <strong className="ui-categoria__titulo">{titulo}</strong>
      <span className="ui-categoria__cifra">
        <span className="ui-categoria__numero">{cantidad}</span> <span className="ui-categoria__unidad">{unidad}</span>
      </span>
      {alerta ? (
        <span className="ui-categoria__alerta">
          <Icono nombre="alerta" tam="chico" />
          {alerta}
        </span>
      ) : (
        <span className="ui-categoria__ok">
          <Icono nombre="check" tam="chico" />
          Todo en orden
        </span>
      )}
    </Link>
  );
}

/** Grilla de dos columnas para los mosaicos (baja a una sola con texto agrandado). */
export function GrillaCategorias({ children, etiqueta }: { children: ReactNode; etiqueta: string }) {
  return (
    <nav className="ui-categorias" aria-label={etiqueta}>
      {children}
    </nav>
  );
}

/**
 * Fila de una herramienta: mosaico con su ícono (o su foto), nombre, detalle y los chips de dónde está y qué le pasa.
 * Enlace al detalle.
 */
export function FilaHerramienta({ icono, foto, titulo, detalle, chips, href }: { icono: NombreIconoUi; foto?: string | null; titulo: string; detalle?: string | null; chips?: ReactNode; href: string }) {
  return (
    <Link href={href} className="ui-fila-herr">
      <span className="ui-fila-herr__mosaico" aria-hidden="true">
        {foto ? <img src={foto} alt="" width={58} height={58} /> : <Icono nombre={icono} tam="grande" />}
      </span>
      <span className="ui-fila-herr__texto">
        <strong>{titulo}</strong>
        {detalle ? <span className="ui-fila-herr__detalle">{detalle}</span> : null}
        {chips ? <span className="ui-fila-herr__chips">{chips}</span> : null}
      </span>
      <Icono nombre="flecha" className="ui-fila-herr__flecha" />
    </Link>
  );
}

/** Franja amarilla con un aviso y una acción (lista de compras, algo para reponer). Botón o enlace. */
export function FranjaAviso({ icono, children, href, onClick }: { icono: NombreIconoUi; children: ReactNode; href?: string; onClick?: () => void }) {
  const cuerpo = (
    <>
      <Icono nombre={icono} />
      <span className="ui-franja-aviso__texto">{children}</span>
      <Icono nombre="flecha" />
    </>
  );
  if (href)
    return (
      <Link href={href} className="ui-franja-aviso">
        {cuerpo}
      </Link>
    );
  return (
    <button type="button" className="ui-franja-aviso" onClick={onClick}>
      {cuerpo}
    </button>
  );
}

/** Portada de un objeto (detalle de una herramienta): foto o ícono grande sobre el tinte, con sus chips abajo. */
export function PortadaObjeto({ icono, foto, alt, chips }: { icono: NombreIconoUi; foto?: string | null; alt: string; chips?: ReactNode }) {
  return (
    <div className="ui-portada-objeto">
      {foto ? <img className="ui-portada-objeto__foto" src={foto} alt={alt} /> : <Icono nombre={icono} className="ui-portada-objeto__icono" />}
      {chips ? <span className="ui-portada-objeto__chips">{chips}</span> : null}
    </div>
  );
}
