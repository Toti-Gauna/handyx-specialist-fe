'use client';
// Estados de pantalla del kit v3. EstadoError replica D6-Error (sin conexión: "Se nos desenchufó algo") y D6-Fallo
// (error del servidor: "Estamos en obra"), con su ilustración, el chip, el título marcado, el texto y el código para
// soporte. Lo ya cargado nunca se reemplaza por datos inventados. EstadoVacio: ilustración, título, texto y una acción.
import type { ReactNode } from 'react';
import { Boton, BotonEnlace } from '../atomos/Boton.tsx';
import { Chip, Titulo } from '../atomos/Texto.tsx';
import { Desenchufado, EnObra } from '../ilustraciones/Estados.tsx';

export type TipoEstadoError = 'sin_conexion' | 'servidor';

const TEXTOS: Record<TipoEstadoError, { chip: string; antes: string; marcado: string; despues: string; texto: string }> = {
  sin_conexion: { chip: 'Sin conexión', antes: 'Se nos ', marcado: 'desenchufó', despues: ' algo', texto: 'Revisá tu conexión y probá de nuevo. Lo que ya habías cargado sigue acá: nunca mostramos datos inventados.' },
  servidor: { chip: 'Error del servidor', antes: 'Estamos ', marcado: 'en obra', despues: '', texto: 'Algo falló de nuestro lado y ya lo estamos arreglando. No perdiste nada de lo que cargaste.' },
};

export function EstadoError({
  tipo,
  mensaje,
  codigo,
  onReintentar,
  hrefSoporte,
  nivel = 1,
  extra,
}: {
  tipo: TipoEstadoError;
  /** Mensaje seguro del servidor o de la app; si no hay, el texto del lienzo. */
  mensaje?: string;
  /** Referencia para soporte (requestId o "HX-503"). */
  codigo?: string | null;
  onReintentar?: () => void;
  hrefSoporte?: string;
  nivel?: 1 | 2;
  /** Lo último guardado, por ejemplo (una FilaIcono en una Tarjeta). */
  extra?: ReactNode;
}) {
  const t = TEXTOS[tipo];
  return (
    <section className={`ui-estado ui-estado--${tipo}`} role="alert">
      {tipo === 'sin_conexion' ? <Desenchufado tam="grande" /> : <EnObra tam="grande" />}
      <div className="ui-estado__texto">
        <Chip tono={tipo === 'sin_conexion' ? 'error' : 'amarillo'} icono={tipo === 'sin_conexion' ? 'wifi' : 'alerta'}>
          {t.chip}
        </Chip>
        <Titulo nivel={nivel} tam="medio" antes={t.antes} marcado={t.marcado} despues={t.despues} />
        <p>{mensaje ?? t.texto}</p>
        {codigo ? (
          <p className="ui-estado__codigo">
            Si se repite, contale a soporte el código <strong>{codigo}</strong>.
          </p>
        ) : null}
        {extra}
      </div>
      {onReintentar || hrefSoporte ? (
        <div className="ui-estado__acciones">
          {onReintentar ? (
            <Boton icono="reintentar" onClick={onReintentar}>
              Reintentar
            </Boton>
          ) : null}
          {hrefSoporte && tipo === 'servidor' ? (
            <BotonEnlace variante="contorno" href={hrefSoporte}>
              Hablar con soporte
            </BotonEnlace>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

export function EstadoVacio({ ilustracion, titulo, children, accion }: { ilustracion: ReactNode; titulo: string; children?: ReactNode; accion?: ReactNode }) {
  return (
    <section className="ui-estado ui-estado--vacio">
      {ilustracion}
      <div className="ui-estado__texto">
        <h2 className="ui-titulo ui-titulo--medio">{titulo}</h2>
        {children ? <div className="ui-estado__detalle">{children}</div> : null}
      </div>
      {accion ? <div className="ui-estado__acciones">{accion}</div> : null}
    </section>
  );
}
