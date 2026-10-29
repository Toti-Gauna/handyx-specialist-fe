'use client';
import { api } from '@handyx/origen-datos';
import { useCarga } from '../hooks/useCarga.ts';
import { Cargando, ErrorCaja } from './Estados.tsx';
import { TextoFee } from './FeeAviso.tsx';
import { Icono } from './Icono.tsx';

/** Aviso del fee 0 % tras el registro: informa hasta cuándo dura. Quien lo acepta formalmente es el modal de Inicio. */
export function FeeAviso() {
  const c = useCarga(() => api.feeVigente(), []);
  if (c.fallo && !c.datos) return <ErrorCaja fallo={c.fallo} onReintentar={() => void c.recargar()} />;
  if (!c.datos) return <Cargando />;
  if (!c.datos.politica) return null; // sin política vigente no se muestra ningún porcentaje
  return (
    <div className="tarjeta tarjeta--amarillo">
      <p className="tarjeta__titulo">
        <Icono nombre="etiqueta" /> Handy no te cobra tarifa durante la demo
      </p>
      <TextoFee politica={c.datos.politica} />
    </div>
  );
}
