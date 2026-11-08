// Textos y decisiones de las pantallas de «Tu equipamiento» (lote 2.4). Lógica pura con pruebas (vista.test.ts): qué
// nombre e ícono tiene cada categoría, qué chips lleva una herramienta (dónde está y qué le pasa, siempre con ícono y
// texto), cuánto falta para un mantenimiento y los textos de «Ya no la tengo».
import type { CategoriaEquipo, ItemEquipo, MotivoBajaEquipo, REPOSICIONES, UbicacionEquipo } from '../../contracts/equipamiento.ts';
import type { NombreIconoUi } from '../../ui/atomos/Icono.tsx';
import type { TonoChip } from '../../ui/atomos/Texto.tsx';

export const CATEGORIA: Record<CategoriaEquipo, { nombre: string; icono: NombreIconoUi; uno: string; varios: string; articulo: 'la' | 'lo' }> = {
  electricas: { nombre: 'Eléctricas', icono: 'taladro', uno: 'herramienta', varios: 'herramientas', articulo: 'la' },
  manuales: { nombre: 'Manuales', icono: 'herramienta', uno: 'herramienta', varios: 'herramientas', articulo: 'la' },
  medicion: { nombre: 'Medición', icono: 'termometro', uno: 'instrumento', varios: 'instrumentos', articulo: 'lo' },
  seguridad: { nombre: 'Seguridad', icono: 'casco', uno: 'elemento', varios: 'elementos', articulo: 'lo' },
  consumibles: { nombre: 'Consumibles', icono: 'tornillo', uno: 'ítem', varios: 'ítems', articulo: 'lo' },
  repuestos: { nombre: 'Repuestos', icono: 'caja', uno: 'ítem', varios: 'ítems', articulo: 'lo' },
};

export const UBICACION: Record<UbicacionEquipo, { texto: string; en: string; icono: NombreIconoUi }> = {
  camioneta: { texto: 'En la camioneta', en: 'a la camioneta', icono: 'camion' },
  taller: { texto: 'En el taller', en: 'al taller', icono: 'casa' },
  obra: { texto: 'En una obra', en: 'a una obra', icono: 'obra' },
  otro: { texto: 'En otro lugar', en: 'a otro lugar', icono: 'pin' },
};

export const MOTIVOS: Record<MotivoBajaEquipo, string> = {
  se_rompio: 'Se rompió',
  la_vendi: 'La vendí',
  la_perdi: 'La perdí',
  me_la_robaron: 'Me la robaron',
  la_regale: 'La regalé',
  otro: 'Otro motivo',
};

export const REPONER: Record<(typeof REPOSICIONES)[number], { texto: string; ayuda: string }> = {
  ferreteria: { texto: 'Buscar una nueva en la ferretería', ayuda: 'Queda en tu pedido para comparar precios de las adheridas.' },
  lista_compras: { texto: 'Sumarla a la lista de compras', ayuda: 'Para comprarla vos cuando puedas.' },
  no_reponer: { texto: 'No, por ahora', ayuda: 'Sale de tu equipamiento y listo.' },
};

/** «8 herramientas», «1 instrumento». */
export function cantidadCategoria(c: CategoriaEquipo, n: number): { numero: string; unidad: string } {
  return { numero: String(n), unidad: n === 1 ? CATEGORIA[c].uno : CATEGORIA[c].varios };
}

const DIA = 86_400_000;

/** Días enteros de hoy (instante) a una fecha AAAA-MM-DD, en el calendario de Buenos Aires. */
export function diasHasta(fecha: string, ahora: Date): number {
  const hoy = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Argentina/Buenos_Aires', year: 'numeric', month: '2-digit', day: '2-digit' }).format(ahora);
  return Math.round((Date.parse(`${fecha}T12:00:00Z`) - Date.parse(`${hoy}T12:00:00Z`)) / DIA);
}

/** «Hoy», «Mañana», «En 25 días», «Hace 3 días». */
export function textoDias(dias: number): string {
  if (dias === 0) return 'Hoy';
  if (dias === 1) return 'Mañana';
  if (dias === -1) return 'Ayer';
  return dias > 0 ? `En ${dias} días` : `Hace ${-dias} días`;
}

