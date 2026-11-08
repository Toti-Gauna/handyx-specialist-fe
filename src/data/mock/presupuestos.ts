// Presupuestos, lista de precios, mano de obra y catálogo de nombres en el mock (lote 2.2, contrato 0.11). Emula las
// reglas del servidor que implementa el lote 2.5:
// - Una versión enviada no se edita: se arma otra (borrador) y al mandarla la anterior queda `reemplazado`.
// - Material con precio FIJO (se congela) o que SE ACTUALIZA con la lista: en un borrador sigue la lista; en uno enviado,
//   si la lista cambia, el ítem guarda `precioNuevo` y el presupuesto avisa (`actualizacionPendiente`).
// - Al cliente solo se le suma lo que se le cobra. Mandar el presupuesto deja un mensaje en el chat (directo, sin vista
//   previa) y, si el cliente acepta, el total del trabajo pasa a ser el del presupuesto.
// - La lectura de la lista llega como filas (la foto nunca sale del teléfono); revisarla no guarda nada.
// - El catálogo de Handyx tiene NOMBRES: un material nuevo propone su nombre (Operations lo revisa); el precio, nunca.
// Estado propio en un WeakMap atado al EstadoMock (sin tocar el estado común de la ola). Todo es de PRUEBA.
import { ConVersionSchema } from '../../contracts/comun.ts';
import { formatearPesos, monto, multiplicar, sumar, type Monto } from '../../contracts/dinero.ts';
import type { UNIDADES_MATERIAL } from '../../contracts/dto.ts';
import {
  AgregarManoObraSchema,
  AgregarMaterialesSchema,
  CambioItemMaterialSchema,
  CambioPrecioSchema,
  CambioTarifaTareaSchema,
  DIAS_PRECIO_VIEJO,
  EnvioPresupuestoSchema,
  GuardarTarifasBaseSchema,
  LecturaListaSchema,
  NuevaTarifaTareaSchema,
  NuevoPrecioSchema,
  NuevoPresupuestoSchema,
  PreferenciasMaterialSchema,
  type CategoriaPrecio,
  type ItemMaterial,
  type KitMateriales,
  type LecturaLista,
  type ManoDeObra,
  type MaterialCatalogo,
  type PrecioDetalle,
  type PrecioMaterial,
  type PreferenciasMaterial,
  type Presupuesto,
  type ResultadoLectura,
  type RevisionLectura,
  type TarifaTarea,
} from '../../contracts/presupuestos.ts';
import type { Rubro } from '../../contracts/rubros.ts';
import { diaLocal } from '../../lib/formato.ts';
import type { FiltroPrecios } from '../api/presupuestos.ts';
import type { Pagina } from '../api/tipos.ts';
import { ahoraMs, fallo, idempotente, idFijo, idNuevo, iso, type EstadoMock } from './estado.ts';
import { ID_NUCLEO } from './nucleo.ts';
import { agregarMensaje, asegurarConversacion } from './propuestas.ts';
import { zodAFallo } from './validacion.ts';

type Unidad = (typeof UNIDADES_MATERIAL)[number];
const DIA = 86_400_000;
const PROVEEDOR_PRUEBA = 'Corralón Simulación';

interface PrecioInterno {
  pub: Omit<PrecioMaterial, 'viejo'>;
  historial: PrecioDetalle['historial'];
}

interface ExtraPresupuestos {
  precios: PrecioInterno[];
  presupuestos: Presupuesto[];
  preferencias: PreferenciasMaterial;
  mano: ManoDeObra;
  kits: KitMateriales[];
  catalogo: MaterialCatalogo[];
  /** Nombres propuestos al catálogo: Operations los revisa antes de que los vean otros (nunca con precio). */
  propuestosCatalogo: string[];
}

// ── Ids sembrados (rango 0x22xxxx, propio del lote) ───────────────────────────────────────────────

const pid = (n: number) => idFijo(0x220000 + n);
export const ID_PRESUPUESTOS = {
  /** «Pierde la canilla» de Lucía Ferreyra: la versión 1 la vio y la 2 está en borrador (H0-Presupuesto). */
  v1: pid(0x101),
  v2: pid(0x102),
  cartucho: pid(0x001),
  cartuchoLargo: pid(0x002),
  flexible: pid(0x003),
  sellador: pid(0x004),
  llavePaso: pid(0x005),
  teflon: pid(0x006),
  codo: pid(0x007),
  tareaCartucho: pid(0x201),
  tareaPrueba: pid(0x202),
  kitGriferia: pid(0x301),
} as const;
export const TRABAJO_PRESUPUESTO = ID_NUCLEO.canilla;

const normalizar = (t: string) =>
  t
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();

const pesos = (n: number): Monto => monto(n * 100);
const hoy = (s: EstadoMock) => diaLocal(iso(ahoraMs(s)));
const diasDesde = (s: EstadoMock, fecha: string) => Math.floor((Date.parse(`${hoy(s)}T12:00:00Z`) - Date.parse(`${fecha}T12:00:00Z`)) / DIA);

// ── Semilla ───────────────────────────────────────────────────────────────────────────────────────

