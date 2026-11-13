// Accesos de un toque del Modo trabajo (H0-Modo, lote 2.3): Foto, Repuestos, Pedir ayuda, Agenda. Mosaicos blancos de
// 72 px con ícono azul y texto debajo, en una grilla que pasa a dos columnas si no entran (texto al 200 %). Cada uno es
// un enlace o un botón con su nombre escrito.
import Link from 'next/link';
import type { ReactNode } from 'react';
import { Icono, type NombreIconoUi } from '../atomos/Icono.tsx';
import '../trabajo.css';

export function GrillaAccesos({ etiqueta, children }: { etiqueta: string; children: ReactNode }) {
  return (
    <nav className="ui-accesos" aria-label={etiqueta}>
      {children}
    </nav>
  );
}

export function AccesoRapido({ icono, texto, href, onClick }: { icono: NombreIconoUi; texto: string; href?: string; onClick?: () => void }) {
  const cuerpo = (
    <>
      <Icono nombre={icono} tam="grande" />
      <span>{texto}</span>
    </>
  );
  if (href)
    return (
      <Link className="ui-acceso" href={href}>
        {cuerpo}
      </Link>
    );
  return (
    <button type="button" className="ui-acceso" onClick={onClick}>
      {cuerpo}
    </button>
  );
}
