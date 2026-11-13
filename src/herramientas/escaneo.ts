// Escanear en 3D en el teléfono (T-Escanear → T-Modelo3D, lote 2.4, fase H0.1b). Decisión asumida para este lote: el
// modelo se arma **en el teléfono** y no se envía nada; si el teléfono no puede, se avisa y las fotos se descartan.
//
// Método (casco visual, «shape from silhouette»), pensado para equipos de la casa (termotanque, calefón, aire,
// lavarropas) fotografiados dando una vuelta alrededor, a la misma distancia:
// 1. En cada foto (achicada a ~160 px) se separa el objeto del fondo: el fondo se toma de los costados de cada fila
//    (pared arriba, piso abajo), la distancia de color se corta con el umbral de Otsu y queda la mancha del centro.
// 2. Las siluetas se alinean por la base y el centro, y se igualan en alto (la distancia cambia un poco entre fotos).
// 3. Cada foto i se tomó a 360° · i / n alrededor del objeto (el anillo guía la vuelta): una grilla de cubitos se talla
//    con todas las siluetas y queda el volumen que las cumple a todas.
// 4. Las medidas salen del volumen y la escala, de la tarjeta de referencia (o de una medida que escribe el
//    profesional). Son aproximadas y se dice siempre.
// 5. La malla es una superficie de revolución deformada (anillos por altura), liviana para gama baja.
// Todo es lógica pura: se prueba en Node con fotos sintéticas (escaneoPrueba.ts).

export interface Fotograma {
  ancho: number;
  alto: number;
  /** RGBA, fila por fila (como ImageData.data). */
  datos: Uint8ClampedArray | Uint8Array;
}

export interface Silueta {
  ancho: number;
  alto: number;
  /** 1 = objeto. */
  mascara: Uint8Array;
  x0: number;
  x1: number;
  /** Arriba (y0) y la base (y1), inclusive. */
  y0: number;
  y1: number;
}

export const ANCHO_PROCESO = 160;
/** Fotos que tienen que separarse bien del fondo para armar el modelo (de 30). */
export const MINIMO_SILUETAS = 24;

const MARGEN_LADOS = 0.07;
const UMBRAL_MINIMO = 28;

function colorEn(f: Fotograma, x: number, y: number): [number, number, number] {
  const i = (y * f.ancho + x) * 4;
  return [f.datos[i] ?? 0, f.datos[i + 1] ?? 0, f.datos[i + 2] ?? 0];
}

/** Umbral de Otsu sobre un histograma de 0 a `max`. */
export function umbralOtsu(hist: readonly number[]): number {
  const total = hist.reduce((a, b) => a + b, 0);
  if (!total) return 0;
  let suma = 0;
  hist.forEach((h, i) => (suma += i * h));
  let sumaB = 0;
  let pesoB = 0;
  let mejor = 0;
  let umbral = 0;
  for (let t = 0; t < hist.length; t++) {
    const h = hist[t] ?? 0;
    pesoB += h;
    if (pesoB === 0) continue;
    const pesoF = total - pesoB;
    if (pesoF === 0) break;
    sumaB += t * h;
    const mB = sumaB / pesoB;
    const mF = (suma - sumaB) / pesoF;
    const entre = pesoB * pesoF * (mB - mF) ** 2;
    if (entre > mejor) {
      mejor = entre;
      umbral = t;
    }
  }
  return umbral;
}

/**
 * Separa el objeto del fondo. Devuelve null si no hay un objeto claro en el centro o si se sale de la foto por los
 * costados (no se ve entero).
 */