function sembrar(s: EstadoMock): ExtraPresupuestos {
  let n = 0x020;
  const precio = (
    id: string | null,
    nombre: string,
    categoria: CategoriaPrecio,
    costo: number,
    actualizadoEn: string,
    o: { unidad?: Unidad; modo?: 'fijo' | 'actualiza'; historial?: Array<[string, number]>; proveedor?: string | null } = {},
  ): PrecioInterno => ({
    pub: {
      id: id ?? pid(n++),
      catalogoId: null,
      nombre,
      categoria,
      unidad: o.unidad ?? 'unidad',
      costo: pesos(costo),
      precioCliente: pesos(costo),
      proveedor: o.proveedor === undefined ? PROVEEDOR_PRUEBA : o.proveedor,
      fuente: 'foto_lista',
      modoPrecio: o.modo ?? 'actualiza',
      actualizadoEn,
      avisarSiViejoDias: DIAS_PRECIO_VIEJO,
      version: 1,
    },
    historial: (o.historial ?? [[actualizadoEn, costo]]).map(([fecha, c]) => ({ fecha, costo: pesos(c) })),
  });
  const I = ID_PRESUPUESTOS;
  const precios = [
    precio(I.cartucho, 'Cartucho cerámico 35 mm', 'plomeria', 9_800, '2026-11-05', {
      historial: [
        ['2026-08-04', 8_400],
        ['2026-09-07', 8_900],
        ['2026-10-06', 9_100],
        ['2026-11-05', 9_800],
      ],
    }),
    precio(I.cartuchoLargo, 'Cartucho cerámico 35 mm largo', 'plomeria', 11_200, '2026-11-05'),
    precio(I.flexible, 'Flexible 40 cm', 'plomeria', 1_600, '2026-11-05', { modo: 'fijo' }),
    precio(I.sellador, 'Sellador de roscas', 'plomeria', 3_100, '2026-10-02'),
    precio(I.llavePaso, 'Llave de paso 1/2"', 'plomeria', 6_900, '2026-10-20'),
    precio(I.teflon, 'Teflón 12 mm', 'plomeria', 2_300, '2026-10-20'),
    precio(I.codo, 'Codo 20 mm', 'plomeria', 950, '2026-10-20'),
    precio(null, 'Sifón de PVC', 'plomeria', 4_500, '2026-10-28'),
    precio(null, 'Canilla monocomando de cocina', 'plomeria', 58_000, '2026-11-01', { modo: 'fijo' }),
    precio(null, 'Llave de paso para gas 1/2"', 'gas', 14_500, '2026-10-15'),
    precio(null, 'Flexible para gas 40 cm', 'gas', 6_200, '2026-09-30'),
    precio(null, 'Cable unipolar 2,5 mm', 'electricidad', 650, '2026-11-03', { unidad: 'metro' }),
    precio(null, 'Térmica bipolar 20 A', 'electricidad', 18_900, '2026-11-03'),
    precio(null, 'Disyuntor 40 A 30 mA', 'electricidad', 52_000, '2026-10-10'),
    precio(null, 'Silicona transparente', 'otra', 5_200, '2026-10-25', { proveedor: null }),
  ];

  const tarea = (id: string | null, rubro: Rubro, nombre: string, detalle: string | null, m: number): TarifaTarea => ({ id: id ?? pid(n++), rubro, nombre, detalle, monto: pesos(m), version: 1 });
  const mano: ManoDeObra = {
    hora: pesos(22_000),
    visita: pesos(12_000),
    urgenciaBps: 3_000,
    tareas: [
      tarea(I.tareaCartucho, 'plomeria', 'Cambio de cartucho', 'Incluye prueba', 28_000),
      tarea(I.tareaPrueba, 'plomeria', 'Prueba de pérdidas', 'Hasta 1 hora', 6_000),
      tarea(null, 'plomeria', 'Cambio de flexible', 'Por unidad', 9_000),
      tarea(null, 'plomeria', 'Destapación', 'Sin máquina', 25_000),
      tarea(null, 'electricidad', 'Cambio de térmica', 'Por unidad', 20_000),
      tarea(null, 'electricidad', 'Colocar un tomacorriente', 'Con la caja ya puesta', 15_000),
      tarea(null, 'gas', 'Prueba de hermeticidad', 'Con manómetro', 30_000),
    ],
    version: 1,
  };

  const cat = (nombre: string, categoria: CategoriaPrecio, unidad: Unidad = 'unidad'): MaterialCatalogo => ({ id: pid(n++), nombre, categoria, unidad });
  const catalogo = [
    ...precios.map((p) => cat(p.pub.nombre, p.pub.categoria, p.pub.unidad)),
    cat('Termofusión 20 mm (tira)', 'plomeria'),
    cat('Cupla termofusión 20 mm', 'plomeria'),
    cat('Válvula esférica 3/4"', 'plomeria'),
    cat('Tapón 1/2"', 'plomeria'),
    cat('Cinta aisladora', 'electricidad', 'rollo'),
    cat('Tomacorriente doble', 'electricidad'),
    cat('Caja de luz rectangular', 'electricidad'),
  ];
  for (const p of precios) p.pub.catalogoId = catalogo.find((c) => c.nombre === p.pub.nombre)?.id ?? null;

  const kits: KitMateriales[] = [
    {
      id: I.kitGriferia,
      nombre: 'Cambio de grifería',
      rubro: 'plomeria',
      origen: 'handyx',
      items: [
        { nombre: 'Cartucho cerámico 35 mm', cantidad: 1 },
        { nombre: 'Flexible 40 cm', cantidad: 2 },
        { nombre: 'Llave de paso 1/2"', cantidad: 1 },
        { nombre: 'Sellador de roscas', cantidad: 1 },
      ].map((x) => ({ catalogoId: catalogo.find((c) => c.nombre === x.nombre)?.id ?? null, nombre: x.nombre, unidad: 'unidad' as const, cantidad: x.cantidad, precioId: null })),
    },
    {
      id: pid(0x302),
      nombre: 'Cambio de térmica',
      rubro: 'electricidad',
      origen: 'handyx',
      items: [
        { nombre: 'Térmica bipolar 20 A', cantidad: 1, unidad: 'unidad' as const },
        { nombre: 'Cable unipolar 2,5 mm', cantidad: 3, unidad: 'metro' as const },
      ].map((x) => ({ catalogoId: catalogo.find((c) => c.nombre === x.nombre)?.id ?? null, nombre: x.nombre, unidad: x.unidad, cantidad: x.cantidad, precioId: null })),
    },
  ];

  const e: ExtraPresupuestos = {
    precios,
    presupuestos: [],
    preferencias: { cobrarAlCliente: true, registrarGasto: true, modoPrecio: 'actualiza', version: 1 },
    mano,
    kits,
    catalogo,
    propuestosCatalogo: [],
  };

  // El presupuesto de Lucía Ferreyra (solo si el trabajo de hoy existe en este escenario).
  if (s.trabajos.some((t) => t.trabajo.id === TRABAJO_PRESUPUESTO)) {
    const ahora = ahoraMs(s);
    const base = (id: string, numeroVersion: number): Presupuesto => ({
      id,
      pedidoId: null,
      trabajoId: TRABAJO_PRESUPUESTO,
      obraId: null,
      titulo: 'Pierde la canilla',
      numeroVersion,
      reemplazaA: null,
      estado: 'borrador',
      manoDeObra: [
        { id: pid(0x111 + numeroVersion * 0x10), tarifaId: I.tareaCartucho, descripcion: 'Cambio de cartucho', cantidad: 1, precioUnitario: pesos(28_000), subtotal: pesos(28_000) },
        { id: pid(0x112 + numeroVersion * 0x10), tarifaId: I.tareaPrueba, descripcion: 'Prueba de pérdidas', cantidad: 1, precioUnitario: pesos(6_000), subtotal: pesos(6_000) },
      ],
      materiales: [],
      totales: { manoDeObra: pesos(0), materiales: pesos(0), total: pesos(0) },
      actualizacionPendiente: false,
      vigenteHasta: null,
      enviadoEn: null,
      vistoEn: null,
      respondidoEn: null,
      mensajeId: null,
      version: 1,
    });
    const item = (id: string, precioId: string, nombre: string, cantidad: number, unit: number, modo: 'fijo' | 'actualiza', precioDel: string): ItemMaterial => ({
      id,
      precioId,
      nombre,
      unidad: 'unidad',
      cantidad,
      precioUnitario: pesos(unit),
      subtotal: multiplicar(pesos(unit), cantidad),
      modoPrecio: modo,
      precioDel,
      cobrarAlCliente: true,
      registrarGasto: true,
      precioNuevo: null,
    });
    const v1 = base(I.v1, 1);
    v1.estado = 'visto';
    v1.enviadoEn = iso(ahora - 26 * 3_600_000);
    v1.vistoEn = iso(ahora - 25 * 3_600_000);
    v1.materiales = [item(pid(0x1a1), I.cartucho, 'Cartucho cerámico 35 mm', 1, 9_100, 'fijo', '2026-10-06'), item(pid(0x1a2), I.flexible, 'Flexible 40 cm', 2, 1_600, 'fijo', '2026-11-05')];
    const v2 = base(I.v2, 2);
    v2.reemplazaA = v1.id;
    v2.materiales = [item(pid(0x1b1), I.cartucho, 'Cartucho cerámico 35 mm', 1, 9_800, 'actualiza', '2026-11-05'), item(pid(0x1b2), I.flexible, 'Flexible 40 cm', 2, 1_600, 'fijo', hoy(s))];
    e.presupuestos.push(v1, v2);
  }
  for (const p of e.presupuestos) recalcular(e, p);
  return e;
}

