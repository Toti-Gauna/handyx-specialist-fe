// Mapa de rutas de la PWA (exportación estática: cada ruta es una carpeta con index.html).
// Los ids de recursos van por query (?id=…), no por segmento, porque no se conocen en build.
// Partido por dominio (lote 0.2): cada lote de una ola agrega sus rutas en `rutas/<dominio>.ts`; acá solo se componen.
// Las pestañas de la barra de abajo están en `rutas/navegacion.ts`.
import { rutasAcceso } from './rutas/acceso.ts';
import { rutasAgenda } from './rutas/agenda.ts';
import { rutasAlta } from './rutas/alta.ts';
import { rutasBase } from './rutas/base.ts';
import { rutasCaja } from './rutas/caja.ts';
import { rutasCuenta } from './rutas/cuenta.ts';
import { rutasMensajes } from './rutas/mensajes.ts';
import { rutasObras } from './rutas/obras.ts';
import { rutasPedidos } from './rutas/pedidos.ts';
import { rutasPresupuestos } from './rutas/presupuestos.ts';
import { rutasSoporte } from './rutas/soporte.ts';
import { rutasTaller } from './rutas/taller.ts';
import { rutasTrabajos } from './rutas/trabajos.ts';
import type { Ruta } from './rutas/tipos.ts';

export type { Ruta } from './rutas/tipos.ts';

export const RUTAS = {
  ...rutasBase,
  ...rutasAcceso,
  ...rutasAlta,
  ...rutasPedidos,
  ...rutasTrabajos,
  ...rutasObras,
  ...rutasMensajes,
  ...rutasCaja,
  ...rutasCuenta,
  ...rutasSoporte,
  ...rutasTaller,
  ...rutasAgenda,
  ...rutasPresupuestos,
} as const satisfies Record<string, Ruta>;

export type ClaveRuta = keyof typeof RUTAS;