export function silueta(f: Fotograma): Silueta | null {
  const { ancho: W, alto: H } = f;
  const borde = Math.max(2, Math.round(W * MARGEN_LADOS));
  const dist = new Uint16Array(W * H);
  const hist = new Array<number>(443).fill(0);
  for (let y = 0; y < H; y++) {
    // Fondo de la fila: el promedio de cada costado (la pared y el piso cambian de arriba a abajo).
    let [ir, ig, ib, dr, dg, db] = [0, 0, 0, 0, 0, 0];
    for (let x = 0; x < borde; x++) {
      const [ar, ag, ab] = colorEn(f, x, y);
      const [br, bg, bb] = colorEn(f, W - 1 - x, y);
      ir += ar;
      ig += ag;
      ib += ab;
      dr += br;
      dg += bg;
      db += bb;
    }
    [ir, ig, ib, dr, dg, db] = [ir / borde, ig / borde, ib / borde, dr / borde, dg / borde, db / borde];
    for (let x = 0; x < W; x++) {
      const [r, g, b] = colorEn(f, x, y);
      const d = Math.min(Math.hypot(r - ir, g - ig, b - ib), Math.hypot(r - dr, g - dg, b - db));
      const v = Math.min(442, Math.round(d));
      dist[y * W + x] = v;
      hist[v] = (hist[v] ?? 0) + 1;
    }
  }
  // Umbral: el de Otsu, pero sin pasar de lo que varía el propio fondo (los costados) con un margen; si el objeto
  // tiene partes de colores distintos (cuerpo, sombra, zócalo), Otsu solo partiría el objeto en dos.
  const bordes: number[] = [];
  for (let y = 0; y < H; y++) for (let x = 0; x < borde; x++) bordes.push(dist[y * W + x] ?? 0, dist[y * W + W - 1 - x] ?? 0);
  bordes.sort((a, b) => a - b);
  const ruidoFondo = bordes[Math.floor(bordes.length * 0.99)] ?? 0;
  const umbral = Math.max(UMBRAL_MINIMO, Math.min(umbralOtsu(hist), ruidoFondo * 2.5));
  const crudo = new Uint8Array(W * H);
  for (let i = 0; i < W * H; i++) crudo[i] = (dist[i] ?? 0) > umbral ? 1 : 0;

  // La mancha del centro: se busca el píxel de objeto más cercano al centro y se inunda desde ahí.
  const cx = Math.floor(W / 2);
  const cy = Math.floor(H / 2);
  let semilla = -1;
  for (let r = 0; r < Math.min(W, H) / 4 && semilla < 0; r++) {
    for (let dy = -r; dy <= r && semilla < 0; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        const x = cx + dx;
        const y = cy + dy;
        if (x >= 0 && y >= 0 && x < W && y < H && crudo[y * W + x]) {
          semilla = y * W + x;
          break;
        }
      }
    }
  }
  if (semilla < 0) return null;
  const mancha = new Uint8Array(W * H);
  const pila = [semilla];
  mancha[semilla] = 1;
  for (let i = pila.pop(); i !== undefined; i = pila.pop()) {
    const x = i % W;
    const y = (i - x) / W;
    const vecinos = [x > 0 ? i - 1 : -1, x < W - 1 ? i + 1 : -1, y > 0 ? i - W : -1, y < H - 1 ? i + W : -1];
    for (const v of vecinos) {
      if (v >= 0 && crudo[v] && !mancha[v]) {
        mancha[v] = 1;
        pila.push(v);
      }
    }
  }
  // Se rellena cada fila entre su primer y su último píxel (huecos de brillos y reflejos).
  let x0 = W;
  let x1 = -1;
  let y0 = H;
  let y1 = -1;
  let area = 0;
  for (let y = 0; y < H; y++) {
    let a = -1;
    let b = -1;
    for (let x = 0; x < W; x++) {
      if (mancha[y * W + x]) {
        if (a < 0) a = x;
        b = x;
      }
    }
    if (a < 0) continue;
    for (let x = a; x <= b; x++) mancha[y * W + x] = 1;
    area += b - a + 1;
    x0 = Math.min(x0, a);
    x1 = Math.max(x1, b);
    y0 = Math.min(y0, y);
    y1 = Math.max(y1, y);
  }
  if (area < W * H * 0.02) return null;
  // Tocando los dos costados no se ve entero (o se mezcló con el fondo).
  if (x0 <= 0 && x1 >= W - 1) return null;
  return { ancho: W, alto: H, mascara: mancha, x0, x1, y0, y1 };
}

