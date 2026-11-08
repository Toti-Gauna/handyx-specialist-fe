// Lectura de la lista de precios del corralón EN EL TELÉFONO (H0-PreciosFoto, lote 2.2). La foto nunca sale del
// teléfono: el lector del dispositivo (./lector.ts) devuelve renglones de texto y acá se convierten en filas
// (material, unidad y precio). Lo que no se entiende bien queda marcado «Revisá» y no se guarda hasta corregirlo a mano.
// Lógica pura, con pruebas en lectura.test.ts.
import type { UNIDADES_MATERIAL } from '../contracts/dto.ts';
import { centavosDesdeTexto } from '../lib/formato.ts';

export type Unidad = (typeof UNIDADES_MATERIAL)[number];

/** Un texto reconocido con su caja (como lo da el detector de texto del navegador). */
export interface BloqueTexto {
  texto: string;
  x: number;
  y: number;
  alto: number;
}

export interface FilaLeida {
  nombre: string;
  unidad: Unidad;
  /** null si el número no se entendió (quedó «Revisá»). */
  centavos: number | null;
  /** Lo que se leyó del precio, para mostrarlo tal cual al revisar ("$ 1?0"). */
  precioLeido: string;
}

export interface ListaLeida {
  proveedor: string | null;
  filas: FilaLeida[];
}

/** Pasados estos renglones sin precio, se deja de buscar el nombre del corralón. */
const RENGLONES_ENCABEZADO = 3;
const MAX_FILAS = 300;
const MAX_NOMBRE = 120;

/** Junta los bloques que están a la misma altura en renglones, de arriba abajo y de izquierda a derecha. */
export function agruparRenglones(bloques: readonly BloqueTexto[]): string[] {
  const orden = [...bloques].filter((b) => b.texto.trim() !== '').sort((a, b) => a.y - b.y || a.x - b.x);
  const renglones: BloqueTexto[][] = [];
  for (const b of orden) {
    const ultimo = renglones.at(-1);
    const ref = ultimo?.[0];
    // Mismo renglón si el centro vertical cae dentro de la mitad de la altura del primero.
    if (ultimo && ref && Math.abs(b.y + b.alto / 2 - (ref.y + ref.alto / 2)) <= Math.max(ref.alto, b.alto) / 2) ultimo.push(b);
    else renglones.push([b]);
  }
  return renglones.map((r) =>
    r
      .sort((a, b) => a.x - b.x)
      .map((b) => b.texto.trim())
      .join(' '),
  );
}

// Un precio al final del renglón: "$ 10.600", "10600", "$10.600,50" o algo parecido con caracteres que no se leyeron
// ("$ 1?0", "1O.6OO"). Tiene que empezar con $ o con un número.
const PRECIO_AL_FINAL = /(\$\s*[0-9OolI?.,]+|[0-9][0-9OolI?.,]*)\s*$/;

/** "$ 10.600" → 1_060_000 centavos; null si tiene algo que no es un número claro. */
export function leerPrecio(texto: string): number | null {
  const t = texto.trim();
  if (/[?OolI]/.test(t.replace(/^\$/, ''))) return null;
  const c = centavosDesdeTexto(t);
  return c !== null && c > 0 ? c : null;
}

/** Unidad por las palabras del nombre ("por metro", "x m", "(kg)"); si no dice, unidad. */
export function unidadDe(nombre: string): Unidad {
  const n = nombre.toLowerCase();
  if (/\b(x|por)\s*(m|metro|mts?)\b|\(metro\)|\bmetro\b/.test(n)) return 'metro';
  if (/\b(x|por)\s*kg\b|\(kg\)|\bkilo\b/.test(n)) return 'kg';
  if (/\b(x|por)\s*(l|litro)\b|\(litro\)/.test(n)) return 'litro';
  if (/\brollo\b/.test(n)) return 'rollo';
  if (/\bbolsa\b/.test(n)) return 'bolsa';
  if (/\bcaja x\b|\(caja\)/.test(n)) return 'caja';
  return 'unidad';
}

/** Limpia el nombre: puntos de relleno, guiones y espacios de más. */
export function limpiarNombre(t: string): string {
  return t
    .replace(/[.·…_-]{2,}/g, ' ')
    .replace(/[\s:|-]+$/g, '')
    .replace(/^[\s:|*•-]+/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, MAX_NOMBRE);
}

/** De renglones de texto a filas. Los renglones sin precio arriba de todo dan el nombre del corralón. */
export function interpretarLista(renglones: readonly string[]): ListaLeida {
  let proveedor: string | null = null;
  const filas: FilaLeida[] = [];
  renglones.forEach((r, i) => {
    // Un renglón que termina en una fecha ("17/11/2026") no trae precio.
    const m = /\d{1,2}\/\d{1,2}(\/\d{2,4})?\s*$/.test(r) ? null : PRECIO_AL_FINAL.exec(r);
    const nombre = m ? limpiarNombre(r.slice(0, m.index)) : '';
    if (!m || nombre.length < 3 || !/[a-záéíóúñ]/i.test(nombre)) {
      const titulo = limpiarNombre(r);
      if (proveedor === null && filas.length === 0 && i < RENGLONES_ENCABEZADO && /[a-z]{3}/i.test(titulo) && !/lista|precio|fecha|\d{2}\/\d{2}/i.test(titulo)) proveedor = titulo.slice(0, 80);
      return;
    }
    if (filas.length >= MAX_FILAS) return;
    const precioLeido = (m[1] ?? '').trim();
    filas.push({ nombre, unidad: unidadDe(nombre), centavos: leerPrecio(precioLeido), precioLeido: precioLeido.startsWith('$') ? precioLeido.replace(/^\$\s*/, '$ ') : `$ ${precioLeido}` });
  });
  return { proveedor, filas };
}

/** Cuántas filas se entendieron (las que se marcan en la foto). */
export const entendidas = (l: ListaLeida): number => l.filas.filter((f) => f.centavos !== null).length;

/** "CORRALÓN SIMULACIÓN" → "Corralón Simulación" (el encabezado de la lista suele venir en mayúsculas). */
export function nombrePropio(t: string): string {
  if (t !== t.toUpperCase()) return t;
  return t.toLowerCase().replace(/(^|\s)(\p{L})/gu, (_, a: string, b: string) => a + b.toUpperCase());
}
