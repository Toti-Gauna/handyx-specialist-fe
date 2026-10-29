'use client';
import { useEffect, useId, useRef, type ReactNode } from 'react';
import { Icono } from './Icono.tsx';

const ENFOCABLES = 'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])';

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
  const idTitulo = useId(); // único: puede haber más de una hoja en la pantalla
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
      aria-labelledby={idTitulo}
      onCancel={(e) => {
        e.preventDefault();
        if (cerrable) onCerrar();
      }}
      onClick={(e) => {
        if (cerrable && e.target === ref.current) onCerrar();
      }}
      onKeyDown={(e) => {
        // El foco circula dentro de la hoja (además de que el fondo queda inerte por showModal).
        if (e.key !== 'Tab' || !ref.current) return;
        const enfocables = [...ref.current.querySelectorAll<HTMLElement>(ENFOCABLES)].filter((x) => !x.hasAttribute('disabled') && x.offsetParent !== null);
        const primero = enfocables[0];
        const ultimo = enfocables[enfocables.length - 1];
        if (!primero || !ultimo) return;
        if (e.shiftKey && document.activeElement === primero) {
          e.preventDefault();
          ultimo.focus();
        } else if (!e.shiftKey && document.activeElement === ultimo) {
          e.preventDefault();
          primero.focus();
        }
      }}
    >
      {abierta ? (
        <div className="hoja__cuerpo">
          <div className="hoja__cabecera">
            <h2 id={idTitulo} className="hoja__titulo">
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
