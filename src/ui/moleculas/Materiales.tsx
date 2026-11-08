'use client';
// Piezas para elegir y revisar materiales y precios (lote 2.2): fila que se elige y muestra la cantidad, fila con casilla
// y cifra, tarjeta punteada para agregar lo que falta, resumen de lo que va a pasar con «Cambiar», mosaico con una cifra
// tocable y el precio de antes tachado al lado del nuevo. Todo con su texto (nunca solo color) y áreas táctiles ≥ 48 px.
import Link from 'next/link';
import { useId, type ReactNode } from 'react';
import { pesosDesdeCentavos } from '../../lib/formato.ts';
import { textoCifra } from '../logica.ts';
import { BotonIcono } from '../atomos/Boton.tsx';
import { Icono, type NombreIconoUi } from '../atomos/Icono.tsx';
import { Cifra } from '../atomos/Texto.tsx';
import { Stepper } from './Controles.tsx';
import './materiales.css';

/**
 * Un material de tu lista que se toca para elegirlo. Elegido, se resalta (borde y «Elegido» escrito) y abajo aparece la
 * cantidad con − y +. Sin elegir, el botón «+» lo elige.
 */
export function FilaEleccion({
  icono = 'caja',
  titulo,
  detalle,
  centavos,
  elegida,
  cantidad,
  unidad,
  onElegir,
  onCantidad,
}: {
  icono?: NombreIconoUi;
  titulo: string;
  detalle: string;
  centavos: number;
  elegida: boolean;
  cantidad: number;
  unidad?: string;
  onElegir(): void;
  onCantidad(n: number): void;
}) {
  return (
    <li className={`ui-eleccion${elegida ? ' ui-eleccion--elegida' : ''}`}>
      <div className="ui-eleccion__fila">
        <span className="ui-eleccion__ico" aria-hidden="true">
          <Icono nombre={icono} />
        </span>
        <span className="ui-eleccion__texto">
          <strong>{titulo}</strong>
          <span>{elegida ? `Elegido · ${detalle}` : detalle}</span>
        </span>
        {elegida ? null : (
          <>
            <Cifra centavos={centavos} tam="chico" como="strong" />
            <BotonIcono icono="mas" tono="claro" etiqueta={`Elegir ${titulo}, ${pesosDesdeCentavos(centavos)}`} onClick={onElegir} />
          </>
        )}
      </div>
      {elegida ? <Stepper valor={cantidad} min={1} max={999} etiqueta={`Cantidad de ${titulo}`} unidad={unidad} onCambio={onCantidad} /> : null}
    </li>
  );
}

/** Fila con casilla: el texto entero es tocable y la cifra (o lo que vaya) queda a la derecha. */
export function FilaCasilla({ titulo, detalle, derecha, marcada, onCambio, deshabilitada = false }: { titulo: string; detalle?: ReactNode; derecha?: ReactNode; marcada: boolean; onCambio(v: boolean): void; deshabilitada?: boolean }) {
  const id = useId();
  return (
    <li className={`ui-casilla-fila${marcada ? ' ui-casilla-fila--on' : ''}`}>
      <input id={id} type="checkbox" checked={marcada} disabled={deshabilitada} onChange={(e) => onCambio(e.target.checked)} aria-describedby={detalle ? `${id}-d` : undefined} />
      <span className="ui-casilla-fila__caja" aria-hidden="true">
        <Icono nombre="check" tam="chico" />
      </span>
      <label htmlFor={id} className="ui-casilla-fila__texto">
        <strong>{titulo}</strong>
      </label>
      {detalle ? (
        <span id={`${id}-d`} className="ui-casilla-fila__detalle">
          {detalle}
        </span>
      ) : null}
      {derecha ? <span className="ui-casilla-fila__derecha">{derecha}</span> : null}
    </li>
  );
}

/** Tarjeta punteada con un «+» amarillo: agregar lo que no está («¿No está? Agregalo a tu lista»). */
export function FilaAgregar({ titulo, detalle, href, onClick }: { titulo: string; detalle?: string; href?: string; onClick?: () => void }) {
  const cuerpo = (
    <>
      <span className="ui-agregar__ico" aria-hidden="true">
        <Icono nombre="mas" />
      </span>
      <span className="ui-agregar__texto">
        <strong>{titulo}</strong>
        {detalle ? <span>{detalle}</span> : null}
      </span>
    </>
  );
  if (href)
    return (
      <Link href={href} className="ui-agregar">
        {cuerpo}
      </Link>
    );
  return (
    <button type="button" className="ui-agregar" onClick={onClick}>
      {cuerpo}
    </button>
  );
}

/** Lo que va a pasar, en una caja gris con tildes, y un botón para cambiarlo. */
export function ResumenHechos({ lineas, textoCambiar = 'Cambiar', etiquetaCambiar, onCambiar }: { lineas: readonly string[]; textoCambiar?: string; etiquetaCambiar?: string; onCambiar(): void }) {
  return (
    <div className="ui-hechos">
      <ul className="ui-hechos__lista">
        {lineas.map((l) => (
          <li key={l}>
            <Icono nombre="check" tam="chico" />
            <span>{l}</span>
          </li>
        ))}
      </ul>
      <button type="button" className="ui-hechos__cambiar" aria-label={etiquetaCambiar} onClick={onCambiar}>
        {textoCambiar}
      </button>
    </div>
  );
}

/** Mosaico con rótulo y cifra («HORA $ 22.000»). Con `onClick` se toca para cambiarla. */
export function MosaicoCifra({ rotulo, centavos, texto, detalle, tono = 'gris', onClick, etiqueta }: { rotulo: string; centavos?: number; texto?: string; detalle?: string; tono?: 'gris' | 'azul'; onClick?: () => void; etiqueta?: string }) {
  const cuerpo = (
    <>
      <span className="ui-mosaico-cifra__rotulo">{rotulo}</span>
      <Cifra centavos={centavos} texto={texto} tam="medio" como="strong" />
      {detalle ? <span className="ui-mosaico-cifra__detalle">{detalle}</span> : null}
    </>
  );
  const clase = `ui-mosaico-cifra ui-mosaico-cifra--${tono}`;
  if (onClick)
    return (
      <button type="button" className={`${clase} ui-mosaico-cifra--tocable`} aria-label={etiqueta} onClick={onClick}>
        {cuerpo}
      </button>
    );
  return <div className={clase}>{cuerpo}</div>;
}

/** El precio de antes tachado y el nuevo; el lector escucha «antes $ 9.100, ahora $ 9.800». */
export function CifraCambio({ antes, ahora, textoAhora }: { antes: number | null; ahora: number | null; textoAhora?: string }) {
  return (
    <span className="ui-cifra-cambio">
      {antes !== null && antes !== ahora ? (
        <s>
          <span className="visualmente-oculto">antes </span>
          {textoCifra(antes)}
        </s>
      ) : null}
      <strong>
        {antes !== null && antes !== ahora ? <span className="visualmente-oculto">ahora </span> : null}
        {textoCifra(ahora ?? undefined, textoAhora)}
      </strong>
    </span>
  );
}
