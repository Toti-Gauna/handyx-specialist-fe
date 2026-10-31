'use client';
// Piezas chicas del kit Handyx v2 (lote 4.1). Estilos en kit.css; lógica pura en logica.ts.
import Link from 'next/link';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Handy, type NombreHandy } from '../components/Handy.tsx';
import { Icono, type NombreIcono } from '../components/Icono.tsx';
import { pesosDesdeCentavos } from '../lib/formato.ts';
import { iniciales, sinCorte, tonoAvatar, valorContador } from './logica.ts';
import { sinMovimiento } from './movimiento.ts';

/** La acción principal, fija abajo sobre el área segura. Una sola por pantalla. */
export function BotonFijo({ children, nota }: { children: ReactNode; nota?: ReactNode }) {
  return (
    <div className="hx-boton-fijo">
      {nota ? <p className="hx-boton-fijo__nota">{nota}</p> : null}
      {children}
    </div>
  );
}

/** Mosaico tocable (rubros, zonas, franjas): elegido = azul con tilde amarillo, además del color. */
export function Mosaico({ icono, texto, nota, elegido, onCambio }: { icono: NombreIcono; texto: string; nota?: string; elegido: boolean; onCambio(v: boolean): void }) {
  return (
    <button type="button" className="hx-mosaico" aria-pressed={elegido} onClick={() => onCambio(!elegido)}>
      <Icono nombre={icono} />
      <span>{texto}</span>
      {nota ? <span className="hx-mosaico__nota">{nota}</span> : null}
    </button>
  );
}

/** Chip que se elige (franjas, filtros, motivos). */
export function ChipOpcion({ texto, icono, elegido, onClick }: { texto: string; icono?: NombreIcono; elegido: boolean; onClick(): void }) {
  return (
    <button type="button" className="hx-chip" aria-pressed={elegido} onClick={onClick}>
      {icono ? <Icono nombre={icono} /> : null}
      {texto}
    </button>
  );
}

/** Avatar con iniciales y tono fijo por nombre. El tilde de verificado solo con `verificado` del servidor. */
export function Avatar({ nombre, tamano, verificado = false }: { nombre: string; tamano?: 'chico' | 'grande'; verificado?: boolean }) {
  return (
    <span className={`hx-avatar hx-avatar--t${tonoAvatar(nombre)}${tamano ? ` hx-avatar--${tamano}` : ''}`} aria-hidden="true">
      {iniciales(nombre)}
      {verificado ? (
        <span className="hx-avatar__verificado">
          <Icono nombre="check" />
        </span>
      ) : null}
    </span>
  );
}

/** Fila de lista con ícono, texto y flecha: un enlace o un botón. */
export function Fila({ icono, titulo, detalle, href, onClick }: { icono: NombreIcono; titulo: string; detalle?: string; href?: string; onClick?(): void }) {
  const cuerpo = (
    <>
      <span className="hx-fila__ico">
        <Icono nombre={icono} />
      </span>
      <span className="hx-fila__texto">
        <strong>{titulo}</strong>
        {detalle ? <small>{detalle}</small> : null}
      </span>
      <Icono nombre="derecha" />
    </>
  );
  return href ? (
    <Link className="hx-fila" href={href}>
      {cuerpo}
    </Link>
  ) : (
    <button type="button" className="hx-fila" onClick={onClick}>
      {cuerpo}
    </button>
  );
}

export type EstadoPaso = 'hecho' | 'actual' | 'pendiente';
const TEXTO_PASO: Record<EstadoPaso, string> = { hecho: 'hecho', actual: 'en curso', pendiente: 'pendiente' };
const ICONO_PASO: Record<EstadoPaso, NombreIcono> = { hecho: 'check', actual: 'reloj', pendiente: 'reloj' };

