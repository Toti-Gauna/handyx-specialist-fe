'use client';
// Un fallo que no deja ver la pantalla (D6-Error sin conexión, D6-Fallo del servidor) con el texto seguro del servidor.
import { RUTAS } from '../../app/rutas.ts';
import type { FalloApi } from '../../data/errores.ts';
import { EstadoError } from '../../ui/organismos/EstadosPantalla.tsx';

export function PantallaFallo({ fallo, onReintentar }: { fallo: FalloApi; onReintentar(): void }) {
  const sinRed = fallo.tipo === 'red' || fallo.tipo === 'timeout';
  return (
    <div className="nu-fallo">
      <EstadoError tipo={sinRed ? 'sin_conexion' : 'servidor'} mensaje={fallo.detalle?.mensaje} codigo={fallo.detalle?.requestId ?? null} onReintentar={onReintentar} hrefSoporte={RUTAS.soporte.ruta} />
    </div>
  );
}
