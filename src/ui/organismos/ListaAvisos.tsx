'use client';
// Lista de avisos (D6-Avisos): grupos por día; cada aviso abre su detalle (nunca acepta nada) y tiene su botón para
// quitarlo (nada depende de deslizar). Los avisos sin leer dicen «Nuevo» con texto, además del punto azul.
import Link from 'next/link';
import type { ReactNode } from 'react';
import { BotonIcono } from '../atomos/Boton.tsx';
import { Avatar } from '../atomos/Avatar.tsx';
import { Icono, type NombreIconoUi } from '../atomos/Icono.tsx';
import './cuenta.css';

export function GrupoAvisos({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <section className="ui-avisos">
      <h2 className="ui-avisos__titulo">{titulo}</h2>
      <ul className="ui-avisos__lista">{children}</ul>
    </section>
  );
}

export function ItemAviso({ titulo, cuerpo, momento, icono, iniciales, nuevo, href, onAbrir, onQuitar }: { titulo: string; cuerpo: string; momento: string; icono: NombreIconoUi; iniciales: string | null; nuevo: boolean; href: string; onAbrir(): void; onQuitar(): void }) {
  return (
    <li className={`ui-aviso${nuevo ? ' ui-aviso--nuevo' : ''}`}>
      <Link href={href} className="ui-aviso__enlace" onClick={onAbrir}>
        <span className="ui-aviso__imagen" aria-hidden="true">
          {iniciales ? <Avatar nombre={iniciales} /> : <span className="ui-aviso__ico"><Icono nombre={icono} /></span>}
        </span>
        <span className="ui-aviso__texto">
          <strong>{titulo}</strong>
          <span>{cuerpo}</span>
          <small>
            {nuevo ? <span className="ui-aviso__nuevo">Nuevo</span> : null}
            {momento}
          </small>
        </span>
      </Link>
      <BotonIcono icono="borrar" etiqueta={`Quitar el aviso: ${titulo}`} onClick={onQuitar} />
    </li>
  );
}
