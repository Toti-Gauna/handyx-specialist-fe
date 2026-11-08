// Equipamiento y lista de compras contra api-especialista (ola 2.5). La foto va achicada y sin metadatos (multipart con
// el JSON en `datos`); el código de barras se lee en el teléfono.
import { z } from 'zod';
import {
  ItemCompraSchema,
  ItemEquipoDetalleSchema,
  ItemEquipoSchema,
  ResultadoBajaEquipoSchema,
  ResumenEquipamientoSchema,
  type BajaEquipo,
  type CambioItemEquipo,
  type MoverEquipo,
  type NuevoItemCompra,
  type NuevoItemEquipo,
  type PrestarEquipo,
} from '../../../contracts/equipamiento.ts';
import type { ClienteHttp } from '../cliente.ts';
import { id, Nada } from '../comun.ts';
import { q } from './agenda.ts';

const E = '/v1/especialista';
const I = `${E}/equipamiento/items`;
const Pagina = z.strictObject({ items: z.array(ItemEquipoSchema), siguienteCursor: z.string().nullable() });

export const equipamientoServidor = (c: ClienteHttp) => ({
  equipamiento: () => c.pedir('GET', `${E}/equipamiento`, ResumenEquipamientoSchema),
  equipos: (f: { categoria?: string; ubicacion?: string; prestados?: boolean; q?: string; cursor?: string } = {}) =>
    c.pedir('GET', `${I}${q({ ...f, prestados: f.prestados === undefined ? undefined : String(f.prestados) })}`, Pagina),
  crearEquipo(n: NuevoItemEquipo, clave: string, foto?: Blob) {
    if (!foto) return c.pedir('POST', I, ItemEquipoSchema, { cuerpo: n, idempotencyKey: clave });
    const f = new FormData();
    f.set('datos', new Blob([JSON.stringify(n)], { type: 'application/json' }));
    f.set('foto', foto, 'foto.jpg');
    return c.pedir('POST', I, ItemEquipoSchema, { formulario: f, idempotencyKey: clave });
  },
  equipo: (itemId: string) => c.pedir('GET', `${I}/${id(itemId)}`, ItemEquipoDetalleSchema),
  cambiarEquipo: (itemId: string, cambio: CambioItemEquipo) => c.pedir('PATCH', `${I}/${id(itemId)}`, ItemEquipoDetalleSchema, { cuerpo: cambio }),
  prestarEquipo: (itemId: string, p: PrestarEquipo) => c.pedir('POST', `${I}/${id(itemId)}/prestamo`, ItemEquipoDetalleSchema, { cuerpo: p }),
  devolverEquipo: (itemId: string, version: number) => c.pedir('POST', `${I}/${id(itemId)}/devolucion`, ItemEquipoDetalleSchema, { cuerpo: { version } }),
  moverEquipo: (itemId: string, m: MoverEquipo) => c.pedir('POST', `${I}/${id(itemId)}/movimiento`, ItemEquipoDetalleSchema, { cuerpo: m }),
  bajaEquipo: (itemId: string, b: BajaEquipo) => c.pedir('POST', `${I}/${id(itemId)}/baja`, ResultadoBajaEquipoSchema, { cuerpo: b }),
  mantenimientoHecho: (itemId: string, mantenimientoId: string, version: number) =>
    c.pedir('POST', `${I}/${id(itemId)}/mantenimientos/${id(mantenimientoId)}/hecho`, ItemEquipoDetalleSchema, { cuerpo: { version } }),
  listaCompras: () => c.pedir('GET', `${E}/lista-compras`, z.array(ItemCompraSchema)),
  sumarCompra: (n: NuevoItemCompra) => c.pedir('POST', `${E}/lista-compras`, ItemCompraSchema, { cuerpo: n }),
  sacarCompra: async (compraId: string) => void (await c.pedir('DELETE', `${E}/lista-compras/${id(compraId)}`, Nada)),
});
