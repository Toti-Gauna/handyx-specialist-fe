'use client';
// Dónde está mi propuesta en este pedido (lote 4.5): esperando al cliente, "¡te eligió!" (con celebración si el cambio
// se ve en esta pantalla) o "esta vez no", en gris y sin culpa. Nada de esto acepta ni rechaza: solo informa.
import Link from 'next/link';
import { useEffect, useRef } from 'react';
import { RUTAS } from '../app/rutas.ts';
import type { PedidoDetalle } from '../contracts/dto.ts';
import { useAhora } from '../hooks/useAhora.ts';
import { fechaHora, pesos } from '../lib/formato.ts';
import { useConfeti } from '../kit/Efectos.tsx';
import { Tilde } from '../kit/Piezas.tsx';
import { CuentaRegresiva } from './CuentaRegresiva.tsx';
import { Handy } from './Handy.tsx';
import './pedidos.css';

export function EstadoMiPropuesta({ pedido, alCambiar }: { pedido: PedidoDetalle; alCambiar(): void }) {
  const ahora = useAhora();
  const mia = pedido.propuestas.filter((p) => p.autorRol === 'especialista').at(-1);
  const vigente = mia?.estado === 'pendiente' && Date.parse(mia.venceEn) > ahora.getTime();
  const eligieron = mia?.estado === 'aceptada' && pedido.trabajoId !== null;

  // Celebración solo si en esta pantalla se vio el paso de "esperando" a "te eligió".
  const antes = useRef(vigente);
  const confeti = useConfeti();
  const { lanzar } = confeti;
  useEffect(() => {
    if (antes.current && eligieron) lanzar();
    antes.current = vigente;
  }, [vigente, eligieron, lanzar]);

  if (!mia) return null;

  if (eligieron) {
    return (
      <section className="mp mp--eligieron" aria-labelledby="mp-t">
        {confeti.capa}
        <Tilde />
        <h2 id="mp-t" className="hx-titulo mp__titulo">
          ¡El cliente te <span className="hx-marca">eligió</span>!
        </h2>
        <p>
          Aceptó tu propuesta de {pesos(mia.monto)} para el {fechaHora(mia.horario.inicio)}. Ya podés ver la dirección en el trabajo.
        </p>
        <Link className="boton boton--exito boton--bloque" href={`${RUTAS.trabajo.ruta}?id=${pedido.trabajoId}`}>
          Ver el trabajo
        </Link>
      </section>
    );
  }

  if (vigente) {
    return (
      <section className="mp mp--esperando" aria-labelledby="mp-t">
        <Handy nombre="lamparita" alto={72} />
        <div>
          <h2 id="mp-t" className="mp__titulo">
            Esperando al cliente
          </h2>
          <p>
            Tu propuesta: <strong>{pesos(mia.monto)}</strong> para el {fechaHora(mia.horario.inicio)}.
          </p>
          <CuentaRegresiva hasta={mia.venceEn} texto="Vence en" terminado="Tu propuesta venció" alVencer={alCambiar} />
          <p className="texto-suave texto-chico">Te avisamos cuando responda. Mientras tanto, podés mirar otros pedidos.</p>
        </div>
      </section>
    );
  }

  const vencio = mia.estado === 'pendiente' || mia.estado === 'vencida';
  if (mia.estado !== 'rechazada' && !vencio && mia.estado !== 'retirada') return null;
  return (
    <section className="mp mp--cerrada" aria-labelledby="mp-t">
      <h2 id="mp-t" className="mp__titulo">
        {mia.estado === 'retirada' ? 'Retiraste tu propuesta' : vencio ? 'Tu propuesta venció' : 'Esta vez no'}
      </h2>
      <p>
        {mia.estado === 'retirada'
          ? 'El cliente ya no la ve.'
          : vencio
            ? 'El cliente no respondió a tiempo. No te resta nada: seguí con otros pedidos.'
            : 'El cliente eligió otra opción. No te resta nada: seguí con otros pedidos.'}
      </p>
    </section>
  );
}
