// Adaptador HTTP del equipamiento (lote 2.4, contrato 0.11.0). Rutas: docs/api/openapi.yaml (tag equipamiento y los
// adjuntos de un trabajo, tag modo-trabajo).
import { z } from 'zod';
import { ItemCompraSchema, ItemEquipoDetalleSchema, ItemEquipoSchema, ResultadoBajaEquipoSchema, ResumenEquipamientoSchema, SugerenciaCodigoSchema } from '../../contracts/equipamiento.ts';
import { AdjuntoTrabajoSchema } from '../../contracts/modo-trabajo.ts';
import type { ApiEquipamiento } from '../api/equipamiento.ts';
import type { ClienteHttp } from './cliente.ts';
import { id, Nada } from './comun.ts';

const E = '/v1/especialista';
const PaginaEquipo = z.strictObject({ items: z.array(ItemEquipoSchema), siguienteCursor: z.string().nullable() });
const parteJson = (v: unknown) => new Blob([JSON.stringify(v)], { type: 'application/json' });

export const equipamientoHttp = (c: ClienteHttp): ApiEquipamiento => ({
  equipamiento: () => c.pedir('GET', `${E}/equipamiento`, ResumenEquipamientoSchema),
  equipamientoItems(f = {}) {
    const q = new URLSearchParams();
    if (f.categoria) q.set('categoria', f.categoria);
    if (f.ubicacion) q.set('ubicacion', f.ubicacion);
    if (f.prestados) q.set('prestados', 'true');
    if (f.q) q.set('q', f.q);
    if (f.cursor) q.set('cursor', f.cursor);
    const s = q.toString();
    return c.pedir('GET', `${E}/equipamiento/items${s ? `?${s}` : ''}`, PaginaEquipo);
  },
  equipamientoItem: (i) => c.pedir('GET', `${E}/equipamiento/items/${id(i)}`, ItemEquipoDetalleSchema),
  agregarEquipamiento(datos, foto, clave) {
    if (!foto) return c.pedir('POST', `${E}/equipamiento/items`, ItemEquipoSchema, { cuerpo: datos, idempotencyKey: clave });
    const f = new FormData();
    f.set('datos', parteJson(datos));
    f.set('foto', foto, 'herramienta.jpg');
    return c.pedir('POST', `${E}/equipamiento/items`, ItemEquipoSchema, { formulario: f, idempotencyKey: clave });
  },
  corregirEquipamiento: (i, cambio) => c.pedir('PATCH', `${E}/equipamiento/items/${id(i)}`, ItemEquipoDetalleSchema, { cuerpo: cambio }),
  prestarEquipamiento: (i, d) => c.pedir('POST', `${E}/equipamiento/items/${id(i)}/prestamo`, ItemEquipoDetalleSchema, { cuerpo: d }),
  devolverEquipamiento: (i, version) => c.pedir('POST', `${E}/equipamiento/items/${id(i)}/devolucion`, ItemEquipoDetalleSchema, { cuerpo: { version } }),
  moverEquipamiento: (i, d) => c.pedir('POST', `${E}/equipamiento/items/${id(i)}/movimiento`, ItemEquipoDetalleSchema, { cuerpo: d }),
  bajaEquipamiento: (i, d) => c.pedir('POST', `${E}/equipamiento/items/${id(i)}/baja`, ResultadoBajaEquipoSchema, { cuerpo: d }),
  mantenimientoHecho: (i, m, version) => c.pedir('POST', `${E}/equipamiento/items/${id(i)}/mantenimientos/${id(m)}/hecho`, ItemEquipoDetalleSchema, { cuerpo: { version } }),
  listaCompras: () => c.pedir('GET', `${E}/lista-compras`, z.array(ItemCompraSchema)),
  sumarListaCompras: (d) => c.pedir('POST', `${E}/lista-compras`, ItemCompraSchema, { cuerpo: d }),
  async sacarListaCompras(i) {
    await c.pedir('DELETE', `${E}/lista-compras/${id(i)}`, Nada);
  },
  sugerenciaCodigo: (codigo) => c.pedir('GET', `${E}/catalogo/codigos?codigo=${encodeURIComponent(codigo)}`, SugerenciaCodigoSchema),
  adjuntosTrabajo: (t) => c.pedir('GET', `${E}/trabajos/${id(t)}/adjuntos`, z.array(AdjuntoTrabajoSchema)),
  guardarAdjuntoTrabajo(t, datos, archivo, clave) {
    const f = new FormData();
    f.set('datos', parteJson(datos));
    f.set('archivo', archivo, datos.tipo === 'modelo_3d' ? 'modelo.glb' : 'informe.pdf');
    return c.pedir('POST', `${E}/trabajos/${id(t)}/adjuntos`, AdjuntoTrabajoSchema, { formulario: f, idempotencyKey: clave });
  },
});
