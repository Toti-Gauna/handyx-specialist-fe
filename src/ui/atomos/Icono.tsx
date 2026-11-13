// Ícono de línea del kit v3: reúne los trazos de la landing (src/components/Icono.tsx) y los del lienzo deluxe
// (./iconos.ts). Si un nombre está en los dos, gana el del lienzo (es el diseño vigente). Siempre decorativo: el texto
// de al lado o el `aria-label` del control dicen lo que significa.
import { TRAZOS_LANDING } from '../../components/Icono.tsx';
import { TRAZOS_LIENZO } from './iconos.ts';

const TRAZOS = { ...TRAZOS_LANDING, ...TRAZOS_LIENZO } as const;

export type NombreIconoUi = keyof typeof TRAZOS;

export const NOMBRES_ICONO = Object.keys(TRAZOS) as NombreIconoUi[];

export function Icono({ nombre, tam = 'medio', className = '' }: { nombre: NombreIconoUi; tam?: 'chico' | 'medio' | 'grande'; className?: string }) {
  return (
    <svg
      className={`ui-icono ui-icono--${tam}${className ? ` ${className}` : ''}`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      // Cadenas constantes del repo: no hay contenido de usuario.
      dangerouslySetInnerHTML={{ __html: TRAZOS[nombre] }}
    />
  );
}
