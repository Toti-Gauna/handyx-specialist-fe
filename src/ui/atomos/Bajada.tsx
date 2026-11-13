// Átomos de texto corrido del kit v3 (lote 1.1): la bajada bajo un título (17 px, gris de lectura con contraste AA)
// y el enlace de texto con área táctil de 48 px (subrayado: no depende del color). `EnlaceTexto` es un enlace con
// `href` o un botón con `onClick`, con el mismo aspecto.
import Link from 'next/link';
import type { ReactNode } from 'react';

export function Bajada({ children, chica = false }: { children: ReactNode; chica?: boolean }) {
  return <p className={`ui-bajada${chica ? ' ui-bajada--chica' : ''}`}>{children}</p>;
}

export function EnlaceTexto({ children, href, onClick, centrado = false, deshabilitado = false }: { children: ReactNode; href?: string; onClick?: () => void; centrado?: boolean; deshabilitado?: boolean }) {
  const clase = `ui-enlace${centrado ? ' ui-enlace--centrado' : ''}`;
  if (href)
    return (
      <Link className={clase} href={href}>
        {children}
      </Link>
    );
  return (
    <button type="button" className={clase} onClick={onClick} disabled={deshabilitado}>
      {children}
    </button>
  );
}
