// Recorrido de caños y cables en un ambiente (fase H1.5). Lógica pura: ubica las bocas, arma el recorrido por el techo
// (subida desde el tablero o la boca, tramo horizontal, bajada a la siguiente) y calcula metros de caño, cable por
// sección, cajas y curvas. Es una estimación para presupuestar: el recorrido real lo decide el profesional en obra.
// Medidas en metros. Ejes: x a lo largo, z a lo ancho, y hacia arriba; el tablero va en la pared z = 0.

export type TipoBoca = 'luz' | 'toma' | 'llave';
export type Punto = { x: number; y: number; z: number };

export interface Ambiente {
  largo: number;
  ancho: number;
  alto: number;
  luces: number;
  tomas: number;
  llaves: number;
}

export interface Boca {
  id: string;
  tipo: TipoBoca;
  punto: Punto;
}

export interface Circuito {
  id: 'iug' | 'tug';
  texto: string;
  seccion: number;
  bocas: Boca[];
  /** Polilínea del caño, del tablero a la última boca. */
  recorrido: Punto[];
  metrosCano: number;
}

export const ALTURA = { tablero: 1.6, toma: 0.3, llave: 1.1 } as const;
/** Cable que se deja de más en cada boca para conectar. */
export const DEJA_POR_BOCA = 0.3;
/** Conductores por caño en monofásico: fase, neutro y tierra. */
export const CONDUCTORES = 3;
export const LARGO_TIRA_CANO = 3;

const r2 = (n: number) => Math.round(n * 100) / 100;
const dist = (a: Punto, b: Punto) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y) + Math.abs(a.z - b.z);

/** Luces en grilla en el techo, tomas repartidas por el perímetro y llaves junto a la puerta (en la pared del tablero). */
export function ubicarBocas(a: Ambiente): Boca[] {
  const bocas: Boca[] = [];
  const nl = Math.max(0, Math.round(a.luces));
  const columnas = Math.max(1, Math.ceil(Math.sqrt((nl * a.largo) / Math.max(a.ancho, 0.1))));
  const filas = Math.max(1, Math.ceil(nl / columnas));
  for (let i = 0; i < nl; i++) {
    const c = i % columnas;
    const f = Math.floor(i / columnas);
    bocas.push({ id: `luz${i + 1}`, tipo: 'luz', punto: { x: r2(((c + 0.5) * a.largo) / columnas), y: a.alto, z: r2(((f + 0.5) * a.ancho) / filas) } });
  }
  // Perímetro sin la pared del tablero (z = 0): pared x = largo, pared z = ancho, pared x = 0.
  const nt = Math.max(0, Math.round(a.tomas));
  const perimetro = a.ancho + a.largo + a.ancho;
  for (let i = 0; i < nt; i++) {
    const d = ((i + 0.5) * perimetro) / nt;
    const punto =
      d < a.ancho
        ? { x: a.largo, y: ALTURA.toma, z: r2(d) }
        : d < a.ancho + a.largo
          ? { x: r2(a.largo - (d - a.ancho)), y: ALTURA.toma, z: a.ancho }
          : { x: 0, y: ALTURA.toma, z: r2(a.ancho - (d - a.ancho - a.largo)) };
    bocas.push({ id: `toma${i + 1}`, tipo: 'toma', punto });
  }
  const nk = Math.max(0, Math.round(a.llaves));
  for (let i = 0; i < nk; i++) bocas.push({ id: `llave${i + 1}`, tipo: 'llave', punto: { x: r2(0.3 + i * 0.12), y: ALTURA.llave, z: 0 } });
  return bocas;
}

/** El tablero, en la pared z = 0, cerca de la esquina opuesta a la puerta. */
export const tableroEn = (a: Ambiente): Punto => ({ x: r2(Math.max(0.5, a.largo - 0.6)), y: ALTURA.tablero, z: 0 });

