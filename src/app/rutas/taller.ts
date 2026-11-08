import type { Ruta } from './tipos.ts';

export const rutasTaller = {
  taller: { ruta: '/taller/', titulo: 'Taller', lote: 'H0.1', descripcion: 'Pestaña Taller: herramientas por oficio, las de tu rubro primero (la ola 2 suma agenda, ingresos y presupuestos).' },
  tallerConductores: { ruta: '/taller/conductores/', titulo: 'Sección y caída de tensión', lote: 'H1.1', descripcion: 'Sección del cable, protección y caída de tensión con el porqué.' },
  tallerVivienda: { ruta: '/taller/vivienda/', titulo: 'Planificador de vivienda', lote: 'H1.1', descripcion: 'Grado de electrificación, circuitos y bocas mínimas por ambiente.' },
  tallerTablero: { ruta: '/taller/tablero/', titulo: 'Armador de tablero', lote: 'H1.2', descripcion: 'Tablero en 3D, gabinete, materiales, etiquetas y vista en la pared (iPhone).' },
  tallerIluminacion: { ruta: '/taller/iluminacion/', titulo: 'Iluminación', lote: 'H1.1', descripcion: 'Lúmenes y cantidad de luminarias por ambiente.' },
  tallerConsumo: { ruta: '/taller/consumo/', titulo: 'Consumo y ahorro', lote: 'H1.1', descripcion: 'Consumo del mes y ahorro de pasar a LED con la tarifa que carga el profesional.' },
  tallerOhm: { ruta: '/taller/ohm/', titulo: 'Ohm y referencias', lote: 'H1.1', descripcion: 'Ley de Ohm, colores de conductores y seguridad antes de trabajar.' },
  tallerEtiquetas: { ruta: '/taller/etiquetas/', titulo: 'Etiquetas con IA', lote: 'H1.3', descripcion: 'Foto del tablero, propuesta de la IA, corrección, etiquetas y armador.' },
  tallerDictado: { ruta: '/taller/dictado/', titulo: 'Presupuesto dictado', lote: 'H1.3', descripcion: 'Del trabajo contado a tareas y materiales, sin datos personales y sin precios.' },
  tallerInforme: { ruta: '/taller/informe/', titulo: 'Informe eléctrico', lote: 'H1.4', descripcion: 'Mediciones con semáforo, estado del tablero, fotos y recomendaciones para el cliente.' },
  tallerCanalizacion: { ruta: '/taller/canalizacion/', titulo: 'Recorrido de caños', lote: 'H1.5', descripcion: 'Ambiente en 3D con bocas y el recorrido de caños por circuito; materiales.' },
  tallerChecklists: { ruta: '/taller/checklists/', titulo: 'Checklists', lote: 'H1.5', descripcion: 'Pasos por tipo de trabajo, siempre con la seguridad primero.' },
  tallerNivel: { ruta: '/taller/nivel/', titulo: 'Nivel y pendiente', lote: 'H0.1', descripcion: 'Nivel, plomada y pendiente con el giroscopio.' },
} as const satisfies Record<string, Ruta>;
