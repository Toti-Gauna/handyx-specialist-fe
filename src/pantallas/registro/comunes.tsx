'use client';
// Piezas comunes de los pasos del registro (RG-1 a RG-10, lote 1.2): el marco de cada paso (cabecera «Paso N de 10»,
// título con marcador, bajada, lo que Operations pidió corregir, contenido y la acción fija) y el contexto con el
// registro que devolvió el servidor. Cada paso se guarda apenas se completa; la app retoma en `pasoActual`.
import { createContext, useContext, type ReactNode } from 'react';
import { RUTAS } from '../../app/rutas.ts';
import type { PasoRegistro, RegistroEspecialista } from '../../contracts/registro.ts';
import type { FalloApi } from '../../data/errores.ts';
import { NOMBRE_PASO, numeroPaso, pasoAnterior, TOTAL_PASOS } from '../../lib/registro.ts';
import { Titulo } from '../../ui/atomos/Texto.tsx';
import { AvisoCaja } from '../../ui/moleculas/Avisos.tsx';
import { AccionFija } from '../../ui/organismos/Acciones.tsx';
import { CabeceraPasos } from '../../ui/organismos/CabeceraPasos.tsx';
import { PantallaSecundaria } from '../../ui/plantillas/Plantillas.tsx';

export interface CtxRegistro {
  r: RegistroEspecialista;
  /** Guarda lo que devolvió el servidor (la versión nueva) antes de seguir. */
  fijar(r: RegistroEspecialista): void;
  recargar(): Promise<void>;
  /** Pasa al paso siguiente (o vuelve al estado del alta si ya se mandó). */
  seguir(desde: PasoRegistro): void;
}

const Ctx = createContext<CtxRegistro | null>(null);
export const ProveedorRegistro = Ctx.Provider;

export function useRegistro(): CtxRegistro {
  const v = useContext(Ctx);
  if (!v) throw new Error('useRegistro necesita <ProveedorRegistro>');
  return v;
}

export const rutaPaso = (p: PasoRegistro): string => `${RUTAS.alta.ruta}?paso=${p}`;

export function MarcoPaso({ paso, antes, marcado, despues, bajada, children, accion, nota, volver }: { paso: PasoRegistro; antes?: ReactNode; marcado?: ReactNode; despues?: ReactNode; bajada: ReactNode; children: ReactNode; accion: ReactNode | null; nota?: ReactNode; volver?: string | null }) {
  const { r } = useRegistro();
  const anterior = pasoAnterior(paso);
  const hrefVolver = volver === undefined ? (anterior ? rutaPaso(anterior) : undefined) : (volver ?? undefined);
  const motivo = r.pasos.find((x) => x.paso === paso && x.estado === 'a_corregir')?.motivo;
  return (
    <PantallaSecundaria
      barra={<CabeceraPasos paso={numeroPaso(paso)} total={TOTAL_PASOS} nombre={NOMBRE_PASO[paso]} hrefVolver={hrefVolver} />}
      accion={accion ? <AccionFija nota={nota}>{accion}</AccionFija> : undefined}
    >
      <section className="rg-encabezado">
        <Titulo antes={antes} marcado={marcado} despues={despues} />
        <p className="rg-bajada">{bajada}</p>
      </section>
      {motivo ? (
        <AvisoCaja tono="alerta" titulo="Te pedimos corregir esto">
          {motivo}
        </AvisoCaja>
      ) : null}
      {children}
    </PantallaSecundaria>
  );
}

/** Detalle de una fila con su estado debajo (así la flecha de la fila no se va de renglón). */
export function DetalleEstado({ texto, estado }: { texto: ReactNode; estado: ReactNode }) {
  return (
    <span className="rg-detalle">
      <span>{texto}</span>
      {estado}
    </span>
  );
}

/** Error de una acción en palabras simples, con lo que se puede hacer. */
export function textoFallo(f: FalloApi): string {
  if (f.tipo === 'red' || f.tipo === 'timeout') return 'No pudimos conectarnos. Revisá tu conexión y probá de nuevo: lo que escribiste sigue acá.';
  if (f.status === 409 && f.detalle?.codigo === 'conflicto_version') return 'Tu registro cambió desde otro lado. Volvé a abrir este paso para ver lo último.';
  if (f.status === 413) return 'El archivo es muy pesado. Probá con una foto o un PDF más liviano.';
  if (f.status === 415) return 'Ese tipo de archivo no se acepta. Usá una foto (JPG o PNG) o un PDF.';
  return f.detalle?.mensaje ?? 'No pudimos guardar. Probá de nuevo en un momento.';
}

export function FalloPaso({ fallo }: { fallo: FalloApi | null }) {
  if (!fallo) return null;
  return (
    <AvisoCaja tono="error" titulo="No se guardó">
      {textoFallo(fallo)}
    </AvisoCaja>
  );
}
