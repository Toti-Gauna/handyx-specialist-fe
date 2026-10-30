'use client';
import { useEffect, useState, type ReactNode } from 'react';
import type { FalloApi } from '../data/errores.ts';
import { Handy, type NombreHandy } from './Handy.tsx';
import { Icono, type NombreIcono } from './Icono.tsx';

/** Las esperas cortas no muestran los bloques grises: así no parpadean al pasar de una pantalla a otra (ni al terminar la carga). */
export const ESPERA_ESQUELETO_MS = 500;

export function Cargando({ texto = 'Cargando…' }: { texto?: string }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = window.setTimeout(() => setVisible(true), ESPERA_ESQUELETO_MS);
    return () => window.clearTimeout(t);
  }, []);
  // El aviso para lectores de pantalla está desde el primer momento; los bloques, solo si la espera se alarga.
  return (
    <div className={`esqueleto${visible ? '' : ' esqueleto--esperando'}`} role="status" aria-live="polite">
      <span className="visualmente-oculto">{texto}</span>
      {visible ? (
        <>
          <div className="esqueleto__linea esqueleto__linea--titulo" />
          <div className="esqueleto__linea" />
          <div className="esqueleto__linea esqueleto__linea--corta" />
        </>
      ) : null}
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

// Un Handy roto por tipo de falla, como las pantallas de error de la demo de la landing.
const HANDY_ROTO: Record<string, NombreHandy> = {
  red: 'lamparita-rota',
  timeout: 'lamparita-rota',
  no_encontrado: 'llave-rota',
  permiso: 'llave-rota',
};

/** Error con reintento. Muestra el mensaje seguro del servidor si lo hay y la referencia para soporte. */
/** `pantalla`: el error ocupa toda la pantalla (no cargó nada); su mensaje pasa a ser el título h1 para los lectores. */
export function ErrorCaja({ fallo, onReintentar, pantalla = false }: { fallo: FalloApi; onReintentar?: () => void; pantalla?: boolean }) {
  const mensaje = fallo.detalle?.mensaje ?? TEXTOS[fallo.tipo] ?? TEXTOS.servidor;
  return (
    <div className="caja-error" role="alert">
      <Handy nombre={HANDY_ROTO[fallo.tipo] ?? 'engranaje-roto'} alto={88} className="handy--tambalea" />
      {pantalla ? <h1 className="caja-error__mensaje">{mensaje}</h1> : <p>{mensaje}</p>}
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