/** 12/12 (sin el año: alcanza para lo que viene). */
export const ddmm = (f: string) => `${f.slice(8, 10)}/${f.slice(5, 7)}`;
/** «Marzo de 2025». */
export function mesAnio(f: string): string {
  const t = new Intl.DateTimeFormat('es-AR', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${f}T12:00:00Z`));
  return t.charAt(0).toUpperCase() + t.slice(1);
}

/** «Cada 6 meses», «Cada 30 días», «Cada año». */
export function textoCada(dias: number): string {
  if (dias % 365 === 0) return dias === 365 ? 'Cada año' : `Cada ${dias / 365} años`;
  if (dias % 30 === 0) return dias === 30 ? 'Cada mes' : `Cada ${dias / 30} meses`;
  return dias === 1 ? 'Cada día' : `Cada ${dias} días`;
}

export interface ChipEstado {
  texto: string;
  icono: NombreIconoUi;
  tono: TonoChip;
}

/** Dónde está: prestada a alguien, o su lugar. */
export function chipLugar(i: Pick<ItemEquipo, 'ubicacion' | 'prestamo'>): ChipEstado {
  if (i.prestamo) return { texto: `Prestada a ${i.prestamo.aNombre.split(' ')[0]}`, icono: 'usuario2', tono: 'gris' };
  return { texto: UBICACION[i.ubicacion].texto, icono: UBICACION[i.ubicacion].icono, tono: i.ubicacion === 'camioneta' ? 'tinte' : 'gris' };
}

/** Los chips de una herramienta en una lista: dónde está y lo más importante que le pasa (o «Funciona bien»). */
export function chipsHerramienta(i: Pick<ItemEquipo, 'ubicacion' | 'prestamo' | 'alertas' | 'estado' | 'cantidad' | 'unidad'>): ChipEstado[] {
  const chips: ChipEstado[] = [chipLugar(i)];
  if (i.estado === 'con_falla') chips.push({ texto: 'Con falla', icono: 'alerta', tono: 'error' });
  for (const a of i.alertas) {
    if (a.tipo === 'devolucion') chips.push({ texto: a.texto, icono: 'reloj', tono: 'gris' });
    else if (a.tipo === 'stock_bajo') chips.push({ texto: i.cantidad !== null ? `Quedan ${i.cantidad}` : a.texto, icono: 'alerta', tono: 'error' });
    else if (a.tipo === 'vencimiento') chips.push({ texto: a.texto, icono: 'alerta', tono: 'error' });
    else chips.push({ texto: a.texto, icono: a.tipo === 'calibracion' ? 'termometro' : 'herramienta', tono: 'amarillo' });
  }
  if (chips.length === 1 && i.estado === 'funciona' && i.cantidad === null) chips.push({ texto: 'Funciona bien', icono: 'check', tono: 'exito' });
  return chips;
}

/** El detalle de la fila: marca y modelo, o cuánto hay de un consumible. */
export function detalleHerramienta(i: Pick<ItemEquipo, 'marcaModelo' | 'cantidad' | 'unidad' | 'minimo' | 'compradaEn'>): string | null {
  if (i.cantidad !== null) return `Hay ${i.cantidad}${i.minimo !== null ? ` · mínimo ${i.minimo}` : ''}`;
  const partes = [i.marcaModelo, i.compradaEn ? `comprada en ${mesAnio(i.compradaEn).toLowerCase()}` : null].filter(Boolean);
  return partes.length ? partes.join(' · ') : null;
}

/** Tono del mosaico de una categoría: la de más cosas en azul; con algo que reponer, el rosado de alerta. */
export function tonoCategoria(c: { categoria: CategoriaEquipo; cantidad: number; alerta: string | null }, mayor: CategoriaEquipo | null): 'azul' | 'alerta' | 'gris' {
  if (c.alerta && /quedan? pocos?|queda poco/.test(c.alerta)) return 'alerta';
  return c.categoria === mayor ? 'azul' : 'gris';
}

/** «¿Qué pasó con la amoladora?» */
export function preguntaBaja(nombre: string): string {
  const corto = nombre.split(/\s+\d/)[0]?.trim() || nombre;
  return `¿Qué pasó con ${/s$/i.test(corto) ? 'los' : 'la'} ${corto.toLocaleLowerCase('es')}?`;
}

/** Fecha de vuelta por defecto del préstamo: en una semana (AAAA-MM-DD). */
export function enUnaSemana(ahora: Date): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Argentina/Buenos_Aires', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(ahora.getTime() + 7 * DIA));
}

/** «Lista de compras: cartuchos, teflón y tarugos». */
export function textoCompras(nombres: readonly string[]): string {
  const cortos = nombres.map((n) => (n.split(/\s+/)[0] ?? n).toLocaleLowerCase('es'));
  if (cortos.length === 0) return 'Lista de compras vacía';
  if (cortos.length === 1) return `Lista de compras: ${cortos[0]}`;
  const ultimos = cortos.length > 3 ? [...cortos.slice(0, 2), `${cortos.length - 2} más`] : cortos;
  return `Lista de compras: ${ultimos.slice(0, -1).join(', ')} y ${ultimos.at(-1)}`;
}

// Aviso que pasa de una pantalla a la siguiente («Sumaste…», «Sacaste…»): en memoria, nunca en el navegador.
let aviso: string | null = null;
export function dejarAviso(texto: string): void {
  aviso = texto;
}
export function tomarAviso(): string | null {
  const t = aviso;
  aviso = null;
  return t;
}
