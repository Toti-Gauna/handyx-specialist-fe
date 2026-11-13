// Adaptador HTTP del equipamiento (lote 2.4). Las rutas y la validación viven en `servidor/equipamiento.ts`,
// `servidor/presupuestos.ts` (códigos de barras) y `servidor/modo-trabajo.ts` (adjuntos del trabajo), del lote 2.5 y
// probados contra la API real: acá solo se adapta al puerto de la PWA.
import type { ApiEquipamiento } from '../api/equipamiento.ts';
import type { ClienteHttp } from './cliente.ts';
import { equipamientoServidor } from './servidor/equipamiento.ts';
import { modoTrabajoServidor } from './servidor/modo-trabajo.ts';
import { presupuestosServidor } from './servidor/presupuestos.ts';

export const equipamientoHttp = (c: ClienteHttp): ApiEquipamiento => {
  const s = equipamientoServidor(c);
  const modo = modoTrabajoServidor(c);
  return {
    equipamiento: s.equipamiento,
    // `prestados` solo viaja cuando se pide (el filtro apagado no es «los no prestados»).
    equipamientoItems: (f = {}) => s.equipos({ categoria: f.categoria, ubicacion: f.ubicacion, prestados: f.prestados || undefined, q: f.q || undefined, cursor: f.cursor ?? undefined }),
    equipamientoItem: s.equipo,
    agregarEquipamiento: (datos, foto, clave) => s.crearEquipo(datos, clave, foto ?? undefined),
    corregirEquipamiento: s.cambiarEquipo,
    prestarEquipamiento: s.prestarEquipo,
    devolverEquipamiento: s.devolverEquipo,
    moverEquipamiento: s.moverEquipo,
    bajaEquipamiento: s.bajaEquipo,
    mantenimientoHecho: s.mantenimientoHecho,
    listaCompras: s.listaCompras,
    sumarListaCompras: s.sumarCompra,
    sacarListaCompras: s.sacarCompra,
    sugerenciaCodigo: presupuestosServidor(c).sugerenciaCodigo,
    adjuntosTrabajo: modo.adjuntosTrabajo,
    guardarAdjuntoTrabajo: (t, datos, archivo, clave) => modo.adjuntarTrabajo(t, datos.tipo, datos.nombre, archivo, clave),
  };
};
