// Dominio equipamiento (contrato 0.11.0, fase H0.5, lote 2.4): tu equipamiento, la lista de compras, el nombre sugerido
// para un código de barras y lo que se guarda en un trabajo desde el Taller (modelo 3D, informe, plano).
import type { BajaEquipo, CambioItemEquipo, CategoriaEquipo, ItemCompra, ItemEquipo, ItemEquipoDetalle, MoverEquipo, NuevoItemCompra, NuevoItemEquipo, PrestarEquipo, ResultadoBajaEquipo, ResumenEquipamiento, SugerenciaCodigo, UbicacionEquipo } from '../../contracts/equipamiento.ts';
import type { AdjuntoTrabajo, TIPOS_ADJUNTO_TRABAJO } from '../../contracts/modo-trabajo.ts';
import type { ClaveIdempotencia, Pagina } from './tipos.ts';

export interface FiltroEquipo {
  categoria?: CategoriaEquipo;
  ubicacion?: UbicacionEquipo;
  prestados?: boolean;
  /** Busca en el nombre y la marca. */
  q?: string;
  cursor?: string;
}

export interface ApiEquipamiento {
  /** Por categoría y ubicación, con lo que hay que mantener o reponer (H0-Equipo). */
  equipamiento(): Promise<ResumenEquipamiento>;
  equipamientoItems(filtro?: FiltroEquipo): Promise<Pagina<ItemEquipo>>;
  /** Una herramienta con su historial (H0-EquipoDetalle). 404 si no es tuya. */
  equipamientoItem(id: string): Promise<ItemEquipoDetalle>;
  /** Sumar una herramienta. La foto ya viene achicada y sin metadatos (se arma en el teléfono). */
  agregarEquipamiento(datos: NuevoItemEquipo, foto: Blob | null, clave: ClaveIdempotencia): Promise<ItemEquipo>;
  corregirEquipamiento(id: string, cambio: CambioItemEquipo): Promise<ItemEquipoDetalle>;
  prestarEquipamiento(id: string, datos: PrestarEquipo): Promise<ItemEquipoDetalle>;
  devolverEquipamiento(id: string, version: number): Promise<ItemEquipoDetalle>;
  moverEquipamiento(id: string, datos: MoverEquipo): Promise<ItemEquipoDetalle>;
  /** «Ya no la tengo»: sale del equipamiento y queda en el historial. */
  bajaEquipamiento(id: string, datos: BajaEquipo): Promise<ResultadoBajaEquipo>;
  mantenimientoHecho(id: string, mantenimientoId: string, version: number): Promise<ItemEquipoDetalle>;
  listaCompras(): Promise<ItemCompra[]>;
  sumarListaCompras(datos: NuevoItemCompra): Promise<ItemCompra>;
  sacarListaCompras(id: string): Promise<void>;
  /** Nombre sugerido para un código leído en el teléfono (catálogo de Handyx, sin precios). */
  sugerenciaCodigo(codigo: string): Promise<SugerenciaCodigo>;
  /** Lo guardado en un trabajo desde el Taller (T-Modelo3D «Guardar en el trabajo», T-Informe). */
  adjuntosTrabajo(trabajoId: string): Promise<AdjuntoTrabajo[]>;
  guardarAdjuntoTrabajo(trabajoId: string, datos: { tipo: (typeof TIPOS_ADJUNTO_TRABAJO)[number]; nombre: string }, archivo: Blob, clave: ClaveIdempotencia): Promise<AdjuntoTrabajo>;
}
