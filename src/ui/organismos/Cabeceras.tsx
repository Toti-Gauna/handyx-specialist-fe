'use client';
// Cabeceras del kit v3. CabeceraAzul: solo en Inicio, con la marca, Avisos, Mis zonas y el único control de
// "Disponible" (no hay otro en la pantalla). BarraCompacta: el resto de las pantallas, con Volver, el título y una
// acción opcional a la derecha.
import Link from 'next/link';
import type { ReactNode } from 'react';
import { BotonIconoEnlace } from '../atomos/Boton.tsx';
import { Interruptor } from '../atomos/Controles.tsx';
import { Icono } from '../atomos/Icono.tsx';

export function CabeceraAzul({
  hrefAvisos,
  hrefZonas,
  avisosNuevos = 0,
  disponible,
  onDisponible,
  ocupado = false,
  subtitulo,
}: {
  hrefAvisos: string;
  hrefZonas: string;
  avisosNuevos?: number;
  /** null: todavía no se sabe (no se muestra el control para no mentir el estado). */
  disponible: boolean | null;
  onDisponible(v: boolean): void;
  ocupado?: boolean;
  /** Una línea junto a Disponible que dice qué pasa ahora («Te llegan pedidos de tus zonas»). Se anuncia al cambiar. */
  subtitulo?: string;
}) {
  return (
    <header className="ui-cabecera-azul">
      <div className="ui-cabecera-azul__fila">
        <span className="ui-cabecera-azul__marca">
          <span className="ui-cabecera-azul__logo">Handyx</span>
          <span className="ui-cabecera-azul__lema">Soluciones, no problemas</span>
        </span>
        <span className="ui-cabecera-azul__botones">
          <BotonIconoEnlace icono="campana" tono="vidrio" href={hrefAvisos} etiqueta={avisosNuevos > 0 ? `Avisos: ${avisosNuevos} sin leer` : 'Avisos'} punto={avisosNuevos > 0} />
          <BotonIconoEnlace icono="pin" tono="vidrio" href={hrefZonas} etiqueta="Mis zonas" />
        </span>
      </div>
      {disponible !== null ? (
        <div className="ui-cabecera-azul__disponible">
          {subtitulo ? (
            <p className="ui-cabecera-azul__estado" role="status">
              {subtitulo}
            </p>
          ) : null}
          <Interruptor tono="noche" encendido={disponible} etiqueta="Recibir pedidos" textoEncendido="Disponible" textoApagado="No disponible" deshabilitado={ocupado} onCambio={onDisponible} />
        </div>
      ) : null}
    </header>
  );
}

export function BarraCompacta({ titulo, subtitulo, hrefVolver, onVolver, accion }: { titulo: string; subtitulo?: string; hrefVolver?: string; onVolver?: () => void; accion?: ReactNode }) {
  const volver = hrefVolver ? (
    <Link href={hrefVolver} className="ui-boton-icono" aria-label="Volver">
      <Icono nombre="atras" />
    </Link>
  ) : onVolver ? (
    <button type="button" className="ui-boton-icono" aria-label="Volver" onClick={onVolver}>
      <Icono nombre="atras" />
    </button>
  ) : (
    <span />
  );
  return (
    <header className="ui-barra-compacta">
      {volver}
      <span className="ui-barra-compacta__titulo">
        <h1>{titulo}</h1>
        {subtitulo ? <span>{subtitulo}</span> : null}
      </span>
      <span className="ui-barra-compacta__accion">{accion}</span>
    </header>
  );
}
