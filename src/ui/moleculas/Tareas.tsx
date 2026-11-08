// Listas de onboarding (lote 1.2). `FilaTarea`: un primer paso con su círculo de hecho, el mosaico, el título y a
// dónde lleva; «Hecho» también se dice en texto (no solo con el tachado o el color). `TarjetaPermiso`: para qué sirve
// un permiso del teléfono, cuándo se usa y su estado escrito.
import Link from 'next/link';
import type { ReactNode } from 'react';
import { Icono, type NombreIconoUi } from '../atomos/Icono.tsx';
import '../registro.css';

export function FilaTarea({ icono, titulo, detalle, hecha, href }: { icono: NombreIconoUi; titulo: string; detalle: string; hecha: boolean; href: string }) {
  return (
    <Link href={href} className={`ui-tarea${hecha ? ' ui-tarea--hecha' : ''}`}>
      <span className="ui-tarea__circulo" aria-hidden="true">
        {hecha ? <Icono nombre="check" tam="chico" /> : null}
      </span>
      <span className="ui-fila__ico" aria-hidden="true">
        <Icono nombre={icono} />
      </span>
      <span className="ui-tarea__texto">
        <strong>{titulo}</strong>
        <span>{hecha ? `Hecho · ${detalle}` : detalle}</span>
      </span>
      <Icono nombre="flecha" className="ui-fila__flecha" />
    </Link>
  );
}

export function TarjetaPermiso({ icono, titulo, para, cuando, estado, activo = false }: { icono: NombreIconoUi; titulo: string; para: string; cuando: string; estado: ReactNode; activo?: boolean }) {
  return (
    <section className={`ui-permiso${activo ? ' ui-permiso--activo' : ''}`} aria-label={titulo}>
      <span className="ui-permiso__ico" aria-hidden="true">
        <Icono nombre={icono} tam="grande" />
      </span>
      <span className="ui-permiso__texto">
        <strong>{titulo}</strong>
        <span>{para}</span>
        <small>{cuando}</small>
        <span className="ui-permiso__estado">{estado}</span>
      </span>
    </section>
  );
}
