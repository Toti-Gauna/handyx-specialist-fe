'use client';
// Un cobro directo del cliente al especialista (lotes 4.6 y 4.7): su estado con texto, y "Ya me pagó: informarlo" con
// confirmación. Informarlo lo deja "reportado": no se verifica porque lo informe el especialista (lo confirma Mercado
// Pago u Operations). Sirve para el trabajo terminado y para cada etapa de una obra.
import { api } from '@handyx/origen-datos';
import Link from 'next/link';
import { useState } from 'react';
import { RUTAS } from '../app/rutas.ts';
import type { Pago } from '../contracts/dto.ts';
import { useAccion } from '../hooks/useAccion.ts';
import { PAGO } from '../lib/etiquetas.ts';
import { pesos } from '../lib/formato.ts';
import { ErrorCaja } from './Estados.tsx';
import { Hoja } from './Hoja.tsx';
import { Icono } from './Icono.tsx';
import { Chip } from './ui.tsx';
import './cobro.css';

export function CobroDirecto({ pago, alCambiar, conCaja = true, que }: { pago: Pago; alCambiar(): Promise<unknown>; conCaja?: boolean; /** Para el lector de pantalla cuando hay varios cobros ("la etapa 2"). */ que?: string }) {
  const [abierta, setAbierta] = useState(false);
  const reporte = useAccion();
  const efectivo = pago.metodo === 'efectivo';

  async function confirmar() {
    // El refresco va dentro de la acción: la hoja se cierra con el estado nuevo ya a la vista.
    const r = await reporte.ejecutar(async () => {
      await api.reportarCobro(pago.id, reporte.clave());
      await alCambiar();
    });
    if (r.ok) setAbierta(false);
  }

  return (
    <div className="cobro">
      <Chip e={PAGO[pago.estado]} />
      <p>{pago.estado === 'pendiente' ? (efectivo ? 'Te paga en efectivo.' : 'Te paga por Mercado Pago, directo a tu cuenta.') : PAGO[pago.estado].detalle}</p>
      {pago.estado === 'pendiente' ? (
        <button type="button" className="boton boton--bloque" onClick={() => setAbierta(true)}>
          <Icono nombre="check" /> {efectivo ? 'Ya lo cobré en efectivo' : 'Ya me pagó: informarlo'}
          {que ? <span className="visualmente-oculto"> ({que})</span> : null}
        </button>
      ) : null}
      {conCaja ? (
        <Link className="enlace cobro__caja" href={RUTAS.caja.ruta}>
          Ver la Caja
        </Link>
      ) : null}
      <Hoja abierta={abierta} titulo="Informar el cobro" onCerrar={() => { setAbierta(false); reporte.limpiar(); reporte.nueva(); }}>
        <p>
          Vas a informar que cobraste {pesos(pago.monto)}
          {que ? ` (${que})` : ''}. Queda como <strong>reportado</strong>: no se verifica solo porque lo informes vos. Lo confirma Mercado Pago u Operations.
        </p>
        {reporte.fallo ? <ErrorCaja fallo={reporte.fallo} onReintentar={() => void confirmar()} /> : null}
        <div className="botones">
          <button type="button" className="boton boton--exito" disabled={reporte.pendiente} onClick={() => void confirmar()}>
            {reporte.pendiente ? 'Guardando…' : 'Sí, ya lo cobré'}
          </button>
          <button type="button" className="boton boton--claro" onClick={() => setAbierta(false)}>
            Todavía no
          </button>
        </div>
      </Hoja>
    </div>
  );
}
