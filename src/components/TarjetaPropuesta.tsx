'use client';
import { api } from '@handyx/origen-datos';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { RUTAS } from '../app/rutas.ts';
import type { Propuesta } from '../contracts/dto.ts';
import { useAccion } from '../hooks/useAccion.ts';
import { useAhora } from '../hooks/useAhora.ts';
import { PROPUESTA } from '../lib/etiquetas.ts';
import { fechaHora, hora, pesos } from '../lib/formato.ts';
import { CuentaRegresiva } from './CuentaRegresiva.tsx';
import { ErrorCaja } from './Estados.tsx';
import { Hoja } from './Hoja.tsx';
import { Icono } from './Icono.tsx';
import { Chip } from './ui.tsx';

interface Props {
  propuesta: Propuesta;
  /** Si el pedido sigue abierto y mi alta lo permite. */
  puedeActuar: boolean;
  /** Se vuelve a pedir el estado real (la propuesta cambió o venció). */
  alCambiar(): void;
  alContraofertar?(p: Propuesta): void;
  /** Texto del descuento de Handy en la ficha ("Tarifa de Handy: 0 %"). */
}

type Intencion = 'aceptar' | 'rechazar' | null;

/**
 * Una propuesta del hilo. Aceptar y rechazar piden confirmación en una hoja aparte, con el resumen del acuerdo:
 * un toque suelto (o un aviso) nunca contrata. Solo la contraparte responde; quien la escribió solo puede retirarla.
 */
export function TarjetaPropuesta({ propuesta: p, puedeActuar, alCambiar, alContraofertar }: Props) {
  const router = useRouter();
  const ahora = useAhora();
  const [intencion, setIntencion] = useState<Intencion>(null);
  const respuesta = useAccion();
  const retiro = useAccion();
  const propia = p.autorRol === 'especialista';
  const vigente = p.estado === 'pendiente' && Date.parse(p.venceEn) > ahora.getTime();
  const venció = p.estado === 'pendiente' && !vigente;
  const etiqueta = venció ? PROPUESTA.vencida : PROPUESTA[p.estado];

  async function responder() {
    if (!intencion) return;
    const r = await respuesta.ejecutar(() => api.responderPropuesta(p.id, intencion, p.version, respuesta.clave()));
    if (!r.ok) return;
    setIntencion(null);
    if (r.valor.trabajo) router.push(`${RUTAS.trabajo.ruta}?id=${r.valor.trabajo.id}`);
    else alCambiar();
  }
  async function retirar() {
    const r = await retiro.ejecutar(() => api.retirarPropuesta(p.id));
    if (r.ok) alCambiar();
  }
  function cerrar() {
    setIntencion(null);
    respuesta.limpiar();
    respuesta.nueva();
    if (respuesta.fallo?.detalle?.codigo === 'propuesta_no_disponible' || respuesta.fallo?.tipo === 'conflicto') alCambiar();
  }

  return (
    <div className={`propuesta${propia ? ' propuesta--propia' : ''}${!vigente && p.estado !== 'aceptada' ? ' propuesta--cerrada' : ''}`}>
      <div className="fila-flex fila-flex--entre">
        <p className="sobre">{propia ? 'Tu propuesta' : 'Propuesta del usuario'}</p>
        <Chip e={etiqueta} />
      </div>
      <p className="monto">{pesos(p.monto)}</p>
      <div className="propuesta__datos">
        <span>
          <Icono nombre="calendario" className="icono icono--chico" /> {fechaHora(p.horario.inicio)}
          {p.horario.fin ? ` a ${hora(p.horario.fin)}` : ''}
        </span>
        <span>{p.alcance}</span>
      </div>
      {p.estado === 'pendiente' ? <CuentaRegresiva hasta={p.venceEn} texto="Vence en" terminado="La propuesta venció" alVencer={alCambiar} /> : null}
      {p.reemplazaA ? <p className="texto-suave texto-chico">Reemplaza a una propuesta anterior.</p> : null}

      {vigente && puedeActuar && !propia ? (
        <div className="botones">
          <button type="button" className="boton boton--exito" onClick={() => setIntencion('aceptar')}>
            <Icono nombre="checkCirculo" /> Aceptar propuesta
          </button>
          <div className="botones botones--fila">
            <button type="button" className="boton boton--claro" onClick={() => alContraofertar?.(p)}>
              <Icono nombre="reintentar" /> Contraofertar
            </button>
            <button type="button" className="boton boton--peligro" onClick={() => setIntencion('rechazar')}>
              <Icono nombre="cerrar" /> Rechazar
            </button>
          </div>
        </div>
      ) : null}
      {vigente && propia ? (
        <>
          {retiro.fallo ? <ErrorCaja fallo={retiro.fallo} /> : null}
          <button type="button" className="boton boton--claro boton--chico" disabled={retiro.pendiente} onClick={() => void retirar()}>
            {retiro.pendiente ? 'Retirando…' : 'Retirar mi propuesta'}
          </button>
        </>
      ) : null}

      <Hoja abierta={intencion !== null} titulo={intencion === 'aceptar' ? '¿Aceptar esta propuesta?' : '¿Rechazar esta propuesta?'} onCerrar={cerrar}>
        <dl>
          <div className="dato"><dt>Importe</dt><dd>{pesos(p.monto)}</dd></div>
          <div className="dato"><dt>Cuándo</dt><dd>{fechaHora(p.horario.inicio)}</dd></div>
        </dl>
        <p>{p.alcance}</p>
        {intencion === 'aceptar' ? (
          <p className="texto-suave">Al aceptar queda agendado el trabajo. El acuerdo no cambia sin que las dos partes acepten una propuesta nueva.</p>
        ) : (
          <p className="texto-suave">El usuario va a ver que la rechazaste. Podés contraofertar en lugar de rechazar.</p>
        )}
        {respuesta.fallo ? <ErrorCaja fallo={respuesta.fallo} onReintentar={respuesta.fallo.tipo === 'red' || respuesta.fallo.tipo === 'timeout' ? () => void responder() : undefined} /> : null}
        <div className="botones">
          <button type="button" className={intencion === 'aceptar' ? 'boton boton--exito' : 'boton boton--peligro'} disabled={respuesta.pendiente} onClick={() => void responder()}>
            {respuesta.pendiente ? 'Enviando…' : intencion === 'aceptar' ? 'Sí, aceptar' : 'Sí, rechazar'}
          </button>
          <button type="button" className="boton boton--claro" onClick={cerrar}>
            Volver
          </button>
        </div>
      </Hoja>
    </div>
  );
}