export interface Casco {
  /** Cubitos por lado en el plano (x, z) y en alto. */
  n: number;
  m: number;
  /** Tamaño del cubito, en píxeles de la primera silueta. */
  paso: number;
  /** Radio horizontal de la grilla (px). */
  radio: number;
  /** Alto total (px de la primera silueta). */
  altoPx: number;
  /** 1 = lleno; índice (k * n + j) * n + i, con k la altura desde la base. */
  lleno: Uint8Array;
}

/** Ángulo (radianes) desde el que se tomó la foto i de n, girando como camina la persona (ver tres/escaneo.ts). */
export const anguloToma = (i: number, n: number) => (-2 * Math.PI * i) / n;

/**
 * Talla el volumen con las siluetas. La primera fija la escala (alto y centro); las demás se igualan a su alto.
 * `angulos[i]` es el ángulo de la toma de `siluetas[i]` (las descartadas no están).
 */
export function cascoVisual(siluetas: readonly Silueta[], angulos: readonly number[], o: { n?: number; m?: number } = {}): Casco {
  const primera = siluetas[0];
  if (!primera) throw new Error('sin siluetas');
  const altoPx = primera.y1 - primera.y0 + 1;
  const escalas = siluetas.map((s) => altoPx / (s.y1 - s.y0 + 1));
  const radio = Math.max(...siluetas.map((s, i) => ((s.x1 - s.x0 + 1) / 2) * (escalas[i] ?? 1))) * 1.08;
  const n = o.n ?? 48;
  const m = o.m ?? 64;
  const paso = (2 * radio) / n;
  const pasoY = altoPx / m;
  const lleno = new Uint8Array(n * n * m).fill(1);
  const trig = angulos.map((a) => [Math.cos(a), Math.sin(a)] as const);
  siluetas.forEach((sil, s) => {
    const k = escalas[s] ?? 1;
    const centro = (sil.x0 + sil.x1) / 2;
    const [cos, sin] = trig[s] ?? [1, 0];
    for (let iy = 0; iy < m; iy++) {
      const y = (iy + 0.5) * pasoY;
      const fila = Math.round(sil.y1 - y / k);
      for (let iz = 0; iz < n; iz++) {
        const z = -radio + (iz + 0.5) * paso;
        for (let ix = 0; ix < n; ix++) {
          const idx = (iy * n + iz) * n + ix;
          if (!lleno[idx]) continue;
          const x = -radio + (ix + 0.5) * paso;
          const u = x * cos - z * sin;
          const col = Math.round(centro + u / k);
          if (fila < 0 || fila >= sil.alto || col < 0 || col >= sil.ancho || !sil.mascara[fila * sil.ancho + col]) lleno[idx] = 0;
        }
      }
    }
  });
  return { n, m, paso, radio, altoPx, lleno };
}

export interface MedidasEscaneo {
  altoM: number;
  /** Si es redondo (termotanque, calefón cilíndrico). */
  diametroM: number | null;
  /** Si es una caja (aire, lavarropas): ancho de frente (primera foto) y fondo. */
  anchoM: number | null;
  fondoM: number | null;
  forma: 'redondo' | 'caja';
}

/**
 * Medidas en metros a partir del ancho de cada silueta según el ángulo de la toma (igualadas al alto de la primera).
 * Se prueban dos plantas: redonda (el ancho no cambia) y rectangular (ancho = a·|cos(θ−φ)| + f·|sin(θ−φ)|, se busca φ
 * de a 1° y a, f por mínimos cuadrados). Gana la rectangular solo si explica claramente mejor lo medido. Así un
 * aire acondicionado sale con su ancho y su fondo aunque ninguna foto lo agarre justo de costado.
 */
