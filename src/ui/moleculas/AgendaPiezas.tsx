// Piezas de la agenda del taller (lote 2.1): la tarjeta de un turno con su hora, la fila de una pasada con su cobro y el
// resumen de las pasadas. El estado siempre lleva ícono y texto (nunca solo color); un turno que se superpone lo dice escrito.
import Link from 'next/link';
import type { ReactNode } from 'react';
import type { ChipDato } from '../../lib/agendaTaller.ts';
import { Avatar } from '../atomos/Avatar.tsx';
import { Icono } from '../atomos/Icono.tsx';
import { Chip, Cifra, Etiqueta } from '../atomos/Texto.tsx';
import '../taller-dia.css';

export function ChipDatos({ d }: { d: ChipDato }) {
  return (
    <Chip tono={d.tono} icono={d.icono}>
      {d.texto}
    </Chip>
  );
}

interface PropsTurno {
  desde: string;
  hasta: string | null;
  titulo: string;
  detalle: string;
  chip: ChipDato;
  /** Nombre de la otra parte (o null). Las iniciales van en un avatar decorativo. */
  cliente?: string | null;
  /** «Van N más en el equipo». */
  equipo?: number;
  /** Importe acordado (centavos), si hay. */
  centavos?: number | null;
  /** Aviso escrito, p. ej. que se superpone con un turno agendado. */
  alerta?: string | null;
  href?: string;
  onClick?: () => void;
}

/** Un turno: la hora a la izquierda y la tarjeta con el título, el estado y la otra parte. Enlace, botón o fijo. */
export function TurnoTarjeta({ desde, hasta, titulo, detalle, chip, cliente, equipo = 0, centavos, alerta, href, onClick }: PropsTurno) {
  const cuerpo = (
    <>
      <span className="ui-turno__hora">
        <strong>{desde}</strong>
        {hasta ? <span>a {hasta}</span> : null}
      </span>
      <span className="ui-turno__tarjeta">
        <span className="ui-turno__fila">
          <strong className="ui-turno__titulo">{titulo}</strong>
          <ChipDatos d={chip} />
        </span>
        <span className="ui-turno__detalle">
          {centavos ? <Cifra centavos={centavos} tam="chico" /> : null}
          {centavos ? ' · ' : ''}
          {detalle}
        </span>
        {cliente || equipo > 0 ? (
          <span className="ui-turno__gente">
            {cliente ? (
              <>
                <Avatar nombre={cliente} tam="chico" />
                <span>{cliente}</span>
              </>
            ) : null}
            {equipo > 0 ? <span>{`+ ${equipo} en el equipo`}</span> : null}
          </span>
        ) : null}
        {alerta ? (
          <span className="ui-turno__alerta">
            <Icono nombre="alerta" tam="chico" /> {alerta}
          </span>
        ) : null}
      </span>
    </>
  );
  if (href)
    return (
      <Link className="ui-turno ui-turno--tocable" href={href}>
        {cuerpo}
      </Link>
    );
  if (onClick)
    return (
      <button type="button" className="ui-turno ui-turno--tocable" onClick={onClick}>
        {cuerpo}
      </button>
    );
  return <div className="ui-turno">{cuerpo}</div>;
}

/** Un día de las pasadas: el rótulo en mayúsculas y sus filas dentro de una tarjeta blanca. */
export function GrupoPasadas({ rotulo, children }: { rotulo: string; children: ReactNode }) {
  return (
    <section className="ui-pasadas" aria-label={rotulo}>
      <Etiqueta como="h2">{rotulo}</Etiqueta>
      <ul className="ui-pasadas__lista">{children}</ul>
    </section>
  );
}

/** Una pasada: título, de quién y dónde, cómo va el cobro y cuánto. */
export function FilaPasada({ titulo, detalle, centavos, chip, href }: { titulo: string; detalle: string; centavos: number | null; chip: ChipDato | null; href?: string }) {
  const cuerpo = (
    <>
      <span className="ui-pasada__texto">
        <strong>{titulo}</strong>
        <span>{detalle}</span>
        {chip ? <ChipDatos d={chip} /> : null}
      </span>
      {centavos !== null ? <Cifra centavos={centavos} tam="medio" como="strong" /> : null}
      {href ? <Icono nombre="flecha" className="ui-pasada__flecha" /> : null}
    </>
  );
  return (
    <li>
      {href ? (
        <Link className="ui-pasada ui-pasada--tocable" href={href}>
          {cuerpo}
        </Link>
      ) : (
        <div className="ui-pasada">{cuerpo}</div>
      )}
    </li>
  );
}

/** Los dos datos de arriba de las pasadas: cuántas hubo este mes y cuánto se cobró (verificado). */
export function ResumenPasadas({ trabajos, cobradoCentavos }: { trabajos: number; cobradoCentavos: number }) {
  return (
    <div className="ui-resumen-pasadas">
      <div className="ui-resumen-pasadas__dato ui-resumen-pasadas__dato--azul">
        <span>Pasadas</span>
        <strong>{trabajos}</strong>
      </div>
      <div className="ui-resumen-pasadas__dato">
        <span>Cobrado y verificado este mes</span>
        <Cifra centavos={cobradoCentavos} tam="grande" como="strong" />
      </div>
    </div>
  );
}
