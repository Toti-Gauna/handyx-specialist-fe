'use client';
// Botón de Google o Apple del kit v3 (lote 1.1, D6-Login y D6-Acceso): contorno con el logo y el nombre, del mismo
// alto que el resto (56 px). El logo es decorativo: el nombre accesible es el texto visible («Google», «Apple»).
import type { ButtonHTMLAttributes } from 'react';
import { LogoApple, LogoGoogle } from '../../components/BotonesProveedor.tsx';

export function BotonProveedor({ proveedor, className, type = 'button', ...resto }: Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> & { proveedor: 'google' | 'apple' }) {
  return (
    <button {...resto} type={type} className={`ui-boton ui-boton--contorno ui-boton--bloque ui-proveedor${className ? ` ${className}` : ''}`}>
      <span className="ui-proveedor__logo">{proveedor === 'google' ? <LogoGoogle /> : <LogoApple />}</span>
      <span className="ui-boton__texto">{proveedor === 'google' ? 'Google' : 'Apple'}</span>
    </button>
  );
}
