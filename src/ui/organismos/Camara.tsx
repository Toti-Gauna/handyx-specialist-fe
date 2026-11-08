'use client';
// Pantalla de cámara del kit v3 (lote 2.4: medir, escanear, lupa y código de barras). La imagen de la cámara (o la escena
// de prueba) ocupa todo; arriba, Volver y un chip con el estado; abajo, un panel con las acciones. Nada tapa lo
// importante: con texto agrandado el panel crece y la pantalla se desplaza. El título va escrito (h1) aunque la cámara
// llene la pantalla. Con «reducir movimiento», sin animaciones.
import Link from 'next/link';
import type { ReactNode, RefObject } from 'react';
import { Icono, type NombreIconoUi } from '../atomos/Icono.tsx';
import '../herramientas.css';

export function PantallaCamara({
  titulo,
  hrefVolver,
  onVolver,
  chip,
  fondo,
  encima,
  arriba,
  panel,
  tono = 'claro',
}: {
  titulo: string;
  hrefVolver?: string;
  onVolver?: () => void;
  /** Chip arriba a la derecha («Precisión ± 1 cm», «18 de 30 fotos»). */
  chip?: ReactNode;
  /** La cámara (VideoCamara) o la escena de prueba. Decorativa: lo importante está en texto en el panel. */
  fondo: ReactNode;
  /** Lo que se dibuja encima de la imagen (puntos, anillo de fotos). */
  encima?: ReactNode;
  /** Texto grande arriba, sobre la imagen («Girá alrededor del termotanque»). */
  arriba?: ReactNode;
  panel: ReactNode;
  /** `claro`: panel blanco flotante. `oscuro`: botones sobre la imagen. */
  tono?: 'claro' | 'oscuro';
}) {
  const volver = hrefVolver ? (
    <Link href={hrefVolver} className="ui-camara__volver" aria-label="Volver">
      <Icono nombre="atras" />
    </Link>
  ) : (
    <button type="button" className="ui-camara__volver" aria-label="Volver" onClick={onVolver}>
      <Icono nombre="atras" />
    </button>
  );
  return (
    <div className={`ui-camara ui-camara--${tono}`}>
      <div className="ui-camara__fondo">{fondo}</div>
      {encima ? <div className="ui-camara__encima">{encima}</div> : null}
      <header className="ui-camara__arriba">
        {volver}
        <h1 className="visualmente-oculto">{titulo}</h1>
        {chip ? <span className="ui-camara__chip">{chip}</span> : null}
      </header>
      {arriba ? <div className="ui-camara__texto">{arriba}</div> : null}
      <div className="ui-camara__espacio" />
      <div className="ui-camara__panel">{panel}</div>
    </div>
  );
}

/** El video de la cámara trasera, sin sonido y en línea (iPhone). Decorativo: la pantalla dice todo en texto. */
export function VideoCamara({ video }: { video: RefObject<HTMLVideoElement | null> }) {
  return <video ref={video} className="ui-camara__video" playsInline muted autoPlay aria-hidden="true" />;
}

/** Botón redondo grande para sacar la foto (84 px), con su nombre. */
export function Disparador({ etiqueta, onClick, deshabilitado = false }: { etiqueta: string; onClick(): void; deshabilitado?: boolean }) {
  return (
    <button type="button" className="ui-disparador" aria-label={etiqueta} onClick={onClick} disabled={deshabilitado}>
      <span className="ui-disparador__centro" aria-hidden="true" />
    </button>
  );
}

/**
 * Botón sobre fondo oscuro (cámara, nivel) con ícono y palabra, ≥ 64 px de alto. `presionado`: estado de un botón que
 * se prende y se apaga (Fijar, Linterna), dicho con aria-pressed y con el texto.
 */
export function BotonOscuro({ icono, children, onClick, presionado, deshabilitado = false, href }: { icono: NombreIconoUi; children: ReactNode; onClick?: () => void; presionado?: boolean; deshabilitado?: boolean; href?: string }) {
  if (href)
    return (
      <Link href={href} className="ui-boton-oscuro">
        <Icono nombre={icono} />
        <span>{children}</span>
      </Link>
    );
  return (
    <button type="button" className={`ui-boton-oscuro${presionado ? ' ui-boton-oscuro--on' : ''}`} aria-pressed={presionado} onClick={onClick} disabled={deshabilitado}>
      <Icono nombre={icono} />
      <span>{children}</span>
    </button>
  );
}