const extras = new WeakMap<EstadoMock, ExtraPresupuestos>();
export function extraPresupuestos(s: EstadoMock): ExtraPresupuestos {
  let e = extras.get(s);
  if (!e) {
    e = sembrar(s);
    extras.set(s, e);
  }
  return e;
}

// ── Reglas ────────────────────────────────────────────────────────────────────────────────────────

const ABIERTOS = new Set<Presupuesto['estado']>(['borrador', 'enviado', 'visto']);

function precioPub(s: EstadoMock, p: PrecioInterno): PrecioMaterial {
  const limite = p.pub.avisarSiViejoDias ?? DIAS_PRECIO_VIEJO;
  return { ...p.pub, viejo: diasDesde(s, p.pub.actualizadoEn) > limite };
}

/** Subtotales, totales (solo lo que se cobra) y precios que siguen la lista. */
function recalcular(e: ExtraPresupuestos, p: Presupuesto): void {
  for (const m of p.materiales) {
    const lista = m.precioId ? e.precios.find((x) => x.pub.id === m.precioId) : undefined;
    if (m.modoPrecio === 'actualiza' && lista) {
      if (p.estado === 'borrador') {
        m.precioUnitario = lista.pub.precioCliente;
        m.precioDel = lista.pub.actualizadoEn;
        m.precioNuevo = null;
      } else if (ABIERTOS.has(p.estado)) {
        m.precioNuevo = lista.pub.precioCliente.centavos === m.precioUnitario.centavos ? null : lista.pub.precioCliente;
      }
    } else if (p.estado === 'borrador') m.precioNuevo = null;
    m.subtotal = multiplicar(m.precioUnitario, m.cantidad);
  }
  for (const t of p.manoDeObra) t.subtotal = multiplicar(t.precioUnitario, t.cantidad);
  const manoDeObra = p.manoDeObra.reduce((a, t) => sumar(a, t.subtotal), monto(0));
  const materiales = p.materiales.filter((m) => m.cobrarAlCliente).reduce((a, m) => sumar(a, m.subtotal), monto(0));
  p.totales = { manoDeObra, materiales, total: sumar(manoDeObra, materiales) };
  p.actualizacionPendiente = p.estado !== 'borrador' && ABIERTOS.has(p.estado) && p.materiales.some((m) => m.precioNuevo !== null);
}

