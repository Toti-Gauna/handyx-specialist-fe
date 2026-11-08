// Mock de tu equipamiento (lote 2.4, contrato 0.11.0, fase H0.5). Emula al servidor: valida con los esquemas del
// contrato, controla la versión de cada herramienta (409 si cambió), calcula las alertas (mantenimiento, calibración,
// vencimiento, poco stock, devolución) y deja el historial. «Ya no la tengo» la saca del equipamiento pero el historial
// queda. Todo es de PRUEBA: herramientas genéricas, «Marca de ejemplo» y profesionales ficticios.
// El estado propio del lote vive en un WeakMap atado al EstadoMock (sin tocar el estado común de la ola).
import {
  BajaEquipoSchema,
  CambioItemEquipoSchema,
  MoverEquipoSchema,
  NuevoItemCompraSchema,
  NuevoItemEquipoSchema,
  PrestarEquipoSchema,
  CATEGORIAS_EQUIPO,
  UBICACIONES_EQUIPO,
  type CategoriaEquipo,
  type EventoEquipo,
  type ItemCompra,
  type ItemEquipo,
  type ItemEquipoDetalle,
  type ResultadoBajaEquipo,
  type ResumenEquipamiento,
  type SugerenciaCodigo,
} from '../../contracts/equipamiento.ts';
import { CamposAdjuntoTrabajoSchema, LIMITE_MODELO_3D_BYTES, type AdjuntoTrabajo } from '../../contracts/modo-trabajo.ts';
import type { FiltroEquipo } from '../api/equipamiento.ts';
import { FalloApi } from '../errores.ts';
import type { Pagina } from '../api/tipos.ts';
import { ahoraMs, fallo, idempotente, idFijo, idNuevo, iso, type EstadoMock } from './estado.ts';
import { FOTO_PRUEBA } from './fotos.ts';
import { zodAFallo } from './validacion.ts';

const DIA = 86_400_000;
const MAX_FOTO = 5 * 1024 * 1024;
const MAX_ADJUNTO = 10 * 1024 * 1024;
const TIPOS_FOTO = new Set(['image/jpeg', 'image/png', 'image/webp']);
const TIPOS_MODELO = new Set(['model/gltf-binary', 'model/vnd.usdz+zip']);
const TIPOS_DOCUMENTO = new Set(['application/pdf', 'image/jpeg', 'image/png', 'image/webp']);
/** Las alertas se encienden con esta anticipación (el servidor usa los mismos plazos). */
const AVISO_MANTENIMIENTO_DIAS = 30;
const AVISO_VENCIMIENTO_DIAS = 45;

interface Guardado {
  item: ItemEquipo;
  historial: EventoEquipo[];
  /** Fuera del equipamiento («Ya no la tengo»): no se lista ni se abre, pero el historial queda. */
  baja: boolean;
}

interface ExtraEquipo {
  items: Guardado[];
  compras: ItemCompra[];
  adjuntos: Map<string, AdjuntoTrabajo[]>;
}

const extras = new WeakMap<EstadoMock, ExtraEquipo>();

/** Ids fijos de la siembra (rango 0x2400: lote 2.4). */
export const ID_EQUIPO = {
  taladro: idFijo(0x2401),
  amoladora: idFijo(0x2402),
  termofusora: idFijo(0x2403),
  atornillador: idFijo(0x2404),
  pinza: idFijo(0x2411),
  matafuego: idFijo(0x2421),
  tarugos: idFijo(0x2431),
} as const;

/** Códigos de barras de prueba que el catálogo reconoce (sin precios). */
export const CODIGOS_PRUEBA: Record<string, { nombre: string; categoria: CategoriaEquipo }> = {
  '7790000000017': { nombre: 'Amoladora angular 115 mm', categoria: 'electricas' },
  '7790000000024': { nombre: 'Cinta aisladora 19 mm', categoria: 'consumibles' },
  '7790000000031': { nombre: 'Multímetro digital', categoria: 'medicion' },
};

