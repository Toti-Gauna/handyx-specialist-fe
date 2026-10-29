'use client';
import { api } from '@handyx/origen-datos';
import { useState } from 'react';
import { useAccion } from '../hooks/useAccion.ts';
import { useCarga } from '../hooks/useCarga.ts';
import { avisoFee } from '../contracts/fee.ts';
import { ErrorCaja } from './Estados.tsx';
import { Hoja } from './Hoja.tsx';
import { TextoFee } from './FeeAviso.tsx';

/**
 * Modal de primer ingreso: explica el fee 0 % y hasta cuándo dura. Se muestra hasta que el servidor registra que
 * lo viste (fee_acceptances). Sin política vigente (la demo terminó) no se muestra ningún porcentaje.
 */
export function ModalFee() {
  const fee = useCarga(() => api.feeVigente(), []);
  const { pendiente, fallo, ejecutar } = useAccion();
  const [cerrado, setCerrado] = useState(false);
  const f = fee.datos;
  if (!f?.politica || f.avisoAceptadoEn !== null || cerrado) return null;
  if (avisoFee(api.ahora(), f.politica).fase === 'terminada') return null;
  const politica = f.politica;

  async function entendido() {
    const r = await ejecutar(() => api.aceptarAvisoFee(politica.id, politica.version));
    if (r.ok) setCerrado(true);
  }

  return (
    <Hoja abierta titulo="Handyx no te cobra tarifa durante la demo" cerrable={false} onCerrar={() => undefined}>
      <TextoFee politica={politica} />
      {fallo ? <ErrorCaja fallo={fallo} /> : null}
      <button type="button" className="boton boton--bloque" disabled={pendiente} onClick={() => void entendido()}>
        {pendiente ? 'Guardando…' : 'Entendido'}
      </button>
    </Hoja>
  );
}
