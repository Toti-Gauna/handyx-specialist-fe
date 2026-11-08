'use client';
// Hoja inferior y modal flotante del kit v3, sobre <dialog> modal: el foco queda adentro, Esc cierra y la pantalla de
// atrás se ve detrás de un velo (inerte). La hoja se puede bajar arrastrando la manija, pero siempre tiene el botón
// "Cerrar" (todo gesto tiene botón). Mientras se arrastra, el desplazamiento se fija desde código en --ui-arrastre.
import { useEffect, useId, useRef, type ReactNode } from 'react';
import { Icono } from '../atomos/Icono.tsx';

/** Más que esto hacia abajo al soltar, la hoja se cierra. */
const UMBRAL_CIERRE_PX = 110;

interface PropsDialogo {
  abierta: boolean;
  titulo: string;
  onCerrar(): void;
  /** false: no se cierra con Esc ni tocando afuera ni con la X (exige una acción de adentro). */
  cerrable?: boolean;
  children: ReactNode;
  /** Acciones fijas al pie de la hoja (una principal). */
  pie?: ReactNode;
}

function useDialogo(abierta: boolean) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (abierta && !d.open) d.showModal();
    if (!abierta && d.open) d.close();
  }, [abierta]);
  return ref;
}

export function Hoja({ abierta, titulo, onCerrar, cerrable = true, children, pie }: PropsDialogo) {
  const ref = useDialogo(abierta);
  const idTitulo = useId();
  const inicio = useRef<number | null>(null);

  const soltar = (y: number) => {
    const d = ref.current;
    if (inicio.current === null || !d) return;
    const dy = y - inicio.current;
    inicio.current = null;
    d.style.removeProperty('--ui-arrastre');
    d.classList.remove('ui-hoja--arrastrando');
    if (cerrable && dy > UMBRAL_CIERRE_PX) onCerrar();
  };

  return (
    <dialog
      ref={ref}
      className="ui-hoja"
      aria-labelledby={idTitulo}
      onCancel={(e) => {
        e.preventDefault();
        if (cerrable) onCerrar();
      }}
      onClick={(e) => {
        if (cerrable && e.target === ref.current) onCerrar();
      }}
    >
      {abierta ? (
        <div className="ui-hoja__panel">
          {cerrable ? (
            <div
              className="ui-hoja__manija"
              aria-hidden="true"
              onPointerDown={(e) => {
                inicio.current = e.clientY;
                e.currentTarget.setPointerCapture(e.pointerId);
                ref.current?.classList.add('ui-hoja--arrastrando');
              }}
              onPointerMove={(e) => {
                if (inicio.current === null) return;
                ref.current?.style.setProperty('--ui-arrastre', `${Math.max(0, e.clientY - inicio.current)}px`);
              }}
              onPointerUp={(e) => soltar(e.clientY)}
              onPointerCancel={() => soltar(inicio.current ?? 0)}
            >
              <span />
            </div>
          ) : null}
          <div className="ui-hoja__cabecera">
            <h2 id={idTitulo} className="ui-hoja__titulo">
              {titulo}
            </h2>
            {cerrable ? (
              <button type="button" className="ui-boton-icono" onClick={onCerrar} aria-label="Cerrar">
                <Icono nombre="cerrar" />
              </button>
            ) : null}
          </div>
          <div className="ui-hoja__cuerpo">{children}</div>
          {pie ? <div className="ui-hoja__pie">{pie}</div> : null}
        </div>
      ) : null}
    </dialog>
  );
}

/** Modal flotante en el centro (confirmaciones cortas, avisos con una decisión). */
export function ModalFlotante({ abierta, titulo, onCerrar, cerrable = true, children, pie }: PropsDialogo) {
  const ref = useDialogo(abierta);
  const idTitulo = useId();
  return (
    <dialog
      ref={ref}
      className="ui-modal"
      aria-labelledby={idTitulo}
      onCancel={(e) => {
        e.preventDefault();
        if (cerrable) onCerrar();
      }}
      onClick={(e) => {
        if (cerrable && e.target === ref.current) onCerrar();
      }}
    >
      {abierta ? (
        <div className="ui-modal__panel">
          <h2 id={idTitulo} className="ui-hoja__titulo">
            {titulo}
          </h2>
          <div className="ui-hoja__cuerpo">{children}</div>
          {pie ? <div className="ui-modal__pie">{pie}</div> : null}
        </div>
      ) : null}
    </dialog>
  );
}
