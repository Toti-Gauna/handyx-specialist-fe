// Catálogo de materiales eléctricos (fase H1.5): nombres y unidades comunes para el cómputo, el dictado, el armador y,
// desde la fase R, los pedidos a la ferretería. Sin precios: los pone el profesional o la ferretería.
export type UnidadMaterial = 'unidad' | 'metro' | 'rollo' | 'caja';
export type CategoriaMaterial = 'conductores' | 'canalizacion' | 'cajas' | 'protecciones' | 'tablero' | 'bocas' | 'tierra' | 'consumibles';

export interface Material {
  id: string;
  descripcion: string;
  unidad: UnidadMaterial;
  categoria: CategoriaMaterial;
}

export const MATERIALES_ELECTRICOS: readonly Material[] = [
  { id: 'cable-1-5', descripcion: 'Cable unipolar 1,5 mm²', unidad: 'metro', categoria: 'conductores' },
  { id: 'cable-2-5', descripcion: 'Cable unipolar 2,5 mm²', unidad: 'metro', categoria: 'conductores' },
  { id: 'cable-4', descripcion: 'Cable unipolar 4 mm²', unidad: 'metro', categoria: 'conductores' },
  { id: 'cable-6', descripcion: 'Cable unipolar 6 mm²', unidad: 'metro', categoria: 'conductores' },
  { id: 'cable-tierra-4', descripcion: 'Cable verde y amarillo 4 mm²', unidad: 'metro', categoria: 'tierra' },
  { id: 'cano-3-4', descripcion: 'Caño corrugado 3/4"', unidad: 'metro', categoria: 'canalizacion' },
  { id: 'cano-7-8', descripcion: 'Caño corrugado 7/8"', unidad: 'metro', categoria: 'canalizacion' },
  { id: 'curva-3-4', descripcion: 'Curva y conector para caño 3/4"', unidad: 'unidad', categoria: 'canalizacion' },
  { id: 'caja-octogonal', descripcion: 'Caja octogonal', unidad: 'unidad', categoria: 'cajas' },
  { id: 'caja-rect', descripcion: 'Caja rectangular 5 × 10', unidad: 'unidad', categoria: 'cajas' },
  { id: 'caja-paso', descripcion: 'Caja de paso 10 × 10', unidad: 'unidad', categoria: 'cajas' },
  { id: 'termica-1p', descripcion: 'Interruptor termomagnético 1 polo', unidad: 'unidad', categoria: 'protecciones' },
  { id: 'termica-2p', descripcion: 'Interruptor termomagnético 2 polos', unidad: 'unidad', categoria: 'protecciones' },
  { id: 'diferencial-2p', descripcion: 'Disyuntor diferencial 2 polos 30 mA', unidad: 'unidad', categoria: 'protecciones' },
  { id: 'gabinete-12', descripcion: 'Gabinete modular de 12 módulos con riel DIN', unidad: 'unidad', categoria: 'tablero' },
  { id: 'gabinete-18', descripcion: 'Gabinete modular de 18 módulos con riel DIN', unidad: 'unidad', categoria: 'tablero' },
  { id: 'borneras', descripcion: 'Borneras de neutro y tierra', unidad: 'unidad', categoria: 'tablero' },
  { id: 'modulo-toma', descripcion: 'Módulo de toma 10 A con tierra', unidad: 'unidad', categoria: 'bocas' },
  { id: 'modulo-punto', descripcion: 'Módulo de punto (llave)', unidad: 'unidad', categoria: 'bocas' },
  { id: 'jabalina', descripcion: 'Jabalina de acero cobreado 1,5 m', unidad: 'unidad', categoria: 'tierra' },
  { id: 'cinta', descripcion: 'Cinta aisladora', unidad: 'rollo', categoria: 'consumibles' },
  { id: 'terminales', descripcion: 'Terminales de compresión', unidad: 'caja', categoria: 'consumibles' },
  { id: 'precintos', descripcion: 'Precintos plásticos', unidad: 'caja', categoria: 'consumibles' },
];
