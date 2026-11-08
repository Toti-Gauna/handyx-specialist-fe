'use client';
// Cabecera azul del Modo trabajo (H0-Modo, lote 2.3): salir, el chip «Modo trabajo», el chat con el cliente, el trabajo,
// el cronómetro grande y el avance de las tareas en tramos amarillos. El cronómetro es solo para vos (no mide
// puntualidad ni se le muestra a nadie); el lector de pantalla lo escucha en minutos y solo cuando lo pide.
import Link from 'next/link';
import { Icono } from '../atomos/Icono.tsx';
import { Chip } from '../atomos/Texto.tsx';
import { segmentosAvance, textoDuracion, textoReloj } from '../logicaModo.ts';
import '../trabajo.css';

export function CabeceraTrabajo({
  titulo,
  subtitulo,
  hrefSalir,
  hrefChat,
  etiquetaChat,
  trabajadoMs,
  enPausa,
  hechas,
  total,
}: {
  titulo: string;
  subtitulo: string;
  hrefSalir: string;
  hrefChat: string | null;
  etiquetaChat: string;
  trabajadoMs: number;
  enPausa: boolean;
  hechas: number;
  total: number;
}) {
  const segmentos = segmentosAvance(hechas, total);
  return (
    <header className="ui-cabecera-trabajo">
      <div className="ui-cabecera-trabajo__fila">
        <Link href={hrefSalir} className="ui-boton-icono ui-boton-icono--vidrio" aria-label="Salir del Modo trabajo">
          <Icono nombre="atras" />
        </Link>
        <Chip tono="amarillo" icono="herramienta">
          Modo trabajo
        </Chip>
        {hrefChat ? (
          <Link href={hrefChat} className="ui-boton-icono ui-boton-icono--vidrio" aria-label={etiquetaChat}>
            <Icono nombre="chat" />
          </Link>
        ) : (
          <span />
        )}
      </div>
      <div className="ui-cabecera-trabajo__datos">
        <span className="ui-cabecera-trabajo__nombre">
          <h1>{titulo}</h1>
          <span>{subtitulo}</span>
        </span>
        <span className="ui-cabecera-trabajo__reloj">
          <strong role="timer" aria-live="off" aria-label={`${enPausa ? 'En pausa. Llevás' : 'Trabajando hace'} ${textoDuracion(trabajadoMs)}`}>
            {textoReloj(trabajadoMs)}
          </strong>
          <span aria-hidden="true">{enPausa ? 'en pausa' : 'trabajando'}</span>
        </span>
      </div>
      {segmentos.length > 0 ? (
        <div className="ui-cabecera-trabajo__avance" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={hechas} aria-valuetext={`${hechas} de ${total} tareas hechas`} aria-label="Avance de las tareas">
          {segmentos.map((lleno, i) => (
            <span key={i} className={lleno ? 'ui-cabecera-trabajo__tramo ui-cabecera-trabajo__tramo--lleno' : 'ui-cabecera-trabajo__tramo'} />
          ))}
        </div>
      ) : null}
    </header>
  );
}
