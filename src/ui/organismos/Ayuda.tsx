'use client';
// Centro de ayuda (D6-Ayuda): cabecera azul con el buscador, temas, preguntas que se abren una por una y el acceso a
// soporte. Todo texto simple, sin siglas: lo tiene que poder usar una persona de 90 años.
import Link from 'next/link';
import { useId, type ReactNode } from 'react';
import { BotonIconoEnlace } from '../atomos/Boton.tsx';
import { Icono, type NombreIconoUi } from '../atomos/Icono.tsx';
import { Chip, Marcador } from '../atomos/Texto.tsx';
import { Buscador } from '../moleculas/Controles.tsx';
import './cuenta.css';

export function CabeceraAyuda({ hrefVolver, horario, busqueda, onBusqueda }: { hrefVolver: string; horario: string; busqueda: string; onBusqueda(v: string): void }) {
  return (
    <header className="ui-cab-ayuda">
      <div className="ui-cab-ayuda__fila">
        <BotonIconoEnlace icono="atras" etiqueta="Volver" href={hrefVolver} tono="vidrio" />
        <Chip tono="blanco" icono="reloj">
          {horario}
        </Chip>
      </div>
      <p className="ui-cab-ayuda__etiqueta">Centro de ayuda</p>
      <h1 className="ui-cab-ayuda__titulo">
        ¿En qué te <Marcador>ayudamos</Marcador>?
      </h1>
      <Buscador valor={busqueda} onCambio={onBusqueda} etiqueta="Buscar en la ayuda" ejemplo="Buscá «cobro» u «obra»…" />
    </header>
  );
}

export function TemasAyuda({ temas, elegido, onElegir }: { temas: readonly { id: string; texto: string; icono: NombreIconoUi; cantidad: number }[]; elegido: string | null; onElegir(id: string | null): void }) {
  return (
    <ul className="ui-temas" aria-label="Temas de ayuda">
      {temas.map((t) => (
        <li key={t.id}>
          <button type="button" className={`ui-tema${elegido === t.id ? ' ui-tema--on' : ''}`} aria-pressed={elegido === t.id} onClick={() => onElegir(elegido === t.id ? null : t.id)}>
            <Icono nombre={t.icono} />
            <strong>{t.texto}</strong>
            <span>{t.cantidad === 1 ? '1 respuesta' : `${t.cantidad} respuestas`}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}

/** Preguntas con su respuesta: nativas (`details`), así el lector de pantalla y el teclado ya las entienden. */
export function PreguntasAyuda({ titulo, preguntas, vacio }: { titulo: string; preguntas: readonly { pregunta: string; respuesta: string }[]; vacio: ReactNode }) {
  const id = useId();
  return (
    <section className="ui-preguntas" aria-labelledby={id}>
      <h2 id={id} className="ui-preguntas__titulo">
        {titulo}
      </h2>
      {preguntas.length === 0 ? <div className="ui-preguntas__vacio">{vacio}</div> : null}
      {preguntas.map((q) => (
        <details key={q.pregunta} className="ui-pregunta">
          <summary>
            <span>{q.pregunta}</span>
            <Icono nombre="abajo" />
          </summary>
          <p>{q.respuesta}</p>
        </details>
      ))}
    </section>
  );
}

/** «Hablar con soporte»: la acción principal de la pantalla, con cuántos casos hay abiertos. */
export function AccesoSoporte({ href, detalle }: { href: string; detalle: string }) {
  return (
    <Link href={href} className="ui-soporte">
      <span className="ui-soporte__ico" aria-hidden="true">
        H
      </span>
      <span className="ui-soporte__texto">
        <strong>Hablar con soporte</strong>
        <span>{detalle}</span>
      </span>
      <Icono nombre="flecha" />
    </Link>
  );
}
