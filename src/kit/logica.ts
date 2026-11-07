// Lógica pura del kit (lote 4.1): sin React ni DOM, con sus pruebas en logica.test.ts.
// Fechas como 'AAAA-MM-DD' (día civil de Argentina). Importes siempre en centavos enteros.

export interface DiaGrilla {
  /** 'AAAA-MM-DD', o null para los huecos antes del día 1. */
  fecha: string | null;
  dia: number | null;
}

const dos = (n: number) => String(n).padStart(2, '0');
export const claveFecha = (a: number, m: number, d: number): string => `${a}-${dos(m)}-${dos(d)}`;

/** Grilla de un mes que empieza el domingo (como la agenda de la app). `mes` va de 1 a 12. */
export function grillaMes(anio: number, mes: number): DiaGrilla[] {
  const primero = new Date(Date.UTC(anio, mes - 1, 1)).getUTCDay();
  const dias = new Date(Date.UTC(anio, mes, 0)).getUTCDate();
  const celdas: DiaGrilla[] = Array.from({ length: primero }, () => ({ fecha: null, dia: null }));
  for (let d = 1; d <= dias; d++) celdas.push({ fecha: claveFecha(anio, mes, d), dia: d });
  return celdas;
}

/** Mes anterior o siguiente. */
export function moverMes(anio: number, mes: number, delta: number): { anio: number; mes: number } {
  const t = anio * 12 + (mes - 1) + delta;
  return { anio: Math.floor(t / 12), mes: (t % 12) + 1 };
}

const DIAS_CORTOS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

export interface DiaTira {
  fecha: string;
  corto: string;
  dia: number;
  esHoy: boolean;
}

/** `cuantos` días seguidos desde `desde` ('AAAA-MM-DD'), para la tira de días. */
export function tiraDias(desde: string, cuantos: number, hoy: string = desde): DiaTira[] {
  const [a, m, d] = desde.split('-').map(Number) as [number, number, number];
  return Array.from({ length: cuantos }, (_, i) => {
    const f = new Date(Date.UTC(a, m - 1, d + i));
    const fecha = claveFecha(f.getUTCFullYear(), f.getUTCMonth() + 1, f.getUTCDate());
    return { fecha, corto: DIAS_CORTOS[f.getUTCDay()] ?? '', dia: f.getUTCDate(), esHoy: fecha === hoy };
  });
}

// ── Precio ──────────────────────────────────────────────────────────────

/** Paso de los botones − y + del precio: $ 500. */
export const PASO_PRECIO = 50_000;
/** Atajos que se suman al sugerido ("+ $ 1.000", "+ $ 2.000", "+ $ 5.000"). */
export const ATAJOS_PRECIO = [100_000, 200_000, 500_000] as const;
/** Tope de la demo para no aceptar errores de tipeo ($ 10.000.000). */
export const PRECIO_MAXIMO = 1_000_000_000;

/** Suma (o resta) y redondea al paso; nunca baja de 0 ni pasa el tope. */
export function ajustarPrecio(centavos: number, delta: number): number {
  const v = Math.round((centavos + delta) / PASO_PRECIO) * PASO_PRECIO;
  return Math.min(PRECIO_MAXIMO, Math.max(0, v));
}

/** Lo que se tipea ("45.000", "$ 45000", "45000,50") a centavos; null si no es un monto. */
export function leerPesos(texto: string): number | null {
  const limpio = texto.replace(/[$\s.]/g, '').replace(',', '.');
  if (!/^\d+(\.\d{1,2})?$/.test(limpio)) return null;
  const centavos = Math.round(Number(limpio) * 100);
  return centavos <= PRECIO_MAXIMO ? centavos : null;
}

// ── Avatar ──────────────────────────────────────────────────────────────

/**
 * Iniciales para el avatar: primera y última palabra ("Cliente De Prueba" → "CP", "La Perla" → "LP"), sin contar números
 * sueltos ("Cliente De Prueba 2" → "CP"). Una sola palabra: sus dos primeras letras.
 */
export function iniciales(nombre: string): string {
  const todas = nombre.trim().split(/\s+/).filter(Boolean);
  const sinNumeros = todas.filter((p) => !/^\d+$/.test(p));
  const palabras = sinNumeros.length ? sinNumeros : todas;
  if (palabras.length === 1) return (palabras[0] ?? '').slice(0, 2).toUpperCase();
  return ((palabras[0]?.[0] ?? '') + (palabras[palabras.length - 1]?.[0] ?? '')).toUpperCase();
}

/** Cantidad de tonos de avatar (clases hx-avatar--t0 a t5 en kit.css, todos con texto blanco en AA). */
export const TONOS_AVATAR = 6;
/** El mismo nombre siempre da el mismo tono. */
export function tonoAvatar(nombre: string): number {
  let h = 0;
  for (const c of nombre) h = (h * 31 + (c.codePointAt(0) ?? 0)) >>> 0;
  return h % TONOS_AVATAR;
}

// ── Hoja arrastrable ────────────────────────────────────────────────────

/** Alturas fijas de la hoja, como fracción de la pantalla visible. */
export const ALTURAS_HOJA = [0.34, 0.66, 0.94] as const;
export type AlturaHoja = 0 | 1 | 2;

/**
 * Altura a la que se acomoda la hoja al soltarla: la más cercana a donde quedó, salvo que se haya
 * soltado con impulso (velocidad en fracciones de pantalla por segundo), que lleva a la siguiente.
 */
export function alturaAlSoltar(fraccion: number, velocidad: number): AlturaHoja {
  if (velocidad > 1.2) return siguienteAltura(cercana(fraccion), 1);
  if (velocidad < -1.2) return siguienteAltura(cercana(fraccion), -1);
  return cercana(fraccion);
}

function cercana(fraccion: number): AlturaHoja {
  let mejor: AlturaHoja = 0;
  ALTURAS_HOJA.forEach((a, i) => {
    if (Math.abs(a - fraccion) < Math.abs(ALTURAS_HOJA[mejor] - fraccion)) mejor = i as AlturaHoja;
  });
  return mejor;
}

export function siguienteAltura(actual: AlturaHoja, sentido: 1 | -1): AlturaHoja {
  return Math.min(2, Math.max(0, actual + sentido)) as AlturaHoja;
}

// ── Contador de montos ──────────────────────────────────────────────────

/** Curva del contador (sale rápido y frena): t de 0 a 1. */
export const frenado = (t: number): number => 1 - Math.pow(1 - Math.min(1, Math.max(0, t)), 3);

/** Valor del contador a los `ms` de empezar: pesos enteros mientras sube (nunca "$ 26.687,23") y exacto al final. */
export function valorContador(desde: number, hasta: number, ms: number, duracion: number): number {
  if (ms >= duracion) return hasta;
  return Math.round((desde + (hasta - desde) * frenado(ms / duracion)) / 100) * 100;
}

// ── Selector de hora ────────────────────────────────────────────────────

export const HORAS = Array.from({ length: 24 }, (_, i) => i);
export const MINUTOS = [0, 15, 30, 45] as const;
export const hora = (h: number, m: number): string => `${dos(h)}:${dos(m)}`;

/** "$ 44.000" con espacio que no se corta: en montos grandes el signo nunca queda solo en una línea. */
export const sinCorte = (pesos: string): string => pesos.replace('$ ', '$\u00a0');
