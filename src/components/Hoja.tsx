'use client';
import { useEffect, useRef, type ReactNode } from 'react';
import { Icono } from './Icono.tsx';

interface Props {
  abierta: boolean;
  titulo: string;
  onCerrar(): void;
  /** false: no se cierra con Esc, ni tocando afuera, ni con la X (avisos que exigen una acción). */
  cerrable?: boolean;
  children: ReactNode;
}

/** Hoja inferior sobre <dialog> modal: foco atrapado, Esc cierra, el contenido de atrás queda inerte. */
export function Hoja({ abierta, titulo, onCerrar, cerrable = true, children }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (abierta && !d.open) d.showModal();
    if (!abierta && d.open) d.close();
  }, [abierta]);

  return (
    <dialog
      ref={ref}
      className="hoja"
      aria-labelledby="hoja-titulo"
      onCancel={(e) => {
        e.preventDefault();
        if (cerrable) onCerrar();
      }}
      onClick={(e) => {
        if (cerrable && e.target === ref.current) onCerrar();
      }}
    >
      {abierta ? (
        <div className="hoja__cuerpo">
          <div className="hoja__cabecera">
            <h2 id="hoja-titulo" className="hoja__titulo">
              {titulo}
            </h2>
            {cerrable ? (
              <button type="button" className="boton-icono" onClick={onCerrar} aria-label="Cerrar">
                <Icono nombre="cerrar" />
              </button>
            ) : null}
          </div>
          {children}
        </div>
      ) : null}
    </dialog>
  );
}
