// Adaptador HTTP del dominio presupuestos y lista de precios (lote 2.2). Rutas: docs/api/openapi.yaml.
import { z } from 'zod';
import { paginado } from '../../contracts/dto.ts';
import {
  KitMaterialesSchema,
  ManoDeObraSchema,
  MaterialCatalogoSchema,
  PrecioDetalleSchema,
  PrecioMaterialSchema,
  PreferenciasMaterialSchema,
  PresupuestoSchema,
  ResultadoLecturaSchema,
  RevisionLecturaSchema,
  TarifaTareaSchema,
} from '../../contracts/presupuestos.ts';
import type { ApiPresupuestos } from '../api/presupuestos.ts';
import type { ClienteHttp } from './cliente.ts';
import { id, Nada } from './comun.ts';

const E = '/v1/especialista';
const P = `${E}/presupuestos`;

/** Arma `?a=1&b=2` solo con lo que vino. */
function consulta(p: Record<string, string | boolean | undefined>): string {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(p)) if (v !== undefined && v !== '') q.set(k, String(v));
  const t = q.toString();
  return t ? `?${t}` : '';
}

export const presupuestosHttp = (c: ClienteHttp): ApiPresupuestos => ({
  presupuestos: (estado, cursor) => c.pedir('GET', `${P}${consulta({ estado, cursor })}`, paginado(PresupuestoSchema)),
  crearPresupuesto: (n, clave) => c.pedir('POST', P, PresupuestoSchema, { cuerpo: n, idempotencyKey: clave }),
  presupuesto: (pid) => c.pedir('GET', `${P}/${id(pid)}`, PresupuestoSchema),
  versionesPresupuesto: (pid) => c.pedir('GET', `${P}/${id(pid)}/versiones`, z.array(PresupuestoSchema)),
  agregarMateriales: (pid, a) => c.pedir('POST', `${P}/${id(pid)}/materiales`, PresupuestoSchema, { cuerpo: a }),
  cambiarMaterial: (pid, item, x) => c.pedir('PATCH', `${P}/${id(pid)}/materiales/${id(item)}`, PresupuestoSchema, { cuerpo: x }),
  quitarMaterial: (pid, item) => c.pedir('DELETE', `${P}/${id(pid)}/materiales/${id(item)}`, PresupuestoSchema),
  agregarManoObra: (pid, a) => c.pedir('POST', `${P}/${id(pid)}/mano-de-obra`, PresupuestoSchema, { cuerpo: a }),
  quitarManoObra: (pid, item) => c.pedir('DELETE', `${P}/${id(pid)}/mano-de-obra/${id(item)}`, PresupuestoSchema),
  enviarPresupuesto: (pid, e, clave) => c.pedir('POST', `${P}/${id(pid)}/envio`, PresupuestoSchema, { cuerpo: e, idempotencyKey: clave }),
  versionNuevaPresupuesto: (pid, v, clave) => c.pedir('POST', `${P}/${id(pid)}/version-nueva`, PresupuestoSchema, { cuerpo: v, idempotencyKey: clave }),
  kitsMateriales: (rubro) => c.pedir('GET', `${P}/kits${consulta({ rubro })}`, z.array(KitMaterialesSchema)),
  preferenciasMaterial: () => c.pedir('GET', `${P}/preferencias`, PreferenciasMaterialSchema),
  guardarPreferenciasMaterial: (p) => c.pedir('PUT', `${P}/preferencias`, PreferenciasMaterialSchema, { cuerpo: p }),

  precios: (f = {}) => c.pedir('GET', `${E}/precios${consulta({ categoria: f.categoria, q: f.q, viejos: f.viejos, cursor: f.cursor })}`, paginado(PrecioMaterialSchema)),
  crearPrecio: (n, clave) => c.pedir('POST', `${E}/precios`, PrecioMaterialSchema, { cuerpo: n, idempotencyKey: clave }),
  precio: (pid) => c.pedir('GET', `${E}/precios/${id(pid)}`, PrecioDetalleSchema),
  cambiarPrecio: (pid, x) => c.pedir('PATCH', `${E}/precios/${id(pid)}`, PrecioMaterialSchema, { cuerpo: x }),
  async quitarPrecio(pid) {
    await c.pedir('DELETE', `${E}/precios/${id(pid)}`, Nada);
  },
  revisarLectura: (l) => c.pedir('POST', `${E}/precios/lectura/revision`, RevisionLecturaSchema, { cuerpo: l }),
  guardarLectura: (l, clave) => c.pedir('POST', `${E}/precios/lectura`, ResultadoLecturaSchema, { cuerpo: l, idempotencyKey: clave }),

  manoDeObra: () => c.pedir('GET', `${E}/mano-de-obra`, ManoDeObraSchema),
  guardarTarifasBase: (g) => c.pedir('PUT', `${E}/mano-de-obra`, ManoDeObraSchema, { cuerpo: g }),
  crearTarifaTarea: (n) => c.pedir('POST', `${E}/mano-de-obra/tareas`, TarifaTareaSchema, { cuerpo: n }),
  cambiarTarifaTarea: (tid, x) => c.pedir('PATCH', `${E}/mano-de-obra/tareas/${id(tid)}`, TarifaTareaSchema, { cuerpo: x }),
  async quitarTarifaTarea(tid) {
    await c.pedir('DELETE', `${E}/mano-de-obra/tareas/${id(tid)}`, Nada);
  },

  buscarCatalogo: (q, categoria) => c.pedir('GET', `${E}/catalogo/materiales${consulta({ q, categoria })}`, z.array(MaterialCatalogoSchema)),
});
