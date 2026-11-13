// Adaptador HTTP de presupuestos y lista de precios (lote 2.2). Las rutas y la validación viven en
// `servidor/presupuestos.ts` (lote 2.5, probado contra la API real): acá solo se adapta al puerto de la PWA.
import type { ApiPresupuestos } from '../api/presupuestos.ts';
import type { ClienteHttp } from './cliente.ts';
import { presupuestosServidor } from './servidor/presupuestos.ts';

export const presupuestosHttp = (c: ClienteHttp): ApiPresupuestos => {
  const s = presupuestosServidor(c);
  return {
    presupuestos: s.presupuestos,
    crearPresupuesto: s.crearPresupuesto,
    presupuesto: s.presupuesto,
    versionesPresupuesto: s.versionesPresupuesto,
    agregarMateriales: s.agregarMateriales,
    cambiarMaterial: s.cambiarMaterial,
    quitarMaterial: s.quitarMaterial,
    agregarManoObra: s.agregarManoObra,
    quitarManoObra: s.quitarManoObra,
    enviarPresupuesto: s.enviarPresupuesto,
    versionNuevaPresupuesto: (pid, v, clave) => s.versionNuevaPresupuesto(pid, v.version, clave),
    kitsMateriales: s.kits,
    preferenciasMaterial: s.preferenciasMaterial,
    guardarPreferenciasMaterial: s.guardarPreferenciasMaterial,

    precios: (f = {}) => s.precios({ categoria: f.categoria, q: f.q || undefined, viejos: f.viejos, cursor: f.cursor }),
    crearPrecio: s.crearPrecio,
    precio: s.precio,
    cambiarPrecio: s.cambiarPrecio,
    quitarPrecio: s.borrarPrecio,
    revisarLectura: s.revisarLectura,
    guardarLectura: s.aplicarLectura,

    manoDeObra: s.manoDeObra,
    guardarTarifasBase: s.guardarTarifasBase,
    crearTarifaTarea: s.crearTarifaTarea,
    cambiarTarifaTarea: s.cambiarTarifaTarea,
    quitarTarifaTarea: s.borrarTarifaTarea,

    buscarCatalogo: s.catalogoMateriales,
  };
};
