// Grafo de calles y cálculo de trayectos (lote 4.3). En producción los calcula el motor del servidor (OSRM o Valhalla,
// fase 5); este módulo lo emula el mock con un grafo armado desde OpenStreetMap por scripts/mapa/generar.ts.
import type { Punto } from '../contracts/dto.ts';
import { distanciaM } from '../lib/geo.ts';

/** Formato compacto del grafo (JSON). Coordenadas en enteros (grados × 1e6), intercaladas lat, lng. */
export interface GrafoDatos {
  version: 1;
  /** "© OpenStreetMap contributors · <fecha del extracto>", o null si todavía no se generó. */
  fuente: string | null;
  coords: number[];
  /** Por cada arista dirigida: desde, hasta, metros y segundos (enteros). */
  aristas: number[];
}

export const ESCALA_COORD = 1e6;

/** Lectura de una lista numérica dentro de rango (las listas del grafo se arman con el largo justo). */
const v = (a: ArrayLike<number>, i: number): number => a[i] ?? 0;

interface Grafo {
  n: number;
  lat: Float64Array;
  lng: Float64Array;
  /** Adyacencia comprimida: las aristas de i van de inicio[i] a inicio[i + 1]. */
  inicio: Int32Array;
  hasta: Int32Array;
  metros: Float64Array;
  segundos: Float64Array;
}

export function prepararGrafo(d: GrafoDatos): Grafo | null {
  const n = d.coords.length / 2;
  if (n < 2 || d.aristas.length < 4) return null;
  const lat = new Float64Array(n);
  const lng = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    lat[i] = v(d.coords, 2 * i) / ESCALA_COORD;
    lng[i] = v(d.coords, 2 * i + 1) / ESCALA_COORD;
  }
  const m = d.aristas.length / 4;
  const grado = new Int32Array(n + 1);
  for (let k = 0; k < m; k++) grado[v(d.aristas, 4 * k) + 1] = v(grado, v(d.aristas, 4 * k) + 1) + 1;
  for (let i = 0; i < n; i++) grado[i + 1] = v(grado, i + 1) + v(grado, i);
  const inicio = grado.slice();
  const lugar = grado.slice();
  const hasta = new Int32Array(m);
  const metros = new Float64Array(m);
  const segundos = new Float64Array(m);
  for (let k = 0; k < m; k++) {
    const desde = v(d.aristas, 4 * k);
    const j = v(lugar, desde);
    lugar[desde] = j + 1;
    hasta[j] = v(d.aristas, 4 * k + 1);
    metros[j] = v(d.aristas, 4 * k + 2);
    segundos[j] = v(d.aristas, 4 * k + 3);
  }
  return { n, lat, lng, inicio, hasta, metros, segundos };
}

const punto = (g: Grafo, i: number): Punto => ({ lat: v(g.lat, i), lng: v(g.lng, i) });

/** El nodo con salida más cercano a p (recorrido lineal: el grafo del mock tiene pocos miles de nodos). */
function masCercano(g: Grafo, p: Punto): number {
  let mejor = -1;
  let dm = Infinity;
  for (let i = 0; i < g.n; i++) {
    if (v(g.inicio, i + 1) === v(g.inicio, i)) continue;
    const d = distanciaM(p, punto(g, i));
    if (d < dm) {
      dm = d;
      mejor = i;
    }
  }
  return mejor;
}

/** Montículo binario mínimo de (prioridad, nodo). */
class Monticulo {
  private p: number[] = [];
  private v: number[] = [];
  get vacio(): boolean {
    return this.v.length === 0;
  }
  poner(prioridad: number, nodo: number): void {
    this.p.push(prioridad);
    this.v.push(nodo);
    let i = this.v.length - 1;
    while (i > 0) {
      const padre = (i - 1) >> 1;
      if (v(this.p, padre) <= v(this.p, i)) break;
      this.cambiar(i, padre);
      i = padre;
    }
  }
  sacar(): [number, number] {
    const r: [number, number] = [v(this.p, 0), v(this.v, 0)];
    const ultP = this.p.pop() as number;
    const ultV = this.v.pop() as number;
    if (this.v.length > 0) {
      this.p[0] = ultP;
      this.v[0] = ultV;
      let i = 0;
      for (;;) {
        const a = 2 * i + 1;
        const b = a + 1;
        let m = i;
        if (a < this.v.length && v(this.p, a) < v(this.p, m)) m = a;
        if (b < this.v.length && v(this.p, b) < v(this.p, m)) m = b;
        if (m === i) break;
        this.cambiar(i, m);
        i = m;
      }
    }
    return r;
  }
  private cambiar(i: number, j: number): void {
    [this.p[i], this.p[j]] = [v(this.p, j), v(this.p, i)];
    [this.v[i], this.v[j]] = [v(this.v, j), v(this.v, i)];
  }
}

export interface Ruta {
  linea: Punto[];
  distanciaM: number;
  duracionS: number;
}

/** Más lejos que esto de la red de calles, el trayecto no se calcula (el punto está fuera de la zona del grafo). */
const MAX_ENGANCHE_M = 400;

/** Trayecto más rápido por el grafo (Dijkstra por tiempo), del origen al destino. Null si no hay camino. */
export function calcularRuta(g: Grafo, origen: Punto, destino: Punto): Ruta | null {
  const s = masCercano(g, origen);
  const t = masCercano(g, destino);
  if (s < 0 || t < 0) return null;
  if (distanciaM(origen, punto(g, s)) > MAX_ENGANCHE_M || distanciaM(destino, punto(g, t)) > MAX_ENGANCHE_M) return null;
  const tiempo = new Float64Array(g.n).fill(Infinity);
  const previo = new Int32Array(g.n).fill(-1);
  const via = new Int32Array(g.n).fill(-1);
  const cola = new Monticulo();
  tiempo[s] = 0;
  cola.poner(0, s);
  while (!cola.vacio) {
    const [ts, u] = cola.sacar();
    if (ts > v(tiempo, u)) continue;
    if (u === t) break;
    for (let k = v(g.inicio, u); k < v(g.inicio, u + 1); k++) {
      const w = v(g.hasta, k);
      const nt = ts + v(g.segundos, k);
      if (nt < v(tiempo, w)) {
        tiempo[w] = nt;
        previo[w] = u;
        via[w] = k;
        cola.poner(nt, w);
      }
    }
  }
  if (v(tiempo, t) === Infinity) return null;
  const nodos: number[] = [];
  let metros = 0;
  for (let u = t; u !== -1; u = v(previo, u)) {
    nodos.push(u);
    if (v(via, u) >= 0) metros += v(g.metros, v(via, u));
  }
  nodos.reverse();
  const linea = nodos.map((i) => punto(g, i));
  if (linea.length === 1) linea.push(punto(g, t));
  return { linea, distanciaM: Math.round(metros), duracionS: Math.round(v(tiempo, t)) };
}
