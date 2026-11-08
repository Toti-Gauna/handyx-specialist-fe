// Herramientas de Electricidad (fase H1) para la puerta del oficio (T-Electricidad, lote 2.4), con los íconos del kit v3.
// Las primeras seis son las del lienzo; el resto, «más herramientas». Las rutas son las de siempre (rutas/taller.ts).
import { rutasTaller } from '../../app/rutas/taller.ts';
import type { NombreIconoUi } from '../../ui/atomos/Icono.tsx';

export interface AccesoOficio {
  id: string;
  titulo: string;
  detalle: string;
  icono: NombreIconoUi;
  ruta: string;
  /** Tiene realidad aumentada (en la pared o en el techo). */
  ar?: boolean;
}

export const HERRAMIENTAS_ELECTRICIDAD: readonly AccesoOficio[] = [
  { id: 'tablero', titulo: 'Tablero 3D', detalle: 'Armalo y miralo en la pared', icono: 'caja', ruta: rutasTaller.tallerTablero.ruta, ar: true },
  { id: 'cables', titulo: 'Cables', detalle: 'Sección y caída de tensión', icono: 'rayo', ruta: rutasTaller.tallerConductores.ruta },
  { id: 'informe', titulo: 'Informe eléctrico', detalle: 'Mediciones con semáforo', icono: 'escudo', ruta: rutasTaller.tallerInforme.ruta },
  { id: 'iluminacion', titulo: 'Iluminación', detalle: 'Luz por ambiente', icono: 'bombita', ruta: rutasTaller.tallerIluminacion.ruta, ar: true },
  { id: 'consumo', titulo: 'Consumo', detalle: 'Cuánto gasta cada equipo', icono: 'billete', ruta: rutasTaller.tallerConsumo.ruta },
  { id: 'canalizacion', titulo: 'Recorrido de caños', detalle: 'El ambiente en 3D', icono: 'obra', ruta: rutasTaller.tallerCanalizacion.ruta },
  { id: 'vivienda', titulo: 'Planificador de vivienda', detalle: 'Circuitos y bocas mínimas', icono: 'casa', ruta: rutasTaller.tallerVivienda.ruta },
  { id: 'checklists', titulo: 'Checklists', detalle: 'La seguridad primero', icono: 'lista', ruta: rutasTaller.tallerChecklists.ruta },
  { id: 'ohm', titulo: 'Ohm y referencias', detalle: 'Colores y seguridad', icono: 'libro', ruta: rutasTaller.tallerOhm.ruta },
  { id: 'etiquetas', titulo: 'Etiquetas con IA', detalle: 'De una foto del tablero', icono: 'camara', ruta: rutasTaller.tallerEtiquetas.ruta },
  { id: 'dictado', titulo: 'Presupuesto dictado', detalle: 'Tareas y materiales', icono: 'micro', ruta: rutasTaller.tallerDictado.ruta },
];
