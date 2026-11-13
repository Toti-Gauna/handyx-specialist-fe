import type { Ruta } from './tipos.ts';

// Herramientas del teléfono para todos los oficios y la puerta a las de tu oficio (lote 2.4, fase H0.1b). Las de
// Electricidad siguen en `rutas/taller.ts` con sus rutas de siempre.
export const rutasHerramientas = {
  tallerHerramientas: { ruta: '/taller/herramientas/', titulo: 'Herramientas del teléfono', lote: '2.4', descripcion: 'Medir, escanear en 3D, nivel, linterna y lupa, conversor y las de tu oficio (T-Taller).' },
  tallerMedir: { ruta: '/taller/medir/', titulo: 'Medir con la cámara', lote: '2.4', descripcion: 'Realidad aumentada en Android; en iPhone, con una tarjeta de referencia. Medida aproximada (T-Medir).' },
  tallerEscanear: { ruta: '/taller/escanear/', titulo: 'Escanear en 3D', lote: '2.4', descripcion: '30 fotos alrededor del objeto; el modelo y sus medidas se arman en el teléfono (T-Escanear).' },
  tallerModelo: { ruta: '/taller/modelo/', titulo: 'Modelo 3D', lote: '2.4', descripcion: 'El modelo escaneado: girarlo, ver sus medidas, compartirlo y guardarlo en un trabajo (T-Modelo3D).' },
  tallerLinterna: { ruta: '/taller/linterna/', titulo: 'Linterna y lupa', lote: '2.4', descripcion: 'El flash del teléfono y la cámara como lupa, sin guardar nada.' },
  tallerConversor: { ruta: '/taller/conversor/', titulo: 'Conversor', lote: '2.4', descripcion: 'Pulgadas y centímetros, superficies, volúmenes, presión y potencia.' },
  tallerElectricidad: { ruta: '/taller/electricidad/', titulo: 'Electricidad', lote: '2.4', descripcion: 'Las herramientas del electricista: cables, tablero 3D, informe y más (T-Electricidad).' },
} as const satisfies Record<string, Ruta>;
