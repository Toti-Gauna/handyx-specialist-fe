'use client';
import { api } from '@handyx/origen-datos';
import { useEffect, useState, type FormEvent } from 'react';
import { monto, porcion } from '../contracts/dinero.ts';
import type { NuevaPropuesta, Propuesta } from '../contracts/dto.ts';
import type { PoliticaFee } from '../contracts/fee.ts';
import { avisoFee } from '../contracts/fee.ts';
import { useAccion } from '../hooks/useAccion.ts';
import { aInputLocal, centavosDesdeTexto, deInputLocal, pesos } from '../lib/formato.ts';
import { ErrorCaja } from './Estados.tsx';
import { Hoja } from './Hoja.tsx';
import { Aviso, AreaTexto, Campo } from './ui.tsx';

interface Props {
  abierta: boolean;
  onCerrar(): void;
  pedido: { id: string; tipo: 'urgente' | 'programado' | 'obra'; fechaSolicitada: string | null };
  /** Contraoferta: la propuesta que se reemplaza. */
  base?: Propuesta | null;
  fee: PoliticaFee | null;
  onEnviada(p: Propuesta): void;
}

/**
 * Enviar una propuesta o una contrapropuesta: importe, horario y alcance. El especialista pone su precio
 * (Handy sugiere, nunca impone). El vencimiento lo calcula el servidor y se muestra al enviarla.
 */
export function FormPropuesta({ abierta, onCerrar, pedido, base, fee, onEnviada }: Props) {
  const { pendiente, fallo, ejecutar, clave, nueva, limpiar } = useAccion();
  const [importe, setImporte] = useState('');
  const [inicio, setInicio] = useState('');
  const [alcance, setAlcance] = useState('');
  const [errores, setErrores] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!abierta) return;
    const proximo = pedido.fechaSolicitada ?? new Date(api.ahora().getTime() + 45 * 60_000).toISOString();
    setImporte(base ? String(base.monto.centavos / 100) : '');
    setInicio(aInputLocal(base?.horario.inicio ?? proximo));
    setAlcance(base?.alcance ?? '');
    setErrores({});
    limpiar();
    nueva();
  }, [abierta, base, pedido.fechaSolicitada, limpiar, nueva]);

  const centavos = centavosDesdeTexto(importe);
  const bps = fee && avisoFee(api.ahora(), fee).fase !== 'terminada' ? fee.bpsEspecialista : null;

  async function enviar(e: FormEvent) {
    e.preventDefault();
    const err: Record<string, string> = {};
    const horario = deInputLocal(inicio);
    if (centavos === null || centavos <= 0) err.importe = 'Escribí un importe en pesos, por ejemplo 45.000.';
    if (!horario) err.inicio = 'Elegí una fecha y una hora.';
    else if (Date.parse(horario) <= api.ahora().getTime()) err.inicio = 'La fecha y hora tienen que ser a futuro.';
    if (!alcance.trim()) err.alcance = 'Contá qué incluye tu propuesta.';
    setErrores(err);
    if (Object.keys(err).length > 0 || centavos === null || !horario) return;
    const datos: NuevaPropuesta = { pedidoId: pedido.id, monto: monto(centavos), alcance: alcance.trim(), horario: { inicio: horario, fin: null }, reemplazaA: base?.id ?? null };
    const r = await ejecutar(() => api.enviarPropuesta(datos, clave()));
    if (r.ok) onEnviada(r.valor);
  }

  return (
    <Hoja abierta={abierta} titulo={base ? 'Contraofertar' : 'Enviar una propuesta'} onCerrar={onCerrar}>
      <form className="pila" onSubmit={(e) => void enviar(e)} noValidate>
        <Aviso tono="neutro" icono="info">
          Vos ponés tu precio. Podés enviar la propuesta sin aceptar ninguna otra y no hay obligación de contratar.
        </Aviso>
        {base ? <p className="texto-suave">Estás respondiendo a la propuesta de {pesos(base.monto)}. La anterior queda como reemplazada.</p> : null}
        {fallo ? <ErrorCaja fallo={fallo} /> : null}
        <Campo etiqueta="Tu precio (en pesos)" inputMode="decimal" value={importe} onChange={(e) => setImporte(e.target.value)} error={errores.importe} placeholder="45.000" />
        {centavos && centavos > 0 ? (
          <p className="texto-suave" role="status">
            {bps === null ? `Vas a cobrar ${pesos(monto(centavos))} directo del usuario.` : bps === 0 ? `Cobrás ${pesos(monto(centavos))} directo del usuario. Handy no te cobra tarifa (0 %).` : `Cobrás ${pesos(monto(centavos))} y la tarifa de Handy es ${pesos(porcion(monto(centavos), bps))}.`}
          </p>
        ) : null}
        <Campo etiqueta="Día y hora" type="datetime-local" value={inicio} onChange={(e) => setInicio(e.target.value)} error={errores.inicio} ayuda={pedido.fechaSolicitada ? 'El usuario pidió esta fecha: podés proponer otra.' : 'Hora de Mar del Plata.'} />
        <AreaTexto etiqueta="Qué incluye" value={alcance} onChange={(e) => setAlcance(e.target.value)} error={errores.alcance} maxLength={2000} ayuda="Trabajo, materiales y condiciones." />
        <p className="texto-suave texto-chico">
          {pedido.tipo === 'urgente' ? 'En pedidos urgentes la propuesta vale 5 minutos desde que la enviás.' : 'El vencimiento lo calcula el servidor y lo ves apenas la enviás.'}
        </p>
        <button type="submit" className="boton boton--bloque" disabled={pendiente}>
          {pendiente ? 'Enviando…' : base ? 'Enviar contraoferta' : 'Enviar propuesta'}
        </button>
      </form>
    </Hoja>
  );
}
