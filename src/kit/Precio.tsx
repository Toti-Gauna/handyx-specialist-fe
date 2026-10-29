'use client';
// "Handyx sugiere · Vos decidís" (lote 4.1, como "Tu precio" de la demo). La sugerencia es una ayuda: el precio lo pone
// el especialista y Handyx nunca lo impone. La tarifa de Handyx se muestra aparte y no es un descuento sobre su precio.
import { useId, useState } from 'react';
import { Handy } from '../components/Handy.tsx';
import { Icono } from '../components/Icono.tsx';
import { monto, porcion } from '../contracts/dinero.ts';
import { pesosDesdeCentavos } from '../lib/formato.ts';
import { ajustarPrecio, ATAJOS_PRECIO, leerPesos, PASO_PRECIO, sinCorte } from './logica.ts';

interface Props {
  /** Precio en centavos. */
  valor: number;
  onCambio(centavos: number): void;
  /** Sugerencia de Handyx en centavos (por rubro y tipo). null: no hay sugerencia para este pedido. */
  sugerido: number | null;
  /** Tarifa de Handyx en puntos básicos (0 durante la demo). null: sin política vigente. */
  tarifaBps: number | null;
  /** Debajo de esto se avisa y no se puede enviar (lo decide el servidor; acá solo se muestra). */
  minimo?: number;
}

export function PrecioStepper({ valor, onCambio, sugerido, tarifaBps, minimo = 0 }: Props) {
  const idValor = useId();
  const idAviso = useId();
  const [escribiendo, setEscribiendo] = useState(false);
  const [texto, setTexto] = useState('');
  const bajo = valor < minimo;
  const tarifa = tarifaBps === null ? null : porcion(monto(valor), tarifaBps).centavos;

  return (
    <div className="hx-precio">
      {sugerido !== null ? (
        <p className="hx-precio__sugerido">
          <Handy nombre="lamparita" alto={34} />
          <span>
            Handyx sugiere <strong>{pesosDesdeCentavos(sugerido)}</strong>
          </span>
          <span className="hx-precio__decidis">Vos decidís</span>
        </p>
      ) : null}

      <div className="hx-precio__fila">
        <button type="button" className="hx-precio__paso" aria-label={`Bajar ${pesosDesdeCentavos(PASO_PRECIO)}`} aria-controls={idValor} disabled={valor <= 0} onClick={() => onCambio(ajustarPrecio(valor, -PASO_PRECIO))}>
          −
        </button>
        <p id={idValor} className="hx-precio__valor" aria-live="polite" aria-describedby={bajo ? idAviso : undefined}>
          <span className="visualmente-oculto">Tu precio: </span>
          {sinCorte(pesosDesdeCentavos(valor))}
        </p>
        <button type="button" className="hx-precio__paso" aria-label={`Subir ${pesosDesdeCentavos(PASO_PRECIO)}`} aria-controls={idValor} onClick={() => onCambio(ajustarPrecio(valor, PASO_PRECIO))}>
          +
        </button>
      </div>

      {bajo ? (
        <p id={idAviso} className="aviso aviso--aviso" role="status">
          Ese valor es muy bajo. El mínimo para enviar es {pesosDesdeCentavos(minimo)}.
        </p>
      ) : null}

      <ul className="hx-chips" aria-label="Atajos de precio">
        {sugerido !== null ? (
          <li>
            <button type="button" className="hx-chip" aria-pressed={valor === sugerido} onClick={() => onCambio(sugerido)}>
              Dejar el sugerido
            </button>
          </li>
        ) : null}
        {ATAJOS_PRECIO.map((a) => {
          const base = sugerido ?? valor;
          return (
            <li key={a}>
              <button type="button" className="hx-chip" aria-pressed={sugerido !== null && valor === base + a} onClick={() => onCambio(ajustarPrecio(base, a))}>
                + {pesosDesdeCentavos(a)}
              </button>
            </li>
          );
        })}
      </ul>

      {escribiendo ? (
        <form
          className="hx-precio__escribir"
          onSubmit={(e) => {
            e.preventDefault();
            const c = leerPesos(texto);
            if (c !== null) {
              onCambio(c);
              setEscribiendo(false);
            }
          }}
        >
          <label className="etiqueta" htmlFor={`${idValor}-texto`}>
            Escribí tu precio (en pesos)
          </label>
          <input id={`${idValor}-texto`} inputMode="numeric" autoComplete="off" value={texto} onChange={(e) => setTexto(e.target.value)} aria-invalid={texto !== '' && leerPesos(texto) === null} />
          <button type="submit" className="boton boton--claro" disabled={leerPesos(texto) === null}>
            Usar este precio
          </button>
        </form>
      ) : (
        <button type="button" className="boton boton--fantasma" onClick={() => setEscribiendo(true)}>
          <Icono nombre="editar" /> Escribir otro monto
        </button>
      )}

      <div className="hx-recibis">
        <span className="hx-recibis__icono" aria-hidden="true">
          <Icono nombre="billetera" />
        </span>
        <span className="hx-recibis__fila">
          Recibís <span className="hx-monto">{sinCorte(pesosDesdeCentavos(tarifa === null ? valor : valor - tarifa))}</span>
        </span>
        <small>
          {tarifaBps === null
            ? 'Sin tarifa de Handyx definida. El cliente te paga directo a vos.'
            : tarifaBps === 0
              ? 'Handyx no te cobra tarifa durante la demo (0 %). El cliente te paga directo a vos.'
              : `Handyx retiene su tarifa de ${pesosDesdeCentavos(tarifa ?? 0)}. El cliente te paga directo a vos.`}
        </small>
      </div>
    </div>
  );
}
