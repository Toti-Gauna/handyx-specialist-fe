'use client';
import { useId, type ComponentProps, type ReactNode } from 'react';
import type { Etiqueta, Tono } from '../lib/etiquetas.ts';
import { Icono, type NombreIcono } from './Icono.tsx';

/** Pastilla de estado: ícono + texto (el color es solo apoyo). */
export function Chip({ e, className = '' }: { e: Pick<Etiqueta, 'texto' | 'tono' | 'icono'>; className?: string }) {
  return (
    <span className={`chip chip--${e.tono} ${className}`}>
      <Icono nombre={e.icono} />
      {e.texto}
    </span>
  );
}

export function ChipTexto({ children, tono = 'neutro', icono }: { children: ReactNode; tono?: Tono; icono?: NombreIcono }) {
  return (
    <span className={`chip chip--${tono}`}>
      {icono ? <Icono nombre={icono} /> : null}
      {children}
    </span>
  );
}

export function Aviso({ tono = 'azul', icono = 'info', titulo, children, role }: { tono?: Tono; icono?: NombreIcono; titulo?: string; children?: ReactNode; role?: 'alert' | 'status' }) {
  return (
    <div className={`aviso aviso--${tono}`} role={role}>
      <Icono nombre={icono} />
      <div>
        {titulo ? <p className="aviso__titulo">{titulo}</p> : null}
        {children ? <div className="aviso__texto">{children}</div> : null}
      </div>
    </div>
  );
}

interface CampoBase {
  etiqueta: string;
  ayuda?: string;
  error?: string | undefined;
}

/** Campo con etiqueta visible, ayuda y error asociados (aria-describedby / aria-invalid). */
export function Campo({ etiqueta, ayuda, error, ...props }: CampoBase & ComponentProps<'input'>) {
  const id = useId();
  return (
    <div className="campo">
      <label htmlFor={id}>{etiqueta}</label>
      <input id={id} {...props} aria-invalid={error ? true : undefined} aria-describedby={error ? `${id}-e` : ayuda ? `${id}-a` : undefined} />
      {ayuda && !error ? (
        <p id={`${id}-a`} className="campo__ayuda">
          {ayuda}
        </p>
      ) : null}
      {error ? (
        <p id={`${id}-e`} className="campo__error">
          <Icono nombre="alerta" /> {error}
        </p>
      ) : null}
    </div>
  );
}

export function AreaTexto({ etiqueta, ayuda, error, ...props }: CampoBase & ComponentProps<'textarea'>) {
  const id = useId();
  return (
    <div className="campo">
      <label htmlFor={id}>{etiqueta}</label>
      <textarea id={id} rows={4} {...props} aria-invalid={error ? true : undefined} aria-describedby={error ? `${id}-e` : ayuda ? `${id}-a` : undefined} />
      {ayuda && !error ? (
        <p id={`${id}-a`} className="campo__ayuda">
          {ayuda}
        </p>
      ) : null}
      {error ? (
        <p id={`${id}-e`} className="campo__error">
          <Icono nombre="alerta" /> {error}
        </p>
      ) : null}
    </div>
  );
}

export function Seleccion({ etiqueta, ayuda, error, children, ...props }: CampoBase & ComponentProps<'select'>) {
  const id = useId();
  return (
    <div className="campo">
      <label htmlFor={id}>{etiqueta}</label>
      <select id={id} {...props} aria-invalid={error ? true : undefined} aria-describedby={error ? `${id}-e` : undefined}>
        {children}
      </select>
      {ayuda && !error ? <p className="campo__ayuda">{ayuda}</p> : null}
      {error ? (
        <p id={`${id}-e`} className="campo__error">
          <Icono nombre="alerta" /> {error}
        </p>
      ) : null}
    </div>
  );
}

/** Casilla explícita (aceptaciones legales: nunca tildada por defecto). */
export function Casilla({ etiqueta, error, ...props }: { etiqueta: ReactNode; error?: string | undefined } & Omit<ComponentProps<'input'>, 'type'>) {
  const id = useId();
  return (
    <div className="casilla">
      <input id={id} type="checkbox" {...props} aria-invalid={error ? true : undefined} aria-describedby={error ? `${id}-e` : undefined} />
      <label htmlFor={id}>{etiqueta}</label>
      {error ? (
        <p id={`${id}-e`} className="campo__error">
          <Icono nombre="alerta" /> {error}
        </p>
      ) : null}
    </div>
  );
}

/** Interruptor accesible (role="switch"): el estado se dice con texto, no solo con color. */
export function Interruptor({ etiqueta, descripcion, activo, onCambio, deshabilitado }: { etiqueta: string; descripcion?: string; activo: boolean; onCambio(v: boolean): void; deshabilitado?: boolean }) {
  const id = useId();
  return (
    <div className="interruptor">
      <div className="interruptor__texto">
        <span id={`${id}-t`} className="interruptor__etiqueta">
          {etiqueta}
        </span>
        {descripcion ? (
          <span id={`${id}-d`} className="texto-suave texto-chico">
            {descripcion}
          </span>
        ) : null}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={activo}
        aria-labelledby={`${id}-t`}
        aria-describedby={descripcion ? `${id}-d` : undefined}
        className={`interruptor__control${activo ? ' interruptor__control--on' : ''}`}
        disabled={deshabilitado}
        onClick={() => onCambio(!activo)}
      >
        <span className="interruptor__estado">{activo ? 'Sí' : 'No'}</span>
        <span className="interruptor__perilla" aria-hidden="true" />
      </button>
    </div>
  );
}

export function Pasos({ actual, pasos }: { actual: number; pasos: string[] }) {
  return (
    <ol className="pasos" aria-label="Progreso del alta">
      {pasos.map((p, i) => (
        <li key={p} className={i === actual ? 'pasos__item pasos__item--actual' : i < actual ? 'pasos__item pasos__item--hecho' : 'pasos__item'} aria-current={i === actual ? 'step' : undefined}>
          <span className="pasos__numero">{i < actual ? <Icono nombre="check" /> : i + 1}</span>
          <span className="pasos__texto">{p}</span>
        </li>
      ))}
    </ol>
  );
}

export function Seccion({ titulo, accion, children }: { titulo: string; accion?: ReactNode; children: ReactNode }) {
  return (
    <section className="seccion">
      <div className="seccion__cabecera">
        <h2 className="seccion__titulo">{titulo}</h2>
        {accion}
      </div>
      {children}
    </section>
  );
}

export function Tarjeta({ children, tono, className = '' }: { children: ReactNode; tono?: 'gris' | 'azul' | 'noche' | 'amarillo'; className?: string }) {
  return <div className={`tarjeta${tono ? ` tarjeta--${tono}` : ''} ${className}`}>{children}</div>;
}

export function Dato({ etiqueta, valor }: { etiqueta: string; valor: ReactNode }) {
  return (
    <div className="dato">
      <dt>{etiqueta}</dt>
      <dd>{valor}</dd>
    </div>
  );
}

export function Cabecera({ titulo, atras, children }: { titulo: string; atras?: ReactNode; children?: ReactNode }) {
  return (
    <header className="cabecera-pantalla">
      {atras}
      <h1 className="titulo">{titulo}</h1>
      {children}
    </header>
  );
}
