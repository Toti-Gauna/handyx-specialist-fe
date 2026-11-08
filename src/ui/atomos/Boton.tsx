'use client';
// Botones del kit v3. Cuadrados de esquinas suaves con la base que se hunde al tocarlos (sombra sólida de 4 px).
// Principal ≥ 56 px de alto (pedido de Ignacio: que lo use una persona de 90 años); íconos ≥ 48 px. El texto lleva
// verbo ("Mandar precio", no "OK"). Un botón ocupado sigue anunciando su nombre y queda deshabilitado.
import Link from 'next/link';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Icono, type NombreIconoUi } from './Icono.tsx';

export type VarianteBoton = 'primaria' | 'contorno' | 'peligro' | 'amarilla' | 'exito' | 'texto';

interface Comun {
  variante?: VarianteBoton;
  icono?: NombreIconoUi;
  /** Ocupa todo el ancho (por defecto, sí). */
  bloque?: boolean;
  /** Más bajo (48 px) para acciones secundarias dentro de una tarjeta. */
  chico?: boolean;
  children: ReactNode;
}

const clases = ({ variante = 'primaria', bloque = true, chico = false }: Pick<Comun, 'variante' | 'bloque' | 'chico'>, extra?: string) =>
  ['ui-boton', `ui-boton--${variante}`, bloque ? 'ui-boton--bloque' : '', chico ? 'ui-boton--chico' : '', extra ?? ''].filter(Boolean).join(' ');

type PropsBoton = Comun & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> & { ocupado?: boolean; textoOcupado?: string };

export function Boton({ variante, icono, bloque, chico, children, ocupado = false, textoOcupado, className, type = 'button', disabled, ...resto }: PropsBoton) {
  return (
    <button {...resto} type={type} className={clases({ variante, bloque, chico }, className)} disabled={disabled || ocupado} aria-busy={ocupado || undefined}>
      {icono ? <Icono nombre={icono} /> : null}
      <span className="ui-boton__texto">{ocupado && textoOcupado ? textoOcupado : children}</span>
    </button>
  );
}

/** El mismo botón, como enlace a otra pantalla. */
export function BotonEnlace({ variante, icono, bloque, chico, children, href, className }: Comun & { href: string; className?: string }) {
  return (
    <Link href={href} className={clases({ variante, bloque, chico }, className)}>
      {icono ? <Icono nombre={icono} /> : null}
      <span className="ui-boton__texto">{children}</span>
    </Link>
  );
}

type PropsBotonIcono = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'aria-label'> & {
  icono: NombreIconoUi;
  /** Nombre para el lector de pantalla: obligatorio, el ícono solo no dice nada. */
  etiqueta: string;
  tono?: 'claro' | 'azul' | 'vidrio';
  /** Punto amarillo (hay algo nuevo); se anuncia en la etiqueta, no solo con el color. */
  punto?: boolean;
};

/** Botón cuadrado o redondo con un solo ícono (≥ 48 px). */
export function BotonIcono({ icono, etiqueta, tono = 'claro', punto = false, className, type = 'button', ...resto }: PropsBotonIcono) {
  return (
    <button {...resto} type={type} aria-label={etiqueta} className={`ui-boton-icono ui-boton-icono--${tono}${className ? ` ${className}` : ''}`}>
      <Icono nombre={icono} />
      {punto ? <span className="ui-boton-icono__punto" aria-hidden="true" /> : null}
    </button>
  );
}

export function BotonIconoEnlace({ icono, etiqueta, href, tono = 'claro', punto = false }: { icono: NombreIconoUi; etiqueta: string; href: string; tono?: 'claro' | 'azul' | 'vidrio'; punto?: boolean }) {
  return (
    <Link href={href} aria-label={etiqueta} className={`ui-boton-icono ui-boton-icono--${tono}`}>
      <Icono nombre={icono} />
      {punto ? <span className="ui-boton-icono__punto" aria-hidden="true" /> : null}
    </Link>
  );
}