export function medirSiluetas(siluetas: readonly Silueta[], angulos: readonly number[], metrosPorPx: number): MedidasEscaneo {
  const primera = siluetas[0];
  if (!primera) throw new ErrorEscaneo('vacio');
  const altoPx = primera.y1 - primera.y0 + 1;
  const muestras = siluetas.map((s, i) => ({ a: angulos[i] ?? 0, w: ((s.x1 - s.x0 + 1) * altoPx) / (s.y1 - s.y0 + 1) }));
  const prom = muestras.reduce((t, x) => t + x.w, 0) / muestras.length;
  const errRedondo = muestras.reduce((t, x) => t + (x.w - prom) ** 2, 0);
  let mejor = { err: Infinity, a: 0, f: 0 };
  for (let g = 0; g < 90; g++) {
    const phi = (g * Math.PI) / 180;
    // Mínimos cuadrados de w ≈ a·c + f·s.
    let cc = 0;
    let ss = 0;
    let cs = 0;
    let wc = 0;
    let ws = 0;
    for (const x of muestras) {
      const c = Math.abs(Math.cos(x.a - phi));
      const sn = Math.abs(Math.sin(x.a - phi));
      cc += c * c;
      ss += sn * sn;
      cs += c * sn;
      wc += x.w * c;
      ws += x.w * sn;
    }
    const det = cc * ss - cs * cs;
    if (Math.abs(det) < 1e-9) continue;
    const a = (wc * ss - ws * cs) / det;
    const f = (ws * cc - wc * cs) / det;
    if (a <= 0 || f <= 0) continue;
    const err = muestras.reduce((t, x) => t + (x.w - a * Math.abs(Math.cos(x.a - phi)) - f * Math.abs(Math.sin(x.a - phi))) ** 2, 0);
    if (err < mejor.err) mejor = { err, a, f };
  }
  const altoM = altoPx * metrosPorPx;
  const caja = mejor.err < errRedondo * 0.35 && Math.abs(mejor.a - mejor.f) / Math.max(mejor.a, mejor.f) > 0.08;
  if (!caja) return { altoM, diametroM: prom * metrosPorPx, anchoM: null, fondoM: null, forma: 'redondo' };
  return { altoM, diametroM: null, anchoM: Math.max(mejor.a, mejor.f) * metrosPorPx, fondoM: Math.min(mejor.a, mejor.f) * metrosPorPx, forma: 'caja' };
}

export interface Malla {
  /** x, y, z en metros, con el origen en el centro de la base. */
  posiciones: Float32Array;
  indices: Uint32Array;
  triangulos: number;
}

/**
 * Superficie por anillos: para cada altura y cada dirección, hasta dónde llega el volumen desde el eje. Se suaviza con
 * los vecinos para que no se vean los escalones de los cubitos. Liviana: `capas × lados` vértices.
 */