const recalcularTodos = (e: ExtraPresupuestos) => e.presupuestos.forEach((p) => recalcular(e, p));

function buscar(e: ExtraPresupuestos, id: string): Presupuesto {
  const p = e.presupuestos.find((x) => x.id === id);
  if (!p) throw fallo('no_encontrado', 404, 'no_encontrado', 'No encontramos ese presupuesto.');
  return p;
}

function editable(p: Presupuesto, version?: number): void {
  if (p.estado !== 'borrador') throw fallo('conflicto', 409, 'transicion_invalida', 'Este presupuesto ya se mandó: armá una versión nueva para cambiarlo.');
  if (version !== undefined && version !== p.version) throw fallo('conflicto', 409, 'conflicto_version', 'El presupuesto cambió desde otra pantalla. Volvé a cargarlo.');
}

function precioDe(e: ExtraPresupuestos, id: string): PrecioInterno {
  const p = e.precios.find((x) => x.pub.id === id);
  if (!p) throw fallo('no_encontrado', 404, 'no_encontrado', 'No encontramos ese precio en tu lista.');
  return p;
}

const porNombre = (e: ExtraPresupuestos, nombre: string) => e.precios.find((p) => normalizar(p.pub.nombre) === normalizar(nombre));

/** Chat del cliente al que va el presupuesto. */
function chatDe(s: EstadoMock, p: Presupuesto): string | null {
  const trabajoId = p.trabajoId ?? p.obraId;
  if (trabajoId) return s.trabajos.find((t) => t.trabajo.id === trabajoId)?.trabajo.conversacionId ?? null;
  const ped = s.pedidos.find((x) => x.pub.id === p.pedidoId);
  return ped ? asegurarConversacion(s, ped) : null;
}

function nuevoPrecio(s: EstadoMock, e: ExtraPresupuestos, d: { nombre: string; categoria: CategoriaPrecio; unidad: Unidad; costo: Monto; precioCliente: Monto | null; proveedor: string | null; modoPrecio: 'fijo' | 'actualiza'; catalogoId: string | null; fuente: PrecioMaterial['fuente'] }): PrecioInterno {
  const dia = hoy(s);
  const p: PrecioInterno = {
    pub: {
      id: idNuevo(s),
      catalogoId: d.catalogoId,
      nombre: d.nombre,
      categoria: d.categoria,
      unidad: d.unidad,
      costo: d.costo,
      precioCliente: d.precioCliente ?? d.costo,
      proveedor: d.proveedor,
      fuente: d.fuente,
      modoPrecio: d.modoPrecio,
      actualizadoEn: dia,
      avisarSiViejoDias: DIAS_PRECIO_VIEJO,
      version: 1,
    },
    historial: [{ fecha: dia, costo: d.costo }],
  };
  e.precios.push(p);
  return p;
}

/** Cambia el costo de un precio: guarda el historial y mantiene el margen que tenía (en pesos). */
function moverCosto(s: EstadoMock, p: PrecioInterno, costo: Monto, fuente: PrecioMaterial['fuente'], proveedor?: string | null): void {
  const margen = p.pub.precioCliente.centavos - p.pub.costo.centavos;
  const dia = hoy(s);
  p.pub.costo = costo;
  p.pub.precioCliente = monto(Math.max(0, costo.centavos + margen));
  p.pub.actualizadoEn = dia;
  p.pub.fuente = fuente;
  if (proveedor !== undefined) p.pub.proveedor = proveedor;
  p.pub.version += 1;
  const ultimo = p.historial.at(-1);
  if (ultimo?.fecha === dia) ultimo.costo = costo;
  else p.historial.push({ fecha: dia, costo });
  if (p.historial.length > 24) p.historial.splice(0, p.historial.length - 24);
}

function variacionBps(anterior: Monto, nuevo: Monto): number {
  if (anterior.centavos === 0) return 0;
  return Math.round(((nuevo.centavos - anterior.centavos) * 10_000) / anterior.centavos);
}

function comparar(e: ExtraPresupuestos, l: LecturaLista): RevisionLectura {
  const afectados = new Set<string>();
  const filas = l.filas.map((f) => {
    const mio = f.precioId ? e.precios.find((p) => p.pub.id === f.precioId) : porNombre(e, f.nombre);
    if (!mio) return { nombre: f.nombre, resultado: 'nuevo' as const, precioId: null, anterior: null, nuevo: f.costo, variacionBps: null };
    const v = variacionBps(mio.pub.costo, f.costo);
    // Una diferencia de más de la mitad suele ser un número mal leído: se pide revisarla.
    const resultado = Math.abs(v) > 5_000 ? ('revisar' as const) : v > 0 ? ('sube' as const) : v < 0 ? ('baja' as const) : ('igual' as const);
    if (v !== 0) for (const p of e.presupuestos) if (p.estado !== 'borrador' && ABIERTOS.has(p.estado) && p.materiales.some((m) => m.precioId === mio.pub.id && m.modoPrecio === 'actualiza')) afectados.add(p.id);
    return { nombre: mio.pub.nombre, resultado, precioId: mio.pub.id, anterior: mio.pub.costo, nuevo: f.costo, variacionBps: v };
  });
  return { filas, presupuestosAfectados: afectados.size };
}

// ── Métodos del puerto ────────────────────────────────────────────────────────────────────────────

