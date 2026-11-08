// Compositor del mock: junta los métodos síncronos de cada dominio (un archivo por dominio, como `api/` y `http/`).
// Un dominio nuevo de una ola se suma acá; el adaptador los envuelve con latencia, fallas y sesión.
import { acceso } from './acceso.ts';
import { alta } from './alta.ts';
import { caja } from './caja.ts';
import { cuenta } from './cuenta.ts';
import type { EstadoMock } from './estado.ts';
import { mensajes } from './mensajes.ts';
import { modoTrabajo } from './modo-trabajo.ts';
import { obras } from './obras.ts';
import { pedidos } from './pedidos.ts';
import { propuestas } from './propuestas.ts';
import { soporte } from './soporte.ts';
import { taller } from './taller.ts';
import { trabajos } from './trabajos.ts';
import { turnos } from './turnos.ts';
import { viajes } from './viajes.ts';

export const metodosMock = (s: EstadoMock) => ({
  ...acceso(s),
  ...alta(s),
  ...pedidos(s),
  ...propuestas(s),
  ...trabajos(s),
  ...viajes(s),
  ...obras(s),
  ...turnos(s),
  ...mensajes(s),
  ...caja(s),
  ...soporte(s),
  ...cuenta(s),
  ...taller(),
  ...modoTrabajo(s),
});
