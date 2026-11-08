// Presupuestos, lista de precios, mano de obra y catálogo de nombres contra api-especialista (ola 2.5). La foto de la
// lista del corralón se lee en el teléfono: acá solo viajan las filas.
import { z } from 'zod';
import type { MaterialCatalogo } from '../../../contracts/presupuestos.ts';
import {
  KitMaterialesSchema,
  ManoDeObraSchema,
  MaterialCatalogoSchema,
  PlantillaPresupuestoSchema,
  PrecioDetalleSchema,
  PrecioMaterialSchema,
  PreferenciasMaterialSchema,
  PresupuestoSchema,
  ResultadoLecturaSchema,
  RevisionLecturaSchema,
  TarifaTareaSchema,
  type AgregarManoObra,
  type AgregarMateriales,
  type CambioItemMaterial,
  type CambioPrecio,
  type CambioTarifaTarea,
  type EnvioPresupuesto,
  type GuardarTarifasBase,
  type LecturaLista,
  type NuevaPlantilla,
  type NuevaTarifaTarea,
  type NuevoPrecio,
  type NuevoPresupuesto,
  type PreferenciasMaterial,
} from '../../../contracts/presupuestos.ts';
import { SugerenciaCodigoSchema } from '../../../contracts/equipamiento.ts';
import type { Rubro } from '../../../contracts/rubros.ts';
import type { ClienteHttp } from '../cliente.ts';
import { id, Nada } from '../comun.ts';
import { q } from './agenda.ts';

const E = '/v1/especialista';
const pagina = <S extends z.ZodType>(s: S) => z.strictObject({ items: z.array(s), siguienteCursor: z.string().nullable() });

