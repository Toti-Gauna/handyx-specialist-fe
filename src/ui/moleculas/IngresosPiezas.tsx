'use client';
// Piezas de ingresos y gastos (lote 2.1): elegir el mes con botones, la barra del neto (dicha con palabras), una línea de la
// cuenta y la ganancia de un trabajo. Importes siempre con `Cifra` (nunca se parten). Sin tarifa de Handyx: no existe.
import type { ReactNode } from 'react';
import { textoBarra, type TramoBarra } from '../../lib/agendaTaller.ts';
import { Boton, BotonIcono } from '../atomos/Boton.tsx';
import { Icono, type NombreIconoUi } from '../atomos/Icono.tsx';
import { Cifra } from '../atomos/Texto.tsx';
import '../taller-dia.css';

/** Mes anterior y siguiente con botones; el nombre del mes se anuncia al cambiar. */
export function SelectorMes({ nombre, onAnterior, onSiguiente, siguienteDeshabilitado = false }: { nombre: string; onAnterior(): void; onSiguiente(): void; siguienteDeshabilitado?: boolean }) {
  return (
    <div className="ui-selmes" role="group" aria-label="Mes">
      <BotonIcono icono="izquierda" etiqueta="Mes anterior" tono="vidrio" onClick={onAnterior} />
      <strong aria-live="polite">{nombre}</strong>
      <BotonIcono icono="derecha" etiqueta="Mes siguiente" tono="vidrio" disabled={siguienteDeshabilitado} onClick={onSiguiente} />
    </div>
  );
}

const COLOR_TRAMO: Record<string, string> = { neto: 'blanco', materiales: 'amarillo', combustible_viaticos: 'noche', herramientas: 'arena', otro: 'gris' };

/** La barra del bruto: lo que queda (neto) y lo que se va en cada gasto, dibujada en SVG. Dicha completa para el lector. */
export function BarraNeto({ tramos }: { tramos: readonly TramoBarra[] }) {
  let x = 0;
  return (
    <span className="ui-barra-neto" role="img" aria-label={`Del bruto: ${textoBarra(tramos)}`}>
      <svg className="ui-barra-neto__svg" aria-hidden="true" focusable="false" preserveAspectRatio="none">
        {tramos.map((t) => {
          const el = <rect key={t.clave} className={`ui-barra-neto__tramo ui-barra-neto__tramo--${COLOR_TRAMO[t.clave] ?? 'gris'}`} x={`${x}%`} y="0" height="100%" width={`${t.porcentaje}%`} />;
          x += t.porcentaje;
          return el;
        })}
      </svg>
    </span>
  );
}

/** Una línea de la cuenta: texto a la izquierda, importe a la derecha; con un cuadradito de color si es un gasto. */
export function LineaCuenta({ texto, centavos, resta = false, fuerte = false, suave = false, muestra }: { texto: ReactNode; centavos: number; resta?: boolean; fuerte?: boolean; suave?: boolean; muestra?: string }) {
  return (
    <div className={`ui-linea-cuenta${fuerte ? ' ui-linea-cuenta--fuerte' : ''}${suave ? ' ui-linea-cuenta--suave' : ''}`}>
      <span>
        {muestra ? <span className={`ui-linea-cuenta__muestra ui-linea-cuenta__muestra--${muestra}`} aria-hidden="true" /> : null}
        {texto}
      </span>
      <span>
        {resta ? <span aria-hidden="true">− </span> : null}
        {resta ? <span className="visualmente-oculto">menos </span> : null}
        <Cifra centavos={centavos} tam="chico" />
      </span>
    </div>
  );
}

/** Lo que dejó un trabajo (o una etapa): cobrado menos gastos; si fue pérdida, lo dice con palabras. */
export function FilaGanancia({ titulo, cobrado, gastos, ganancia, perdida }: { titulo: string; cobrado: number; gastos: number; ganancia: number | null; perdida: number | null }) {
  return (
    <li className="ui-ganancia">
      <span className="ui-ganancia__texto">
        <strong>{titulo}</strong>
        <span>
          <Cifra centavos={cobrado} tam="chico" /> cobrados{gastos > 0 ? <> − <Cifra centavos={gastos} tam="chico" /> de gastos</> : null}
        </span>
      </span>
      <span className="ui-ganancia__valor">
        {perdida !== null ? (
          <>
            <span>Perdiste</span>
            <Cifra centavos={perdida} tam="medio" como="strong" />
          </>
        ) : (
          <>
            <span>Te quedó</span>
            <Cifra centavos={ganancia ?? 0} tam="medio" como="strong" />
          </>
        )}
      </span>
    </li>
  );
}

/** Un gasto cargado, con un botón para borrarlo (la forma de deshacer). */
export function FilaGasto({ icono, titulo, detalle, centavos, onBorrar, deshabilitado = false }: { icono: NombreIconoUi; titulo: string; detalle: string; centavos: number; onBorrar(): void; deshabilitado?: boolean }) {
  return (
    <li className="ui-gasto">
      <span className="ui-gasto__ico" aria-hidden="true">
        <Icono nombre={icono} />
      </span>
      <span className="ui-gasto__texto">
        <strong>{titulo}</strong>
        <span>{detalle}</span>
      </span>
      <Cifra centavos={centavos} tam="chico" como="strong" />
      <Boton variante="contorno" chico disabled={deshabilitado} onClick={onBorrar}>
        Borrar<span className="visualmente-oculto"> el gasto: {titulo}</span>
      </Boton>
    </li>
  );
}
