import type { Ruta } from './tipos.ts';

// Tu equipamiento (lote 2.4, fase H0.5). Se llega desde la pestaña Taller; los ids van por query (?id=, ?c=).
export const rutasEquipamiento = {
  equipamiento: { ruta: '/taller/equipamiento/', titulo: 'Tu equipamiento', lote: '2.4', descripcion: 'Herramientas y consumibles por categoría, dónde está cada cosa, mantenimientos y lista de compras (H0-Equipo).' },
  equipamientoCategoria: { ruta: '/taller/equipamiento/categoria/', titulo: 'Una categoría', lote: '2.4', descripcion: 'Las herramientas de una categoría con su estado y el buscador (H0-EquipoCategoria).' },
  equipamientoAgregar: { ruta: '/taller/equipamiento/agregar/', titulo: 'Agregar herramienta', lote: '2.4', descripcion: 'Foto o código de barras, nombre, categoría, dónde está y el recordatorio (H0-EquipoAgregar).' },
  equipamientoHerramienta: { ruta: '/taller/equipamiento/herramienta/', titulo: 'Una herramienta', lote: '2.4', descripcion: 'Dónde está, mantenimiento e historial; prestar, mover y «Ya no la tengo» (H0-EquipoDetalle, H0-EquipoBaja).' },
} as const satisfies Record<string, Ruta>;