export function mallaCasco(c: Casco, metrosPorPx: number, o: { capas?: number; lados?: number } = {}): Malla {
  const capas = o.capas ?? 24;
  const lados = o.lados ?? 32;
  const { n, m, paso, radio, lleno } = c;
  const r = Array.from({ length: capas }, () => new Float32Array(lados));
  r.forEach((fila, k) => {
    const iy = Math.min(m - 1, Math.floor(((k + 0.5) / capas) * m));
    for (let j = 0; j < lados; j++) {
      const a = (2 * Math.PI * j) / lados;
      const dx = Math.cos(a);
      const dz = Math.sin(a);
      let hasta = 0;
      for (let d = 0; d <= radio; d += paso / 2) {
        const ix = Math.floor((d * dx + radio) / paso);
        const iz = Math.floor((d * dz + radio) / paso);
        if (ix < 0 || iz < 0 || ix >= n || iz >= n) break;
        if (lleno[(iy * n + iz) * n + ix]) hasta = d + paso / 2;
      }
      fila[j] = hasta;
    }
  });
  // Suavizado 3 × 3 (con vuelta en los lados).
  const suave = r.map((fila, k) =>
    Float32Array.from(fila, (_, j) => {
      let s = 0;
      let c2 = 0;
      for (let dk = -1; dk <= 1; dk++) {
        const kk = k + dk;
        if (kk < 0 || kk >= capas) continue;
        for (let dj = -1; dj <= 1; dj++) {
          s += r[kk]?.[(j + dj + lados) % lados] ?? 0;
          c2++;
        }
      }
      return s / c2;
    }),
  );
  const pos: number[] = [];
  for (let k = 0; k < capas; k++) {
    const y = ((k + 0.5) / capas) * c.altoPx * metrosPorPx;
    for (let j = 0; j < lados; j++) {
      const a = (2 * Math.PI * j) / lados;
      const rr = (suave[k]?.[j] ?? 0) * metrosPorPx;
      pos.push(rr * Math.cos(a), y, rr * Math.sin(a));
    }
  }
  const abajo = pos.length / 3;
  pos.push(0, 0, 0);
  const arriba = pos.length / 3;
  pos.push(0, c.altoPx * metrosPorPx, 0);
  const idx: number[] = [];
  for (let k = 0; k < capas - 1; k++) {
    for (let j = 0; j < lados; j++) {
      const a = k * lados + j;
      const b = k * lados + ((j + 1) % lados);
      const c1 = (k + 1) * lados + j;
      const d = (k + 1) * lados + ((j + 1) % lados);
      idx.push(a, c1, b, b, c1, d);
    }
  }
  for (let j = 0; j < lados; j++) {
    idx.push(abajo, j, (j + 1) % lados);
    const t = (capas - 1) * lados;
    idx.push(arriba, t + ((j + 1) % lados), t + j);
  }
  return { posiciones: Float32Array.from(pos), indices: Uint32Array.from(idx), triangulos: idx.length / 3 };
}

export type MotivoEscaneo = 'sin_lienzo' | 'poca_memoria' | 'fondo' | 'vacio' | 'escala' | 'tiempo';

export class ErrorEscaneo extends Error {
  override name = 'ErrorEscaneo';
  readonly motivo: MotivoEscaneo;
  constructor(motivo: MotivoEscaneo) {
    super(motivo);
    this.motivo = motivo;
  }
}

/** Qué le decimos a la persona en cada caso (nunca se envía nada: las fotos se borran). */
export const TEXTO_MOTIVO: Record<MotivoEscaneo, { titulo: string; texto: string }> = {
  sin_lienzo: { titulo: 'Este teléfono no puede armar el modelo', texto: 'Le falta lo necesario para procesar las fotos. No mandamos nada: las fotos se borraron.' },
  poca_memoria: { titulo: 'Este teléfono no puede armar el modelo', texto: 'No tiene memoria suficiente para procesar las fotos. No mandamos nada: las fotos se borraron.' },
  fondo: { titulo: 'No pudimos separar el objeto del fondo', texto: 'Probá de nuevo con una pared lisa detrás y buena luz, y que el objeto entre entero en cada foto.' },
  vacio: { titulo: 'No pudimos armar el volumen', texto: 'Probá de nuevo dando la vuelta a la misma distancia y sin saltear fotos.' },
  escala: { titulo: 'Falta la medida de referencia', texto: 'Marcá las puntas de la tarjeta o escribí una medida que sepas.' },
  tiempo: { titulo: 'El teléfono tardó demasiado', texto: 'No mandamos nada: las fotos se borraron. Cerrá otras aplicaciones y probá de nuevo.' },
};

export interface CapacidadTelefono {
  /** ¿Se pueden leer los píxeles de una foto (canvas 2D)? */
  lienzo: boolean;
  memoriaGb?: number;
}

