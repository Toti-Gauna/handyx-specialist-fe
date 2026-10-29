import type { ReactNode } from 'react';
import type { FalloApi } from '../data/errores.ts';
import { Icono, type NombreIcono } from './Icono.tsx';

export function Cargando({ texto = 'Cargando…' }: { texto?: string }) {
  return (
    <div className="esqueleto" role="status" aria-live="polite">
      <span className="visualmente-oculto">{texto}</span>
      <div className="esqueleto__linea esqueleto__linea--titulo" />
      <div className="esqueleto__linea" />
      <div className="esqueleto__linea esqueleto__linea--corta" />
    </div>
  );
}

const TEXTOS: Record<string, string> = {
  red: 'No pudimos conectarnos. Revisá tu conexión y probá de nuevo.',
  timeout: 'La conexión tardó demasiado. Probá de nuevo.',
  servidor: 'Hubo un problema de nuestro lado. Probá de nuevo en un rato.',
  contrato: 'Recibimos una respuesta inesperada. Probá de nuevo en un rato.',
  permiso: 'No tenés permiso para ver esto todavía.',
  no_encontrado: 'No encontramos lo que buscabas.',
  limite: 'Hiciste demasiados pedidos seguidos. Esperá un momento.',
  validacion: 'Revisá los datos ingresados.',
  conflicto: 'Esto cambió mientras lo mirabas. Volvé a cargarlo.',
  sesion: 'Tu sesión expiró.',
};

/** Error con reintento. Muestra el mensaje seguro del servidor si lo hay y la referencia para soporte. */
export function ErrorCaja({ fallo, onReintentar }: { fallo: FalloApi; onReintentar?: () => void }) {
  return (
    <div className="caja-error" role="alert">
      <Icono nombre="alerta" />
      <p>{fallo.detalle?.mensaje ?? TEXTOS[fallo.tipo] ?? TEXTOS.servidor}</p>
      {fallo.requestId ? <p className="texto-suave texto-chico">Referencia: {fallo.requestId}</p> : null}
      {onReintentar ? (
        <button type="button" className="boton boton--claro" onClick={onReintentar}>
          <Icono nombre="reintentar" /> Reintentar
        </button>
      ) : null}
    </div>
  );
}

export function Vacio({ icono = 'info', titulo, children }: { icono?: NombreIcono; titulo: string; children?: ReactNode }) {
  return (
    <div className="vacio">
      <span className="vacio__icono">
        <Icono nombre={icono} />
      </span>
      <p className="vacio__titulo">{titulo}</p>
      {children ? <div className="texto-suave">{children}</div> : null}
    </div>
  );
}
