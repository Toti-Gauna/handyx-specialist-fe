// Un contacto profesional en «Pedir ayuda» (H0-ModoAyuda, lote 2.3): iniciales, nombre, el oficio y su estado escritos
// (si lo comparte; nunca su ubicación), y dos botones de 48 px con el nombre de la persona: escribirle y llamarla.
import type { ReactNode } from 'react';
import { Avatar } from '../atomos/Avatar.tsx';
import { BotonIcono } from '../atomos/Boton.tsx';
import { Chip } from '../atomos/Texto.tsx';
import type { NombreIconoUi } from '../atomos/Icono.tsx';
import type { TonoChip } from '../atomos/Texto.tsx';
import '../trabajo.css';

export function FilaContacto({
  nombre,
  oficio,
  estado,
  onEscribir,
  onLlamar,
  ocupado = false,
  extra,
}: {
  nombre: string;
  oficio: string;
  estado: { texto: string; tono: TonoChip; icono: NombreIconoUi };
  onEscribir(): void;
  onLlamar(): void;
  ocupado?: boolean;
  /** Algo más debajo (por ejemplo, «Sumar a este trabajo»). */
  extra?: ReactNode;
}) {
  return (
    <li className="ui-contacto">
      <div className="ui-contacto__fila">
        <Avatar nombre={nombre} />
        <span className="ui-contacto__texto">
          <strong>{nombre}</strong>
          <span className="ui-contacto__chips">
            <Chip tono="gris">{oficio}</Chip>
            <Chip tono={estado.tono} icono={estado.icono}>
              {estado.texto}
            </Chip>
          </span>
        </span>
        <span className="ui-contacto__botones">
          <BotonIcono icono="chat" etiqueta={`Escribirle a ${nombre}`} disabled={ocupado} onClick={onEscribir} />
          <BotonIcono icono="telefono" tono="azul" etiqueta={`Llamar a ${nombre}`} disabled={ocupado} onClick={onLlamar} />
        </span>
      </div>
      {extra}
    </li>
  );
}