/** Línea de tiempo (revisión del alta, estado de un trabajo, etapas de una obra). El estado se dice con texto oculto. */
export function LineaDeTiempo({ pasos }: { pasos: { titulo: string; detalle?: string; estado: EstadoPaso }[] }) {
  return (
    <ol className="hx-linea">
      {pasos.map((p) => (
        <li key={p.titulo} className={`hx-linea__paso hx-linea__paso--${p.estado}`} aria-current={p.estado === 'actual' ? 'step' : undefined}>
          <span className="hx-linea__marca" aria-hidden="true">
            {p.estado === 'pendiente' ? null : <Icono nombre={ICONO_PASO[p.estado]} />}
          </span>
          <span className="hx-linea__texto">
            <strong>
              {p.titulo}
              <span className="visualmente-oculto"> ({TEXTO_PASO[p.estado]})</span>
            </strong>
            {p.detalle ? <small>{p.detalle}</small> : null}
          </span>
        </li>
      ))}
    </ol>
  );
}

/** Estado vacío con un Handy contento: dice qué va a aparecer acá y, si hay, la acción para que aparezca. */
export function EstadoVacio({ handy = 'lamparita', titulo, children, accion }: { handy?: NombreHandy; titulo: string; children?: ReactNode; accion?: ReactNode }) {
  return (
    <div className="hx-vacio">
      <Handy nombre={handy} alto={110} />
      <h2 className="hx-titulo hx-vacio__titulo">{titulo}</h2>
      {children ? <p>{children}</p> : null}
      {accion}
    </div>
  );
}

/** Tilde de éxito que se dibuja. */
export function Tilde() {
  return (
    <span className="hx-tilde" aria-hidden="true">
      <svg viewBox="0 0 24 24">
        <path d="m5 12.5 4.5 4.5L19 7.5" />
      </svg>
    </span>
  );
}

/**
 * Monto que sube hasta su valor (solo en celebraciones: ganaste o terminaste un trabajo, se registró un cobro).
 * Los lectores de pantalla leen el valor final de una vez; sin movimiento, aparece directo.
 */
export function MontoGrande({ centavos, desde = 0, ms = 900, className = '' }: { centavos: number; desde?: number; ms?: number; className?: string }) {
  const valor = useContador(centavos, desde, ms);
  return (
    <span className={`hx-monto hx-monto--grande ${className}`.trim()}>
      <span aria-hidden="true">{sinCorte(pesosDesdeCentavos(valor))}</span>
      <span className="visualmente-oculto">{pesosDesdeCentavos(centavos)}</span>
    </span>
  );
}

export function useContador(hasta: number, desde = 0, ms = 900): number {
  // Arranca igual en el servidor y en el navegador (si no, React no puede hidratar); el efecto lo lleva al final.
  const [valor, setValor] = useState(desde);
  const inicio = useRef(desde);
  useEffect(() => {
    if (sinMovimiento()) {
      setValor(hasta);
      return;
    }
    const de = inicio.current;
    const t0 = performance.now();
    let id = 0;
    const paso = (t: number) => {
      const v = valorContador(de, hasta, t - t0, ms);
      setValor(v);
      if (v !== hasta) id = requestAnimationFrame(paso);
      else inicio.current = hasta;
    };
    id = requestAnimationFrame(paso);
    return () => cancelAnimationFrame(id);
  }, [hasta, ms]);
  return valor;
}

/** Anillo de progreso (lote 4.4): "3 de 6" con el arco en azul. El texto se lee; el dibujo es decorativo. */
export function AnilloProgreso({ hechos, total, etiqueta = 'listos' }: { hechos: number; total: number; etiqueta?: string }) {
  const r = 34;
  const largo = 2 * Math.PI * r;
  const parte = total > 0 ? Math.min(1, hechos / total) : 0;
  return (
    <div className="hx-anillo">
      <svg viewBox="0 0 80 80" aria-hidden="true">
        <circle className="hx-anillo__fondo" cx="40" cy="40" r={r} />
        <circle className="hx-anillo__arco" cx="40" cy="40" r={r} strokeDasharray={`${largo * parte} ${largo}`} />
      </svg>
      <p className="hx-anillo__texto">
        <strong>{hechos}</strong>
        <span>
          de {total} {etiqueta}
        </span>
      </p>
    </div>
  );
}
