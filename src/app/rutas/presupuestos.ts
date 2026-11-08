import type { Ruta } from './tipos.ts';

// Presupuestos y lista de precios (lote 2.2, H0.2). El presupuestador se abre desde el trabajo (`?trabajo=`), un pedido
// (`?pedido=`) o un presupuesto (`?id=`); agregar materiales recibe el presupuesto en `?id=`.
export const rutasPresupuestos = {
  presupuesto: { ruta: '/presupuestos/', titulo: 'Presupuesto', lote: 'H0.2', descripcion: 'Mano de obra y materiales; se manda directo por el chat como tarjeta.' },
  presupuestoMaterial: { ruta: '/presupuestos/material/', titulo: 'Agregar material', lote: 'H0.2', descripcion: 'Buscar en tu lista, tocar y elegir la cantidad; opciones resumidas (cobrar, gasto, precio).' },
  presupuestoMaterialNuevo: { ruta: '/presupuestos/material-nuevo/', titulo: 'Material nuevo', lote: 'H0.2', descripcion: 'Nombre, categoría y precio; el nombre suma al catálogo de Handyx, el precio nunca.' },
  presupuestoVarios: { ruta: '/presupuestos/varios/', titulo: 'Agregar varios', lote: 'H0.2', descripcion: 'Varios materiales de una vez: un kit o los que marques de tu lista.' },
  precios: { ruta: '/precios/', titulo: 'Tu lista de precios', lote: 'H0.2', descripcion: 'Materiales por categoría con lo que subió y lo viejo; sumar precios.' },
  preciosFoto: { ruta: '/precios/foto/', titulo: 'Foto de la lista', lote: 'H0.2', descripcion: 'La lista del corralón se lee en el teléfono (la foto no se manda) y se revisa antes de guardar.' },
  precioDetalle: { ruta: '/precios/detalle/', titulo: 'Detalle del precio', lote: 'H0.2', descripcion: 'Lo que te cuesta, lo que cobrás, cómo varió y si se congela o se actualiza.' },
  manoDeObra: { ruta: '/precios/mano-de-obra/', titulo: 'Mano de obra', lote: 'H0.2', descripcion: 'Hora, visita, urgencia y tus tarifas por tarea.' },
} as const satisfies Record<string, Ruta>;