export const presupuestosServidor = (c: ClienteHttp) => ({
  presupuestos: (estado: 'abiertos' | 'todos' = 'abiertos', cursor?: string) =>
    c.pedir('GET', `${E}/presupuestos${q({ estado, cursor })}`, pagina(PresupuestoSchema)),
  crearPresupuesto: (n: NuevoPresupuesto, clave: string) =>
    c.pedir('POST', `${E}/presupuestos`, PresupuestoSchema, { cuerpo: n, idempotencyKey: clave }),
  presupuesto: (pid: string) => c.pedir('GET', `${E}/presupuestos/${id(pid)}`, PresupuestoSchema),
  versionesPresupuesto: (pid: string) => c.pedir('GET', `${E}/presupuestos/${id(pid)}/versiones`, z.array(PresupuestoSchema)),
  agregarMateriales: (pid: string, a: AgregarMateriales) =>
    c.pedir('POST', `${E}/presupuestos/${id(pid)}/materiales`, PresupuestoSchema, { cuerpo: a }),
  cambiarMaterial: (pid: string, itemId: string, cambio: CambioItemMaterial) =>
    c.pedir('PATCH', `${E}/presupuestos/${id(pid)}/materiales/${id(itemId)}`, PresupuestoSchema, { cuerpo: cambio }),
  quitarMaterial: (pid: string, itemId: string) => c.pedir('DELETE', `${E}/presupuestos/${id(pid)}/materiales/${id(itemId)}`, PresupuestoSchema),
  agregarManoObra: (pid: string, a: AgregarManoObra) => c.pedir('POST', `${E}/presupuestos/${id(pid)}/mano-de-obra`, PresupuestoSchema, { cuerpo: a }),
  quitarManoObra: (pid: string, itemId: string) => c.pedir('DELETE', `${E}/presupuestos/${id(pid)}/mano-de-obra/${id(itemId)}`, PresupuestoSchema),
  enviarPresupuesto: (pid: string, e: EnvioPresupuesto, clave: string) =>
    c.pedir('POST', `${E}/presupuestos/${id(pid)}/envio`, PresupuestoSchema, { cuerpo: e, idempotencyKey: clave }),
  versionNuevaPresupuesto: (pid: string, version: number, clave: string) =>
    c.pedir('POST', `${E}/presupuestos/${id(pid)}/version-nueva`, PresupuestoSchema, { cuerpo: { version }, idempotencyKey: clave }),
  guardarPlantilla: (pid: string, n: NuevaPlantilla) => c.pedir('POST', `${E}/presupuestos/${id(pid)}/plantilla`, PlantillaPresupuestoSchema, { cuerpo: n }),
  plantillas: () => c.pedir('GET', `${E}/presupuestos/plantillas`, z.array(PlantillaPresupuestoSchema)),
  borrarPlantilla: async (plantillaId: string) => void (await c.pedir('DELETE', `${E}/presupuestos/plantillas/${id(plantillaId)}`, Nada)),
  kits: (rubro?: Rubro) => c.pedir('GET', `${E}/presupuestos/kits${q({ rubro })}`, z.array(KitMaterialesSchema)),
  preferenciasMaterial: () => c.pedir('GET', `${E}/presupuestos/preferencias`, PreferenciasMaterialSchema),
  guardarPreferenciasMaterial: (p: PreferenciasMaterial) => c.pedir('PUT', `${E}/presupuestos/preferencias`, PreferenciasMaterialSchema, { cuerpo: p }),

  precios: (f: { q?: string; categoria?: string; viejos?: boolean; cursor?: string } = {}) =>
    c.pedir('GET', `${E}/precios${q({ ...f, viejos: f.viejos === undefined ? undefined : String(f.viejos) })}`, pagina(PrecioMaterialSchema)),
  crearPrecio: (n: NuevoPrecio, clave: string) => c.pedir('POST', `${E}/precios`, PrecioMaterialSchema, { cuerpo: n, idempotencyKey: clave }),
  precio: (precioId: string) => c.pedir('GET', `${E}/precios/${id(precioId)}`, PrecioDetalleSchema),
  cambiarPrecio: (precioId: string, cambio: CambioPrecio) => c.pedir('PATCH', `${E}/precios/${id(precioId)}`, PrecioMaterialSchema, { cuerpo: cambio }),
  borrarPrecio: async (precioId: string) => void (await c.pedir('DELETE', `${E}/precios/${id(precioId)}`, Nada)),
  revisarLectura: (l: LecturaLista) => c.pedir('POST', `${E}/precios/lectura/revision`, RevisionLecturaSchema, { cuerpo: l }),
  aplicarLectura: (l: LecturaLista, clave: string) => c.pedir('POST', `${E}/precios/lectura`, ResultadoLecturaSchema, { cuerpo: l, idempotencyKey: clave }),
  catalogoMateriales: (texto: string, categoria?: MaterialCatalogo['categoria']) =>
    c.pedir('GET', `${E}/catalogo/materiales${q({ q: texto, categoria })}`, z.array(MaterialCatalogoSchema)),
  sugerenciaCodigo: (codigo: string) => c.pedir('GET', `${E}/catalogo/codigos${q({ codigo })}`, SugerenciaCodigoSchema),

  manoDeObra: () => c.pedir('GET', `${E}/mano-de-obra`, ManoDeObraSchema),
  guardarTarifasBase: (g: GuardarTarifasBase) => c.pedir('PUT', `${E}/mano-de-obra`, ManoDeObraSchema, { cuerpo: g }),
  crearTarifaTarea: (n: NuevaTarifaTarea) => c.pedir('POST', `${E}/mano-de-obra/tareas`, TarifaTareaSchema, { cuerpo: n }),
  cambiarTarifaTarea: (tareaId: string, cambio: CambioTarifaTarea) =>
    c.pedir('PATCH', `${E}/mano-de-obra/tareas/${id(tareaId)}`, TarifaTareaSchema, { cuerpo: cambio }),
  borrarTarifaTarea: async (tareaId: string) => void (await c.pedir('DELETE', `${E}/mano-de-obra/tareas/${id(tareaId)}`, Nada)),
});
