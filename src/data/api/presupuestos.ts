// Dominio presupuestos y lista de precios (lote 2.2, contrato 0.11; pantallas H0-Presupuesto, H0-AgregarMaterial,
// H0-MaterialOpciones, H0-MaterialNuevo, H0-AgregarLista, H0-Precios, H0-PreciosFoto, H0-PreciosRevisar, H0-PrecioItem y
// H0-ManoObra). Rutas en docs/api/openapi.yaml (`/v1/especialista/presupuestos`, `/precios`, `/mano-de-obra`,
// `/catalogo/materiales`). Los precios los pone el especialista: Handyx solo sugiere. La foto de la lista del corralón se
// lee en el teléfono y nunca se manda: al servidor van solo las filas leídas.
import type { ConVersion } from '../../contracts/comun.ts';
import type { CategoriaPrecio } from '../../contracts/presupuestos.ts';
import type {
  AgregarManoObra,
  AgregarMateriales,
  CambioItemMaterial,
  CambioPrecio,
  CambioTarifaTarea,
  EnvioPresupuesto,
  GuardarTarifasBase,
  KitMateriales,
  LecturaLista,
  ManoDeObra,
  MaterialCatalogo,
  NuevaTarifaTarea,
  NuevoPresupuesto,
  NuevoPrecio,
  PrecioDetalle,
  PrecioMaterial,
  PreferenciasMaterial,
  Presupuesto,
  ResultadoLectura,
  RevisionLectura,
  TarifaTarea,
} from '../../contracts/presupuestos.ts';
import type { Rubro } from '../../contracts/rubros.ts';
import type { ClaveIdempotencia, Pagina } from './tipos.ts';

export interface FiltroPrecios {
  categoria?: CategoriaPrecio;
  /** Busca por nombre (hasta 80 letras). */
  q?: string;
  /** Solo los que tienen más días que su aviso (o que `DIAS_PRECIO_VIEJO`). */
  viejos?: boolean;
  cursor?: string;
}

export interface ApiPresupuestos {
  // ── Presupuestos ──
  presupuestos(estado?: 'abiertos' | 'todos', cursor?: string): Promise<Pagina<Presupuesto>>;
  crearPresupuesto(n: NuevoPresupuesto, clave: ClaveIdempotencia): Promise<Presupuesto>;
  /** Avisa con `actualizacionPendiente` si un precio que se actualiza cambió. */
  presupuesto(id: string): Promise<Presupuesto>;
  versionesPresupuesto(id: string): Promise<Presupuesto[]>;
  /** Uno o varios (un kit o de tu lista). Solo en borrador. */
  agregarMateriales(id: string, a: AgregarMateriales): Promise<Presupuesto>;
  cambiarMaterial(id: string, itemId: string, c: CambioItemMaterial): Promise<Presupuesto>;
  quitarMaterial(id: string, itemId: string): Promise<Presupuesto>;
  agregarManoObra(id: string, a: AgregarManoObra): Promise<Presupuesto>;
  quitarManoObra(id: string, itemId: string): Promise<Presupuesto>;
  /** Directo por el chat: llega como tarjeta. La versión anterior queda reemplazada. */
  enviarPresupuesto(id: string, e: EnvioPresupuesto, clave: ClaveIdempotencia): Promise<Presupuesto>;
  /** Borrador de otra versión de uno enviado, con los precios de hoy. */
  versionNuevaPresupuesto(id: string, v: ConVersion, clave: ClaveIdempotencia): Promise<Presupuesto>;
  /** Los de Handyx traen nombres, nunca precios. */
  kitsMateriales(rubro?: Rubro): Promise<KitMateriales[]>;
  preferenciasMaterial(): Promise<PreferenciasMaterial>;
  guardarPreferenciasMaterial(p: PreferenciasMaterial): Promise<PreferenciasMaterial>;

  // ── Lista de precios ──
  precios(f?: FiltroPrecios): Promise<Pagina<PrecioMaterial>>;
  /** A mano o un material nuevo: el NOMBRE se propone al catálogo de Handyx; el precio nunca sale de tu lista. */
  crearPrecio(n: NuevoPrecio, clave: ClaveIdempotencia): Promise<PrecioMaterial>;
  precio(id: string): Promise<PrecioDetalle>;
  cambiarPrecio(id: string, c: CambioPrecio): Promise<PrecioMaterial>;
  quitarPrecio(id: string): Promise<void>;
  /** Compara lo leído con tu lista. No guarda nada. */
  revisarLectura(l: LecturaLista): Promise<RevisionLectura>;
  guardarLectura(l: LecturaLista, clave: ClaveIdempotencia): Promise<ResultadoLectura>;

  // ── Mano de obra ──
  manoDeObra(): Promise<ManoDeObra>;
  guardarTarifasBase(g: GuardarTarifasBase): Promise<ManoDeObra>;
  crearTarifaTarea(n: NuevaTarifaTarea): Promise<TarifaTarea>;
  cambiarTarifaTarea(id: string, c: CambioTarifaTarea): Promise<TarifaTarea>;
  quitarTarifaTarea(id: string): Promise<void>;

  // ── Catálogo de nombres de Handyx (sin precios) ──
  buscarCatalogo(q: string, categoria?: CategoriaPrecio): Promise<MaterialCatalogo[]>;
}
