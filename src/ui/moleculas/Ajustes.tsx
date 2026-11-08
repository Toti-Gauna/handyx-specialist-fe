'use client';
// Moléculas de Cuenta (lote 1.4): grupo de ajustes con rótulo, fila con interruptor, fila de dato con estado y mosaico
// de resumen. Siempre con el estado escrito (nunca solo color ni solo la posición de la perilla) y áreas ≥ 48 px.
import Link from 'next/link';
import { useId, type ReactNode } from 'react';
import { Icono, type NombreIconoUi } from '../atomos/Icono.tsx';
import { Cifra } from '../atomos/Texto.tsx';
import './ajustes.css';

/** Tarjeta blanca con un rótulo en mayúsculas ("TU CUENTA") y sus filas adentro. */
export function GrupoAjustes({ etiqueta, children, nivel = 2 }: { etiqueta?: string; children: ReactNode; nivel?: 2 | 3 }) {
  const id = useId();
  const H = nivel === 2 ? 'h2' : 'h3';
  return (
    <section className="ui-grupo" aria-labelledby={etiqueta ? id : undefined}>
      {etiqueta ? (
        <H id={id} className="ui-grupo__etiqueta">
          {etiqueta}
        </H>
      ) : null}
      {children}
    </section>
  );
}

/** Un ajuste que se enciende o se apaga: título, una línea que lo explica y el estado escrito ("Sí" / "No"). */
export function FilaAjuste({ titulo, detalle, encendido, onCambio, deshabilitado = false, textoEncendido = 'Sí', textoApagado = 'No' }: { titulo: string; detalle?: string; encendido: boolean; onCambio(v: boolean): void; deshabilitado?: boolean; textoEncendido?: string; textoApagado?: string }) {
  const id = useId();
  return (
    <button
      type="button"
      role="switch"
      aria-checked={encendido}
      aria-labelledby={`${id}-t`}
      aria-describedby={detalle ? `${id}-d` : undefined}
      disabled={deshabilitado}
      className={`ui-ajuste${encendido ? ' ui-ajuste--on' : ''}`}
      onClick={() => onCambio(!encendido)}
    >
      <span className="ui-ajuste__texto">
        <strong id={`${id}-t`}>{titulo}</strong>
        {detalle ? <span id={`${id}-d`}>{detalle}</span> : null}
      </span>
      <span className="ui-ajuste__control" aria-hidden="true">
        <span className="ui-ajuste__pista">
          <span className="ui-ajuste__perilla" />
        </span>
        <span className="ui-ajuste__estado">{encendido ? textoEncendido : textoApagado}</span>
      </span>
    </button>
  );
}

/** Rótulo, valor y, a la derecha, el estado de ese dato (un `Chip`). Nada de números completos: solo lo que llega ya enmascarado. */
export function FilaDato({ rotulo, valor, estado }: { rotulo: string; valor: ReactNode; estado?: ReactNode }) {
  return (
    <div className="ui-fila-dato">
      <div className="ui-fila-dato__texto">
        <span>{rotulo}</span>
        <strong>{valor}</strong>
      </div>
      {estado ? <div className="ui-fila-dato__estado">{estado}</div> : null}
    </div>
  );
}

/** Mosaico de resumen de Cuenta (ingresos, taller…): ícono, título, cifra y una línea. Es un enlace entero. */
export function ResumenTarjeta({ icono, titulo, centavos, texto, detalle, href, tono = 'tinte' }: { icono: NombreIconoUi; titulo: string; centavos?: number; texto?: string; detalle?: string; href: string; tono?: 'tinte' | 'noche' | 'amarillo' }) {
  return (
    <Link href={href} className={`ui-resumen ui-resumen--${tono}`}>
      <span className="ui-resumen__ico" aria-hidden="true">
        <Icono nombre={icono} />
      </span>
      <strong className="ui-resumen__titulo">{titulo}</strong>
      {centavos !== undefined || texto ? <Cifra centavos={centavos} texto={texto} tam="medio" como="p" /> : null}
      {detalle ? <span className="ui-resumen__detalle">{detalle}</span> : null}
    </Link>
  );
}

/** Una acción que no se puede deshacer a la ligera (darme de baja): borde y texto rojos, con el ícono de alerta. */
export function FilaAlerta({ titulo, detalle, onClick }: { titulo: string; detalle: string; onClick(): void }) {
  return (
    <button type="button" className="ui-fila-alerta" onClick={onClick}>
      <Icono nombre="alerta" />
      <span className="ui-fila-alerta__texto">
        <strong>{titulo}</strong>
        <span>{detalle}</span>
      </span>
      <Icono nombre="flecha" />
    </button>
  );
}

/** Un método de segunda verificación: tarjeta propia, con el recomendado resaltado y el estado escrito en un chip. */
export function FilaMetodo({ icono, titulo, detalle, destacado = false, chip, href, onClick, deshabilitado = false }: { icono: NombreIconoUi; titulo: string; detalle: string; destacado?: boolean; chip?: ReactNode; href?: string; onClick?: () => void; deshabilitado?: boolean }) {
  const cuerpo = (
    <>
      <span className="ui-metodo__ico" aria-hidden="true">
        <Icono nombre={icono} />
      </span>
      <span className="ui-metodo__texto">
        <strong>{titulo}</strong>
        <span>{detalle}</span>
        {chip ? <span className="ui-metodo__chip">{chip}</span> : null}
      </span>
      {!deshabilitado ? <Icono nombre="flecha" className="ui-fila__flecha" /> : null}
    </>
  );
  const clase = `ui-metodo${destacado ? ' ui-metodo--destacado' : ''}`;
  if (href && !deshabilitado)
    return (
      <Link href={href} className={clase}>
        {cuerpo}
      </Link>
    );
  return (
    <button type="button" className={clase} onClick={onClick} disabled={deshabilitado}>
      {cuerpo}
    </button>
  );
}
