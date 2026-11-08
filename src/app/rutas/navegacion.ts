// Pestañas de la barra de abajo (kit v3, lote 0.2): Inicio · Obras · Taller · Mensajes · Cuenta. La Agenda dejó de
// ser pestaña: se llega desde Inicio y, en la ola 2, desde Taller. Solo las pantallas raíz muestran la barra.
import type { NombreIconoUi } from '../../ui/atomos/Icono.tsx';
import { rutasCuenta } from './cuenta.ts';
import { rutasMensajes } from './mensajes.ts';
import { rutasPedidos } from './pedidos.ts';
import { rutasTaller } from './taller.ts';
import { rutasTrabajos } from './trabajos.ts';

export const PESTANAS = [
  { id: 'inicio', texto: 'Inicio', icono: 'casa', ruta: rutasPedidos.inicio.ruta, prefijos: ['/inicio/', '/pedidos/', '/notificaciones/', '/disponibilidad/'] },
  { id: 'obras', texto: 'Obras', icono: 'obra', ruta: rutasTrabajos.trabajos.ruta, prefijos: ['/trabajos/', '/en-camino/'] },
  { id: 'taller', texto: 'Taller', icono: 'herramienta', ruta: rutasTaller.taller.ruta, prefijos: ['/taller/', '/agenda/', '/caja/'] },
  { id: 'mensajes', texto: 'Mensajes', icono: 'chat', ruta: rutasMensajes.mensajes.ruta, prefijos: ['/mensajes/'] },
  { id: 'cuenta', texto: 'Cuenta', icono: 'cuenta', ruta: rutasCuenta.cuenta.ruta, prefijos: ['/cuenta/', '/soporte/', '/baja/'] },
] as const satisfies readonly { id: string; texto: string; icono: NombreIconoUi; ruta: string; prefijos: readonly string[] }[];

export type IdPestana = (typeof PESTANAS)[number]['id'];

/** La pestaña de una ruta (sin la base de la vista previa); null si no pertenece a ninguna. */
export function pestanaActiva(ruta: string): IdPestana | null {
  const r = ruta.endsWith('/') ? ruta : `${ruta}/`;
  for (const p of PESTANAS) if (p.prefijos.some((x) => r.startsWith(x))) return p.id;
  return null;
}
