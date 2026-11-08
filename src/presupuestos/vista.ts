// Textos y estados de las pantallas de presupuestos y lista de precios (lote 2.2). Lógica pura con pruebas en
// vista.test.ts: los estados se dicen con texto e ícono (el color es solo apoyo).
import type { Monto } from '../contracts/dinero.ts';
import type { UNIDADES_MATERIAL } from '../contracts/dto.ts';
import type { CategoriaPrecio, EstadoPresupuesto, ItemMaterial, ModoPrecio, PrecioDetalle, RESULTADOS_LECTURA } from '../contracts/presupuestos.ts';
import { NOMBRE_RUBRO } from '../contracts/rubros.ts';
import type { NombreIconoUi } from '../ui/atomos/Icono.tsx';
import type { TonoChip } from '../ui/atomos/Texto.tsx';

export interface EstadoVisible {
  texto: string;
  icono: NombreIconoUi;
  tono: TonoChip;
}

type Unidad = (typeof UNIDADES_MATERIAL)[number];
type Resultado = (typeof RESULTADOS_LECTURA)[number];

export const MODO_PRECIO: Record<ModoPrecio, EstadoVisible & { detalle: string }> = {
  actualiza: { texto: 'Se actualiza', icono: 'flechas', tono: 'tinte', detalle: 'Sigue tu lista de precios' },
  fijo: { texto: 'Precio fijo', icono: 'candado', tono: 'gris', detalle: 'Se congela al presupuestar' },
};

export const ESTADO_PRESUPUESTO: Record<EstadoPresupuesto, EstadoVisible> = {
  borrador: { texto: 'Sin mandar', icono: 'lapiz', tono: 'gris' },
  enviado: { texto: 'Mandado', icono: 'enviar', tono: 'tinte' },
  visto: { texto: 'Lo vio', icono: 'ojo', tono: 'tinte' },
  aceptado: { texto: 'Aceptado', icono: 'check', tono: 'exito' },
  rechazado: { texto: 'No lo aceptó', icono: 'cerrar', tono: 'error' },
  reemplazado: { texto: 'Reemplazado', icono: 'reenviar', tono: 'gris' },
  vencido: { texto: 'Vencido', icono: 'reloj', tono: 'gris' },
};

export const NOMBRE_CATEGORIA: Record<CategoriaPrecio, string> = { ...NOMBRE_RUBRO, otra: 'Otra' };

const UNIDAD: Record<Unidad, [string, string]> = {
  unidad: ['unidad', 'unidades'],
  metro: ['metro', 'metros'],
  rollo: ['rollo', 'rollos'],
  caja: ['caja', 'cajas'],
  bolsa: ['bolsa', 'bolsas'],
  kg: ['kilo', 'kilos'],
  litro: ['litro', 'litros'],
};
export const OPCIONES_UNIDAD = (Object.keys(UNIDAD) as Unidad[]).map((u) => ({ valor: u, texto: UNIDAD[u][0].charAt(0).toUpperCase() + UNIDAD[u][0].slice(1) }));

/** "2,5" con coma decimal (cantidades de hasta 3 decimales). */
export const numero = (n: number): string => n.toLocaleString('es-AR', { maximumFractionDigits: 3 });

/** "1 unidad", "2,5 metros". */
export function cantidadConUnidad(cantidad: number, unidad: Unidad): string {
  const [uno, varios] = UNIDAD[unidad];
  return `${numero(cantidad)} ${cantidad === 1 ? uno : varios}`;
}

/** "05/11" de "2026-11-05". */
export function diaMes(fecha: string): string {
  const [, m = '', d = ''] = fecha.split('-');
  return `${d}/${m}`;
}

/** Días enteros entre dos fechas AAAA-MM-DD. */
export function diasEntre(desde: string, hasta: string): number {
  return Math.round((Date.parse(`${hasta}T12:00:00Z`) - Date.parse(`${desde}T12:00:00Z`)) / 86_400_000);
}