const fecha = (ms: number) => iso(ms).slice(0, 10);
const diasEntre = (desdeMs: number, hasta: string) => Math.round((Date.parse(`${hasta}T12:00:00Z`) - desdeMs) / DIA);
const ddmm = (f: string) => `${f.slice(8, 10)}/${f.slice(5, 7)}`;

function base(id: string, nombre: string, categoria: CategoriaEquipo, extra: Partial<ItemEquipo> = {}): ItemEquipo {
  return {
    id,
    nombre,
    categoria,
    marcaModelo: null,
    codigoBarras: null,
    foto: null,
    ubicacion: 'camioneta',
    prestamo: null,
    estado: 'funciona',
    compradaEn: null,
    garantiaHasta: null,
    venceEn: null,
    cantidad: null,
    unidad: null,
    minimo: null,
    mantenimientos: [],
    alertas: [],
    version: 1,
    ...extra,
  };
}

function sembrar(s: EstadoMock): ExtraEquipo {
  const hoy = ahoraMs(s);
  const ev = (n: number, tipo: EventoEquipo['tipo'], texto: string, haceDias: number): EventoEquipo => ({ id: idFijo(0x2500 + n), tipo, texto, trabajoId: null, en: iso(hoy - haceDias * DIA) });
  let m = 0;
  const mant = (descripcion: string, cadaDias: number, proximoEnDias: number): ItemEquipo['mantenimientos'][number] => ({ id: idFijo(0x2600 + ++m), descripcion, cadaDias, proximoEl: fecha(hoy + proximoEnDias * DIA), ultimoEl: fecha(hoy + (proximoEnDias - cadaDias) * DIA) });
  const g = (item: ItemEquipo, historial: EventoEquipo[] = []): Guardado => ({ item, historial, baja: false });
  let n = 0;
  const alta = (dias: number) => ev(++n, 'alta', 'La sumaste a tu equipamiento', dias);

  const items: Guardado[] = [
    g(base(ID_EQUIPO.taladro, 'Taladro percutor 13 mm', 'electricas', { marcaModelo: 'Marca de ejemplo · 750 W', compradaEn: '2025-03-10', foto: { id: idFijo(0x2701), url: FOTO_PRUEBA } }), [alta(600), ev(++n, 'uso', 'Usado en «Pierde la canilla» · Centro', 2)]),
    g(base(ID_EQUIPO.amoladora, 'Amoladora 115 mm', 'electricas', { marcaModelo: 'De ejemplo · 850 W', compradaEn: '2025-03-15', garantiaHasta: '2027-03-15', mantenimientos: [mant('Cambiar escobillas', 180, 25)] }), [
      alta(590),
      ev(++n, 'prestamo', 'Prestada a Sofía Ruiz · del 02/11 al 05/11 · devuelta', 15),
      ev(++n, 'uso', 'Usada en «Baño completo» · Jornada 1 · Demolición', 9),
    ]),
    g(base(ID_EQUIPO.termofusora, 'Termofusora 20–32 mm', 'electricas', { marcaModelo: 'Para Plomería', prestamo: { profesionalId: null, aNombre: 'Sofía Ruiz', desde: fecha(hoy - 3 * DIA), vuelveEl: fecha(hoy + 3 * DIA) } }), [alta(400), ev(++n, 'prestamo', 'Prestada a Sofía Ruiz', 3)]),
    g(base(ID_EQUIPO.atornillador, 'Atornillador inalámbrico', 'electricas', { marcaModelo: '2 baterías', ubicacion: 'taller', mantenimientos: [mant('Cargar las baterías', 30, 2)] }), [alta(300)]),
    g(base(idFijo(0x2405), 'Sierra caladora', 'electricas', { ubicacion: 'taller' }), [alta(250)]),
    g(base(idFijo(0x2406), 'Rotomartillo SDS', 'electricas'), [alta(200)]),
    g(base(idFijo(0x2407), 'Pistola de calor', 'electricas', { ubicacion: 'taller' }), [alta(180)]),
    g(base(idFijo(0x2408), 'Soldador de estaño', 'electricas', { ubicacion: 'taller' }), [alta(160)]),
    g(base(idFijo(0x2409), 'Juego de destornilladores', 'manuales'), [alta(700)]),
    g(base(idFijo(0x240a), 'Pinza universal', 'manuales'), [alta(700)]),
    g(base(idFijo(0x240b), 'Llave francesa 10"', 'manuales'), [alta(650)]),
    g(base(idFijo(0x240c), 'Nivel de burbuja 60 cm', 'manuales', { ubicacion: 'taller' }), [alta(500)]),
    g(base(idFijo(0x240d), 'Cinta métrica 5 m', 'manuales'), [alta(450)]),
    g(base(ID_EQUIPO.pinza, 'Pinza amperométrica', 'medicion', { marcaModelo: 'De ejemplo', mantenimientos: [mant('Calibrar', 365, 12)] }), [alta(420)]),
    g(base(idFijo(0x2412), 'Multímetro digital', 'medicion'), [alta(380)]),
    g(base(idFijo(0x2413), 'Detector de tensión sin contacto', 'medicion'), [alta(300)]),
    g(base(ID_EQUIPO.matafuego, 'Matafuego ABC 1 kg', 'seguridad', { venceEn: fecha(hoy + 25 * DIA) }), [alta(340)]),
    g(base(idFijo(0x2422), 'Guantes dieléctricos', 'seguridad'), [alta(320)]),
    g(base(idFijo(0x2423), 'Antiparras', 'seguridad'), [alta(320)]),
    g(base(ID_EQUIPO.tarugos, 'Tarugos 8 mm', 'consumibles', { cantidad: 12, unidad: 'unidad', minimo: 50 }), [alta(90)]),
    g(base(idFijo(0x2432), 'Cinta aisladora', 'consumibles', { cantidad: 2, unidad: 'rollo', minimo: 4 }), [alta(80)]),
    g(base(idFijo(0x2433), 'Cartuchos de silicona', 'consumibles', { cantidad: 1, unidad: 'unidad', minimo: 3 }), [alta(70)]),
    g(base(idFijo(0x2434), 'Teflón', 'consumibles', { cantidad: 6, unidad: 'rollo', minimo: 2 }), [alta(60)]),
    g(base(idFijo(0x2441), 'Flexibles de 40 cm', 'repuestos', { cantidad: 4, unidad: 'unidad', minimo: 2 }), [alta(50)]),
    g(base(idFijo(0x2442), 'Térmicas de 16 A', 'repuestos', { cantidad: 3, unidad: 'unidad', minimo: 1 }), [alta(40)]),
  ];
  const compras: ItemCompra[] = [
    { id: idFijo(0x2801), nombre: 'Cartuchos de silicona', cantidad: 3, unidad: 'unidad', equipoId: null, creadoEn: iso(hoy - 2 * DIA) },
    { id: idFijo(0x2802), nombre: 'Teflón', cantidad: 2, unidad: 'rollo', equipoId: null, creadoEn: iso(hoy - 2 * DIA) },
    { id: idFijo(0x2803), nombre: 'Tarugos 8 mm', cantidad: 50, unidad: 'unidad', equipoId: ID_EQUIPO.tarugos, creadoEn: iso(hoy - DIA) },
  ];
  return { items, compras, adjuntos: new Map() };
}

