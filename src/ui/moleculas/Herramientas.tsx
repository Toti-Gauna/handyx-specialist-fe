// Piezas de las herramientas del teléfono y del oficio (lote 2.4, T-Taller, T-Electricidad, T-Cables, T-Informe):
// el acceso a una herramienta (mosaico con ícono, nombre y para qué sirve; el destacado en azul), la banda oscura de
// tu oficio, el resultado grande de un cálculo, el semáforo de un informe y el aviso amarillo de lo que está en
// revisión técnica. Los estados siempre con texto, nunca solo color.
import Link from 'next/link';
import type { ReactNode } from 'react';
import { Icono, type NombreIconoUi } from '../atomos/Icono.tsx';
import '../herramientas.css';

/** Acceso a una herramienta (grilla de dos columnas). `insignia`: «AR». */
export function AccesoHerramienta({ icono, titulo, detalle, href, destacada = false, insignia }: { icono: NombreIconoUi; titulo: string; detalle: string; href: string; destacada?: boolean; insignia?: string }) {
  return (
    <Link href={href} className={`ui-acceso-herr${destacada ? ' ui-acceso-herr--destacada' : ''}`}>
      <span className="ui-acceso-herr__ico" aria-hidden="true">
        <Icono nombre={icono} />
      </span>
      <span className="ui-acceso-herr__texto">
        <span className="ui-acceso-herr__titulo">
          <strong>{titulo}</strong>
          {insignia ? <span className="ui-acceso-herr__insignia">{insignia}</span> : null}
        </span>
        <span className="ui-acceso-herr__detalle">{detalle}</span>
      </span>
    </Link>
  );
}

export function GrillaHerramientas({ children, titulo, id }: { children: ReactNode; titulo: string; id: string }) {
  return (
    <section className="ui-grilla-herr" aria-labelledby={id}>
      <h2 id={id} className="ui-grilla-herr__titulo">
        {titulo}
      </h2>
      <div className="ui-grilla-herr__lista">{children}</div>
    </section>
  );
}

/** Banda oscura que lleva a las herramientas de tu oficio. */
export function BandaOficio({ icono, titulo, detalle, href }: { icono: NombreIconoUi; titulo: string; detalle: string; href: string }) {
  return (
    <Link href={href} className="ui-banda-oficio">
      <span className="ui-banda-oficio__ico" aria-hidden="true">
        <Icono nombre={icono} />
      </span>
      <span className="ui-banda-oficio__texto">
        <strong>{titulo}</strong>
        <span>{detalle}</span>
      </span>
      <Icono nombre="flecha" />
    </Link>
  );
}

/** Cabecera oscura de un oficio (T-Electricidad): mosaico amarillo, título y una línea de cuidado. */
export function CabeceraOficio({ icono, titulo, detalle }: { icono: NombreIconoUi; titulo: string; detalle: string }) {
  return (
    <div className="ui-cabecera-oficio">
      <span className="ui-banda-oficio__ico" aria-hidden="true">
        <Icono nombre={icono} tam="grande" />
      </span>
      <span className="ui-cabecera-oficio__texto">
        <strong>{titulo}</strong>
        <span>{detalle}</span>
      </span>
    </div>
  );
}

/**
 * Resultado grande de un cálculo (sección del cable): rótulo, número, unidad, un chip con el estado y una línea de
 * detalle. Se anuncia entero cuando cambia (`lectura` es lo que oye el lector de pantalla).
 */
export function ResultadoDestacado({ etiqueta, valor, unidad, chip, detalle, lectura, children }: { etiqueta: string; valor: string; unidad: string; chip?: ReactNode; detalle?: ReactNode; lectura: string; children?: ReactNode }) {
  return (
    <section className="ui-resultado" aria-live="polite" aria-atomic="true" aria-label={etiqueta}>
      <span className="ui-resultado__etiqueta" aria-hidden="true">
        {etiqueta}
      </span>
      <p className="ui-resultado__fila">
        <span className="visualmente-oculto">{lectura}</span>
        <span className="ui-resultado__valor" aria-hidden="true">
          {valor}
        </span>
        <span className="ui-resultado__unidad" aria-hidden="true">
          {unidad}
        </span>
        {chip ? <span className="ui-resultado__chip">{chip}</span> : null}
      </p>
      {detalle ? <p className="ui-resultado__detalle">{detalle}</p> : null}
      {children}
    </section>
  );
}

export type TonoSemaforo = 'bien' | 'revisar' | 'mal';

/** Tres contadores del semáforo de un informe: «3 Bien · 1 Revisar · 0 Mal». */
export function ContadorSemaforo({ bien, revisar, mal }: { bien: number; revisar: number; mal: number }) {
  const items: { tono: TonoSemaforo; n: number; texto: string; icono: NombreIconoUi }[] = [
    { tono: 'bien', n: bien, texto: 'Bien', icono: 'check' },
    { tono: 'revisar', n: revisar, texto: 'Revisar', icono: 'alerta' },
    { tono: 'mal', n: mal, texto: 'Mal', icono: 'cerrar' },
  ];
  return (
    <ul className="ui-semaforo" aria-label="Resumen de las mediciones">
      {items.map((i) => (
        <li key={i.tono} className={`ui-semaforo__item ui-semaforo__item--${i.tono}${i.n === 0 ? ' ui-semaforo__item--cero' : ''}`}>
          <strong className="ui-semaforo__n">{i.n}</strong>
          <span className="ui-semaforo__texto">
            <Icono nombre={i.icono} tam="chico" />
            {i.texto}
          </span>
        </li>
      ))}
    </ul>
  );
}

/** Una medición del informe con su estado (punto de color + texto). */
export function FilaMedicion({ titulo, valor, tono, texto }: { titulo: string; valor: string; tono: TonoSemaforo | 'sin'; texto: string }) {
  return (
    <div className={`ui-medicion ui-medicion--${tono}`}>
      <span className="ui-medicion__punto" aria-hidden="true" />
      <span className="ui-medicion__texto">
        <strong>{titulo}</strong>
        <span>{valor}</span>
      </span>
      <span className="ui-medicion__estado">{texto}</span>
    </div>
  );
}

/** Aviso amarillo de lo orientativo: «Tabla en revisión técnica…». */
export function AvisoRevisionTecnica({ children, fuente }: { children: ReactNode; fuente?: string }) {
  return (
    <aside className="ui-aviso-revision">
      <Icono nombre="alerta" />
      <p>
        {children}
        {fuente ? <small>{fuente}</small> : null}
      </p>
    </aside>
  );
}
