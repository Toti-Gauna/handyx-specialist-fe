// Conversor de unidades del Taller (lote 2.4, fase H0.1b): lo que se cruza en una obra en Argentina. Caños en pulgadas,
// aires en frigorías y BTU, manómetros en bar y psi, motores en HP. Todo factor lleva a la unidad base de la magnitud.
// Funciona sin conexión y no guarda nada.

export const MAGNITUDES = {
  largo: { nombre: 'Largo', base: 'm', unidades: { mm: { texto: 'milímetros', corto: 'mm', factor: 0.001 }, cm: { texto: 'centímetros', corto: 'cm', factor: 0.01 }, m: { texto: 'metros', corto: 'm', factor: 1 }, pulgada: { texto: 'pulgadas', corto: '"', factor: 0.0254 }, pie: { texto: 'pies', corto: 'pies', factor: 0.3048 } } },
  superficie: { nombre: 'Superficie', base: 'm2', unidades: { cm2: { texto: 'centímetros cuadrados', corto: 'cm²', factor: 0.0001 }, m2: { texto: 'metros cuadrados', corto: 'm²', factor: 1 }, pie2: { texto: 'pies cuadrados', corto: 'pies²', factor: 0.09290304 } } },
  volumen: { nombre: 'Volumen', base: 'l', unidades: { ml: { texto: 'mililitros', corto: 'ml', factor: 0.001 }, l: { texto: 'litros', corto: 'l', factor: 1 }, m3: { texto: 'metros cúbicos', corto: 'm³', factor: 1000 }, galon: { texto: 'galones', corto: 'gal', factor: 3.785411784 } } },
  presion: { nombre: 'Presión', base: 'kpa', unidades: { bar: { texto: 'bar', corto: 'bar', factor: 100 }, psi: { texto: 'psi (libras)', corto: 'psi', factor: 6.894757293 }, kgcm2: { texto: 'kg/cm²', corto: 'kg/cm²', factor: 98.0665 }, kpa: { texto: 'kilopascales', corto: 'kPa', factor: 1 }, mca: { texto: 'metros de columna de agua', corto: 'm.c.a.', factor: 9.80665 } } },
  potencia: { nombre: 'Potencia', base: 'w', unidades: { w: { texto: 'watts', corto: 'W', factor: 1 }, kw: { texto: 'kilowatts', corto: 'kW', factor: 1000 }, hp: { texto: 'HP (caballos)', corto: 'HP', factor: 745.69987 }, frigoria: { texto: 'frigorías por hora', corto: 'frig/h', factor: 1.163 }, btu: { texto: 'BTU por hora', corto: 'BTU/h', factor: 0.29307107 } } },
} as const;

export type Magnitud = keyof typeof MAGNITUDES;
export type UnidadDe<M extends Magnitud> = keyof (typeof MAGNITUDES)[M]['unidades'];

/** Pasa `valor` de una unidad a otra de la misma magnitud. */
export function convertir<M extends Magnitud>(magnitud: M, valor: number, desde: UnidadDe<M>, hacia: UnidadDe<M>): number {
  const u = MAGNITUDES[magnitud].unidades as Record<string, { factor: number }>;
  const a = u[desde as string];
  const b = u[hacia as string];
  if (!a || !b || !Number.isFinite(valor)) return Number.NaN;
  return (valor * a.factor) / b.factor;
}

/**
 * Lee un número escrito como en la obra: «2,5», «1.250,5», «3/4», «1 1/2» (pulgadas fraccionarias). Vacío o inválido →
 * null.
 */
export function leerNumero(texto: string): number | null {
  const t = texto.trim();
  if (!t) return null;
  const fraccion = /^(?:(\d+)\s+)?(\d+)\/(\d+)$/.exec(t);
  if (fraccion) {
    const den = Number(fraccion[3]);
    if (!den) return null;
    return Number(fraccion[1] ?? 0) + Number(fraccion[2]) / den;
  }
  const normal = t.includes(',') ? t.replace(/\./g, '').replace(',', '.') : t;
  if (!/^-?\d*\.?\d+$/.test(normal)) return null;
  return Number(normal);
}

/** Con coma decimal y hasta `decimales` (sin ceros de más; menos decimales cuanto más grande): 19,05 · 145,2 · 11.905 · 0,0042. */
export function mostrarNumero(n: number, decimales = 3): string {
  if (!Number.isFinite(n)) return '—';
  const abs = Math.abs(n);
  const d = abs !== 0 && abs < 0.01 ? 5 : abs < 1 ? 4 : abs >= 1000 ? 0 : abs >= 100 ? Math.min(1, decimales) : decimales;
  return new Intl.NumberFormat('es-AR', { maximumFractionDigits: d }).format(n);
}

/** Medidas de caño que se piden en el corralón, en pulgadas, con su equivalente en milímetros. */
export const PULGADAS_COMUNES = ['1/4', '3/8', '1/2', '3/4', '1', '1 1/4', '1 1/2', '2'] as const;
