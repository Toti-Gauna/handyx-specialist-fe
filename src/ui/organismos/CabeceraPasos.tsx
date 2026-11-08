'use client';
// Cabecera de un flujo por pasos (registro RG-1 a RG-10, lote 1.2): Volver, «Paso N de M · Nombre» escrito y la barra
// partida en M tramos (hechos en azul, el actual en amarillo, los que faltan en gris). El avance se dice en texto y en
// el `progressbar`: el color solo acompaña.
import Link from 'next/link';
import type { ReactNode } from 'react';
import { Icono } from '../atomos/Icono.tsx';
import { textoPaso } from '../logica.ts';
import '../registro.css';

export function CabeceraPasos({ paso, total, nombre, hrefVolver, onVolver, accion }: { paso: number; total: number; nombre: string; hrefVolver?: string; onVolver?: () => void; accion?: ReactNode }) {
  const texto = textoPaso(paso, total);
  const volver = hrefVolver ? (
    <Link href={hrefVolver} className="ui-boton-icono" aria-label="Volver al paso anterior">
      <Icono nombre="atras" />
    </Link>
  ) : onVolver ? (
    <button type="button" className="ui-boton-icono" aria-label="Volver al paso anterior" onClick={onVolver}>
      <Icono nombre="atras" />
    </button>
  ) : (
    <span />
  );
  return (
    <header className="ui-cab-pasos">
      <div className="ui-cab-pasos__fila">
        {volver}
        <p className="ui-cab-pasos__texto">
          {texto} · {nombre}
        </p>
        <span className="ui-cab-pasos__accion">{accion}</span>
      </div>
      <span className="ui-cab-pasos__barra" role="progressbar" aria-label={`${texto}: ${nombre}`} aria-valuemin={1} aria-valuemax={total} aria-valuenow={paso} aria-valuetext={texto}>
        {Array.from({ length: total }, (_, i) => (
          <span key={i} className={`ui-cab-pasos__tramo${i + 1 < paso ? ' ui-cab-pasos__tramo--hecho' : i + 1 === paso ? ' ui-cab-pasos__tramo--actual' : ''}`} />
        ))}
      </span>
    </header>
  );
}
