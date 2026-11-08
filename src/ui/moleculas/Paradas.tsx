'use client';
// Paradas del día (F-InicioDia y F-InicioRuta). TiraParadas: las paradas en una tira horizontal (hecha con tilde,
// la próxima resaltada) con su hora y un nombre corto. ListaParadas: el recorrido en orden con la hora, el tramo entre
// una y otra y botones para subir o bajar una parada (todo gesto tiene botón: reordenar no se hace arrastrando).
// RutaDecorativa: el dibujo del recorrido sobre las manzanas (decorativo; lo importante está en la lista).
// El estado se dice siempre con texto («Hecho», «Próxima», «Opcional»), nunca solo con el color.
import type { ReactNode } from 'react';
import { BotonIcono } from '../atomos/Boton.tsx';
import { Icono } from '../atomos/Icono.tsx';
import '../nucleo.css';

export type EstadoParadaUi = 'hecha' | 'proxima' | 'pendiente';

export interface ParadaUi {
  id: string;
  /** "18:00" */
  hora: string;
  /** "La canilla" en la tira; "Pierde la canilla" en la lista. */
  titulo: string;
  detalle?: string;
  estado: EstadoParadaUi;
  opcional?: boolean;
  /** Lo que va debajo del título en la lista (chip «Sale en 10 min», «Hecho»…). */
  nota?: ReactNode;
  /** El tramo desde la parada anterior: "12 min · 4,1 km". */
  tramo?: string | null;
}

const ESTADO: Record<EstadoParadaUi, string> = { hecha: 'Hecha', proxima: 'Próxima', pendiente: 'Después' };

export function TiraParadas({ paradas, etiqueta = 'Tus paradas de hoy' }: { paradas: readonly ParadaUi[]; etiqueta?: string }) {
  return (
    <ol className="ui-tira-paradas" aria-label={etiqueta}>
      {paradas.map((p, i) => (
        <li key={p.id} className={`ui-tira-paradas__item ui-tira-paradas__item--${p.estado}`} aria-current={p.estado === 'proxima' ? 'step' : undefined}>
          <span className="ui-tira-paradas__punto" aria-hidden="true">
            {p.estado === 'hecha' ? <Icono nombre="check" tam="chico" /> : i + 1}
          </span>
          <strong className="ui-tira-paradas__hora">{p.hora}</strong>
          <span className="ui-tira-paradas__titulo">{p.titulo}</span>
          <span className="visualmente-oculto">{`, ${ESTADO[p.estado]}${p.opcional ? ', opcional' : ''}`}</span>
        </li>
      ))}
    </ol>
  );
}

export function ListaParadas({ paradas, onMover, ocupado = false, etiqueta = 'Tu recorrido en orden' }: { paradas: readonly ParadaUi[]; onMover?: (i: number, sentido: -1 | 1) => void; ocupado?: boolean; etiqueta?: string }) {
  return (
    <ol className="ui-lista-paradas" aria-label={etiqueta}>
      {paradas.map((p, i) => {
        const fija = p.estado === 'hecha';
        const puedeSubir = !!onMover && !fija && i > 0 && paradas[i - 1]?.estado !== 'hecha';
        const puedeBajar = !!onMover && !fija && i < paradas.length - 1;
        return (
          <li key={p.id} className={`ui-lista-paradas__item ui-lista-paradas__item--${p.estado}`} aria-current={p.estado === 'proxima' ? 'step' : undefined}>
            {p.tramo ? (
              <p className="ui-lista-paradas__tramo">
                <Icono nombre="camion" tam="chico" />
                {p.tramo}
              </p>
            ) : null}
            <div className="ui-lista-paradas__fila">
              <strong className="ui-lista-paradas__hora">{p.hora}</strong>
              <span className="ui-lista-paradas__punto" aria-hidden="true">
                {p.estado === 'hecha' ? <Icono nombre="check" tam="chico" /> : null}
              </span>
              <div className="ui-lista-paradas__caja">
                <strong className="ui-lista-paradas__titulo">{p.titulo}</strong>
                {p.detalle ? <span className="ui-lista-paradas__detalle">{p.detalle}</span> : null}
                <span className="visualmente-oculto">{`${ESTADO[p.estado]}${p.opcional ? ', opcional' : ''}. `}</span>
                {p.nota ? <span className="ui-lista-paradas__nota">{p.nota}</span> : null}
                {onMover && !fija ? (
                  <span className="ui-lista-paradas__mover">
                    <BotonIcono icono="arriba" etiqueta={`Subir: ${p.titulo}`} disabled={!puedeSubir || ocupado} onClick={() => onMover(i, -1)} />
                    <BotonIcono icono="abajo" etiqueta={`Bajar: ${p.titulo}`} disabled={!puedeBajar || ocupado} onClick={() => onMover(i, 1)} />
                  </span>
                ) : null}
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

/** Puntos fijos de la ruta dibujada (en un lienzo de 390 × 420), como en el lienzo del diseño. */
const PUNTOS = [
  [96, 410],
  [140, 340],
  [207, 312],
  [240, 230],
  [272, 202],
  [300, 120],
] as const;

/** Recorrido dibujado sobre las manzanas: decorativo (aria-hidden), la lista dice lo importante. */
export function RutaDecorativa({ paradas }: { paradas: readonly ParadaUi[] }) {
  const n = Math.max(1, paradas.length);
  const puntos = PUNTOS.slice(0, Math.min(PUNTOS.length, n * 2 + 1));
  const linea = puntos.map(([x, y]) => `${x},${y}`).join(' ');
  return (
    <svg className="ui-ruta-deco" viewBox="0 0 390 440" preserveAspectRatio="xMidYMax slice" aria-hidden="true" focusable="false">
      <polyline points={linea} fill="none" stroke="var(--ui-azul)" strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={PUNTOS[0][0]} cy={PUNTOS[0][1]} r={16} fill="var(--ui-tinte)" />
      <circle cx={PUNTOS[0][0]} cy={PUNTOS[0][1]} r={9} fill="var(--ui-azul)" stroke="#fff" strokeWidth={3} />
      {paradas.map((p, i) => {
        const punto: readonly [number, number] = PUNTOS[Math.min(PUNTOS.length - 1, i * 2 + 2)] ?? [300, 120];
        const [x, y] = p.opcional ? [60, 250] : punto;
        const relleno = p.estado === 'hecha' ? 'var(--ui-exito-boton)' : p.opcional ? 'var(--ui-amarillo)' : p.estado === 'proxima' ? 'var(--ui-azul)' : '#fff';
        const texto = p.estado === 'pendiente' || p.opcional ? 'var(--ui-tinta)' : '#fff';
        return (
          <g key={p.id}>
            <circle cx={x} cy={y} r={17} fill={relleno} stroke="#fff" strokeWidth={3} />
            <text x={x} y={y + 5} textAnchor="middle" fontSize={14} fontWeight={900} fill={texto}>
              {p.estado === 'hecha' ? '✓' : i + 1}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
