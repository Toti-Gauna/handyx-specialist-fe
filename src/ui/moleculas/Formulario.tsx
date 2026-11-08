// Formulario del kit v3 (lote 1.1): columna con el espacio de siempre, sin la validación del navegador (los errores
// los dice la pantalla con texto y el foco va al primero). `id` para que la acción fija de abajo lo envíe con `form`.
import type { FormEvent, ReactNode } from 'react';

export function Formulario({ id, onEnviar, children, etiqueta }: { id?: string; onEnviar(e: FormEvent<HTMLFormElement>): void; children: ReactNode; etiqueta?: string }) {
  return (
    <form
      id={id}
      className="ui-formulario"
      aria-label={etiqueta}
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        onEnviar(e);
      }}
    >
      {children}
    </form>
  );
}

/** Fila con dos cosas en los extremos que baja de renglón si no entra (casilla a la izquierda, enlace a la derecha). */
export function FilaEntre({ children }: { children: ReactNode }) {
  return <div className="ui-fila-entre">{children}</div>;
}