/** Tramo entre dos puntos por el techo: sube, recorre en L y baja. */
export function tramoPorTecho(desde: Punto, hasta: Punto, alto: number): Punto[] {
  return [desde, { ...desde, y: alto }, { x: hasta.x, y: alto, z: desde.z }, { x: hasta.x, y: alto, z: hasta.z }, hasta];
}

const largoPolilinea = (p: Punto[]) => p.slice(1).reduce((s, q, i) => s + dist(p[i] as Punto, q), 0);

/** Encadena las bocas de un circuito por cercanía (la siguiente es la más cercana a la última). */
function encadenar(inicio: Punto, bocas: Boca[], alto: number): { orden: Boca[]; recorrido: Punto[] } {
  const quedan = [...bocas];
  const orden: Boca[] = [];
  const recorrido: Punto[] = [inicio];
  let actual = inicio;
  while (quedan.length) {
    quedan.sort((a, b) => dist(actual, a.punto) - dist(actual, b.punto));
    const b = quedan.shift() as Boca;
    recorrido.push(...tramoPorTecho(actual, b.punto, alto).slice(1));
    orden.push(b);
    actual = b.punto;
  }
  return { orden, recorrido };
}

export interface Canalizacion {
  bocas: Boca[];
  tablero: Punto;
  circuitos: Circuito[];
  materiales: { descripcion: string; cantidad: number; unidad: 'unidad' | 'metro' }[];
}

export function canalizar(a: Ambiente): Canalizacion {
  const bocas = ubicarBocas(a);
  const tablero = tableroEn(a);
  const defs: { id: Circuito['id']; texto: string; seccion: number; tipos: TipoBoca[] }[] = [
    { id: 'iug', texto: 'Iluminación (luces y llaves)', seccion: 1.5, tipos: ['luz', 'llave'] },
    { id: 'tug', texto: 'Tomacorrientes', seccion: 2.5, tipos: ['toma'] },
  ];
  const circuitos: Circuito[] = defs.flatMap((d) => {
    const propias = bocas.filter((b) => d.tipos.includes(b.tipo));
    if (!propias.length) return [];
    const { orden, recorrido } = encadenar(tablero, propias, a.alto);
    return [{ id: d.id, texto: d.texto, seccion: d.seccion, bocas: orden, recorrido, metrosCano: r2(largoPolilinea(recorrido)) }];
  });
  const metrosCano = circuitos.reduce((s, c) => s + c.metrosCano, 0);
  const cable = (seccion: number) => {
    const c = circuitos.filter((x) => x.seccion === seccion);
    return Math.ceil(c.reduce((s, x) => s + x.metrosCano * CONDUCTORES + x.bocas.length * DEJA_POR_BOCA * CONDUCTORES, 0));
  };
  const materiales: Canalizacion['materiales'] = [];
  if (metrosCano > 0) materiales.push({ descripcion: 'Caño corrugado 3/4" (tiras de 3 m)', cantidad: Math.ceil(metrosCano / LARGO_TIRA_CANO), unidad: 'unidad' });
  if (cable(1.5)) materiales.push({ descripcion: 'Cable unipolar 1,5 mm² (fase, neutro y tierra)', cantidad: cable(1.5), unidad: 'metro' });
  if (cable(2.5)) materiales.push({ descripcion: 'Cable unipolar 2,5 mm² (fase, neutro y tierra)', cantidad: cable(2.5), unidad: 'metro' });
  const luces = bocas.filter((b) => b.tipo === 'luz').length;
  const rect = bocas.length - luces;
  if (luces) materiales.push({ descripcion: 'Caja octogonal (luces)', cantidad: luces, unidad: 'unidad' });
  if (rect) materiales.push({ descripcion: 'Caja rectangular 5 × 10 (tomas y llaves)', cantidad: rect, unidad: 'unidad' });
  // Dos curvas por boca (subida y bajada) y una por cambio de dirección en el techo.
  if (bocas.length) materiales.push({ descripcion: 'Curvas y conectores para caño', cantidad: bocas.length * 3, unidad: 'unidad' });
  return { bocas, tablero, circuitos, materiales };
}
