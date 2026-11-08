// Átomos de texto del kit v3: chip (ícono + texto, nunca solo color), etiqueta de sección, marcador amarillo,
// cifra (montos y números sin corte y con ancho normal) y separador.
import type { ReactNode } from 'react';
import { textoCifra } from '../logica.ts';
import { Icono, type NombreIconoUi } from './Icono.tsx';

export type TonoChip = 'tinte' | 'amarillo' | 'noche' | 'gris' | 'exito' | 'error' | 'blanco' | 'azul';

/** Pastilla con ícono y texto. El estado se entiende por el texto: el color solo acompaña. */
export function Chip({ children, icono, tono = 'tinte' }: { children: ReactNode; icono?: NombreIconoUi; tono?: TonoChip }) {
  return (
    <span className={`ui-chip ui-chip--${tono}`}>
      {icono ? <Icono nombre={icono} tam="chico" /> : null}
      {children}
    </span>
  );
}

/** Rótulo chico en mayúsculas sobre un título o una sección ("TU DÍA"). */
export function Etiqueta({ children, como: Como = 'span', claro = false }: { children: ReactNode; como?: 'span' | 'p' | 'h2' | 'h3'; claro?: boolean }) {
  return <Como className={`ui-etiqueta${claro ? ' ui-etiqueta--claro' : ''}`}>{children}</Como>;
}

/** Resaltador amarillo bajo las letras (el `==texto==` de la marca). */
export function Marcador({ children }: { children: ReactNode }) {
  return <span className="ui-marcador">{children}</span>;
}

/** Título grande de pantalla: Archivo 900 ensanchado, con una parte marcada opcional. */
export function Titulo({ antes, marcado, despues, nivel = 1, tam = 'grande' }: { antes?: ReactNode; marcado?: ReactNode; despues?: ReactNode; nivel?: 1 | 2; tam?: 'grande' | 'medio' }) {
  const H = nivel === 1 ? 'h1' : 'h2';
  return (
    <H className={`ui-titulo ui-titulo--${tam}`}>
      {antes}
      {marcado ? <Marcador>{marcado}</Marcador> : null}
      {despues}
    </H>
  );
}

/**
 * Monto o número que no se corta nunca ("$ 45.000", "12 km"): los espacios pasan a ser no separables. Ancho normal
 * (sin `font-stretch`) para que entre en los mosaicos chicos. `centavos` formatea en pesos; `texto` lo muestra tal cual.
 */
export function Cifra({ centavos, texto, tam = 'medio', como: Como = 'span' }: { centavos?: number; texto?: string; tam?: 'chico' | 'medio' | 'grande'; como?: 'span' | 'strong' | 'p' }) {
  return <Como className={`ui-cifra ui-cifra--${tam}`}>{textoCifra(centavos, texto)}</Como>;
}

export function Separador({ texto }: { texto?: string }) {
  if (!texto) return <hr className="ui-separador" />;
  return (
    <div className="ui-separador ui-separador--texto" role="separator">
      <span>{texto}</span>
    </div>
  );
}