/** De dónde sale el precio de un ítem: «Fijado hoy», «Fijado el 05/11» o «tu lista del 05/11». */
export function origenPrecio(m: Pick<ItemMaterial, 'modoPrecio' | 'precioDel'>, hoy: string): string {
  if (m.modoPrecio === 'actualiza') return `tu lista del ${diaMes(m.precioDel)}`;
  return m.precioDel === hoy ? 'Fijado hoy' : `Fijado el ${diaMes(m.precioDel)}`;
}

/** «Hace 37 días» para un precio viejo; si no, la fecha. */
export function antiguedad(actualizadoEn: string, hoy: string, viejo: boolean): string {
  const d = diasEntre(actualizadoEn, hoy);
  if (viejo) return `Hace ${d} días`;
  return d === 0 ? 'Hoy' : diaMes(actualizadoEn);
}

/** "8 %" desde puntos básicos, sin signo (el signo lo dice la palabra). */
export const porcentaje = (bps: number): string => `${numero(Math.round(Math.abs(bps) / 100))} %`;

export function resultadoLectura(r: Resultado, bps: number | null): EstadoVisible {
  switch (r) {
    case 'sube':
      return { texto: `Sube ${porcentaje(bps ?? 0)}`, icono: 'flechas', tono: 'amarillo' };
    case 'baja':
      return { texto: `Baja ${porcentaje(bps ?? 0)}`, icono: 'flechas', tono: 'exito' };
    case 'igual':
      return { texto: 'Igual', icono: 'check', tono: 'exito' };
    case 'nuevo':
      return { texto: 'Nuevo', icono: 'mas', tono: 'tinte' };
    case 'revisar':
      return { texto: 'Revisá', icono: 'alerta', tono: 'error' };
  }
}

/** Cómo varió el costo del primero al último punto: «+17 % en 4 meses». */
export function variacionHistorial(h: PrecioDetalle['historial']): { bps: number; texto: string } | null {
  const primero = h[0];
  const ultimo = h.at(-1);
  if (!primero || !ultimo || h.length < 2 || primero.costo.centavos === 0) return null;
  const bps = Math.round(((ultimo.costo.centavos - primero.costo.centavos) * 10_000) / primero.costo.centavos);
  const [a1 = 0, m1 = 0] = primero.fecha.split('-').map(Number);
  const [a2 = 0, m2 = 0] = ultimo.fecha.split('-').map(Number);
  const meses = (a2 - a1) * 12 + (m2 - m1) + 1;
  const signo = bps > 0 ? '+' : bps < 0 ? '−' : '';
  return { bps, texto: `${signo}${porcentaje(bps)} en ${meses} ${meses === 1 ? 'mes' : 'meses'}` };
}

const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
/** "Ago" de "2026-08-04". */
export const mesCorto = (fecha: string): string => MESES[Number(fecha.split('-')[1]) - 1] ?? fecha;

/** Margen sobre el costo en puntos básicos (lo decide el especialista). */
export function margenBps(costo: Monto, cliente: Monto): number {
  if (costo.centavos === 0) return 0;
  return Math.round(((cliente.centavos - costo.centavos) * 10_000) / costo.centavos);
}

/** Lo que va a pasar al agregar, dicho en palabras (H0-AgregarMaterial). */
export function resumenOpciones(o: { cobrarAlCliente: boolean; registrarGasto: boolean; modoPrecio: ModoPrecio }, cliente: string | null, varios = false): string[] {
  const quien = cliente ?? 'al cliente';
  const lo = varios ? 'los' : 'lo';
  return [
    o.cobrarAlCliente ? `Se ${lo} cobrás a ${quien} en el presupuesto` : `No se ${lo} cobrás a ${quien}`,
    o.registrarGasto ? (varios ? 'Van a tus gastos con un solo ticket' : 'Va a tus gastos cuando lo compres') : 'No se anota como gasto',
    o.modoPrecio === 'fijo' ? 'Con el precio de hoy, congelado' : 'El precio sigue tu lista',
  ];
}

/** «Mandar a Lucía por el chat»: el primer nombre de la persona, si se conoce. */
export function textoMandar(cliente: string | null): string {
  const nombre = cliente?.trim().split(/\s+/)[0];
  return nombre ? `Mandar a ${nombre} por el chat` : 'Mandar por el chat';
}