function extra(s: EstadoMock): ExtraEquipo {
  let e = extras.get(s);
  if (!e) {
    e = sembrar(s);
    extras.set(s, e);
  }
  return e;
}

/** Las alertas las calcula el servidor con la fecha de hoy. */
export function alertasDe(item: ItemEquipo, hoyMs: number): ItemEquipo['alertas'] {
  const a: ItemEquipo['alertas'] = [];
  for (const m of item.mantenimientos) {
    if (diasEntre(hoyMs, m.proximoEl) <= AVISO_MANTENIMIENTO_DIAS) a.push({ tipo: item.categoria === 'medicion' ? 'calibracion' : 'mantenimiento', texto: m.descripcion, fecha: m.proximoEl });
  }
  if (item.venceEn && diasEntre(hoyMs, item.venceEn) <= AVISO_VENCIMIENTO_DIAS) a.push({ tipo: 'vencimiento', texto: `Vence el ${ddmm(item.venceEn)}`, fecha: item.venceEn });
  if (item.cantidad !== null && item.minimo !== null && item.cantidad < item.minimo) a.push({ tipo: 'stock_bajo', texto: 'Quedan pocos', fecha: null });
  if (item.prestamo?.vuelveEl) a.push({ tipo: 'devolucion', texto: `Vuelve el ${ddmm(item.prestamo.vuelveEl)}`, fecha: item.prestamo.vuelveEl });
  return a;
}