export const presupuestos = (s: EstadoMock) => {
  const e = () => extraPresupuestos(s);
  const conVersion = (p: Presupuesto) => {
    p.version += 1;
    recalcular(e(), p);
    return p;
  };
  return {
    presupuestos(estado: 'abiertos' | 'todos' = 'abiertos'): Pagina<Presupuesto> {
      const x = e();
      recalcularTodos(x);
      const items = x.presupuestos.filter((p) => estado === 'todos' || ABIERTOS.has(p.estado)).sort((a, b) => b.numeroVersion - a.numeroVersion);
      return { items, siguienteCursor: null };
    },
    crearPresupuesto(datos: unknown, clave: string): Presupuesto {
      return idempotente(s, `presupuesto:${clave}`, () => {
        const ok = NuevoPresupuestoSchema.safeParse(datos);
        if (!ok.success) throw zodAFallo(ok.error);
        const d = ok.data;
        const trabajoId = d.trabajoId ?? d.obraId;
        if (trabajoId && !s.trabajos.some((t) => t.trabajo.id === trabajoId)) throw fallo('no_encontrado', 404, 'no_encontrado', 'No encontramos ese trabajo.');
        if (d.pedidoId && !s.pedidos.some((p) => p.pub.id === d.pedidoId)) throw fallo('no_encontrado', 404, 'no_encontrado', 'No encontramos ese pedido.');
        const p: Presupuesto = {
          id: idNuevo(s),
          pedidoId: d.pedidoId,
          trabajoId: d.trabajoId,
          obraId: d.obraId,
          titulo: d.titulo,
          numeroVersion: 1,
          reemplazaA: null,
          estado: 'borrador',
          manoDeObra: [],
          materiales: [],
          totales: { manoDeObra: monto(0), materiales: monto(0), total: monto(0) },
          actualizacionPendiente: false,
          vigenteHasta: null,
          enviadoEn: null,
          vistoEn: null,
          respondidoEn: null,
          mensajeId: null,
          version: 1,
        };
        e().presupuestos.push(p);
        return p;
      });
    },
    presupuesto(id: string): Presupuesto {
      const p = buscar(e(), id);
      recalcular(e(), p);
      return p;
    },
    versionesPresupuesto(id: string): Presupuesto[] {
      const x = e();
      const p = buscar(x, id);
      const cadena: Presupuesto[] = [];
      // Para atrás desde este y para adelante (las versiones que lo reemplazan), la más nueva primero.
      let atras: Presupuesto | undefined = p;
      while (atras) {
        cadena.push(atras);
        const r: string | null = atras.reemplazaA;
        atras = r ? x.presupuestos.find((v) => v.id === r) : undefined;
      }
      let adelante = x.presupuestos.find((v) => v.reemplazaA === p.id);
      while (adelante) {
        cadena.unshift(adelante);
        const desde: string = adelante.id;
        adelante = x.presupuestos.find((v) => v.reemplazaA === desde);
      }
      return cadena;
    },
    agregarMateriales(id: string, datos: unknown): Presupuesto {
      const ok = AgregarMaterialesSchema.safeParse(datos);
      if (!ok.success) throw zodAFallo(ok.error);
      const x = e();
      const p = buscar(x, id);
      editable(p, ok.data.version);
      for (const m of ok.data.materiales) {
        const lista = m.precioId ? precioDe(x, m.precioId) : null;
        const unit = lista ? lista.pub.precioCliente : (m.precioUnitario ?? monto(0));
        const existente = lista ? p.materiales.find((i) => i.precioId === lista.pub.id && i.modoPrecio === m.modoPrecio && i.cobrarAlCliente === m.cobrarAlCliente) : undefined;
        if (existente) {
          // El mismo material otra vez suma cantidad (no repite la fila).
          existente.cantidad = Math.round((existente.cantidad + m.cantidad) * 1000) / 1000;
          continue;
        }
        p.materiales.push({
          id: idNuevo(s),
          precioId: lista?.pub.id ?? null,
          nombre: lista?.pub.nombre ?? m.nombre ?? '',
          unidad: lista?.pub.unidad ?? m.unidad ?? 'unidad',
          cantidad: m.cantidad,
          precioUnitario: unit,
          subtotal: multiplicar(unit, m.cantidad),
          modoPrecio: lista ? m.modoPrecio : 'fijo',
          precioDel: m.modoPrecio === 'actualiza' && lista ? lista.pub.actualizadoEn : hoy(s),
          cobrarAlCliente: m.cobrarAlCliente,
          registrarGasto: m.registrarGasto,
          precioNuevo: null,
        });
      }
      return conVersion(p);
    },
    cambiarMaterial(id: string, itemId: string, datos: unknown): Presupuesto {
      const ok = CambioItemMaterialSchema.safeParse(datos);
      if (!ok.success) throw zodAFallo(ok.error);
      const x = e();
      const p = buscar(x, id);
      editable(p, ok.data.version);
      const m = p.materiales.find((i) => i.id === itemId);
      if (!m) throw fallo('no_encontrado', 404, 'no_encontrado', 'Ese material ya no está en el presupuesto.');
      const c = ok.data;
      if (c.cantidad !== undefined) m.cantidad = c.cantidad;
      if (c.cobrarAlCliente !== undefined) m.cobrarAlCliente = c.cobrarAlCliente;
      if (c.registrarGasto !== undefined) m.registrarGasto = c.registrarGasto;
      if (c.modoPrecio !== undefined && c.modoPrecio !== m.modoPrecio) {
        if (c.modoPrecio === 'actualiza' && !m.precioId) throw fallo('validacion', 400, 'validacion', 'Solo se actualiza un material de tu lista de precios.');
        m.modoPrecio = c.modoPrecio;
        if (c.modoPrecio === 'fijo') m.precioDel = hoy(s);
      }
      return conVersion(p);
    },
    quitarMaterial(id: string, itemId: string): Presupuesto {
      const p = buscar(e(), id);
      editable(p);
      p.materiales = p.materiales.filter((i) => i.id !== itemId);
      return conVersion(p);
    },
    agregarManoObra(id: string, datos: unknown): Presupuesto {
      const ok = AgregarManoObraSchema.safeParse(datos);
      if (!ok.success) throw zodAFallo(ok.error);
      const x = e();
      const p = buscar(x, id);
      editable(p, ok.data.version);
      const tarifa = ok.data.tarifaId ? x.mano.tareas.find((t) => t.id === ok.data.tarifaId) : null;
      if (ok.data.tarifaId && !tarifa) throw fallo('no_encontrado', 404, 'no_encontrado', 'No encontramos esa tarifa.');
      const unit = tarifa?.monto ?? ok.data.precioUnitario ?? monto(0);
      p.manoDeObra.push({ id: idNuevo(s), tarifaId: tarifa?.id ?? null, descripcion: tarifa?.nombre ?? ok.data.descripcion ?? '', cantidad: ok.data.cantidad, precioUnitario: unit, subtotal: multiplicar(unit, ok.data.cantidad) });
      return conVersion(p);
    },
    quitarManoObra(id: string, itemId: string): Presupuesto {
      const p = buscar(e(), id);
      editable(p);
      p.manoDeObra = p.manoDeObra.filter((i) => i.id !== itemId);
      return conVersion(p);
    },
    enviarPresupuesto(id: string, datos: unknown, clave: string): Presupuesto {
      return idempotente(s, `presupuesto-envio:${clave}`, () => {
        const ok = EnvioPresupuestoSchema.safeParse(datos);
        if (!ok.success) throw zodAFallo(ok.error);
        const x = e();
        const p = buscar(x, id);
        editable(p, ok.data.version);
        if (p.manoDeObra.length + p.materiales.length === 0) throw fallo('validacion', 400, 'validacion', 'Agregá al menos una tarea o un material.');
        const chat = chatDe(s, p);
        if (!chat) throw fallo('conflicto', 409, 'transicion_invalida', 'No hay un chat con el cliente para mandarlo.');
        recalcular(x, p);
        const items = p.manoDeObra.length + p.materiales.filter((m) => m.cobrarAlCliente).length;
        agregarMensaje(s, chat, { autorRol: 'especialista', tipo: 'texto', texto: `Presupuesto «${p.titulo}» · versión ${p.numeroVersion} · ${items} ${items === 1 ? 'ítem' : 'ítems'} · ${formatearPesos(p.totales.total)}` });
        p.mensajeId = s.mensajes[chat]?.at(-1)?.id ?? null;
        p.estado = 'enviado';
        p.enviadoEn = iso(ahoraMs(s));
        p.vigenteHasta = ok.data.vigenteHasta;
        if (p.reemplazaA) {
          const anterior = x.presupuestos.find((v) => v.id === p.reemplazaA);
          if (anterior && ABIERTOS.has(anterior.estado)) {
            anterior.estado = 'reemplazado';
            anterior.version += 1;
            recalcular(x, anterior);
          }
        }
        return conVersion(p);
      });
    },
    versionNuevaPresupuesto(id: string, datos: unknown, clave: string): Presupuesto {
      return idempotente(s, `presupuesto-version:${clave}`, () => {
        const ok = ConVersionSchema.safeParse(datos);
        if (!ok.success) throw zodAFallo(ok.error);
        const x = e();
        const p = buscar(x, id);
        if (p.version !== ok.data.version) throw fallo('conflicto', 409, 'conflicto_version', 'El presupuesto cambió. Volvé a cargarlo.');
        if (!['enviado', 'visto'].includes(p.estado)) throw fallo('conflicto', 409, 'transicion_invalida', 'Solo se arma otra versión de un presupuesto enviado que el cliente no respondió.');
        const ya = x.presupuestos.find((v) => v.reemplazaA === p.id && v.estado === 'borrador');
        if (ya) return ya;
        const nueva: Presupuesto = structuredClone(p);
        nueva.id = idNuevo(s);
        nueva.numeroVersion = p.numeroVersion + 1;
        nueva.reemplazaA = p.id;
        nueva.estado = 'borrador';
        nueva.enviadoEn = null;
        nueva.vistoEn = null;
        nueva.respondidoEn = null;
        nueva.mensajeId = null;
        nueva.vigenteHasta = null;
        nueva.version = 1;
        for (const m of nueva.materiales) m.id = idNuevo(s);
        for (const t of nueva.manoDeObra) t.id = idNuevo(s);
        recalcular(x, nueva); // los que se actualizan toman el precio de hoy
        x.presupuestos.push(nueva);
        return nueva;
      });
    },
    kitsMateriales(rubro?: Rubro): KitMateriales[] {
      const x = e();
      return x.kits
        .filter((k) => !rubro || k.rubro === rubro)
        .map((k) => ({ ...k, items: k.items.map((i) => ({ ...i, precioId: porNombre(x, i.nombre)?.pub.id ?? null })) }));
    },
    preferenciasMaterial: (): PreferenciasMaterial => e().preferencias,
    guardarPreferenciasMaterial(datos: unknown): PreferenciasMaterial {
      const ok = PreferenciasMaterialSchema.safeParse(datos);
      if (!ok.success) throw zodAFallo(ok.error);
      const x = e();
      if (ok.data.version !== x.preferencias.version) throw fallo('conflicto', 409, 'conflicto_version', 'Tus opciones cambiaron desde otra pantalla.');
      x.preferencias = { ...ok.data, version: ok.data.version + 1 };
      return x.preferencias;
    },

    // ── Lista de precios ──
    precios(f: FiltroPrecios = {}): Pagina<PrecioMaterial> {
      if (f.q !== undefined && f.q.length > 80) throw fallo('validacion', 400, 'validacion', 'Buscá con menos letras.');
      // Busca palabra por palabra: «cartucho 35» encuentra «Cartucho cerámico 35 mm».
      const palabras = normalizar(f.q ?? '').split(' ').filter(Boolean);
      const items = e()
        .precios.map((p) => precioPub(s, p))
        .filter((p) => (!f.categoria || p.categoria === f.categoria) && palabras.every((w) => normalizar(p.nombre).includes(w)) && (!f.viejos || p.viejo))
        .sort((a, b) => a.categoria.localeCompare(b.categoria) || a.nombre.localeCompare(b.nombre, 'es'));
      return { items, siguienteCursor: null };
    },
    crearPrecio(datos: unknown, clave: string): PrecioMaterial {
      return idempotente(s, `precio:${clave}`, () => {
        const ok = NuevoPrecioSchema.safeParse(datos);
        if (!ok.success) throw zodAFallo(ok.error);
        const x = e();
        const d = ok.data;
        if (porNombre(x, d.nombre)) throw fallo('conflicto', 409, 'transicion_invalida', 'Ese material ya está en tu lista: cambiale el precio desde ahí.');
        const enCatalogo = d.catalogoId ? x.catalogo.find((c) => c.id === d.catalogoId) : x.catalogo.find((c) => normalizar(c.nombre) === normalizar(d.nombre));
        // Solo el NOMBRE se propone al catálogo (lo revisa Operations antes de que lo vean otros); el precio nunca.
        if (d.sumarAlCatalogo && !enCatalogo && !x.propuestosCatalogo.some((n) => normalizar(n) === normalizar(d.nombre))) x.propuestosCatalogo.push(d.nombre);
        const p = nuevoPrecio(s, x, { ...d, catalogoId: enCatalogo?.id ?? null, fuente: d.sumarAlCatalogo ? 'material_nuevo' : 'a_mano' });
        return precioPub(s, p);
      });
    },
    precio(id: string): PrecioDetalle {
      const p = precioDe(e(), id);
      return { ...precioPub(s, p), historial: p.historial };
    },
    cambiarPrecio(id: string, datos: unknown): PrecioMaterial {
      const ok = CambioPrecioSchema.safeParse(datos);
      if (!ok.success) throw zodAFallo(ok.error);
      const x = e();
      const p = precioDe(x, id);
      const c = ok.data;
      if (c.version !== p.pub.version) throw fallo('conflicto', 409, 'conflicto_version', 'Ese precio cambió desde otra pantalla. Volvé a cargarlo.');
      if (c.costo && c.costo.centavos !== p.pub.costo.centavos) moverCosto(s, p, c.costo, 'a_mano', c.proveedor);
      else {
        if (c.proveedor !== undefined) p.pub.proveedor = c.proveedor;
        p.pub.version += 1;
      }
      if (c.precioCliente) p.pub.precioCliente = c.precioCliente;
      if (c.modoPrecio) p.pub.modoPrecio = c.modoPrecio;
      if (c.avisarSiViejoDias !== undefined) p.pub.avisarSiViejoDias = c.avisarSiViejoDias;
      recalcularTodos(x);
      return precioPub(s, p);
    },
    quitarPrecio(id: string): void {
      const x = e();
      x.precios = x.precios.filter((p) => p.pub.id !== id);
    },
    revisarLectura(datos: unknown): RevisionLectura {
      const ok = LecturaListaSchema.safeParse(datos);
      if (!ok.success) throw zodAFallo(ok.error);
      return comparar(e(), ok.data);
    },
    guardarLectura(datos: unknown, clave: string): ResultadoLectura {
      return idempotente(s, `lectura:${clave}`, () => {
        const ok = LecturaListaSchema.safeParse(datos);
        if (!ok.success) throw zodAFallo(ok.error);
        const x = e();
        const r: ResultadoLectura = { creados: 0, actualizados: 0, sinCambios: 0 };
        for (const f of ok.data.filas) {
          const mio = f.precioId ? x.precios.find((p) => p.pub.id === f.precioId) : porNombre(x, f.nombre);
          if (!mio) {
            const cat = x.catalogo.find((c) => normalizar(c.nombre) === normalizar(f.nombre));
            nuevoPrecio(s, x, { nombre: f.nombre, categoria: cat?.categoria ?? 'otra', unidad: f.unidad, costo: f.costo, precioCliente: null, proveedor: ok.data.proveedor, modoPrecio: x.preferencias.modoPrecio, catalogoId: cat?.id ?? null, fuente: 'foto_lista' });
            r.creados += 1;
          } else if (mio.pub.costo.centavos !== f.costo.centavos) {
            moverCosto(s, mio, f.costo, 'foto_lista', ok.data.proveedor);
            r.actualizados += 1;
          } else {
            // Mismo precio: queda confirmado hoy (deja de estar viejo).
            mio.pub.actualizadoEn = hoy(s);
            mio.pub.version += 1;
            r.sinCambios += 1;
          }
        }
        recalcularTodos(x);
        return r;
      });
    },

    // ── Mano de obra ──
    manoDeObra: (): ManoDeObra => e().mano,
    guardarTarifasBase(datos: unknown): ManoDeObra {
      const ok = GuardarTarifasBaseSchema.safeParse(datos);
      if (!ok.success) throw zodAFallo(ok.error);
      const x = e();
      if (ok.data.version !== x.mano.version) throw fallo('conflicto', 409, 'conflicto_version', 'Tus tarifas cambiaron desde otra pantalla.');
      x.mano = { ...x.mano, hora: ok.data.hora, visita: ok.data.visita, urgenciaBps: ok.data.urgenciaBps, version: x.mano.version + 1 };
      return x.mano;
    },
    crearTarifaTarea(datos: unknown): TarifaTarea {
      const ok = NuevaTarifaTareaSchema.safeParse(datos);
      if (!ok.success) throw zodAFallo(ok.error);
      const t: TarifaTarea = { id: idNuevo(s), ...ok.data, version: 1 };
      const x = e();
      x.mano.tareas.push(t);
      x.mano.version += 1;
      return t;
    },
    cambiarTarifaTarea(id: string, datos: unknown): TarifaTarea {
      const ok = CambioTarifaTareaSchema.safeParse(datos);
      if (!ok.success) throw zodAFallo(ok.error);
      const x = e();
      const t = x.mano.tareas.find((v) => v.id === id);
      if (!t) throw fallo('no_encontrado', 404, 'no_encontrado', 'No encontramos esa tarea.');
      if (ok.data.version !== t.version) throw fallo('conflicto', 409, 'conflicto_version', 'Esa tarifa cambió desde otra pantalla.');
      const c = ok.data;
      if (c.rubro !== undefined) t.rubro = c.rubro;
      if (c.nombre !== undefined) t.nombre = c.nombre;
      if (c.detalle !== undefined) t.detalle = c.detalle;
      if (c.monto !== undefined) t.monto = c.monto;
      t.version += 1;
      x.mano.version += 1;
      return t;
    },
    quitarTarifaTarea(id: string): void {
      const x = e();
      x.mano.tareas = x.mano.tareas.filter((t) => t.id !== id);
      x.mano.version += 1;
    },

    buscarCatalogo(q: string, categoria?: CategoriaPrecio): MaterialCatalogo[] {
      const n = normalizar(q);
      if (n.length < 2 || q.length > 80) throw fallo('validacion', 400, 'validacion', 'Escribí al menos 2 letras.');
      return e()
        .catalogo.filter((c) => (!categoria || c.categoria === categoria) && normalizar(c.nombre).includes(n))
        .slice(0, 30);
    },
  };
};

