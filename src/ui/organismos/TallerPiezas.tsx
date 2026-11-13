// Piezas de la pestaña Taller (F-Herramientas, lote 2.1): la tarjeta azul de la Agenda con la semana de un vistazo y el
// acceso ancho amarillo (la ferretería). Los otros accesos son `ResumenTarjeta` del kit. La semana es decorativa
// (aria-hidden): el texto de la tarjeta dice «Hoy, 2 turnos · próximo 18:00».
import Link from 'next/link';
import type { ReactNode } from 'react';
import { Icono, type NombreIconoUi } from '../atomos/Icono.tsx';
import '../taller-dia.css';

export interface DiaSemanaMini {
  fecha: string;
  /** "LUN" */
  corto: string;
  dia: number;
  turnos: number;
  hoy: boolean;
}

export function TarjetaAgendaTaller({ href, titulo, detalle, semana }: { href: string; titulo: string; detalle: ReactNode; semana: readonly DiaSemanaMini[] }) {
  return (
    <Link href={href} className="ui-tx-agenda">
      <span className="ui-tx-agenda__cabeza">
        <span className="ui-tx-agenda__ico" aria-hidden="true">
          <Icono nombre="agenda" />
        </span>
        <span className="ui-tx-agenda__texto">
          <strong>{titulo}</strong>
          <span>{detalle}</span>
        </span>
        <Icono nombre="flecha" />
      </span>
      <span className="ui-tx-agenda__semana" aria-hidden="true">
        {semana.map((d) => (
          <span key={d.fecha} className={`ui-tx-agenda__dia${d.hoy ? ' ui-tx-agenda__dia--hoy' : ''}`}>
            <span>{d.corto}</span>
            <strong>{d.dia}</strong>
            <span className="ui-tx-agenda__puntos">
              {Array.from({ length: Math.min(3, d.turnos) }, (_, i) => (
                <span key={i} className="ui-tx-agenda__punto" />
              ))}
            </span>
          </span>
        ))}
      </span>
    </Link>
  );
}

/** Un acceso ancho amarillo (ferretería): ícono, título, una línea y la flecha. */
export function AccesoAncho({ href, icono, titulo, detalle }: { href: string; icono: NombreIconoUi; titulo: string; detalle: string }) {
  return (
    <Link href={href} className="ui-tx-ancho">
      <span className="ui-tx-ancho__ico" aria-hidden="true">
        <Icono nombre={icono} />
      </span>
      <span className="ui-tx-ancho__texto">
        <strong>{titulo}</strong>
        <span>{detalle}</span>
      </span>
      <Icono nombre="flecha" />
    </Link>
  );
}