/** La alerta de una categoría que se muestra en su mosaico (la más importante). */
export function alertaCategoria(items: readonly ItemEquipo[]): string | null {
  const cuenta = (t: ItemEquipo['alertas'][number]['tipo']) => items.filter((i) => i.alertas.some((a) => a.tipo === t));
  const vence = cuenta('vencimiento');
  const [unico] = vence;
  if (vence.length === 1 && unico) return `${unico.nombre.split(' ')[0]} vence ${ddmm(unico.venceEn ?? '')}`;
  if (vence.length > 1) return `${vence.length} vencen pronto`;
  const stock = cuenta('stock_bajo');
  if (stock.length) return stock.length === 1 ? '1 queda poco' : `${stock.length} quedan pocos`;
  const cal = cuenta('calibracion');
  if (cal.length) return `${cal.length} por calibrar`;
  const man = cuenta('mantenimiento');
  if (man.length) return man.length === 1 ? '1 para mantener' : `${man.length} para mantener`;
  return null;
}

export const equipamiento = (s: EstadoMock) => {
  const e = () => extra(s);
  const hoy = () => ahoraMs(s);
  const vivo = (it: ItemEquipo): ItemEquipo => ({ ...it, alertas: alertasDe(it, hoy()) });
  const detalle = (g: Guardado): ItemEquipoDetalle => ({ ...vivo(g.item), historial: [...g.historial].reverse().sort((a, b) => b.en.localeCompare(a.en)) });

  function buscar(id: string): Guardado {
    const g = e().items.find((x) => x.item.id === id && !x.baja);
    if (!g) throw fallo('no_encontrado', 404, 'no_encontrado', 'No encontramos esa herramienta.');
    return g;
  }
  function conVersion(g: Guardado, version: number) {
    if (version !== g.item.version) throw fallo('conflicto', 409, 'conflicto_version', 'Esta herramienta cambió desde otra pantalla. Volvé a abrirla.');
  }
  function evento(g: Guardado, tipo: EventoEquipo['tipo'], texto: string) {
    g.historial.push({ id: idNuevo(s), tipo, texto, trabajoId: null, en: iso(hoy()) });
    g.item = { ...g.item, version: g.item.version + 1 };
  }
  const LUGAR: Record<ItemEquipo['ubicacion'], string> = { camioneta: 'a la camioneta', taller: 'al taller', obra: 'a la obra', otro: 'a otro lugar' };

  return {
    equipamiento(): ResumenEquipamiento {
      const activos = e().items.filter((g) => !g.baja).map((g) => vivo(g.item));
      return {
        categorias: CATEGORIAS_EQUIPO.map((c) => {
          const de = activos.filter((i) => i.categoria === c);
          return { categoria: c, cantidad: de.length, alerta: alertaCategoria(de) };
        }),
        porUbicacion: UBICACIONES_EQUIPO.map((u) => ({ ubicacion: u, cantidad: activos.filter((i) => i.ubicacion === u && !i.prestamo).length })),
        prestados: activos.filter((i) => i.prestamo).length,
        listaCompras: e().compras.length,
      };
    },

    equipamientoItems(f: FiltroEquipo = {}): Pagina<ItemEquipo> {
      const q = f.q?.trim().toLocaleLowerCase('es') ?? '';
      if (q.length > 80) throw fallo('validacion', 400, 'validacion', 'La búsqueda es demasiado larga.');
      const items = e()
        .items.filter((g) => !g.baja)
        .map((g) => vivo(g.item))
        .filter((i) => (f.categoria ? i.categoria === f.categoria : true))
        .filter((i) => (f.ubicacion ? i.ubicacion === f.ubicacion && !i.prestamo : true))
        .filter((i) => (f.prestados ? i.prestamo !== null : true))
        .filter((i) => (q ? `${i.nombre} ${i.marcaModelo ?? ''}`.toLocaleLowerCase('es').includes(q) : true));
      return { items, siguienteCursor: null };
    },

    equipamientoItem(id: string): ItemEquipoDetalle {
      return detalle(buscar(id));
    },

    agregarEquipamiento(datos: unknown, foto: unknown, clave: string): ItemEquipo {
      return idempotente(s, `equipo:${clave}`, () => {
        const ok = NuevoItemEquipoSchema.safeParse(datos);
        if (!ok.success) throw zodAFallo(ok.error);
        if (foto !== null) {
          if (!(foto instanceof Blob) || !TIPOS_FOTO.has(foto.type)) throw fallo('validacion', 415, 'tipo_archivo_prohibido', 'Mandá una foto (JPEG, PNG o WebP).');
          if (foto.size > MAX_FOTO) throw fallo('limite', 413, 'limite', 'La foto pesa más de 5 MB.');
        }
        const d = ok.data;
        const id = idNuevo(s);
        const item = base(id, d.nombre, d.categoria, {
          marcaModelo: d.marcaModelo,
          codigoBarras: d.codigoBarras,
          foto: foto ? { id: idNuevo(s), url: FOTO_PRUEBA } : null,
          ubicacion: d.ubicacion,
          compradaEn: d.compradaEn,
          garantiaHasta: d.garantiaHasta,
          venceEn: d.venceEn,
          cantidad: d.cantidad,
          unidad: d.unidad,
          minimo: d.minimo,
          mantenimientos: d.mantenimiento ? [{ id: idNuevo(s), descripcion: d.mantenimiento.descripcion, cadaDias: d.mantenimiento.cadaDias, proximoEl: fecha(hoy() + d.mantenimiento.cadaDias * DIA), ultimoEl: null }] : [],
        });
        e().items.push({ item, historial: [{ id: idNuevo(s), tipo: 'alta', texto: 'La sumaste a tu equipamiento', trabajoId: null, en: iso(hoy()) }], baja: false });
        return vivo(item);
      });
    },

    corregirEquipamiento(id: string, cambio: unknown): ItemEquipoDetalle {
      const ok = CambioItemEquipoSchema.safeParse(cambio);
      if (!ok.success) throw zodAFallo(ok.error);
      const g = buscar(id);
      conVersion(g, ok.data.version);
      const limpio = Object.fromEntries(Object.entries(ok.data).filter(([k, v]) => k !== 'version' && v !== undefined));
      g.item = { ...g.item, ...limpio, version: g.item.version + 1 };
      return detalle(g);
    },

    prestarEquipamiento(id: string, datos: unknown): ItemEquipoDetalle {
      const ok = PrestarEquipoSchema.safeParse(datos);
      if (!ok.success) throw zodAFallo(ok.error);
      const g = buscar(id);
      conVersion(g, ok.data.version);
      if (g.item.prestamo) throw fallo('conflicto', 409, 'transicion_invalida', 'Ya está prestada. Primero marcá que te la devolvieron.');
      if (ok.data.vuelveEl && ok.data.vuelveEl < fecha(hoy())) throw new FalloApi('validacion', 400, { codigo: 'validacion', mensaje: 'La vuelta no puede ser antes de hoy.', requestId: 'req-prueba-0001', campos: [{ campo: 'vuelveEl', codigo: 'antes_de_hoy' }] });
      g.item = { ...g.item, prestamo: { profesionalId: ok.data.profesionalId, aNombre: ok.data.aNombre, desde: fecha(hoy()), vuelveEl: ok.data.vuelveEl } };
      evento(g, 'prestamo', `Prestada a ${ok.data.aNombre}${ok.data.vuelveEl ? ` · vuelve el ${ddmm(ok.data.vuelveEl)}` : ''}`);
      return detalle(g);
    },

    devolverEquipamiento(id: string, version: number): ItemEquipoDetalle {
      const g = buscar(id);
      conVersion(g, version);
      if (!g.item.prestamo) throw fallo('conflicto', 409, 'transicion_invalida', 'No está prestada.');
      const quien = g.item.prestamo.aNombre;
      g.item = { ...g.item, prestamo: null };
      evento(g, 'devolucion', `Te la devolvió ${quien}`);
      return detalle(g);
    },

    moverEquipamiento(id: string, datos: unknown): ItemEquipoDetalle {
      const ok = MoverEquipoSchema.safeParse(datos);
      if (!ok.success) throw zodAFallo(ok.error);
      const g = buscar(id);
      conVersion(g, ok.data.version);
      if (g.item.prestamo) throw fallo('conflicto', 409, 'transicion_invalida', 'Está prestada: cuando te la devuelvan, la movés.');
      g.item = { ...g.item, ubicacion: ok.data.ubicacion };
      evento(g, 'movimiento', `La moviste ${LUGAR[ok.data.ubicacion]}`);
      return detalle(g);
    },

    bajaEquipamiento(id: string, datos: unknown): ResultadoBajaEquipo {
      const ok = BajaEquipoSchema.safeParse(datos);
      if (!ok.success) throw zodAFallo(ok.error);
      const g = buscar(id);
      conVersion(g, ok.data.version);
      if (g.item.prestamo) throw fallo('conflicto', 409, 'transicion_invalida', 'Está prestada: primero marcá que te la devolvieron.');
      const MOTIVO = { se_rompio: 'Se rompió', la_vendi: 'La vendiste', la_perdi: 'La perdiste', me_la_robaron: 'Te la robaron', la_regale: 'La regalaste', otro: 'Ya no la tenés' } as const;
      evento(g, 'baja', `${MOTIVO[ok.data.motivo]}${ok.data.detalle ? ` · ${ok.data.detalle}` : ''}`);
      g.baja = true;
      let listaComprasId: string | null = null;
      if (ok.data.reponer === 'lista_compras') {
        const c: ItemCompra = { id: idNuevo(s), nombre: g.item.nombre, cantidad: 1, unidad: g.item.unidad ?? 'unidad', equipoId: g.item.id, creadoEn: iso(hoy()) };
        e().compras.push(c);
        listaComprasId = c.id;
      }
      // La ferretería es de la ola 4: queda un pedido borrador para comparar precios (acá, solo su id).
      const pedidoFerreteriaId = ok.data.reponer === 'ferreteria' ? idNuevo(s) : null;
      return { item: detalle(g), listaComprasId, pedidoFerreteriaId };
    },

    mantenimientoHecho(id: string, mantenimientoId: string, version: number): ItemEquipoDetalle {
      const g = buscar(id);
      conVersion(g, version);
      const m = g.item.mantenimientos.find((x) => x.id === mantenimientoId);
      if (!m) throw fallo('no_encontrado', 404, 'no_encontrado', 'No encontramos ese mantenimiento.');
      const hecho = { ...m, ultimoEl: fecha(hoy()), proximoEl: fecha(hoy() + m.cadaDias * DIA) };
      g.item = { ...g.item, mantenimientos: g.item.mantenimientos.map((x) => (x.id === m.id ? hecho : x)) };
      evento(g, 'mantenimiento', `${m.descripcion}: hecho · el próximo, el ${ddmm(hecho.proximoEl)}`);
      return detalle(g);
    },

    listaCompras(): ItemCompra[] {
      return [...e().compras];
    },

    sumarListaCompras(datos: unknown): ItemCompra {
      const ok = NuevoItemCompraSchema.safeParse(datos);
      if (!ok.success) throw zodAFallo(ok.error);
      const c: ItemCompra = { id: idNuevo(s), ...ok.data, equipoId: null, creadoEn: iso(hoy()) };
      e().compras.push(c);
      return c;
    },

    sacarListaCompras(id: string): undefined {
      const lista = e().compras;
      const i = lista.findIndex((c) => c.id === id);
      if (i < 0) throw fallo('no_encontrado', 404, 'no_encontrado', 'Eso ya no está en tu lista.');
      lista.splice(i, 1);
      return undefined;
    },

    sugerenciaCodigo(codigo: string): SugerenciaCodigo {
      if (!/^[0-9A-Za-z-]{4,32}$/.test(codigo)) throw fallo('validacion', 400, 'validacion', 'Ese código no es válido.');
      const c = CODIGOS_PRUEBA[codigo];
      return { codigoBarras: codigo, nombre: c?.nombre ?? null, categoria: c?.categoria ?? null };
    },

    adjuntosTrabajo(trabajoId: string): AdjuntoTrabajo[] {
      trabajoPropio(s, trabajoId);
      return [...(e().adjuntos.get(trabajoId) ?? [])];
    },

    guardarAdjuntoTrabajo(trabajoId: string, datos: unknown, archivo: unknown, clave: string): AdjuntoTrabajo {
      return idempotente(s, `adjunto:${clave}`, () => {
        trabajoPropio(s, trabajoId);
        const ok = CamposAdjuntoTrabajoSchema.safeParse(datos);
        if (!ok.success) throw zodAFallo(ok.error);
        if (!(archivo instanceof Blob)) throw fallo('validacion', 400, 'validacion', 'Falta el archivo.');
        const modelo = ok.data.tipo === 'modelo_3d';
        if (!(modelo ? TIPOS_MODELO : TIPOS_DOCUMENTO).has(archivo.type)) throw fallo('validacion', 415, 'tipo_archivo_prohibido', modelo ? 'El modelo tiene que ser GLB o USDZ.' : 'Mandá un PDF o una imagen.');
        if (archivo.size > (modelo ? LIMITE_MODELO_3D_BYTES : MAX_ADJUNTO)) throw fallo('limite', 413, 'limite', 'El archivo es demasiado grande.');
        const a: AdjuntoTrabajo = { id: idNuevo(s), tipo: ok.data.tipo, nombre: ok.data.nombre, url: `https://archivos.example.test/adjuntos/${trabajoId}`, bytes: Math.max(1, archivo.size), creadoEn: iso(hoy()) };
        const lista = e().adjuntos.get(trabajoId) ?? [];
        lista.push(a);
        e().adjuntos.set(trabajoId, lista);
        return a;
      });
    },
  };
};

/** Recurso ajeno o inexistente = 404 (no se revela si existe). */
function trabajoPropio(s: EstadoMock, id: string) {
  if (!s.trabajos.some((t) => t.trabajo.id === id)) throw fallo('no_encontrado', 404, 'no_encontrado', 'No encontramos ese trabajo.');
}