/** ¿Este teléfono puede armar el modelo? Gama baja (Moto E20, 2 GB) sí; menos de 1 GB, no. */
export function puedeArmar(c: CapacidadTelefono): MotivoEscaneo | null {
  if (!c.lienzo) return 'sin_lienzo';
  if (c.memoriaGb !== undefined && c.memoriaGb < 1) return 'poca_memoria';
  return null;
}

export interface ModeloEscaneado {
  malla: Malla;
  medidas: MedidasEscaneo;
  fotosUsadas: number;
  fotosTotal: number;
}

export interface Paso {
  /** «Separando el objeto del fondo», «Armando el volumen», «Midiendo». */
  texto: string;
  fraccion: number;
}

const pausa = () => new Promise<void>((r) => setTimeout(r, 0));

/**
 * Todo el proceso, en el teléfono. Cede el control entre foto y foto para que la pantalla siga respondiendo y avisa el
 * avance. `metrosPorPx`: escala en píxeles de las fotos achicadas.
 */
export async function armarModelo(fotos: readonly Fotograma[], metrosPorPx: number, o: { alAvanzar?: (p: Paso) => void; limiteMs?: number; reloj?: () => number } = {}): Promise<ModeloEscaneado> {
  if (!(metrosPorPx > 0)) throw new ErrorEscaneo('escala');
  const reloj = o.reloj ?? (() => Date.now());
  const inicio = reloj();
  const limite = o.limiteMs ?? 60_000;
  const siluetas: Silueta[] = [];
  const angulos: number[] = [];
  for (const [i, foto] of fotos.entries()) {
    o.alAvanzar?.({ texto: `Separando el objeto del fondo · foto ${i + 1} de ${fotos.length}`, fraccion: (0.7 * i) / fotos.length });
    const s = silueta(foto);
    if (s) {
      siluetas.push(s);
      angulos.push(anguloToma(i, fotos.length));
    } else if (i === 0) {
      // La primera fija la escala: sin ella no hay medidas confiables.
      throw new ErrorEscaneo('fondo');
    }
    if (reloj() - inicio > limite) throw new ErrorEscaneo('tiempo');
    await pausa();
  }
  if (siluetas.length < Math.min(MINIMO_SILUETAS, fotos.length)) throw new ErrorEscaneo('fondo');
  o.alAvanzar?.({ texto: 'Armando el volumen', fraccion: 0.75 });
  await pausa();
  const casco = cascoVisual(siluetas, angulos);
  if (!casco.lleno.some((v) => v === 1)) throw new ErrorEscaneo('vacio');
  if (reloj() - inicio > limite) throw new ErrorEscaneo('tiempo');
  o.alAvanzar?.({ texto: 'Midiendo', fraccion: 0.92 });
  await pausa();
  const medidas = medirSiluetas(siluetas, angulos, metrosPorPx);
  const malla = mallaCasco(casco, metrosPorPx);
  o.alAvanzar?.({ texto: 'Listo', fraccion: 1 });
  return { malla, medidas, fotosUsadas: siluetas.length, fotosTotal: fotos.length };
}

/** «Alto 85 cm · diámetro 45 cm · aprox.» para la ficha y la descripción del 3D. */
export function medidasEnTexto(m: MedidasEscaneo): { alto: number; diametro?: number; ancho?: number; fondo?: number } {
  return m.forma === 'redondo' && m.diametroM !== null ? { alto: m.altoM, diametro: m.diametroM } : { alto: m.altoM, ancho: m.anchoM ?? 0, fondo: m.fondoM ?? 0 };
}

/** Escala a partir de una medida que el profesional sabe (el alto, en metros) cuando no hay tarjeta. */
export function escalaPorAlto(altoM: number, s: Pick<Silueta, 'y0' | 'y1'>): number {
  return altoM / (s.y1 - s.y0 + 1);
}
