'use client';
// Piezas comunes de las pantallas de presupuestos y lista de precios (lote 2.2): el día de hoy según el servidor, a quién
// va el presupuesto (nombre y chat) y los chips de cada estado. Solo composición del kit v3.
import { api } from '@handyx/origen-datos';
import type { Presupuesto } from '../../contracts/presupuestos.ts';
import type { CategoriaPrecio, ModoPrecio } from '../../contracts/presupuestos.ts';
import { useCarga } from '../../hooks/useCarga.ts';
import { diaLocal } from '../../lib/formato.ts';
import { RUTAS } from '../../app/rutas.ts';
import { Chip } from '../../ui/atomos/Texto.tsx';
import type { NombreIconoUi } from '../../ui/atomos/Icono.tsx';
import { ICONO_RUBRO } from '../../ui/moleculas/MarcadorPedido.tsx';
import { ESTADO_PRESUPUESTO, MODO_PRECIO } from '../../presupuestos/vista.ts';

/** "2026-11-17" en Buenos Aires, con el reloj de la API (el mock tiene un hoy fijo). */
export const hoyLocal = (): string => diaLocal(api.ahora().toISOString());

export const iconoCategoria = (c: CategoriaPrecio): NombreIconoUi => (c === 'otra' ? 'caja' : ICONO_RUBRO[c]);

export function ChipModo({ modo }: { modo: ModoPrecio }) {
  const m = MODO_PRECIO[modo];
  return (
    <Chip tono={m.tono} icono={m.icono}>
      {m.texto}
    </Chip>
  );
}

export function ChipEstadoPresupuesto({ estado }: { estado: Presupuesto['estado'] }) {
  const e = ESTADO_PRESUPUESTO[estado];
  return (
    <Chip tono={e.tono} icono={e.icono}>
      {e.texto}
    </Chip>
  );
}

export interface DestinoPresupuesto {
  /** Nombre del cliente (solo si ya te contrató). */
  cliente: string | null;
  /** Chat al que llega la tarjeta (si ya existe). */
  chatId: string | null;
  volver: string;
}

/** A quién va el presupuesto: el cliente y el chat del trabajo (o del pedido, que se abre al mandarlo). */
export function useDestino(p: Pick<Presupuesto, 'trabajoId' | 'obraId' | 'pedidoId'> | null) {
  const trabajoId = p ? (p.trabajoId ?? p.obraId) : null;
  const pedidoId = p?.pedidoId ?? null;
  return useCarga<DestinoPresupuesto | null>(async () => {
    if (trabajoId) {
      const t = await api.trabajo(trabajoId);
      return { cliente: t.contraparte, chatId: t.trabajo.conversacionId, volver: `${RUTAS.trabajo.ruta}?id=${trabajoId}` };
    }
    if (pedidoId) return { cliente: null, chatId: null, volver: `${RUTAS.pedido.ruta}?id=${pedidoId}` };
    return null;
  }, [trabajoId, pedidoId]);
}

/** Ruta del presupuestador para un presupuesto. */
export const rutaPresupuesto = (id: string): string => `${RUTAS.presupuesto.ruta}?id=${id}`;