// ── Panel de prueba: el cliente responde y la lista cambia ────────────────────────────────────────

const ultimoEnviado = (s: EstadoMock) =>
  extraPresupuestos(s)
    .presupuestos.filter((p) => p.estado === 'enviado' || p.estado === 'visto')
    .sort((a, b) => Date.parse(b.enviadoEn ?? '') - Date.parse(a.enviadoEn ?? ''))[0];

export function accionesPresupuestos(s: EstadoMock): Array<{ id: string; etiqueta: string; grupo: string }> {
  if (s.perfil.estadoAlta !== 'habilitada') return [];
  const a: Array<{ id: string; etiqueta: string; grupo: string }> = [];
  if (ultimoEnviado(s)) {
    a.push({ id: 'presupuesto_acepta', etiqueta: 'Acepta tu último presupuesto', grupo: 'Usuario del hogar' });
    a.push({ id: 'presupuesto_cambios', etiqueta: 'Pide cambios en tu último presupuesto', grupo: 'Usuario del hogar' });
  }
  a.push({ id: 'lista_sube', etiqueta: 'El corralón sube el cartucho 10 %', grupo: 'Lista de precios' });
  return a;
}

/** true si la acción era de este dominio. */
export function ejecutarPresupuestos(s: EstadoMock, id: string): boolean {
  const x = extraPresupuestos(s);
  const p = ultimoEnviado(s);
  const chat = p ? chatDe(s, p) : null;
  if (id === 'presupuesto_acepta') {
    if (!p) return true;
    p.estado = 'aceptado';
    p.vistoEn ??= iso(ahoraMs(s));
    p.respondidoEn = iso(ahoraMs(s));
    p.version += 1;
    recalcular(x, p);
    // El total del trabajo pasa a ser el del presupuesto aceptado.
    const t = s.trabajos.find((v) => v.trabajo.id === (p.trabajoId ?? p.obraId));
    if (t) {
      t.trabajo.acuerdo = { ...t.trabajo.acuerdo, monto: p.totales.total };
      t.trabajo.version += 1;
    }
    if (chat) agregarMensaje(s, chat, { autorRol: 'usuario', tipo: 'texto', texto: `Acepto el presupuesto de ${formatearPesos(p.totales.total)}. ¡Gracias!` });
    s.nota = `El cliente aceptó el presupuesto (versión ${p.numeroVersion}).`;
    return true;
  }
  if (id === 'presupuesto_cambios') {
    if (!p) return true;
    p.estado = 'visto';
    p.vistoEn ??= iso(ahoraMs(s));
    p.version += 1;
    if (chat) agregarMensaje(s, chat, { autorRol: 'usuario', tipo: 'texto', texto: '¿Se puede sin la prueba de pérdidas? Así me queda un poco más barato.' });
    s.nota = 'El cliente pidió cambios por el chat.';
    return true;
  }
  if (id === 'lista_sube') {
    const c = x.precios.find((v) => v.pub.id === ID_PRESUPUESTOS.cartucho);
    if (c) moverCosto(s, c, monto(Math.round((c.pub.costo.centavos * 1.1) / 10_000) * 10_000), 'foto_lista', PROVEEDOR_PRUEBA);
    recalcularTodos(x);
    s.nota = 'El cartucho subió 10 % en tu lista: los presupuestos enviados con precio que se actualiza avisan.';
    return true;
  }
  return false;
}
