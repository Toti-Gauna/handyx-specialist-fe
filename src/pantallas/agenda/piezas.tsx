'use client';
// Piezas sueltas de las pantallas de la pestaña Taller (lote 2.1): el fallo que ocupa la pantalla y el vínculo de un turno.
import { RUTAS } from '../../app/rutas.ts';
import type { TurnoAgenda } from '../../contracts/agenda.ts';
import type { FalloApi } from '../../data/errores.ts';
import { EstadoError } from '../../ui/organismos/EstadosPantalla.tsx';

/** Un fallo que no deja ver la pantalla (sin conexión o del servidor), con el texto seguro del servidor. */
export function Fallo({ fallo, onReintentar }: { fallo: FalloApi; onReintentar(): void }) {
  const sinRed = fallo.tipo === 'red' || fallo.tipo === 'timeout';
  return (
    <div className="tg-fallo">
      <EstadoError tipo={sinRed ? 'sin_conexion' : 'servidor'} mensaje={fallo.detalle?.mensaje} codigo={fallo.detalle?.requestId ?? null} onReintentar={onReintentar} hrefSoporte={RUTAS.soporte.ruta} />
    </div>
  );
}

/** Adónde lleva un turno: su trabajo (o la obra), la oferta que lo originó o ningún lado (una pasada de ejemplo). */
export function destinoTurno(t: Pick<TurnoAgenda, 'trabajoId' | 'pedidoId'>): string | undefined {
  if (t.trabajoId) return `${RUTAS.trabajo.ruta}?id=${t.trabajoId}`;
  if (t.pedidoId) return `${RUTAS.pedido.ruta}?id=${t.pedidoId}`;
  return undefined;
}
