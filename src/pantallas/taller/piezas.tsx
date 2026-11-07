'use client';
// Piezas del Taller (fase H0): campos con unidad, opciones, resultado con número animado (GSAP) y aviso de revisión.
// Estilos en taller.css (prefijo tl-). Todo el movimiento respeta «reducir movimiento».
import { gsap } from 'gsap';
import { useEffect, useId, useRef, type ReactNode } from 'react';
import { Icono, type NombreIcono } from '../../components/Icono.tsx';
import { sinMovimiento } from '../../kit/movimiento.ts';

/** Acepta coma o punto decimal («2,5»). Vacío o inválido → null. */
export function numero(texto: string): number | null {
  const t = texto.trim().replace(/\./g, (m, i: number, s: string) => (s.includes(',') ? '' : m)).replace(',', '.');
  if (t === '' || !/^-?\d*\.?\d+$/.test(t)) return null;
  return Number(t);
}

/** Número para mostrar con coma decimal y separador de miles: 1234,5 → «1.234,5». */
export function mostrar(n: number, decimales = 1): string {
  return new Intl.NumberFormat('es-AR', { maximumFractionDigits: decimales }).format(n);
}

export function CampoNumero({ etiqueta, valor, onCambio, unidad, ayuda, error, min }: { etiqueta: string; valor: string; onCambio(v: string): void; unidad?: string; ayuda?: string; error?: string | null; min?: number }) {
  const id = useId();
  return (
    <div className="tl-campo">
      <label htmlFor={id}>{etiqueta}</label>
      <div className="tl-campo__caja">
        <input
          id={id}
          inputMode="decimal"
          autoComplete="off"
          value={valor}
          onChange={(e) => onCambio(e.target.value)}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-e` : ayuda ? `${id}-a` : undefined}
          {...(min !== undefined ? { 'data-min': min } : {})}
        />
        {unidad ? <span className="tl-campo__unidad" aria-hidden="true">{unidad}</span> : null}
      </div>
      {ayuda && !error ? <p id={`${id}-a`} className="tl-campo__ayuda">{ayuda}</p> : null}
      {error ? (
        <p id={`${id}-e`} className="tl-campo__error">
          <Icono nombre="alerta" /> {error}
        </p>
      ) : null}
    </div>
  );
}

/** Grupo de opciones excluyentes como chips (radio accesible). */
export function Opciones<T extends string | number>({ etiqueta, opciones, valor, onCambio }: { etiqueta: string; opciones: readonly { valor: T; texto: string }[]; valor: NoInfer<T>; onCambio(v: NoInfer<T>): void }) {
  const id = useId();
  return (
    <fieldset className="tl-opciones">
      <legend id={id}>{etiqueta}</legend>
      <div className="tl-opciones__fila">
        {opciones.map((o) => (
          <button key={String(o.valor)} type="button" className="hx-chip" role="radio" aria-checked={o.valor === valor} onClick={() => onCambio(o.valor)}>
            {o.texto}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

/** Número grande que cuenta hasta su valor (GSAP); sin movimiento, aparece directo. */
export function NumeroAnimado({ valor, decimales = 1, sufijo = '' }: { valor: number; decimales?: number; sufijo?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const actual = useRef(valor);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const escribir = (n: number) => {
      el.textContent = `${mostrar(n, decimales)}${sufijo}`;
    };
    if (sinMovimiento()) {
      actual.current = valor;
      escribir(valor);
      return;
    }
    const o = { n: actual.current };
    const t = gsap.to(o, { n: valor, duration: 0.6, ease: 'power3.out', onUpdate: () => escribir(o.n), onComplete: () => {
        actual.current = valor;
      } });
    return () => {
      t.kill();
      actual.current = o.n;
    };
  }, [valor, decimales, sufijo]);
  return (
    <span ref={ref} aria-hidden="true">
      {mostrar(valor, decimales)}
      {sufijo}
    </span>
  );
}

export type Semaforo = 'bien' | 'atencion' | 'mal';
const SEMAFORO: Record<Semaforo, { icono: NombreIcono; texto: string }> = {
  bien: { icono: 'checkCirculo', texto: 'Cumple' },
  atencion: { icono: 'alerta', texto: 'Al límite' },
  mal: { icono: 'prohibido', texto: 'No cumple' },
};

/** Resultado principal: el número grande, su unidad, el estado con ícono y texto, y el «por qué». */
export function Resultado({ titulo, valor, decimales, unidad, estado, textoEstado, lectura, children }: { titulo: string; valor: number | null; decimales?: number; unidad: string; estado?: Semaforo; textoEstado?: string; lectura: string; children?: ReactNode }) {
  const caja = useRef<HTMLElement>(null);
  useEffect(() => {
    if (!caja.current || sinMovimiento()) return;
    const t = gsap.fromTo(caja.current, { scale: 0.98 }, { scale: 1, duration: 0.35, ease: 'back.out(2)' });
    return () => void t.kill();
  }, [valor, estado]);
  return (
    <section ref={caja} className={`tl-resultado${estado ? ` tl-resultado--${estado}` : ''}`} aria-live="polite" aria-atomic="true">
      <h2 className="tl-resultado__titulo">{titulo}</h2>
      <p className="tl-resultado__valor">
        <span className="visualmente-oculto">{lectura}</span>
        {valor === null ? <span aria-hidden="true">—</span> : <NumeroAnimado valor={valor} {...(decimales !== undefined ? { decimales } : {})} />}
        <span className="tl-resultado__unidad" aria-hidden="true">{unidad}</span>
      </p>
      {estado ? (
        <p className="tl-estado">
          <Icono nombre={SEMAFORO[estado].icono} /> {textoEstado ?? SEMAFORO[estado].texto}
        </p>
      ) : null}
      {children}
    </section>
  );
}

/** Aviso fijo de los valores de referencia que todavía no revisó un profesional. */
export function AvisoRevision({ texto, fuente }: { texto: string; fuente?: string }) {
  return (
    <aside className="tl-revision">
      <Icono nombre="info" />
      <p>
        {texto}
        {fuente ? <small>{fuente}</small> : null}
      </p>
    </aside>
  );
}

/** Lista de «por qué» del cálculo: cada condición con su estado. */
export function PorQue({ items }: { items: { texto: string; ok: boolean }[] }) {
  return (
    <ul className="tl-porque">
      {items.map((i) => (
        <li key={i.texto} className={i.ok ? 'tl-porque--ok' : 'tl-porque--no'}>
          <Icono nombre={i.ok ? 'check' : 'cerrar'} />
          <span>
            <span className="visualmente-oculto">{i.ok ? 'Cumple: ' : 'No cumple: '}</span>
            {i.texto}
          </span>
        </li>
      ))}
    </ul>
  );
}

/** Entrada escalonada de una lista de tarjetas al montar la pantalla. */
export function useEntrada<T extends HTMLElement>(selector: string) {
  const ref = useRef<T>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || sinMovimiento()) return;
    const t = gsap.from(el.querySelectorAll(selector), { y: 14, opacity: 0, duration: 0.45, ease: 'power3.out', stagger: 0.04, clearProps: 'all' });
    return () => void t.revert();
  }, [selector]);
  return ref;
}
