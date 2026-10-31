'use client';
// Fechas y horas del kit v2: tira de días, calendario del mes y selector de hora con ruedas (como la demo).
// Elegir una fecha u hora es una solicitud: nada es turno confirmado sin la aceptación de la otra parte.
import { useEffect, useId, useRef, type KeyboardEvent } from 'react';
import { Icono } from '../components/Icono.tsx';
import { grillaMes, HORAS, MINUTOS, moverMes, tiraDias } from './logica.ts';
import { sinMovimiento } from './movimiento.ts';

const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const DIAS_LARGOS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

function nombreFecha(fecha: string): string {
  const [a, m, d] = fecha.split('-').map(Number) as [number, number, number];
  const dia = new Date(Date.UTC(a, m - 1, d)).getUTCDay();
  return `${DIAS_LARGOS[dia]} ${d} de ${MESES[m - 1]}`;
}

/** Días seguidos para elegir con el pulgar. Los anteriores a `minimo` no se pueden tocar. */
export function TiraDias({ desde, cuantos = 14, hoy, elegido, onElegir, minimo, etiqueta = 'Elegí el día' }: { desde: string; cuantos?: number; hoy: string; elegido: string | null; onElegir(fecha: string): void; minimo?: string; etiqueta?: string }) {
  return (
    <ul className="hx-tira" aria-label={etiqueta}>
      {tiraDias(desde, cuantos, hoy).map((d) => (
        <li key={d.fecha}>
          <button
            type="button"
            className={`hx-tira__dia${d.esHoy ? ' hx-tira__dia--hoy' : ''}`}
            aria-pressed={elegido === d.fecha}
            disabled={minimo ? d.fecha < minimo : false}
            onClick={() => onElegir(d.fecha)}
          >
            <small aria-hidden="true">{d.esHoy ? 'Hoy' : d.corto}</small>
            <b aria-hidden="true">{d.dia}</b>
            <span className="visualmente-oculto">
              {nombreFecha(d.fecha)}
              {d.esHoy ? ', hoy' : ''}
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}

interface PropsCalendario {
  anio: number;
  mes: number;
  onCambiarMes(anio: number, mes: number): void;
  hoy: string;
  elegido: string | null;
  onElegir(fecha: string): void;
  /** Cantidad de eventos por día ('AAAA-MM-DD' → n): se ven como puntitos y se dicen con texto. */
  marcas?: Record<string, number>;
  /** Días anteriores deshabilitados (al pedir una fecha nueva). */
  minimo?: string;
}

/** Calendario del mes: hoy en amarillo, días con eventos en tinte con puntitos, el elegido en azul. */
export function CalendarioMes({ anio, mes, onCambiarMes, hoy, elegido, onElegir, marcas = {}, minimo }: PropsCalendario) {
  const titulo = useId();
  const ant = moverMes(anio, mes, -1);
  const sig = moverMes(anio, mes, 1);
  return (
    <section className="hx-cal" aria-labelledby={titulo}>
      <div className="hx-cal__cabecera">
        <button type="button" className="hx-circulo" aria-label={`Ver ${MESES[ant.mes - 1]}`} onClick={() => onCambiarMes(ant.anio, ant.mes)}>
          <Icono nombre="izquierda" />
        </button>
        <h2 id={titulo} className="hx-cal__mes" aria-live="polite">
          {MESES[mes - 1]} {anio}
        </h2>
        <button type="button" className="hx-circulo" aria-label={`Ver ${MESES[sig.mes - 1]}`} onClick={() => onCambiarMes(sig.anio, sig.mes)}>
          <Icono nombre="derecha" />
        </button>
      </div>
      <ul className="hx-cal__semana" aria-hidden="true">
        {['D', 'L', 'M', 'M', 'J', 'V', 'S'].map((d, i) => (
          <li key={i}>{d}</li>
        ))}
      </ul>
      <ul className="hx-cal__grilla">
        {grillaMes(anio, mes).map(({ fecha, dia }, i) =>
          fecha ? (
            <li key={fecha}>
              <button
                type="button"
                className={`hx-cal__dia${fecha === hoy ? ' hx-cal__dia--hoy' : ''}${marcas[fecha] ? ' hx-cal__dia--con' : ''}`}
                aria-pressed={elegido === fecha}
                disabled={minimo ? fecha < minimo : false}
                onClick={() => onElegir(fecha)}
              >
                <span aria-hidden="true">{dia}</span>
                <span className="visualmente-oculto">
                  {nombreFecha(fecha)}
                  {fecha === hoy ? ', hoy' : ''}
                  {marcas[fecha] ? `, ${marcas[fecha]} ${marcas[fecha] === 1 ? 'evento' : 'eventos'}` : ''}
                </span>
                {marcas[fecha] ? (
                  <span className="hx-cal__puntos" aria-hidden="true">
                    {Array.from({ length: Math.min(3, marcas[fecha] ?? 0) }, (_, k) => (
                      <i key={k} />
                    ))}
                  </span>
                ) : null}
              </button>
            </li>
          ) : (
            <li key={`h${i}`} aria-hidden="true" />
          ),
        )}
      </ul>
    </section>
  );
}

const ALTO_OPCION = 46;

/** Una rueda (horas o minutos): listbox con teclado (flechas, Inicio, Fin) y con el dedo (se acomoda al soltar). */
function Rueda({ etiqueta, opciones, valor, onCambio, formato }: { etiqueta: string; opciones: readonly number[]; valor: number; onCambio(v: number): void; formato(v: number): string }) {
  const ref = useRef<HTMLUListElement>(null);
  const id = useId();
  const espera = useRef(0);
  const indice = Math.max(0, opciones.indexOf(valor));

  // Centra la opción elegida cuando cambia desde afuera, desde el teclado o con un toque.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const destino = indice * ALTO_OPCION;
    if (Math.abs(el.scrollTop - destino) > 2) el.scrollTo({ top: destino, behavior: sinMovimiento() ? 'auto' : 'smooth' });
  }, [indice]);

  function alDeslizar() {
    window.clearTimeout(espera.current);
    espera.current = window.setTimeout(() => {
      const el = ref.current;
      if (!el) return;
      const i = Math.min(opciones.length - 1, Math.max(0, Math.round(el.scrollTop / ALTO_OPCION)));
      if (opciones[i] !== undefined && opciones[i] !== valor) onCambio(opciones[i]);
    }, 120);
  }

  function alTeclear(e: KeyboardEvent) {
    const mover: Record<string, number> = { ArrowUp: -1, ArrowDown: 1, PageUp: -4, PageDown: 4 };
    let i = indice;
    if (e.key in mover) i = indice + (mover[e.key] ?? 0);
    else if (e.key === 'Home') i = 0;
    else if (e.key === 'End') i = opciones.length - 1;
    else return;
    e.preventDefault();
    const v = opciones[Math.min(opciones.length - 1, Math.max(0, i))];
    if (v !== undefined) onCambio(v);
  }

  return (
    <ul ref={ref} className="hx-rueda" role="listbox" tabIndex={0} aria-label={etiqueta} aria-activedescendant={`${id}-${indice}`} onScroll={alDeslizar} onKeyDown={alTeclear}>
      <li className="hx-rueda__relleno" aria-hidden="true" />
      {opciones.map((o, i) => (
        <li key={o} id={`${id}-${i}`} role="option" aria-selected={o === valor} className="hx-rueda__op" onClick={() => onCambio(o)}>
          {formato(o)}
        </li>
      ))}
      <li className="hx-rueda__relleno" aria-hidden="true" />
    </ul>
  );
}

/** Selector de hora con dos ruedas (de 00:00 a 23:45, cada 15 minutos). */
export function SelectorHora({ hora, minuto, onCambio }: { hora: number; minuto: number; onCambio(h: number, m: number): void }) {
  const dos = (n: number) => String(n).padStart(2, '0');
  return (
    <div className="hx-ruedas">
      <span className="hx-ruedas__banda" aria-hidden="true" />
      <Rueda etiqueta="Hora" opciones={HORAS} valor={hora} onCambio={(h) => onCambio(h, minuto)} formato={dos} />
      <span className="hx-ruedas__dos" aria-hidden="true">
        :
      </span>
      <Rueda etiqueta="Minutos" opciones={MINUTOS} valor={minuto} onCambio={(m) => onCambio(hora, m)} formato={dos} />
    </div>
  );
}
